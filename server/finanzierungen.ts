import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { finanzierungen, finanzierungZahlungen, InsertFinanzierung, InsertFinanzierungZahlung } from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Finanzierungs-Router - Verwaltung von Krediten und Leasingverträgen
 */
export const finanzierungenRouter = router({
  /**
   * Alle Finanzierungen eines Unternehmens abrufen
   */
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        typ: z.enum(["kredit", "leasing", "mietkauf", "factoring"]).optional(),
        status: z.enum(["aktiv", "abgeschlossen", "gekuendigt"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(finanzierungen.unternehmenId, input.unternehmenId)];

      if (input.typ) {
        conditions.push(eq(finanzierungen.typ, input.typ));
      }

      if (input.status) {
        conditions.push(eq(finanzierungen.status, input.status));
      }

      const result = await db
        .select()
        .from(finanzierungen)
        .where(and(...conditions))
        .orderBy(desc(finanzierungen.createdAt));

      return result;
    }),

  /**
   * Einzelne Finanzierung abrufen
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [finanzierung] = await db
        .select()
        .from(finanzierungen)
        .where(eq(finanzierungen.id, input.id))
        .limit(1);

      if (!finanzierung) return null;

      // Zahlungen laden
      const zahlungen = await db
        .select()
        .from(finanzierungZahlungen)
        .where(eq(finanzierungZahlungen.finanzierungId, input.id))
        .orderBy(finanzierungZahlungen.faelligkeit);

      return { finanzierung, zahlungen };
    }),

  /**
   * Neue Finanzierung anlegen
   */
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        typ: z.enum(["kredit", "leasing", "mietkauf", "factoring"]),
        vertragsnummer: z.string().optional(),
        bezeichnung: z.string(),
        beschreibung: z.string().optional(),
        kreditgeber: z.string(),
        kreditgeberKontonummer: z.string().optional(),
        objektBezeichnung: z.string().optional(),
        objektWert: z.string().optional(),
        gesamtbetrag: z.string(),
        restschuld: z.string().optional(),
        zinssatz: z.string().optional(),
        vertragsBeginn: z.string(),
        vertragsEnde: z.string(),
        ratenBetrag: z.string(),
        ratenTyp: z.enum(["monatlich", "quartal", "halbjaehrlich", "jaehrlich"]).default("monatlich"),
        ratenTag: z.number().default(1),
        anzahlung: z.string().optional(),
        schlussrate: z.string().optional(),
        aufwandskonto: z.string().optional(),
        verbindlichkeitskonto: z.string().optional(),
        zinsaufwandskonto: z.string().optional(),
        notizen: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [result] = await db.insert(finanzierungen).values({
        unternehmenId: input.unternehmenId,
        typ: input.typ,
        vertragsnummer: input.vertragsnummer,
        bezeichnung: input.bezeichnung,
        beschreibung: input.beschreibung,
        kreditgeber: input.kreditgeber,
        kreditgeberKontonummer: input.kreditgeberKontonummer,
        objektBezeichnung: input.objektBezeichnung,
        objektWert: input.objektWert,
        gesamtbetrag: input.gesamtbetrag,
        restschuld: input.restschuld || input.gesamtbetrag,
        zinssatz: input.zinssatz,
        vertragsBeginn: new Date(input.vertragsBeginn),
        vertragsEnde: new Date(input.vertragsEnde),
        ratenBetrag: input.ratenBetrag,
        ratenTyp: input.ratenTyp,
        ratenTag: input.ratenTag,
        anzahlung: input.anzahlung || "0",
        schlussrate: input.schlussrate || "0",
        aufwandskonto: input.aufwandskonto,
        verbindlichkeitskonto: input.verbindlichkeitskonto,
        zinsaufwandskonto: input.zinsaufwandskonto,
        status: "aktiv",
        notizen: input.notizen,
        createdBy: ctx.user.id,
      } as InsertFinanzierung);

      return { success: true, id: result.insertId };
    }),

  /**
   * Finanzierung aktualisieren
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        bezeichnung: z.string().optional(),
        beschreibung: z.string().optional(),
        restschuld: z.string().optional(),
        status: z.enum(["aktiv", "abgeschlossen", "gekuendigt"]).optional(),
        notizen: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const updateData: any = {};
      if (input.bezeichnung !== undefined) updateData.bezeichnung = input.bezeichnung;
      if (input.beschreibung !== undefined) updateData.beschreibung = input.beschreibung;
      if (input.restschuld !== undefined) updateData.restschuld = input.restschuld;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.notizen !== undefined) updateData.notizen = input.notizen;

      await db
        .update(finanzierungen)
        .set(updateData)
        .where(eq(finanzierungen.id, input.id));

      return { success: true };
    }),

  /**
   * Finanzierung löschen
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Erst Zahlungen löschen
      await db.delete(finanzierungZahlungen).where(eq(finanzierungZahlungen.finanzierungId, input.id));

      // Dann Finanzierung löschen
      await db.delete(finanzierungen).where(eq(finanzierungen.id, input.id));

      return { success: true };
    }),

  /**
   * Zahlungsplan generieren
   */
  generateZahlungsplan: protectedProcedure
    .input(z.object({ finanzierungId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Finanzierung laden
      const [finanzierung] = await db
        .select()
        .from(finanzierungen)
        .where(eq(finanzierungen.id, input.finanzierungId))
        .limit(1);

      if (!finanzierung) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Finanzierung nicht gefunden" });
      }

      // Alte Zahlungen löschen
      await db.delete(finanzierungZahlungen).where(eq(finanzierungZahlungen.finanzierungId, input.finanzierungId));

      // Zahlungsplan berechnen
      const start = new Date(finanzierung.vertragsBeginn);
      const ende = new Date(finanzierung.vertragsEnde);
      const ratenBetrag = parseFloat(finanzierung.ratenBetrag.toString());

      const zahlungen: InsertFinanzierungZahlung[] = [];
      let currentDate = new Date(start);

      // Ratenintervall bestimmen
      let monthsIncrement = 1;
      switch (finanzierung.ratenTyp) {
        case "monatlich": monthsIncrement = 1; break;
        case "quartal": monthsIncrement = 3; break;
        case "halbjaehrlich": monthsIncrement = 6; break;
        case "jaehrlich": monthsIncrement = 12; break;
      }

      // Zahlungen generieren
      while (currentDate <= ende) {
        zahlungen.push({
          finanzierungId: input.finanzierungId,
          faelligkeit: new Date(currentDate),
          betrag: ratenBetrag.toFixed(2),
          zinsenAnteil: null,
          tilgungAnteil: null,
          status: "offen",
        });

        // Nächster Termin
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + monthsIncrement);
      }

      // Zahlungen in Datenbank einfügen
      if (zahlungen.length > 0) {
        await db.insert(finanzierungZahlungen).values(zahlungen);
      }

      return { success: true, anzahl: zahlungen.length };
    }),

  /**
   * Statistiken für Dashboard
   */
  stats: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        gesamtVerbindlichkeiten: "0",
        monatlicheBelastung: "0",
        aktiveVertraege: 0,
      };

      // Aktive Finanzierungen
      const aktive = await db
        .select()
        .from(finanzierungen)
        .where(
          and(
            eq(finanzierungen.unternehmenId, input.unternehmenId),
            eq(finanzierungen.status, "aktiv")
          )
        );

      // Gesamtverbindlichkeiten = Summe aller Restschulden
      const gesamtVerbindlichkeiten = aktive.reduce((sum, f) => {
        return sum + parseFloat(f.restschuld?.toString() || "0");
      }, 0);

      // Monatliche Belastung = Summe aller monatlichen Raten
      const monatlicheBelastung = aktive.reduce((sum, f) => {
        const betrag = parseFloat(f.ratenBetrag.toString());
        // Bei quartalsweisen/halbjährlichen/jährlichen Zahlungen auf Monat umrechnen
        let monatlich = betrag;
        switch (f.ratenTyp) {
          case "quartal": monatlich = betrag / 3; break;
          case "halbjaehrlich": monatlich = betrag / 6; break;
          case "jaehrlich": monatlich = betrag / 12; break;
        }
        return sum + monatlich;
      }, 0);

      return {
        gesamtVerbindlichkeiten: gesamtVerbindlichkeiten.toFixed(2),
        monatlicheBelastung: monatlicheBelastung.toFixed(2),
        aktiveVertraege: aktive.length,
      };
    }),

  /**
   * Fällige Zahlungen abrufen
   */
  faelligeZahlungen: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        monat: z.string().optional(), // Format: "2026-02"
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const today = new Date();
      const monat = input.monat || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const [year, month] = monat.split("-").map(Number);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Zahlungen mit Finanzierungs-Infos
      const result = await db
        .select({
          zahlung: finanzierungZahlungen,
          finanzierung: finanzierungen,
        })
        .from(finanzierungZahlungen)
        .innerJoin(finanzierungen, eq(finanzierungZahlungen.finanzierungId, finanzierungen.id))
        .where(
          and(
            eq(finanzierungen.unternehmenId, input.unternehmenId),
            gte(finanzierungZahlungen.faelligkeit, startDate),
            lte(finanzierungZahlungen.faelligkeit, endDate),
            eq(finanzierungZahlungen.status, "offen")
          )
        )
        .orderBy(finanzierungZahlungen.faelligkeit);

      return result;
    }),
});
