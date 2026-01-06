import { z } from "zod";
import { eq, and, gte, lte, sql, sum, count } from "drizzle-orm";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  buchungen,
  unternehmen,
  userUnternehmen,
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

      // Einnahmen (Erträge)
      const einnahmenResult = await db
        .select({
          summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
          steuer: sql<string>`COALESCE(SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)) - CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "ertrag"),
            gte(buchungen.belegdatum, new Date(startDatum)),
            lte(buchungen.belegdatum, new Date(endDatum))
          )
        );

      // Ausgaben (Aufwände)
      const ausgabenResult = await db
        .select({
          summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
          steuer: sql<string>`COALESCE(SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)) - CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "aufwand"),
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

        // Einnahmen
        const einnahmenResult = await db
          .select({
            summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, input.unternehmenId),
              eq(buchungen.buchungsart, "ertrag"),
              gte(buchungen.belegdatum, new Date(startDatum)),
              lte(buchungen.belegdatum, new Date(endDatum))
            )
          );

        // Ausgaben
        const ausgabenResult = await db
          .select({
            summe: sql<string>`COALESCE(SUM(CAST(${buchungen.nettobetrag} AS DECIMAL(15,2))), 0)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, input.unternehmenId),
              eq(buchungen.buchungsart, "aufwand"),
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
});
