import { eq, desc, and, or, gte, lte, count, sum, sql, like } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { uploadBelegLocal, isStorageAvailable } from "./storage";
import {
  unternehmen,
  userUnternehmen,
  kreditoren,
  debitoren,
  anlagevermoegen,
  beteiligungen,
  gesellschafter,
  bankkonten,
  kostenstellen,
  vertraege,
  buchungen,
  notizen,
  sachkonten,
  InsertUnternehmen,
  InsertKreditor,
  InsertDebitor,
  InsertAnlagevermoegen,
  InsertBeteiligung,
  InsertGesellschafter,
  InsertBankkonto,
  InsertKostenstelle,
  InsertVertrag,
  InsertBuchung,
  InsertNotiz,
  InsertSachkonto,
} from "../drizzle/schema";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Berechnet Wirtschaftsjahr und Periode aus Belegdatum
 *
 * @param belegdatum - Das Datum der Buchung
 * @param wirtschaftsjahrBeginn - Monat (1-12), in dem das Geschäftsjahr beginnt
 * @returns { wirtschaftsjahr, periode }
 *
 * Beispiel 1: wirtschaftsjahrBeginn = 1 (Kalenderjahr)
 *   - 15.01.2026 → WJ 2026, Periode 1
 *   - 15.12.2026 → WJ 2026, Periode 12
 *
 * Beispiel 2: wirtschaftsjahrBeginn = 7 (beginnt am 1. Juli)
 *   - 15.01.2026 → WJ 2025, Periode 7 (7. Monat des am 1.7.2025 begonnenen GJ)
 *   - 15.07.2026 → WJ 2026, Periode 1 (1. Monat des am 1.7.2026 begonnenen GJ)
 */
function calculateWirtschaftsjahrPeriode(
  belegdatum: Date,
  wirtschaftsjahrBeginn: number
): { wirtschaftsjahr: number; periode: number } {
  const jahr = belegdatum.getFullYear();
  const monat = belegdatum.getMonth() + 1; // 1-12

  if (wirtschaftsjahrBeginn === 1) {
    // Einfacher Fall: Kalenderjahr = Geschäftsjahr
    return {
      wirtschaftsjahr: jahr,
      periode: monat
    };
  }

  // Geschäftsjahr beginnt in einem anderen Monat
  if (monat >= wirtschaftsjahrBeginn) {
    // Wir sind im aktuellen Geschäftsjahr (beginnt in diesem Kalenderjahr)
    return {
      wirtschaftsjahr: jahr,
      periode: monat - wirtschaftsjahrBeginn + 1
    };
  } else {
    // Wir sind noch im vorherigen Geschäftsjahr (begann im letzten Kalenderjahr)
    return {
      wirtschaftsjahr: jahr - 1,
      periode: 12 - wirtschaftsjahrBeginn + monat + 1
    };
  }
}

// ============================================
// UNTERNEHMEN ROUTER
// ============================================
export const unternehmenRouter = router({
  // Liste aller Unternehmen des Benutzers
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userCompanies = await db
      .select({
        unternehmen: unternehmen,
        rolle: userUnternehmen.rolle,
      })
      .from(userUnternehmen)
      .innerJoin(unternehmen, eq(userUnternehmen.unternehmenId, unternehmen.id))
      .where(eq(userUnternehmen.userId, ctx.user.id));

    return userCompanies;
  }),

  // Einzelnes Unternehmen abrufen
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Neues Unternehmen erstellen
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        rechtsform: z.string().optional(),
        steuernummer: z.string().optional(),
        ustIdNr: z.string().optional(),
        handelsregister: z.string().optional(),
        strasse: z.string().optional(),
        plz: z.string().optional(),
        ort: z.string().optional(),
        landCode: z.enum(["DE", "AT", "CH", "UK", "CY"]).default("DE"),
        land: z.string().optional(),
        waehrung: z.enum(["EUR", "CHF", "GBP"]).default("EUR"),
        telefon: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).default("SKR03"),
        wirtschaftsjahrBeginn: z.number().min(1).max(12).default(1),
        beraternummer: z.string().optional(),
        mandantennummer: z.string().optional(),
        farbe: z.string().optional(),
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Leere Strings als undefined behandeln, um Datenbankfehler zu vermeiden
      const cleanInput = Object.fromEntries(
        Object.entries(input).map(([key, value]) => [
          key,
          value === "" ? undefined : value,
        ])
      ) as typeof input;

      const values: InsertUnternehmen = {
        name: cleanInput.name,
        rechtsform: cleanInput.rechtsform || undefined,
        steuernummer: cleanInput.steuernummer || undefined,
        ustIdNr: cleanInput.ustIdNr || undefined,
        handelsregister: cleanInput.handelsregister || undefined,
        strasse: cleanInput.strasse || undefined,
        plz: cleanInput.plz || undefined,
        ort: cleanInput.ort || undefined,
        land: cleanInput.land || "Deutschland",
        telefon: cleanInput.telefon || undefined,
        email: cleanInput.email || undefined,
        website: cleanInput.website || undefined,
        kontenrahmen: cleanInput.kontenrahmen || "SKR03",
        wirtschaftsjahrBeginn: cleanInput.wirtschaftsjahrBeginn || 1,
        beraternummer: cleanInput.beraternummer || undefined,
        mandantennummer: cleanInput.mandantennummer || undefined,
        farbe: cleanInput.farbe || "#0d9488",
        logoUrl: cleanInput.logoUrl || undefined,
        createdBy: ctx.user.id,
      };

      const result = await db.insert(unternehmen).values(values);
      const insertId = result[0].insertId;

      // Benutzer als Admin dem Unternehmen zuordnen mit vollen Berechtigungen
      await db.insert(userUnternehmen).values({
        userId: ctx.user.id,
        unternehmenId: insertId,
        rolle: "admin",
        buchungenLesen: true,
        buchungenSchreiben: true,
        stammdatenLesen: true,
        stammdatenSchreiben: true,
        berichteLesen: true,
        berichteExportieren: true,
        einladungenVerwalten: true,
      });

      return { id: insertId };
    }),

  // Unternehmen aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        rechtsform: z.string().optional(),
        steuernummer: z.string().optional(),
        ustIdNr: z.string().optional(),
        handelsregister: z.string().optional(),
        strasse: z.string().optional(),
        plz: z.string().optional(),
        ort: z.string().optional(),
        landCode: z.enum(["DE", "AT", "CH", "UK", "CY"]).optional(),
        land: z.string().optional(),
        waehrung: z.enum(["EUR", "CHF", "GBP"]).optional(),
        telefon: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).optional(),
        wirtschaftsjahrBeginn: z.number().min(1).max(12).optional(),
        beraternummer: z.string().optional(),
        mandantennummer: z.string().optional(),
        farbe: z.string().optional(),
        logoUrl: z.string().optional(),
        aktiv: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, ...rawUpdateData } = input;
      
      // Leere Strings als null behandeln für optionale Felder
      const updateData = Object.fromEntries(
        Object.entries(rawUpdateData).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ])
      );
      
      await db.update(unternehmen).set(updateData).where(eq(unternehmen.id, id));

      return { success: true };
    }),
});

// ============================================
// BUCHUNGEN ROUTER
// ============================================
export const buchungenRouter = router({
  // Liste aller Buchungen eines Unternehmens
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        monat: z.number().min(1).max(12).optional(),
        jahr: z.number().optional(),
        status: z.enum(["entwurf", "geprueft", "exportiert"]).optional(),
        sachkonto: z.string().optional(),
        importReferenz: z.string().optional(),
        geschaeftspartnerKonto: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(buchungen.unternehmenId, input.unternehmenId)];

      if (input.monat) {
        conditions.push(eq(buchungen.periode, input.monat));
      }
      if (input.jahr) {
        conditions.push(eq(buchungen.wirtschaftsjahr, input.jahr));
      }
      if (input.status) {
        conditions.push(eq(buchungen.status, input.status));
      }
      if (input.sachkonto) {
        conditions.push(eq(buchungen.sachkonto, input.sachkonto));
      }
      if (input.importReferenz) {
        conditions.push(eq(buchungen.importReferenz, input.importReferenz));
      }
      if (input.geschaeftspartnerKonto) {
        conditions.push(eq(buchungen.geschaeftspartnerKonto, input.geschaeftspartnerKonto));
      }

      const query = db
        .select()
        .from(buchungen)
        .where(and(...conditions))
        .orderBy(desc(buchungen.belegdatum));

      return await query;
    }),

  // Einzelne Buchung abrufen
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(buchungen)
        .where(eq(buchungen.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Neue Buchung erstellen
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        buchungsart: z.enum(["aufwand", "ertrag", "anlage", "sonstig"]),
        belegdatum: z.string(),
        belegnummer: z.string(),
        geschaeftspartnerTyp: z.enum(["kreditor", "debitor", "gesellschafter", "sonstig"]),
        geschaeftspartner: z.string(),
        geschaeftspartnerKonto: z.string(),
        sachkonto: z.string(),
        kostenstelleId: z.number().optional(),
        nettobetrag: z.string(),
        steuersatz: z.string(),
        bruttobetrag: z.string(),
        buchungstext: z.string().optional(),
        belegUrl: z.string().nullable().optional(),
        // Fremdwährungsfelder
        belegWaehrung: z.string().nullable().optional(),
        belegBetragNetto: z.string().nullable().optional(),
        belegBetragBrutto: z.string().nullable().optional(),
        wechselkurs: z.string().nullable().optional(),
        // Zahlungsfelder
        zahlungsstatus: z.enum(["offen", "teilweise_bezahlt", "bezahlt", "ueberfaellig"]).optional(),
        faelligkeitsdatum: z.string().nullable().optional(),
        bezahltAm: z.string().nullable().optional(),
        bezahlterBetrag: z.string().nullable().optional(),
        zahlungsreferenz: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Unternehmen laden um wirtschaftsjahrBeginn zu bekommen
      const [company] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (!company) throw new Error("Unternehmen nicht gefunden");

      // Wirtschaftsjahr und Periode aus Belegdatum berechnen
      const belegdatum = new Date(input.belegdatum);
      const { wirtschaftsjahr, periode } = calculateWirtschaftsjahrPeriode(
        belegdatum,
        company.wirtschaftsjahrBeginn
      );

      // Date-Konvertierung für Zahlungsfelder
      const faelligkeitsdatum = input.faelligkeitsdatum ? new Date(input.faelligkeitsdatum) : null;
      const bezahltAm = input.bezahltAm ? new Date(input.bezahltAm) : null;

      // Doppelbuchungsprüfung: Suche nach ähnlichen Buchungen
      // Gleiche Kombination = gleiches Datum + gleicher Betrag + gleicher Geschäftspartner
      const belegdatumFormatted = input.belegdatum; // YYYY-MM-DD format
      const potentialDuplicates = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.belegdatum, belegdatum),
            eq(buchungen.bruttobetrag, input.bruttobetrag),
            eq(buchungen.geschaeftspartner, input.geschaeftspartner)
          )
        )
        .limit(1);

      if (potentialDuplicates.length > 0) {
        const duplicate = potentialDuplicates[0];
        throw new Error(
          `⚠️ Mögliche Doppelbuchung gefunden!\n\n` +
          `Eine ähnliche Buchung existiert bereits:\n` +
          `• Datum: ${new Date(duplicate.belegdatum).toLocaleDateString("de-DE")}\n` +
          `• Betrag: ${duplicate.bruttobetrag} €\n` +
          `• Geschäftspartner: ${duplicate.geschaeftspartner}\n` +
          `• Belegnummer: ${duplicate.belegnummer}\n\n` +
          `Bitte prüfen Sie, ob diese Buchung wirklich neu ist!`
        );
      }

      const values: InsertBuchung = {
        ...input,
        belegdatum,
        faelligkeitsdatum,
        bezahltAm,
        nettobetrag: input.nettobetrag,
        steuersatz: input.steuersatz,
        bruttobetrag: input.bruttobetrag,
        wirtschaftsjahr,
        periode,
        createdBy: ctx.user.id,
      };

      const result = await db.insert(buchungen).values(values);
      return { id: result[0].insertId };
    }),

  // Buchung aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        buchungsart: z.enum(["aufwand", "ertrag", "anlage", "sonstig"]).optional(),
        belegdatum: z.string().optional(),
        belegnummer: z.string().optional(),
        geschaeftspartnerTyp: z.enum(["kreditor", "debitor", "gesellschafter", "sonstig"]).optional(),
        geschaeftspartner: z.string().optional(),
        geschaeftspartnerKonto: z.string().optional(),
        sachkonto: z.string().optional(),
        kostenstelleId: z.number().optional(),
        nettobetrag: z.string().optional(),
        steuersatz: z.string().optional(),
        bruttobetrag: z.string().optional(),
        buchungstext: z.string().optional(),
        belegUrl: z.string().nullable().optional(),
        // Fremdwährungsfelder
        belegWaehrung: z.string().nullable().optional(),
        belegBetragNetto: z.string().nullable().optional(),
        belegBetragBrutto: z.string().nullable().optional(),
        wechselkurs: z.string().nullable().optional(),
        status: z.enum(["entwurf", "geprueft", "exportiert"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, belegdatum, ...updateData } = input;
      const finalData: Record<string, unknown> = { ...updateData };

      // Wenn Belegdatum geändert wird, auch wirtschaftsjahr und periode neu berechnen
      if (belegdatum) {
        finalData.belegdatum = new Date(belegdatum);

        // Buchung laden um unternehmenId zu bekommen
        const [buchung] = await db
          .select()
          .from(buchungen)
          .where(eq(buchungen.id, id))
          .limit(1);

        if (buchung) {
          // Unternehmen laden um wirtschaftsjahrBeginn zu bekommen
          const [company] = await db
            .select()
            .from(unternehmen)
            .where(eq(unternehmen.id, buchung.unternehmenId))
            .limit(1);

          if (company) {
            const { wirtschaftsjahr, periode } = calculateWirtschaftsjahrPeriode(
              new Date(belegdatum),
              company.wirtschaftsjahrBeginn
            );
            finalData.wirtschaftsjahr = wirtschaftsjahr;
            finalData.periode = periode;
          }
        }
      }

      await db.update(buchungen).set(finalData).where(eq(buchungen.id, id));
      return { success: true };
    }),

  // Buchung löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db.delete(buchungen).where(eq(buchungen.id, input.id));
      return { success: true };
    }),

  // Statistiken abrufen (Anzahl, Summen)
  stats: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        monat: z.number().min(1).max(12).optional(),
        jahr: z.number().optional(),
        importReferenz: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        count: 0,
        netto: 0,
        steuer: 0,
        brutto: 0,
        guvCount: 0,
        guvNetto: 0,
        guvSteuer: 0,
        guvBrutto: 0,
      };

      const conditions = [eq(buchungen.unternehmenId, input.unternehmenId)];
      if (input.monat) conditions.push(eq(buchungen.periode, input.monat));
      if (input.jahr) conditions.push(eq(buchungen.wirtschaftsjahr, input.jahr));
      if (input.importReferenz) conditions.push(eq(buchungen.importReferenz, input.importReferenz));

      // Gesamt-Summen (alle Buchungen)
      const result = await db
        .select({
          count: count(),
          netto: sum(buchungen.nettobetrag),
          brutto: sum(buchungen.bruttobetrag),
        })
        .from(buchungen)
        .where(and(...conditions));

      // GuV-relevante Summen (nur Kontenklassen 4-7 für SKR04 6-stellig)
      const guvResult = await db
        .select({
          count: count(),
          netto: sum(buchungen.nettobetrag),
          brutto: sum(buchungen.bruttobetrag),
        })
        .from(buchungen)
        .where(
          and(
            ...conditions,
            or(
              // Erträge (Klasse 4: 400000-499999)
              sql`${buchungen.habenKonto} >= '400000' AND ${buchungen.habenKonto} < '500000'`,
              sql`${buchungen.sachkonto} >= '400000' AND ${buchungen.sachkonto} < '500000'`,
              // Aufwendungen (Klassen 5-7: 500000-799999)
              sql`${buchungen.sollKonto} >= '500000' AND ${buchungen.sollKonto} < '800000'`,
              sql`${buchungen.sachkonto} >= '500000' AND ${buchungen.sachkonto} < '800000'`
            )
          )
        );

      const row = result[0];
      const guvRow = guvResult[0];

      const netto = parseFloat(row.netto || "0");
      const brutto = parseFloat(row.brutto || "0");
      const guvNetto = parseFloat(guvRow.netto || "0");
      const guvBrutto = parseFloat(guvRow.brutto || "0");

      return {
        // Gesamt-Summen (alle Buchungen)
        count: row.count || 0,
        netto,
        brutto,
        steuer: brutto - netto,
        // GuV-relevante Summen
        guvCount: guvRow.count || 0,
        guvNetto,
        guvBrutto,
        guvSteuer: guvBrutto - guvNetto,
      };
    }),

  // Prüfe auf Doppelbuchungen (gleiche Belegnummer + Unternehmen + ähnliches Datum)
  checkDuplicate: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        belegnummer: z.string(),
        belegdatum: z.string(),
        excludeId: z.number().optional(), // Bei Update: eigene ID ausschließen
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { isDuplicate: false, existingBuchungen: [] };

      // Prüfe auf gleiche Belegnummer im selben Unternehmen
      const belegdatum = new Date(input.belegdatum);
      const datumVon = new Date(belegdatum);
      datumVon.setDate(datumVon.getDate() - 3); // 3 Tage vor
      const datumBis = new Date(belegdatum);
      datumBis.setDate(datumBis.getDate() + 3); // 3 Tage nach

      const conditions = [
        eq(buchungen.unternehmenId, input.unternehmenId),
        eq(buchungen.belegnummer, input.belegnummer),
        gte(buchungen.belegdatum, datumVon),
        lte(buchungen.belegdatum, datumBis),
      ];

      // Bei Update: eigene Buchung ausschließen
      if (input.excludeId) {
        conditions.push(sql`${buchungen.id} != ${input.excludeId}`);
      }

      const existingBuchungen = await db
        .select()
        .from(buchungen)
        .where(and(...conditions))
        .limit(5);

      return {
        isDuplicate: existingBuchungen.length > 0,
        existingBuchungen,
      };
    }),

  // Zahlungsstatus aktualisieren
  updateZahlungsstatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        zahlungsstatus: z.enum(["offen", "teilweise_bezahlt", "bezahlt", "ueberfaellig"]),
        bezahltAm: z.string().optional(),
        bezahlterBetrag: z.string().optional(),
        zahlungsreferenz: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, bezahltAm, ...updateData } = input;
      const finalData: Record<string, unknown> = { ...updateData };
      if (bezahltAm) {
        finalData.bezahltAm = new Date(bezahltAm);
      }

      await db.update(buchungen).set(finalData).where(eq(buchungen.id, id));
      return { success: true };
    }),

  // Offene Rechnungen abrufen
  offeneRechnungen: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            or(
              eq(buchungen.zahlungsstatus, "offen"),
              eq(buchungen.zahlungsstatus, "teilweise_bezahlt"),
              eq(buchungen.zahlungsstatus, "ueberfaellig")
            )
          )
        )
        .orderBy(buchungen.faelligkeitsdatum);

      return result;
    }),

  // Zahlungsübersicht (Statistiken)
  zahlungsUebersicht: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { offen: 0, teilweise: 0, bezahlt: 0, ueberfaellig: 0, offenerBetrag: 0, bezahlterBetrag: 0 };

      const alleBuchungen = await db
        .select()
        .from(buchungen)
        .where(eq(buchungen.unternehmenId, input.unternehmenId));

      const stats = {
        offen: 0,
        teilweise: 0,
        bezahlt: 0,
        ueberfaellig: 0,
        offenerBetrag: 0,
        bezahlterBetrag: 0,
      };

      const heute = new Date();

      for (const b of alleBuchungen) {
        const brutto = parseFloat(String(b.bruttobetrag)) || 0;
        const bezahlt = parseFloat(String(b.bezahlterBetrag)) || 0;

        switch (b.zahlungsstatus) {
          case "offen":
            // Prüfe ob überfällig
            if (b.faelligkeitsdatum && new Date(b.faelligkeitsdatum) < heute) {
              stats.ueberfaellig++;
              stats.offenerBetrag += brutto;
            } else {
              stats.offen++;
              stats.offenerBetrag += brutto;
            }
            break;
          case "teilweise_bezahlt":
            stats.teilweise++;
            stats.offenerBetrag += (brutto - bezahlt);
            stats.bezahlterBetrag += bezahlt;
            break;
          case "bezahlt":
            stats.bezahlt++;
            stats.bezahlterBetrag += brutto;
            break;
          case "ueberfaellig":
            stats.ueberfaellig++;
            stats.offenerBetrag += brutto;
            break;
        }
      }

      return stats;
    }),

  // Fälligkeiten für Kalender
  faelligkeiten: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        vonDatum: z.string(),
        bisDatum: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const alleBuchungen = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            gte(buchungen.faelligkeitsdatum, new Date(input.vonDatum)),
            lte(buchungen.faelligkeitsdatum, new Date(input.bisDatum))
          )
        );

      const heute = new Date();

      return alleBuchungen.map((b) => {
        // Bestimme den aktuellen Status
        let status = b.zahlungsstatus;
        if (status === "offen" && b.faelligkeitsdatum && new Date(b.faelligkeitsdatum) < heute) {
          status = "ueberfaellig";
        }

        return {
          id: b.id,
          date: b.faelligkeitsdatum,
          title: b.geschaeftspartner,
          belegnummer: b.belegnummer,
          amount: parseFloat(String(b.bruttobetrag)) || 0,
          status: status as "offen" | "teilweise_bezahlt" | "bezahlt" | "ueberfaellig",
          type: b.buchungsart,
          buchungstext: b.buchungstext,
        };
      });
    }),

  // DATEV-Export für einen Monat
  exportDatev: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        monat: z.number().min(1).max(12),
        jahr: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { csv: "", count: 0 };

      // Unternehmensdaten abrufen
      const company = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (!company[0]) throw new Error("Unternehmen nicht gefunden");

      // Buchungen des Monats abrufen
      const monthBuchungen = await db
        .select()
        .from(buchungen)
        .where(eq(buchungen.unternehmenId, input.unternehmenId));

      // Filtern nach Monat/Jahr
      const filteredBuchungen = monthBuchungen.filter((b) => {
        const date = new Date(b.belegdatum);
        return date.getMonth() + 1 === input.monat && date.getFullYear() === input.jahr;
      });

      // DATEV-CSV generieren
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 17) + "000";
      const startDate = `${input.jahr}${String(input.monat).padStart(2, "0")}01`;
      const endDate = `${input.jahr}${String(input.monat).padStart(2, "0")}${new Date(input.jahr, input.monat, 0).getDate()}`;
      const kontenrahmen = company[0].kontenrahmen === "SKR04" ? "04" : "03";

      const header = `"EXTF";700;21;"Buchungsstapel";13;${timestamp};;"${company[0].beraternummer || ""}";"";"";${company[0].mandantennummer || "1001"};10001;${input.jahr}0101;4;${startDate};${endDate};"Buchungsstapel";"MA";1;0;0;"EUR";;"";;;"${kontenrahmen}";;;"";""`;
      const columns = `Umsatz;Soll/Haben-Kz;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto (ohne BU-Schluessel);BU-Schluessel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext;Postensperre;Diverse Adressnummer;Geschaeftspartnerbank;Sachverhalt;Zinssperre;Beleglink;KOST1`;

      const rows = filteredBuchungen.map((b) => {
        const datum = new Date(b.belegdatum);
        const datumStr = `${String(datum.getDate()).padStart(2, "0")}${String(datum.getMonth() + 1).padStart(2, "0")}`;
        const sollHaben = b.buchungsart === "ertrag" ? "H" : "S";
        return `${b.bruttobetrag};"${sollHaben}";"EUR";;;;"${b.sachkonto}";"${b.geschaeftspartnerKonto}";"";"${datumStr}";"${b.belegnummer}";"";;${b.buchungstext || ""};0;;;;;"";"${b.kostenstelleId || ""}"`;
      });

      const csv = [header, columns, ...rows].join("\n");

      return { csv, count: filteredBuchungen.length };
    }),

  // Beleg-Datei zum lokalen Storage hochladen (Railway Volume oder lokales Filesystem)
  uploadBeleg: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        dateiName: z.string(),
        dateiBase64: z.string(), // Base64-kodierte Datei
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Prüfe ob Storage verfügbar ist
      if (!isStorageAvailable()) {
        return {
          url: null,
          path: null,
          dateiName: input.dateiName,
          warning: "Beleg konnte nicht hochgeladen werden - Storage nicht verfügbar",
        };
      }

      // Konvertiere Base64 zu Buffer
      const base64Data = input.dateiBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Upload zum lokalen Storage
      const result = await uploadBelegLocal(buffer, input.dateiName, input.unternehmenId);

      return {
        url: result.url,
        path: result.path,
        dateiName: input.dateiName,
      };
    }),

  // Erweiterte Suche in Buchungen
  search: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        searchText: z.string().optional(), // Suche in Buchungstext, Belegnummer
        dateFrom: z.string().optional(), // ISO date string
        dateTo: z.string().optional(),
        amountMin: z.number().optional(),
        amountMax: z.number().optional(),
        sollKonto: z.string().optional(),
        habenKonto: z.string().optional(),
        sachkonto: z.string().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(buchungen.unternehmenId, input.unternehmenId)];

      // Text-Suche in buchungstext, belegnummer, geschaeftspartner
      if (input.searchText && input.searchText.trim()) {
        const searchPattern = `%${input.searchText.trim()}%`;
        conditions.push(
          or(
            like(buchungen.buchungstext, searchPattern),
            like(buchungen.datevBuchungstext, searchPattern),
            like(buchungen.belegnummer, searchPattern),
            like(buchungen.datevBelegnummer, searchPattern),
            like(buchungen.geschaeftspartner, searchPattern)
          )!
        );
      }

      // Datumsbereich
      if (input.dateFrom) {
        conditions.push(gte(buchungen.belegdatum, new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        conditions.push(lte(buchungen.belegdatum, new Date(input.dateTo)));
      }

      // Betragsbereich
      if (input.amountMin !== undefined) {
        conditions.push(gte(buchungen.bruttobetrag, input.amountMin.toString()));
      }
      if (input.amountMax !== undefined) {
        conditions.push(lte(buchungen.bruttobetrag, input.amountMax.toString()));
      }

      // Konto-Filter
      if (input.sollKonto) {
        conditions.push(eq(buchungen.sollKonto, input.sollKonto));
      }
      if (input.habenKonto) {
        conditions.push(eq(buchungen.habenKonto, input.habenKonto));
      }
      if (input.sachkonto) {
        conditions.push(eq(buchungen.sachkonto, input.sachkonto));
      }

      const results = await db
        .select()
        .from(buchungen)
        .where(and(...conditions))
        .orderBy(desc(buchungen.belegdatum))
        .limit(input.limit);

      return results;
    }),

  // Doppelbuchungen finden
  findDuplicates: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Hole alle Buchungen des Unternehmens
      const allBuchungen = await db
        .select()
        .from(buchungen)
        .where(eq(buchungen.unternehmenId, input.unternehmenId))
        .orderBy(desc(buchungen.belegdatum));

      // Hole bereits geprüfte Paare
      const checkedPairs = await db
        .select()
        .from(sql`checked_duplicates`)
        .where(sql`unternehmenId = ${input.unternehmenId}`);

      const checkedSet = new Set(
        checkedPairs.map((p: any) => `${p.buchung1Id}-${p.buchung2Id}`)
      );

      interface DuplicatePair {
        buchung1: any;
        buchung2: any;
        reason: string;
        similarity: number;
      }

      const duplicates: DuplicatePair[] = [];

      // Prüfe jedes Buchungspaar
      for (let i = 0; i < allBuchungen.length; i++) {
        for (let j = i + 1; j < allBuchungen.length; j++) {
          const b1 = allBuchungen[i];
          const b2 = allBuchungen[j];

          // Überspringe wenn schon geprüft
          const pairKey = `${Math.min(b1.id, b2.id)}-${Math.max(b1.id, b2.id)}`;
          if (checkedSet.has(pairKey)) continue;

          let isDuplicate = false;
          let reason = "";
          let similarity = 0;

          // Kriterium 1: Gleicher Betrag + gleiches Datum + gleiches Konto
          const sameBrutto = b1.bruttobetrag === b2.bruttobetrag;
          const sameDate = b1.belegdatum.getTime() === b2.belegdatum.getTime();
          const sameKonto =
            b1.sachkonto === b2.sachkonto ||
            (b1.sollKonto && b1.sollKonto === b2.sollKonto) ||
            (b1.habenKonto && b1.habenKonto === b2.habenKonto);

          if (sameBrutto && sameDate && sameKonto) {
            isDuplicate = true;
            reason = "Gleicher Betrag, Datum und Konto";
            similarity = 100;
          }

          // Kriterium 2: Gleiche Belegnummer + unterschiedliche IDs
          if (
            !isDuplicate &&
            b1.belegnummer &&
            b2.belegnummer &&
            (b1.belegnummer === b2.belegnummer ||
              b1.datevBelegnummer === b2.datevBelegnummer)
          ) {
            isDuplicate = true;
            reason = "Gleiche Belegnummer";
            similarity = 95;
          }

          // Kriterium 3: Gleicher Buchungstext + Betrag + Datum innerhalb 3 Tage
          if (!isDuplicate && sameBrutto) {
            const daysDiff =
              Math.abs(b1.belegdatum.getTime() - b2.belegdatum.getTime()) /
              (1000 * 60 * 60 * 24);

            const text1 = (b1.buchungstext || b1.datevBuchungstext || "").toLowerCase();
            const text2 = (b2.buchungstext || b2.datevBuchungstext || "").toLowerCase();

            if (daysDiff <= 3 && text1 && text2 && text1 === text2) {
              isDuplicate = true;
              reason = `Gleicher Text und Betrag (${Math.round(daysDiff)} Tage Abstand)`;
              similarity = 85;
            }
          }

          if (isDuplicate) {
            duplicates.push({
              buchung1: b1,
              buchung2: b2,
              reason,
              similarity,
            });
          }

          // Begrenze Ergebnis auf 50 Paare
          if (duplicates.length >= 50) break;
        }
        if (duplicates.length >= 50) break;
      }

      return duplicates;
    }),

  // Buchungspaar als "keine Doppelbuchung" markieren
  markAsChecked: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        buchung1Id: z.number(),
        buchung2Id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Sortiere IDs damit Reihenfolge egal ist
      const [id1, id2] =
        input.buchung1Id < input.buchung2Id
          ? [input.buchung1Id, input.buchung2Id]
          : [input.buchung2Id, input.buchung1Id];

      await db.execute(
        sql`INSERT INTO checked_duplicates (unternehmenId, buchung1Id, buchung2Id, checkedBy)
            VALUES (${input.unternehmenId}, ${id1}, ${id2}, ${ctx.user.id})
            ON DUPLICATE KEY UPDATE checkedAt = CURRENT_TIMESTAMP`
      );

      return { success: true };
    }),
});

// ============================================
// STAMMDATEN ROUTER (Kreditoren, Debitoren, etc.)
// ============================================
export const stammdatenRouter = router({
  // Kreditoren
  kreditoren: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(kreditoren).where(eq(kreditoren.unternehmenId, input.unternehmenId));
      }),

    // Vorschläge aus Buchungen generieren
    getSuggestions: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        // Alle Geschäftspartner aus Buchungen mit Typ "kreditor"
        const buchungenKreditoren = await db
          .select({
            geschaeftspartner: buchungen.geschaeftspartner,
            geschaeftspartnerKonto: buchungen.geschaeftspartnerKonto,
            count: sql<number>`COUNT(*)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, input.unternehmenId),
              eq(buchungen.geschaeftspartnerTyp, "kreditor"),
              sql`${buchungen.geschaeftspartner} IS NOT NULL`,
              sql`${buchungen.geschaeftspartner} != ''`
            )
          )
          .groupBy(buchungen.geschaeftspartner, buchungen.geschaeftspartnerKonto);

        // Bestehende Kreditoren laden
        const existingKreditoren = await db
          .select()
          .from(kreditoren)
          .where(eq(kreditoren.unternehmenId, input.unternehmenId));

        const existingKonten = new Set(existingKreditoren.map(k => k.kontonummer));

        // Nur Vorschläge für noch nicht existierende Konten
        const suggestions = buchungenKreditoren
          .filter(b => b.geschaeftspartnerKonto && !existingKonten.has(b.geschaeftspartnerKonto))
          .map(b => ({
            name: b.geschaeftspartner,
            kontonummer: b.geschaeftspartnerKonto,
            buchungenCount: b.count,
          }))
          .sort((a, b) => b.buchungenCount - a.buchungenCount);

        return suggestions;
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          name: z.string(),
          kurzbezeichnung: z.string().optional(),
          strasse: z.string().optional(),
          plz: z.string().optional(),
          ort: z.string().optional(),
          land: z.string().optional(),
          telefon: z.string().optional(),
          email: z.string().optional(),
          ustIdNr: z.string().optional(),
          steuernummer: z.string().optional(),
          iban: z.string().optional(),
          bic: z.string().optional(),
          zahlungsziel: z.number().optional(),
          skonto: z.string().optional(),
          skontofrist: z.number().optional(),
          standardSachkonto: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(kreditoren).values(input as InsertKreditor);
        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, ...data } = input;
        await db.update(kreditoren).set(data).where(eq(kreditoren.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(kreditoren).where(eq(kreditoren.id, input.id));
        return { success: true };
      }),

    // Kreditor zu Debitor konvertieren
    convertToDebitor: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        
        // Kreditor laden
        const [kreditor] = await db.select().from(kreditoren).where(eq(kreditoren.id, input.id));
        if (!kreditor) throw new Error("Kreditor nicht gefunden");
        
        // Als Debitor erstellen
        const result = await db.insert(debitoren).values({
          unternehmenId: kreditor.unternehmenId,
          kontonummer: kreditor.kontonummer,
          name: kreditor.name,
          kurzbezeichnung: kreditor.kurzbezeichnung,
          strasse: kreditor.strasse,
          plz: kreditor.plz,
          ort: kreditor.ort,
          land: kreditor.land,
          telefon: kreditor.telefon,
          email: kreditor.email,
          ustIdNr: kreditor.ustIdNr,
          zahlungsziel: kreditor.zahlungsziel,
          notizen: kreditor.notizen,
        } as InsertDebitor);
        
        // Kreditor löschen
        await db.delete(kreditoren).where(eq(kreditoren.id, input.id));
        
        return { success: true, newId: result[0].insertId };
      }),
  }),

  // Debitoren
  debitoren: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(debitoren).where(eq(debitoren.unternehmenId, input.unternehmenId));
      }),

    // Vorschläge aus Buchungen generieren
    getSuggestions: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        // Alle Geschäftspartner aus Buchungen mit Typ "debitor"
        const buchungenDebitoren = await db
          .select({
            geschaeftspartner: buchungen.geschaeftspartner,
            geschaeftspartnerKonto: buchungen.geschaeftspartnerKonto,
            count: sql<number>`COUNT(*)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, input.unternehmenId),
              eq(buchungen.geschaeftspartnerTyp, "debitor"),
              sql`${buchungen.geschaeftspartner} IS NOT NULL`,
              sql`${buchungen.geschaeftspartner} != ''`
            )
          )
          .groupBy(buchungen.geschaeftspartner, buchungen.geschaeftspartnerKonto);

        // Bestehende Debitoren laden
        const existingDebitoren = await db
          .select()
          .from(debitoren)
          .where(eq(debitoren.unternehmenId, input.unternehmenId));

        const existingKonten = new Set(existingDebitoren.map(d => d.kontonummer));

        // Nur Vorschläge für noch nicht existierende Konten
        const suggestions = buchungenDebitoren
          .filter(b => b.geschaeftspartnerKonto && !existingKonten.has(b.geschaeftspartnerKonto))
          .map(b => ({
            name: b.geschaeftspartner,
            kontonummer: b.geschaeftspartnerKonto,
            buchungenCount: b.count,
          }))
          .sort((a, b) => b.buchungenCount - a.buchungenCount);

        return suggestions;
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          name: z.string(),
          kurzbezeichnung: z.string().optional(),
          strasse: z.string().optional(),
          plz: z.string().optional(),
          ort: z.string().optional(),
          land: z.string().optional(),
          telefon: z.string().optional(),
          email: z.string().optional(),
          ustIdNr: z.string().optional(),
          kreditlimit: z.string().optional(),
          zahlungsziel: z.number().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(debitoren).values(input as InsertDebitor);
        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, ...data } = input;
        await db.update(debitoren).set(data).where(eq(debitoren.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(debitoren).where(eq(debitoren.id, input.id));
        return { success: true };
      }),

    // Debitor zu Kreditor konvertieren
    convertToKreditor: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        
        // Debitor laden
        const [debitor] = await db.select().from(debitoren).where(eq(debitoren.id, input.id));
        if (!debitor) throw new Error("Debitor nicht gefunden");
        
        // Als Kreditor erstellen
        const result = await db.insert(kreditoren).values({
          unternehmenId: debitor.unternehmenId,
          kontonummer: debitor.kontonummer,
          name: debitor.name,
          kurzbezeichnung: debitor.kurzbezeichnung,
          strasse: debitor.strasse,
          plz: debitor.plz,
          ort: debitor.ort,
          land: debitor.land,
          telefon: debitor.telefon,
          email: debitor.email,
          ustIdNr: debitor.ustIdNr,
          zahlungsziel: debitor.zahlungsziel,
          notizen: debitor.notizen,
        } as InsertKreditor);
        
        // Debitor löschen
        await db.delete(debitoren).where(eq(debitoren.id, input.id));
        
        return { success: true, newId: result[0].insertId };
      }),
  }),

  // Anlagevermögen
  anlagevermoegen: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(anlagevermoegen).where(eq(anlagevermoegen.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          bezeichnung: z.string(),
          kategorie: z.string().optional(),
          anschaffungsdatum: z.string().optional(),
          anschaffungskosten: z.string().optional(),
          nutzungsdauer: z.number().optional(),
          abschreibungsmethode: z.enum(["linear", "degressiv", "keine"]).optional(),
          restwert: z.string().optional(),
          standort: z.string().optional(),
          inventarnummer: z.string().optional(),
          seriennummer: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { anschaffungsdatum, ...rest } = input;
        const values: InsertAnlagevermoegen = {
          ...rest,
          anschaffungsdatum: anschaffungsdatum ? new Date(anschaffungsdatum) : undefined,
        };
        const result = await db.insert(anlagevermoegen).values(values);
        return { id: result[0].insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(anlagevermoegen).where(eq(anlagevermoegen.id, input.id));
        return { success: true };
      }),
  }),

  // Beteiligungen
  beteiligungen: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(beteiligungen).where(eq(beteiligungen.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          name: z.string(),
          rechtsform: z.string().optional(),
          anteil: z.string().optional(),
          buchwert: z.string().optional(),
          erwerbsdatum: z.string().optional(),
          sitz: z.string().optional(),
          handelsregister: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { erwerbsdatum, ...rest } = input;
        const values: InsertBeteiligung = {
          ...rest,
          erwerbsdatum: erwerbsdatum ? new Date(erwerbsdatum) : undefined,
        };
        const result = await db.insert(beteiligungen).values(values);
        return { id: result[0].insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(beteiligungen).where(eq(beteiligungen.id, input.id));
        return { success: true };
      }),
  }),

  // Gesellschafter
  gesellschafter: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(gesellschafter).where(eq(gesellschafter.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          name: z.string(),
          typ: z.enum(["natuerlich", "juristisch"]).optional(),
          anteil: z.string().optional(),
          einlage: z.string().optional(),
          eintrittsdatum: z.string().optional(),
          strasse: z.string().optional(),
          plz: z.string().optional(),
          ort: z.string().optional(),
          steuerId: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { eintrittsdatum, ...rest } = input;
        const values: InsertGesellschafter = {
          ...rest,
          eintrittsdatum: eintrittsdatum ? new Date(eintrittsdatum) : undefined,
        };
        const result = await db.insert(gesellschafter).values(values);
        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          unternehmenId: z.number(), // 🔒 REQUIRED for security check
          kontonummer: z.string().optional(),
          name: z.string().optional(),
          typ: z.enum(["natuerlich", "juristisch"]).optional(),
          anteil: z.string().optional(),
          einlage: z.string().optional(),
          eintrittsdatum: z.string().optional(),
          strasse: z.string().optional(),
          plz: z.string().optional(),
          ort: z.string().optional(),
          steuerId: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");

        // 🔒 SECURITY: Verify unternehmenId match
        const existing = await db
          .select()
          .from(gesellschafter)
          .where(eq(gesellschafter.id, input.id))
          .limit(1);

        if (existing.length === 0) {
          throw new Error("Gesellschafter nicht gefunden");
        }

        if (existing[0].unternehmenId !== input.unternehmenId) {
          console.error("🚨 SECURITY: Attempt to update Gesellschafter from different company!", {
            existingCompanyId: existing[0].unternehmenId,
            requestedCompanyId: input.unternehmenId,
            gesellschafterId: input.id,
          });
          throw new Error("Sie haben keine Berechtigung, diesen Gesellschafter zu bearbeiten");
        }

        const { id, unternehmenId, eintrittsdatum, ...updateData } = input;

        await db.update(gesellschafter).set({
          ...updateData,
          eintrittsdatum: eintrittsdatum ? new Date(eintrittsdatum) : undefined,
        }).where(eq(gesellschafter.id, input.id));

        return { success: true };
      }),

    delete: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          unternehmenId: z.number(), // 🔒 ADDED for security check
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");

        // 🔒 SECURITY: Verify unternehmenId match
        const existing = await db
          .select()
          .from(gesellschafter)
          .where(eq(gesellschafter.id, input.id))
          .limit(1);

        if (existing.length === 0) {
          throw new Error("Gesellschafter nicht gefunden");
        }

        if (existing[0].unternehmenId !== input.unternehmenId) {
          console.error("🚨 SECURITY: Attempt to delete Gesellschafter from different company!", {
            existingCompanyId: existing[0].unternehmenId,
            requestedCompanyId: input.unternehmenId,
            gesellschafterId: input.id,
          });
          throw new Error("Sie haben keine Berechtigung, diesen Gesellschafter zu löschen");
        }

        console.log("✅ DELETE Gesellschafter:", input.id, "| Company:", existing[0].unternehmenId);

        await db.delete(gesellschafter).where(eq(gesellschafter.id, input.id));
        return { success: true };
      }),
  }),

  // Bankkonten
  bankkonten: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(bankkonten).where(eq(bankkonten.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          bezeichnung: z.string(),
          bankname: z.string().optional(),
          iban: z.string().optional(),
          bic: z.string().optional(),
          kontotyp: z.enum(["girokonto", "sparkonto", "festgeld", "kreditkarte", "sonstig"]).optional(),
          waehrung: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(bankkonten).values(input as InsertBankkonto);
        return { id: result[0].insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(bankkonten).where(eq(bankkonten.id, input.id));
        return { success: true };
      }),
  }),

  // Kostenstellen
  kostenstellen: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(kostenstellen).where(eq(kostenstellen.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          nummer: z.string(),
          bezeichnung: z.string(),
          verantwortlicher: z.string().optional(),
          budget: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(kostenstellen).values(input as InsertKostenstelle);
        return { id: result[0].insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(kostenstellen).where(eq(kostenstellen.id, input.id));
        return { success: true };
      }),
  }),

  // Verträge
  vertraege: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(vertraege).where(eq(vertraege.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          bezeichnung: z.string(),
          vertragsart: z.enum(["miete", "leasing", "wartung", "versicherung", "abo", "sonstig"]).optional(),
          vertragspartner: z.string().optional(),
          vertragsnummer: z.string().optional(),
          beginn: z.string().optional(),
          ende: z.string().optional(),
          kuendigungsfrist: z.string().optional(),
          monatlicheBetrag: z.string().optional(),
          zahlungsrhythmus: z.enum(["monatlich", "quartalsweise", "halbjaehrlich", "jaehrlich"]).optional(),
          buchungskonto: z.string().optional(),
          kostenstelleId: z.number().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { beginn, ende, ...rest } = input;
        const values: InsertVertrag = {
          ...rest,
          beginn: beginn ? new Date(beginn) : undefined,
          ende: ende ? new Date(ende) : undefined,
        };
        const result = await db.insert(vertraege).values(values);
        return { id: result[0].insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(vertraege).where(eq(vertraege.id, input.id));
        return { success: true };
      }),
  }),

  // Sachkonten
  sachkonten: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        // Hole firmenspezifische Sachkonten
        const konten = await db
          .select()
          .from(sachkonten)
          .where(eq(sachkonten.unternehmenId, input.unternehmenId))
          .orderBy(sachkonten.kategorie, sachkonten.kontonummer);
        return konten;
      }),

    // Gruppierte Liste für Dropdown mit Kategorien
    listGrouped: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const konten = await db
          .select()
          .from(sachkonten)
          .where(eq(sachkonten.unternehmenId, input.unternehmenId))
          .orderBy(sachkonten.kategorie, sachkonten.kontonummer);
        
        // Gruppiere nach Kategorie
        const grouped: Record<string, typeof konten> = {};
        for (const konto of konten) {
          const kategorie = konto.kategorie || "Sonstige";
          if (!grouped[kategorie]) {
            grouped[kategorie] = [];
          }
          grouped[kategorie].push(konto);
        }
        
        return grouped;
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).default("SKR04"),
          kontonummer: z.string(),
          bezeichnung: z.string(),
          kategorie: z.string().optional(),
          kontotyp: z.enum(["aktiv", "passiv", "aufwand", "ertrag", "neutral"]).optional(),
          standardSteuersatz: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(sachkonten).values(input as InsertSachkonto);
        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, ...data } = input;
        await db.update(sachkonten).set(data).where(eq(sachkonten.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(sachkonten).where(eq(sachkonten.id, input.id));
        return { success: true };
      }),
  }),
});

// ============================================
// NOTIZEN ROUTER
// ============================================
export const notizenRouter = router({
  list: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(notizen)
        .where(eq(notizen.unternehmenId, input.unternehmenId))
        .orderBy(desc(notizen.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        titel: z.string(),
        kategorie: z.enum(["vertrag", "kreditor", "debitor", "buchung", "allgemein"]).optional(),
        bezug: z.string().optional(),
        inhalt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      const values: InsertNotiz = {
        ...input,
        createdBy: ctx.user.id,
      };
      const result = await db.insert(notizen).values(values);
      return { id: result[0].insertId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        titel: z.string().optional(),
        kategorie: z.enum(["vertrag", "kreditor", "debitor", "buchung", "allgemein"]).optional(),
        bezug: z.string().optional(),
        inhalt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      const { id, ...data } = input;
      await db.update(notizen).set(data).where(eq(notizen.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      await db.delete(notizen).where(eq(notizen.id, input.id));
      return { success: true };
    }),
});
