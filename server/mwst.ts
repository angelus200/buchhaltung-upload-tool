import { z } from "zod";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { buchungen, unternehmen } from "../drizzle/schema";

// ============================================
// MWST ROUTER - Schweizer MWST-Quartalsabrechnung
// ============================================

/**
 * Berechnet die MWST-Abrechnung für Schweizer Unternehmen nach ESTV-Formular
 *
 * WICHTIG: Nur für Schweizer Unternehmen (landCode = 'CH')
 *
 * ESTV-Formular-Struktur:
 * - Ziffer 200-299: Umsatz (netto, exkl. MWST)
 * - Ziffer 303-343: Steuerberechnung nach Satz
 * - Ziffer 399: Total geschuldete Steuer
 * - Ziffer 400-479: Vorsteuer
 * - Ziffer 500/510: Zahllast/Guthaben
 *
 * Schweizer MWST-Sätze:
 * - 8.1% Normalsatz (V81)
 * - 2.6% Reduzierter Satz (V26)
 * - 3.8% Beherbergungssatz (V38)
 */
export const mwstRouter = router({
  /**
   * Berechnet die Quartalsabrechnung für ein Schweizer Unternehmen
   */
  quartalsabrechnung: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number(),
        quartal: z.number().min(1).max(4), // Q1-Q4
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Datenbank nicht verfügbar");
      }

      // Unternehmensdaten prüfen
      const [company] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (!company) {
        throw new Error("Unternehmen nicht gefunden");
      }

      // Prüfen ob Schweizer Unternehmen
      if (company.landCode !== "CH") {
        throw new Error("Diese Funktion ist nur für Schweizer Unternehmen verfügbar (landCode = CH)");
      }

      // Berechne Quartalsdatumsbereich
      const quartalStart = getQuartalStart(input.jahr, input.quartal);
      const quartalEnde = getQuartalEnde(input.jahr, input.quartal);

      // ========================================
      // I. UMSATZ (Ziffer 200-299)
      // ========================================

      // Ziffer 200: Gesamtumsatz (alle Erlöse inkl. steuerfreie)
      const gesamtumsatzResult = await db
        .select({
          summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "ertrag"),
            gte(buchungen.belegdatum, new Date(quartalStart)),
            lte(buchungen.belegdatum, new Date(quartalEnde))
          )
        );

      const ziffer200 = parseFloat(gesamtumsatzResult[0]?.summe || "0");

      // Ziffer 220-280: Abzüge (TODO: Exporte, Ausland, etc.)
      // Für jetzt: 0, da noch nicht implementiert
      const ziffer220bis280 = 0;

      // Ziffer 299: Steuerbarer Gesamtumsatz
      const ziffer299 = ziffer200 - ziffer220bis280;

      // ========================================
      // II. STEUERBERECHNUNG (Ziffer 303-343)
      // ========================================

      // Ziffer 303: Leistungen Normalsatz 8.1%
      const normalsatzResult = await db
        .select({
          summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "ertrag"),
            eq(buchungen.steuersatz, "8.1"),
            gte(buchungen.belegdatum, new Date(quartalStart)),
            lte(buchungen.belegdatum, new Date(quartalEnde))
          )
        );

      const ziffer303_betrag = parseFloat(normalsatzResult[0]?.summe || "0");
      const ziffer303_steuer = ziffer303_betrag * 0.081;

      // Ziffer 313: Leistungen reduzierter Satz 2.6%
      const reduziertResult = await db
        .select({
          summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "ertrag"),
            eq(buchungen.steuersatz, "2.6"),
            gte(buchungen.belegdatum, new Date(quartalStart)),
            lte(buchungen.belegdatum, new Date(quartalEnde))
          )
        );

      const ziffer313_betrag = parseFloat(reduziertResult[0]?.summe || "0");
      const ziffer313_steuer = ziffer313_betrag * 0.026;

      // Ziffer 343: Leistungen Beherbergungssatz 3.8%
      const beherbergungResult = await db
        .select({
          summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "ertrag"),
            eq(buchungen.steuersatz, "3.8"),
            gte(buchungen.belegdatum, new Date(quartalStart)),
            lte(buchungen.belegdatum, new Date(quartalEnde))
          )
        );

      const ziffer343_betrag = parseFloat(beherbergungResult[0]?.summe || "0");
      const ziffer343_steuer = ziffer343_betrag * 0.038;

      // Ziffer 399: Total geschuldete Steuer
      const ziffer399 = ziffer303_steuer + ziffer313_steuer + ziffer343_steuer;

      // ========================================
      // III. VORSTEUER (Ziffer 400-479)
      // ========================================

      // Ziffer 400: Vorsteuer Material/Dienstleistungen (Aufwand)
      const vorsteuerResult = await db
        .select({
          steuer: sql<string>`COALESCE(SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)) - CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "aufwand"),
            gte(buchungen.belegdatum, new Date(quartalStart)),
            lte(buchungen.belegdatum, new Date(quartalEnde))
          )
        );

      const ziffer400 = parseFloat(vorsteuerResult[0]?.steuer || "0");

      // Ziffer 405: Vorsteuer Investitionen (Anlagevermögen)
      const vorsteuerInvestitionenResult = await db
        .select({
          steuer: sql<string>`COALESCE(SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)) - CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "anlage"),
            gte(buchungen.belegdatum, new Date(quartalStart)),
            lte(buchungen.belegdatum, new Date(quartalEnde))
          )
        );

      const ziffer405 = parseFloat(vorsteuerInvestitionenResult[0]?.steuer || "0");

      // Ziffer 479: Total Vorsteuer
      const ziffer479 = ziffer400 + ziffer405;

      // ========================================
      // IV. ERGEBNIS (Ziffer 500/510)
      // ========================================

      const differenz = ziffer399 - ziffer479;

      // Ziffer 500: Zu bezahlender Betrag (wenn positiv)
      const ziffer500 = differenz > 0 ? differenz : 0;

      // Ziffer 510: Guthaben (wenn negativ)
      const ziffer510 = differenz < 0 ? Math.abs(differenz) : 0;

      // ========================================
      // RÜCKGABE DER ABRECHNUNG
      // ========================================

      return {
        unternehmen: {
          id: company.id,
          name: company.name,
          ustIdNr: company.ustIdNr,
          landCode: company.landCode,
        },
        zeitraum: {
          jahr: input.jahr,
          quartal: input.quartal,
          von: quartalStart,
          bis: quartalEnde,
          bezeichnung: `Q${input.quartal} ${input.jahr}`,
        },
        // I. UMSATZ
        umsatz: {
          ziffer200: {
            bezeichnung: "Gesamtumsatz",
            betrag: ziffer200,
          },
          ziffer220bis280: {
            bezeichnung: "Abzüge (Exporte, Ausland, etc.)",
            betrag: ziffer220bis280,
          },
          ziffer299: {
            bezeichnung: "Steuerbarer Gesamtumsatz",
            betrag: ziffer299,
          },
        },
        // II. STEUERBERECHNUNG
        steuerberechnung: {
          ziffer303: {
            bezeichnung: "Leistungen Normalsatz 8.1%",
            betrag: ziffer303_betrag,
            satz: 8.1,
            steuer: ziffer303_steuer,
          },
          ziffer313: {
            bezeichnung: "Leistungen reduzierter Satz 2.6%",
            betrag: ziffer313_betrag,
            satz: 2.6,
            steuer: ziffer313_steuer,
          },
          ziffer343: {
            bezeichnung: "Leistungen Beherbergungssatz 3.8%",
            betrag: ziffer343_betrag,
            satz: 3.8,
            steuer: ziffer343_steuer,
          },
          ziffer399: {
            bezeichnung: "Total geschuldete Steuer",
            steuer: ziffer399,
          },
        },
        // III. VORSTEUER
        vorsteuer: {
          ziffer400: {
            bezeichnung: "Vorsteuer Material/Dienstleistungen",
            steuer: ziffer400,
          },
          ziffer405: {
            bezeichnung: "Vorsteuer Investitionen",
            steuer: ziffer405,
          },
          ziffer479: {
            bezeichnung: "Total Vorsteuer",
            steuer: ziffer479,
          },
        },
        // IV. ERGEBNIS
        ergebnis: {
          ziffer500: {
            bezeichnung: "Zu bezahlender Betrag",
            betrag: ziffer500,
          },
          ziffer510: {
            bezeichnung: "Guthaben",
            betrag: ziffer510,
          },
        },
        // Zusammenfassung
        zusammenfassung: {
          geschuldeteSteu: ziffer399,
          vorsteuer: ziffer479,
          zahllastGuthaben: differenz,
          istZahllast: differenz > 0,
        },
      };
    }),

  /**
   * Liste der Schweizer Unternehmen (für Dropdown)
   */
  listSchweizerUnternehmen: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Hole alle Schweizer Unternehmen des Benutzers
    const companies = await db
      .select({
        id: unternehmen.id,
        name: unternehmen.name,
        ustIdNr: unternehmen.ustIdNr,
        landCode: unternehmen.landCode,
      })
      .from(unternehmen)
      .where(eq(unternehmen.landCode, "CH"));

    return companies;
  }),
});

// ============================================
// HILFSFUNKTIONEN
// ============================================

/**
 * Berechnet den ersten Tag eines Quartals
 */
function getQuartalStart(jahr: number, quartal: number): string {
  const monat = (quartal - 1) * 3 + 1; // Q1=Jan, Q2=Apr, Q3=Jul, Q4=Okt
  return `${jahr}-${String(monat).padStart(2, "0")}-01`;
}

/**
 * Berechnet den letzten Tag eines Quartals
 */
function getQuartalEnde(jahr: number, quartal: number): string {
  const monat = quartal * 3; // Q1=Mär, Q2=Jun, Q3=Sep, Q4=Dez
  const letzterTag = new Date(jahr, monat, 0).getDate();
  return `${jahr}-${String(monat).padStart(2, "0")}-${String(letzterTag).padStart(2, "0")}`;
}
