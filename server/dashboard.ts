import { z } from "zod";
import { eq, and, gte, lte, sql, sum, count } from "drizzle-orm";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  buchungen,
  unternehmen,
  userUnternehmen,
  artikel,
  lagerbestaende,
  lagerorte,
} from "../drizzle/schema";

// ============================================
// DASHBOARD ROUTER - Kennzahlen und Statistiken
// ============================================
export const dashboardRouter = router({
  // Hauptkennzahlen für ein Unternehmen
  kennzahlen: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number().default(new Date().getFullYear()),
        monat: z.number().min(1).max(12).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          einnahmen: 0,
          ausgaben: 0,
          gewinn: 0,
          buchungenAnzahl: 0,
          vorsteuer: 0,
          umsatzsteuer: 0,
        };
      }

      // Berechne Datumsbereich
      const startDatum = input.monat
        ? `${input.jahr}-${String(input.monat).padStart(2, "0")}-01`
        : `${input.jahr}-01-01`;
      const endDatum = input.monat
        ? new Date(input.jahr, input.monat, 0).toISOString().split("T")[0]
        : `${input.jahr}-12-31`;

      // Einnahmen (Cashflow): Geld kommt auf Bank-Konto (SOLL Bank)
      // Bank-Konten: 120000-129999 (Kontenklasse 12)
      const einnahmenResult = await db
        .select({
          summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
          steuer: sql<string>`COALESCE(SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)) - CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            sql`${buchungen.sollKonto} LIKE '12%'`,
            gte(buchungen.belegdatum, new Date(startDatum)),
            lte(buchungen.belegdatum, new Date(endDatum))
          )
        );

      // Ausgaben (Cashflow): Geld geht von Bank-Konto weg (HABEN Bank)
      const ausgabenResult = await db
        .select({
          summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
          steuer: sql<string>`COALESCE(SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)) - CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            sql`${buchungen.habenKonto} LIKE '12%'`,
            gte(buchungen.belegdatum, new Date(startDatum)),
            lte(buchungen.belegdatum, new Date(endDatum))
          )
        );

      // Anzahl Buchungen
      const buchungenResult = await db
        .select({
          anzahl: count(),
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            gte(buchungen.belegdatum, new Date(startDatum)),
            lte(buchungen.belegdatum, new Date(endDatum))
          )
        );

      const einnahmen = parseFloat(einnahmenResult[0]?.summe || "0");
      const ausgaben = parseFloat(ausgabenResult[0]?.summe || "0");
      const umsatzsteuer = parseFloat(einnahmenResult[0]?.steuer || "0");
      const vorsteuer = parseFloat(ausgabenResult[0]?.steuer || "0");

      return {
        einnahmen,
        ausgaben,
        gewinn: einnahmen - ausgaben,
        buchungenAnzahl: buchungenResult[0]?.anzahl || 0,
        vorsteuer,
        umsatzsteuer,
        zahllast: umsatzsteuer - vorsteuer,
      };
    }),

  // Monatliche Entwicklung für Charts
  monatlicheEntwicklung: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number().default(new Date().getFullYear()),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return Array.from({ length: 12 }, (_, i) => ({
          monat: i + 1,
          monatName: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][i],
          einnahmen: 0,
          ausgaben: 0,
          gewinn: 0,
        }));
      }

      const monatsDaten = [];
      const monatNamen = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

      for (let monat = 1; monat <= 12; monat++) {
        const startDatum = `${input.jahr}-${String(monat).padStart(2, "0")}-01`;
        const endDatum = new Date(input.jahr, monat, 0).toISOString().split("T")[0];

        // Einnahmen (Cashflow: SOLL Bank)
        const einnahmenResult = await db
          .select({
            summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, input.unternehmenId),
              sql`${buchungen.sollKonto} LIKE '12%'`,
              gte(buchungen.belegdatum, new Date(startDatum)),
              lte(buchungen.belegdatum, new Date(endDatum))
            )
          );

        // Ausgaben (Cashflow: HABEN Bank)
        const ausgabenResult = await db
          .select({
            summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, input.unternehmenId),
              sql`${buchungen.habenKonto} LIKE '12%'`,
              gte(buchungen.belegdatum, new Date(startDatum)),
              lte(buchungen.belegdatum, new Date(endDatum))
            )
          );

        const einnahmen = parseFloat(einnahmenResult[0]?.summe || "0");
        const ausgaben = parseFloat(ausgabenResult[0]?.summe || "0");

        monatsDaten.push({
          monat,
          monatName: monatNamen[monat - 1],
          einnahmen,
          ausgaben,
          gewinn: einnahmen - ausgaben,
        });
      }

      return monatsDaten;
    }),

  // Aufwandsverteilung nach Sachkonto
  aufwandsverteilung: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number().default(new Date().getFullYear()),
        monat: z.number().min(1).max(12).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const startDatum = input.monat
        ? `${input.jahr}-${String(input.monat).padStart(2, "0")}-01`
        : `${input.jahr}-01-01`;
      const endDatum = input.monat
        ? new Date(input.jahr, input.monat, 0).toISOString().split("T")[0]
        : `${input.jahr}-12-31`;

      const result = await db
        .select({
          sachkonto: buchungen.sachkonto,
          summe: sql<string>`SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2)))`,
          anzahl: count(),
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "aufwand"),
            gte(buchungen.belegdatum, new Date(startDatum)),
            lte(buchungen.belegdatum, new Date(endDatum))
          )
        )
        .groupBy(buchungen.sachkonto)
        .orderBy(sql`SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))) DESC`)
        .limit(10);

      return result.map((r) => ({
        sachkonto: r.sachkonto,
        summe: parseFloat(r.summe || "0"),
        anzahl: r.anzahl,
      }));
    }),

  // Ertragsverteilung nach Sachkonto
  ertragsverteilung: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number().default(new Date().getFullYear()),
        monat: z.number().min(1).max(12).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const startDatum = input.monat
        ? `${input.jahr}-${String(input.monat).padStart(2, "0")}-01`
        : `${input.jahr}-01-01`;
      const endDatum = input.monat
        ? new Date(input.jahr, input.monat, 0).toISOString().split("T")[0]
        : `${input.jahr}-12-31`;

      const result = await db
        .select({
          sachkonto: buchungen.sachkonto,
          summe: sql<string>`SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2)))`,
          anzahl: count(),
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "ertrag"),
            gte(buchungen.belegdatum, new Date(startDatum)),
            lte(buchungen.belegdatum, new Date(endDatum))
          )
        )
        .groupBy(buchungen.sachkonto)
        .orderBy(sql`SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))) DESC`)
        .limit(10);

      return result.map((r) => ({
        sachkonto: r.sachkonto,
        summe: parseFloat(r.summe || "0"),
        anzahl: r.anzahl,
      }));
    }),

  // Top Geschäftspartner
  topGeschaeftspartner: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number().default(new Date().getFullYear()),
        typ: z.enum(["kreditor", "debitor"]).default("kreditor"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const startDatum = `${input.jahr}-01-01`;
      const endDatum = `${input.jahr}-12-31`;

      const buchungsart = input.typ === "kreditor" ? "aufwand" : "ertrag";

      const result = await db
        .select({
          geschaeftspartner: buchungen.geschaeftspartner,
          summe: sql<string>`SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)))`,
          anzahl: count(),
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, buchungsart),
            eq(buchungen.geschaeftspartnerTyp, input.typ),
            gte(buchungen.belegdatum, new Date(startDatum)),
            lte(buchungen.belegdatum, new Date(endDatum))
          )
        )
        .groupBy(buchungen.geschaeftspartner)
        .orderBy(sql`SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))) DESC`)
        .limit(5);

      return result.map((r) => ({
        name: r.geschaeftspartner,
        summe: parseFloat(r.summe || "0"),
        anzahl: r.anzahl,
      }));
    }),

  // Abweichungsanalyse - Vergleich zwei Zeiträume
  abweichungsanalyse: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        // Zeitraum 1 (Basis)
        vonDatum1: z.string(),
        bisDatum1: z.string(),
        // Zeitraum 2 (Vergleich)
        vonDatum2: z.string(),
        bisDatum2: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Aggregiere Buchungen nach Sachkonto für Zeitraum 1
      const periode1 = await db
        .select({
          sachkonto: buchungen.sachkonto,
          summe: sql<string>`SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2)))`,
          anzahl: count(),
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            gte(buchungen.belegdatum, new Date(input.vonDatum1)),
            lte(buchungen.belegdatum, new Date(input.bisDatum1))
          )
        )
        .groupBy(buchungen.sachkonto);

      // Aggregiere Buchungen nach Sachkonto für Zeitraum 2
      const periode2 = await db
        .select({
          sachkonto: buchungen.sachkonto,
          summe: sql<string>`SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2)))`,
          anzahl: count(),
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            gte(buchungen.belegdatum, new Date(input.vonDatum2)),
            lte(buchungen.belegdatum, new Date(input.bisDatum2))
          )
        )
        .groupBy(buchungen.sachkonto);

      // Konvertiere zu Maps für einfachen Zugriff
      const map1 = new Map(periode1.map((p) => [p.sachkonto, parseFloat(p.summe || "0")]));
      const map2 = new Map(periode2.map((p) => [p.sachkonto, parseFloat(p.summe || "0")]));

      // Alle Sachkonten sammeln
      const alleSachkonten = new Set([...Array.from(map1.keys()), ...Array.from(map2.keys())]);

      // Vergleiche berechnen
      const vergleiche = Array.from(alleSachkonten).map((sachkonto) => {
        const wert1 = map1.get(sachkonto) || 0;
        const wert2 = map2.get(sachkonto) || 0;
        const differenz = wert2 - wert1;
        const prozentual = wert1 !== 0 ? ((differenz / Math.abs(wert1)) * 100) : 0;

        return {
          sachkonto,
          periode1: wert1,
          periode2: wert2,
          differenz,
          differenzProzent: prozentual,
          signifikant: Math.abs(differenz) > 1000 || Math.abs(prozentual) > 10,
        };
      });

      // Sortiere nach absoluter Differenz
      vergleiche.sort((a, b) => Math.abs(b.differenz) - Math.abs(a.differenz));

      // Gesamt-Statistiken
      const gesamtPeriode1 = Array.from(map1.values()).reduce((sum, v) => sum + v, 0);
      const gesamtPeriode2 = Array.from(map2.values()).reduce((sum, v) => sum + v, 0);
      const gesamtDifferenz = gesamtPeriode2 - gesamtPeriode1;
      const gesamtProzent =
        gesamtPeriode1 !== 0 ? ((gesamtDifferenz / Math.abs(gesamtPeriode1)) * 100) : 0;

      return {
        vergleiche,
        signifikante: vergleiche.filter((v) => v.signifikant),
        gesamt: {
          periode1: gesamtPeriode1,
          periode2: gesamtPeriode2,
          differenz: gesamtDifferenz,
          differenzProzent: gesamtProzent,
        },
      };
    }),

  // Niedrige Lagerbestände - Artikel unter Mindestbestand
  niedrigeBestaende: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Hole alle Artikel mit Beständen
      const result = await db
        .select({
          artikel: artikel,
          bestand: lagerbestaende,
          lagerort: lagerorte,
        })
        .from(lagerbestaende)
        .innerJoin(artikel, eq(lagerbestaende.artikelId, artikel.id))
        .innerJoin(lagerorte, eq(lagerbestaende.lagerortId, lagerorte.id))
        .where(
          and(
            eq(artikel.unternehmenId, input.unternehmenId),
            eq(artikel.aktiv, true)
          )
        );

      // Filtere auf niedrige Bestände (Bestand < Mindestbestand)
      const niedrig = result
        .filter((r) => {
          const menge = parseFloat(r.bestand.menge || "0");
          const mindest = parseFloat(r.artikel.mindestbestand || "0");
          return mindest > 0 && menge < mindest;
        })
        .map((r) => {
          const menge = parseFloat(r.bestand.menge || "0");
          const mindest = parseFloat(r.artikel.mindestbestand || "0");
          const ziel = parseFloat(r.artikel.zielbestand || "0");
          const fehlmenge = Math.max(0, (ziel > 0 ? ziel : mindest) - menge);

          return {
            artikelId: r.artikel.id,
            artikelnummer: r.artikel.artikelnummer,
            bezeichnung: r.artikel.bezeichnung,
            kategorie: r.artikel.kategorie,
            einheit: r.artikel.einheit,
            lagerort: r.lagerort.name,
            aktuellerBestand: menge,
            mindestbestand: mindest,
            zielbestand: ziel > 0 ? ziel : mindest,
            fehlmenge: fehlmenge,
            einkaufspreis: r.artikel.einkaufspreis ? parseFloat(r.artikel.einkaufspreis) : null,
            geschaetzterWert: r.artikel.einkaufspreis
              ? fehlmenge * parseFloat(r.artikel.einkaufspreis)
              : null,
          };
        })
        // Sortiere nach Fehlmenge (absteigend)
        .sort((a, b) => b.fehlmenge - a.fehlmenge)
        .slice(0, input.limit);

      return niedrig;
    }),
});
