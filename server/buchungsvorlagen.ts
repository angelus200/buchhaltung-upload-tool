import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { buchungsvorlagen } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// ============================================
// BUCHUNGSVORLAGEN - Templates für häufig wiederkehrende Buchungen
// ============================================

export const buchungsvorlagenRouter = router({
  // Liste aller Vorlagen für ein Unternehmen
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        kategorie: z.enum([
          "miete",
          "gehalt",
          "versicherung",
          "telefon",
          "internet",
          "energie",
          "fahrzeug",
          "büromaterial",
          "abschreibung",
          "sonstig",
        ]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      let query = db
        .select()
        .from(buchungsvorlagen)
        .where(eq(buchungsvorlagen.unternehmenId, input.unternehmenId))
        .orderBy(buchungsvorlagen.sortierung, buchungsvorlagen.name);

      if (input.kategorie) {
        query = query.where(
          and(
            eq(buchungsvorlagen.unternehmenId, input.unternehmenId),
            eq(buchungsvorlagen.kategorie, input.kategorie)
          )
        ) as any;
      }

      const result = await query;

      return result;
    }),

  // Einzelne Vorlage abrufen
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [vorlage] = await db
        .select()
        .from(buchungsvorlagen)
        .where(eq(buchungsvorlagen.id, input.id));

      if (!vorlage) {
        throw new Error("Vorlage nicht gefunden");
      }

      return vorlage;
    }),

  // Neue Vorlage erstellen
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        name: z.string().min(1, "Name erforderlich"),
        beschreibung: z.string().optional(),
        sollKonto: z.string().min(1, "Soll-Konto erforderlich"),
        habenKonto: z.string().min(1, "Haben-Konto erforderlich"),
        betrag: z.number().optional(),
        buchungstext: z.string().min(1, "Buchungstext erforderlich"),
        ustSatz: z.number().default(0),
        kategorie: z.enum([
          "miete",
          "gehalt",
          "versicherung",
          "telefon",
          "internet",
          "energie",
          "fahrzeug",
          "büromaterial",
          "abschreibung",
          "sonstig",
        ]).default("sonstig"),
        geschaeftspartner: z.string().optional(),
        farbe: z.string().optional(),
        sortierung: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [result] = await db.insert(buchungsvorlagen).values({
        ...input,
        betrag: input.betrag?.toString() as any,
        ustSatz: input.ustSatz.toString() as any,
        erstelltVon: ctx.user.userId,
      });

      return {
        success: true,
        id: result.insertId,
        message: "Vorlage erfolgreich erstellt",
      };
    }),

  // Vorlage aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Name erforderlich").optional(),
        beschreibung: z.string().optional(),
        sollKonto: z.string().optional(),
        habenKonto: z.string().optional(),
        betrag: z.number().optional(),
        buchungstext: z.string().optional(),
        ustSatz: z.number().optional(),
        kategorie: z.enum([
          "miete",
          "gehalt",
          "versicherung",
          "telefon",
          "internet",
          "energie",
          "fahrzeug",
          "büromaterial",
          "abschreibung",
          "sonstig",
        ]).optional(),
        geschaeftspartner: z.string().optional(),
        farbe: z.string().optional(),
        sortierung: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, ...updateData } = input;

      const dataToUpdate: any = { ...updateData };
      if (updateData.betrag !== undefined) {
        dataToUpdate.betrag = updateData.betrag.toString();
      }
      if (updateData.ustSatz !== undefined) {
        dataToUpdate.ustSatz = updateData.ustSatz.toString();
      }

      await db
        .update(buchungsvorlagen)
        .set(dataToUpdate)
        .where(eq(buchungsvorlagen.id, id));

      return {
        success: true,
        message: "Vorlage erfolgreich aktualisiert",
      };
    }),

  // Vorlage löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db.delete(buchungsvorlagen).where(eq(buchungsvorlagen.id, input.id));

      return {
        success: true,
        message: "Vorlage erfolgreich gelöscht",
      };
    }),

  // Vorlage duplizieren
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [original] = await db
        .select()
        .from(buchungsvorlagen)
        .where(eq(buchungsvorlagen.id, input.id));

      if (!original) {
        throw new Error("Vorlage nicht gefunden");
      }

      const [result] = await db.insert(buchungsvorlagen).values({
        unternehmenId: original.unternehmenId,
        name: `${original.name} (Kopie)`,
        beschreibung: original.beschreibung,
        sollKonto: original.sollKonto,
        habenKonto: original.habenKonto,
        betrag: original.betrag,
        buchungstext: original.buchungstext,
        ustSatz: original.ustSatz,
        kategorie: original.kategorie,
        geschaeftspartner: original.geschaeftspartner,
        farbe: original.farbe,
        sortierung: original.sortierung,
        erstelltVon: ctx.user.userId,
      });

      return {
        success: true,
        id: result.insertId,
        message: "Vorlage erfolgreich dupliziert",
      };
    }),
});

export type BuchungsvorlagenRouter = typeof buchungsvorlagenRouter;
