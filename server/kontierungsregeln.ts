import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { kontierungsregeln } from "../drizzle/schema";
import { eq, and, like, desc, sql } from "drizzle-orm";

// ============================================
// KONTIERUNGSREGELN - Automatische Kontierung basierend auf Buchungstext
// ============================================

export const kontierungsregelnRouter = router({
  // Liste aller Regeln für ein Unternehmen
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        nurAktive: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      if (input.nurAktive) {
        const result = await db
          .select()
          .from(kontierungsregeln)
          .where(
            and(
              eq(kontierungsregeln.unternehmenId, input.unternehmenId),
              eq(kontierungsregeln.aktiv, true)
            )
          )
          .orderBy(desc(kontierungsregeln.prioritaet), kontierungsregeln.suchbegriff);
        return result;
      }

      const result = await db
        .select()
        .from(kontierungsregeln)
        .where(eq(kontierungsregeln.unternehmenId, input.unternehmenId))
        .orderBy(desc(kontierungsregeln.prioritaet), kontierungsregeln.suchbegriff);

      return result;
    }),

  // Einzelne Regel abrufen
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [regel] = await db
        .select()
        .from(kontierungsregeln)
        .where(eq(kontierungsregeln.id, input.id));

      if (!regel) {
        throw new Error("Regel nicht gefunden");
      }

      return regel;
    }),

  // Passende Regeln für Buchungstext finden
  suggest: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        buchungstext: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Hole alle aktiven Regeln
      const regeln = await db
        .select()
        .from(kontierungsregeln)
        .where(
          and(
            eq(kontierungsregeln.unternehmenId, input.unternehmenId),
            eq(kontierungsregeln.aktiv, true)
          )
        )
        .orderBy(desc(kontierungsregeln.prioritaet));

      // Finde passende Regeln (case-insensitive)
      const buchungstextLower = input.buchungstext.toLowerCase();
      const matches = regeln.filter((regel) =>
        buchungstextLower.includes(regel.suchbegriff.toLowerCase())
      );

      // Sortiere nach Priorität und Erfolgsrate
      matches.sort((a, b) => {
        if (a.prioritaet !== b.prioritaet) {
          return (b.prioritaet || 0) - (a.prioritaet || 0);
        }
        const successRateA = parseFloat(a.erfolgsrate?.toString() || "0");
        const successRateB = parseFloat(b.erfolgsrate?.toString() || "0");
        return successRateB - successRateA;
      });

      return {
        matches: matches.slice(0, 3), // Top 3 Vorschläge
        hasMatches: matches.length > 0,
      };
    }),

  // Neue Regel erstellen
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        suchbegriff: z.string().min(1, "Suchbegriff erforderlich"),
        sollKonto: z.string().min(1, "Soll-Konto erforderlich"),
        habenKonto: z.string().min(1, "Haben-Konto erforderlich"),
        ustSatz: z.number().default(0),
        prioritaet: z.number().default(0),
        beschreibung: z.string().optional(),
        geschaeftspartner: z.string().optional(),
        aktiv: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [result] = await db.insert(kontierungsregeln).values({
        ...input,
        ustSatz: input.ustSatz.toString() as any,
        erstelltVon: ctx.user.id,
      });

      return {
        success: true,
        id: result.insertId,
        message: "Regel erfolgreich erstellt",
      };
    }),

  // Regel aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        suchbegriff: z.string().optional(),
        sollKonto: z.string().optional(),
        habenKonto: z.string().optional(),
        ustSatz: z.number().optional(),
        prioritaet: z.number().optional(),
        beschreibung: z.string().optional(),
        geschaeftspartner: z.string().optional(),
        aktiv: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, ...updateData } = input;

      const dataToUpdate: any = { ...updateData };
      if (updateData.ustSatz !== undefined) {
        dataToUpdate.ustSatz = updateData.ustSatz.toString();
      }

      await db
        .update(kontierungsregeln)
        .set(dataToUpdate)
        .where(eq(kontierungsregeln.id, id));

      return {
        success: true,
        message: "Regel erfolgreich aktualisiert",
      };
    }),

  // Regel löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db.delete(kontierungsregeln).where(eq(kontierungsregeln.id, input.id));

      return {
        success: true,
        message: "Regel erfolgreich gelöscht",
      };
    }),

  // Regel als verwendet markieren (für Lern-Funktion)
  markUsed: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        erfolg: z.boolean(), // Wurde die Regel akzeptiert?
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Hole aktuelle Regel
      const [regel] = await db
        .select()
        .from(kontierungsregeln)
        .where(eq(kontierungsregeln.id, input.id));

      if (!regel) {
        throw new Error("Regel nicht gefunden");
      }

      const aktuelleVerwendungen = regel.verwendungen || 0;
      const aktuelleErfolgsrate = parseFloat(regel.erfolgsrate?.toString() || "100");

      // Berechne neue Erfolgsrate
      const neueVerwendungen = aktuelleVerwendungen + 1;
      const neueErfolgsrate = input.erfolg
        ? ((aktuelleErfolgsrate * aktuelleVerwendungen + 100) / neueVerwendungen)
        : ((aktuelleErfolgsrate * aktuelleVerwendungen) / neueVerwendungen);

      await db
        .update(kontierungsregeln)
        .set({
          verwendungen: neueVerwendungen,
          erfolgsrate: neueErfolgsrate.toFixed(2) as any,
        })
        .where(eq(kontierungsregeln.id, input.id));

      return {
        success: true,
        message: "Verwendung erfasst",
      };
    }),

  // Statistiken zu Regeln
  statistics: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const regeln = await db
        .select()
        .from(kontierungsregeln)
        .where(eq(kontierungsregeln.unternehmenId, input.unternehmenId));

      const aktiv = regeln.filter((r) => r.aktiv).length;
      const inaktiv = regeln.length - aktiv;
      const gesamtVerwendungen = regeln.reduce((sum, r) => sum + (r.verwendungen || 0), 0);
      const durchschnittErfolgsrate =
        regeln.length > 0
          ? regeln.reduce((sum, r) => sum + parseFloat(r.erfolgsrate?.toString() || "100"), 0) /
            regeln.length
          : 0;

      return {
        gesamt: regeln.length,
        aktiv,
        inaktiv,
        gesamtVerwendungen,
        durchschnittErfolgsrate: durchschnittErfolgsrate.toFixed(2),
      };
    }),
});

export type KontierungsregelnRouter = typeof kontierungsregelnRouter;
