import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { buchungen, unternehmen } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * ELSTER USt-Voranmeldung für deutsche Firmen
 *
 * Berechnet Kennzahlen aus SKR04-Buchungen und generiert XML für ELSTER-Upload
 */

interface UStVAKennzahlen {
  // Umsätze
  kz81: number; // Umsätze 19%
  kz86: number; // Umsätze 7%
  kz35: number; // Steuerfreie Umsätze
  kz21: number; // EU-Lieferungen steuerfrei

  // Steuerbeträge
  kz81Steuer: number; // USt 19%
  kz86Steuer: number; // USt 7%

  // Vorsteuer
  kz66: number; // Abziehbare Vorsteuer

  // Vorauszahlung
  kz83: number; // Verbleibende USt-Vorauszahlung (kann negativ sein = Erstattung)
}

/**
 * SKR04 Konten-Mapping für USt-VA
 */
const SKR04_USTVA_MAPPING = {
  // KZ 81: Umsätze 19%
  umsaetze19: ['4000', '4100', '4110', '4120', '4200'],

  // KZ 86: Umsätze 7%
  umsaetze7: ['4300', '4310', '4320'],

  // KZ 66: Vorsteuer
  vorsteuer: ['1400', '1401', '1405', '1406', '1576'],

  // KZ 35: Steuerfreie Umsätze
  steuerfrei: ['4125', '4126'],

  // KZ 21: EU-Lieferungen (subset von steuerfrei mit EU-Kennzeichen)
  euLieferungen: ['4125'],
};

/**
 * Berechnet Zeitraum (von/bis Datum) aus Jahr und Zeitraum
 */
function getZeitraumDates(jahr: number, zeitraum: string): { von: string; bis: string } {
  if (zeitraum.startsWith('Q')) {
    // Quartal
    const quartal = parseInt(zeitraum.substring(1));
    const startMonat = (quartal - 1) * 3 + 1;
    const endMonat = startMonat + 2;

    return {
      von: `${jahr}-${String(startMonat).padStart(2, '0')}-01`,
      bis: `${jahr}-${String(endMonat).padStart(2, '0')}-${new Date(jahr, endMonat, 0).getDate()}`,
    };
  } else {
    // Monat
    const monat = parseInt(zeitraum);
    return {
      von: `${jahr}-${String(monat).padStart(2, '0')}-01`,
      bis: `${jahr}-${String(monat).padStart(2, '0')}-${new Date(jahr, monat, 0).getDate()}`,
    };
  }
}

/**
 * Berechnet USt-VA Kennzahlen aus Buchungen
 */
async function berechneKennzahlen(
  unternehmenId: number,
  jahr: number,
  zeitraum: string
): Promise<UStVAKennzahlen> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");

  const { von, bis } = getZeitraumDates(jahr, zeitraum);

  // Hole alle Buchungen im Zeitraum
  const alleBuchungen = await db
    .select()
    .from(buchungen)
    .where(
      and(
        eq(buchungen.unternehmenId, unternehmenId),
        gte(buchungen.belegdatum, von),
        lte(buchungen.belegdatum, bis)
      )
    );

  let kz81 = 0; // Umsätze 19% (netto)
  let kz86 = 0; // Umsätze 7% (netto)
  let kz35 = 0; // Steuerfreie Umsätze
  let kz21 = 0; // EU-Lieferungen
  let kz66 = 0; // Vorsteuer

  for (const buchung of alleBuchungen) {
    const sollKonto = buchung.sollKonto?.toString() || '';
    const habenKonto = buchung.habenKonto?.toString() || '';
    const betrag = parseFloat(buchung.betrag?.toString() || '0');

    // KZ 81: Umsätze 19%
    if (SKR04_USTVA_MAPPING.umsaetze19.includes(habenKonto)) {
      kz81 += betrag;
    }

    // KZ 86: Umsätze 7%
    if (SKR04_USTVA_MAPPING.umsaetze7.includes(habenKonto)) {
      kz86 += betrag;
    }

    // KZ 35: Steuerfreie Umsätze
    if (SKR04_USTVA_MAPPING.steuerfrei.includes(habenKonto)) {
      kz35 += betrag;

      // KZ 21: EU-Lieferungen (wenn Konto 4125 und buchungstext enthält EU-Land)
      if (habenKonto === '4125') {
        const text = (buchung.buchungstext || '').toLowerCase();
        const euLaender = ['österreich', 'frankreich', 'niederlande', 'belgien', 'italien', 'spanien', 'polen'];
        if (euLaender.some(land => text.includes(land))) {
          kz21 += betrag;
        }
      }
    }

    // KZ 66: Vorsteuer (auf Haben-Seite)
    if (SKR04_USTVA_MAPPING.vorsteuer.includes(habenKonto)) {
      kz66 += betrag;
    }
  }

  // Steuerbeträge berechnen
  const kz81Steuer = kz81 * 0.19;
  const kz86Steuer = kz86 * 0.07;

  // KZ 83: Vorauszahlung (USt - Vorsteuer)
  const kz83 = kz81Steuer + kz86Steuer - kz66;

  return {
    kz81: Math.round(kz81 * 100) / 100,
    kz86: Math.round(kz86 * 100) / 100,
    kz35: Math.round(kz35 * 100) / 100,
    kz21: Math.round(kz21 * 100) / 100,
    kz81Steuer: Math.round(kz81Steuer * 100) / 100,
    kz86Steuer: Math.round(kz86Steuer * 100) / 100,
    kz66: Math.round(kz66 * 100) / 100,
    kz83: Math.round(kz83 * 100) / 100,
  };
}

/**
 * Generiert ELSTER-XML für USt-Voranmeldung
 */
function generiereElsterXML(
  firma: typeof unternehmen.$inferSelect,
  kennzahlen: UStVAKennzahlen,
  jahr: number,
  zeitraum: string,
  testmodus: boolean
): string {
  const zeitraumCode = zeitraum.startsWith('Q')
    ? zeitraum.replace('Q', '4') // Q1=41, Q2=42, Q3=43, Q4=44
    : zeitraum.padStart(2, '0'); // Monat 01-12

  const now = new Date();
  const erstellungsDatum = now.toISOString().split('T')[0];

  // ELSTER-XML (vereinfacht, ERiC-kompatibel)
  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">
  <TransferHeader version="11">
    <Verfahren>ElsterAnmeldung</Verfahren>
    <DatenArt>UStVA</DatenArt>
    <Vorgang>send-NoSig</Vorgang>
    <TransferTicket>TT-${now.getTime()}</TransferTicket>
    <Testmerker>${testmodus ? '700000004' : '000000000'}</Testmerker>
    <HerstellerID>74931</HerstellerID>
    <DatenLieferant>${firma.name}</DatenLieferant>
    <Datum>${erstellungsDatum}</Datum>
  </TransferHeader>

  <DatenTeil>
    <Nutzdatenblock>
      <NutzdatenHeader version="11">
        <NutzdatenTicket>ND-${now.getTime()}</NutzdatenTicket>
        <Empfaenger id="F">Finanzamt ${firma.ort || 'Berlin'}</Empfaenger>
        <Hersteller>
          <ProduktName>Buchhaltung Upload Tool</ProduktName>
          <ProduktVersion>1.0</ProduktVersion>
        </Hersteller>
      </NutzdatenHeader>

      <Nutzdaten>
        <Anmeldungssteuern art="UStVA">
          <DatenLieferant>
            <Name>${firma.name}</Name>
            <Strasse>${firma.strasse || ''}</Strasse>
            <PLZ>${firma.plz || ''}</PLZ>
            <Ort>${firma.ort || ''}</Ort>
          </DatenLieferant>

          <Erstellungsdatum>${erstellungsDatum}</Erstellungsdatum>

          <Steuerfall>
            <Steuernummer>${firma.steuernummer || ''}</Steuernummer>
            <Zeitraum>${jahr}${zeitraumCode}</Zeitraum>

            ${kennzahlen.kz81 > 0 ? `<Kz81>${Math.round(kennzahlen.kz81)}</Kz81>` : ''}
            ${kennzahlen.kz81Steuer > 0 ? `<Kz81Steuer>${Math.round(kennzahlen.kz81Steuer)}</Kz81Steuer>` : ''}

            ${kennzahlen.kz86 > 0 ? `<Kz86>${Math.round(kennzahlen.kz86)}</Kz86>` : ''}
            ${kennzahlen.kz86Steuer > 0 ? `<Kz86Steuer>${Math.round(kennzahlen.kz86Steuer)}</Kz86Steuer>` : ''}

            ${kennzahlen.kz35 > 0 ? `<Kz35>${Math.round(kennzahlen.kz35)}</Kz35>` : ''}
            ${kennzahlen.kz21 > 0 ? `<Kz21>${Math.round(kennzahlen.kz21)}</Kz21>` : ''}

            ${kennzahlen.kz66 > 0 ? `<Kz66>${Math.round(kennzahlen.kz66)}</Kz66>` : ''}

            <Kz83>${Math.round(kennzahlen.kz83)}</Kz83>
          </Steuerfall>
        </Anmeldungssteuern>
      </Nutzdaten>
    </Nutzdatenblock>
  </DatenTeil>
</Elster>`;

  return xml;
}

/**
 * ELSTER Router
 */
export const elsterRouter = router({
  /**
   * Berechne USt-VA Kennzahlen
   */
  berechneUStVA: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number(),
        zeitraum: z.string(), // '01'-'12' oder 'Q1'-'Q4'
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Prüfe ob deutsche Firma
      const [firma] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (!firma) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Firma nicht gefunden" });
      }

      if (firma.landCode !== 'DE') {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "USt-VA ist nur für deutsche Firmen verfügbar",
        });
      }

      // Berechne Kennzahlen
      const kennzahlen = await berechneKennzahlen(
        input.unternehmenId,
        input.jahr,
        input.zeitraum
      );

      return {
        kennzahlen,
        firma: {
          name: firma.name,
          steuernummer: firma.steuernummer,
        },
      };
    }),

  /**
   * Generiere ELSTER-XML
   */
  generiereXML: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number(),
        zeitraum: z.string(),
        testmodus: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Lade Firma
      const [firma] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (!firma || firma.landCode !== 'DE') {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "USt-VA ist nur für deutsche Firmen verfügbar",
        });
      }

      // Berechne Kennzahlen
      const kennzahlen = await berechneKennzahlen(
        input.unternehmenId,
        input.jahr,
        input.zeitraum
      );

      // Generiere XML
      const xml = generiereElsterXML(
        firma,
        kennzahlen,
        input.jahr,
        input.zeitraum,
        input.testmodus
      );

      return {
        xml,
        filename: `UStVA_${firma.name.replace(/\s+/g, '_')}_${input.jahr}_${input.zeitraum}.xml`,
      };
    }),
});
