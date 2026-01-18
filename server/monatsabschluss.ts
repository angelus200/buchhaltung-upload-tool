import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { monatsabschluss, monatsabschlussItems, buchungen } from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

// ============================================
// MONATSABSCHLUSS - Month-End Closing Process
// ============================================

// Standard-Checkliste Items
const STANDARD_CHECKLIST = [
  { beschreibung: "Alle Belege erfasst", kategorie: "belege" as const, sortierung: 1, pflicht: true },
  { beschreibung: "Bankkonto abgestimmt", kategorie: "abstimmung" as const, sortierung: 2, pflicht: true },
  { beschreibung: "Kasse abgestimmt", kategorie: "abstimmung" as const, sortierung: 3, pflicht: true },
  { beschreibung: "Kreditoren geprüft", kategorie: "abstimmung" as const, sortierung: 4, pflicht: true },
  { beschreibung: "Debitoren geprüft", kategorie: "abstimmung" as const, sortierung: 5, pflicht: true },
  { beschreibung: "USt-Voranmeldung erstellt", kategorie: "steuer" as const, sortierung: 6, pflicht: true },
  { beschreibung: "Lohnabrechnung geprüft", kategorie: "personal" as const, sortierung: 7, pflicht: false },
  { beschreibung: "BWA erstellt", kategorie: "bericht" as const, sortierung: 8, pflicht: false },
  { beschreibung: "Summen- und Saldenliste geprüft", kategorie: "pruefung" as const, sortierung: 9, pflicht: true },
];

export const monatsabschlussRouter = router({
  // Liste aller Monatsabschlüsse für ein Unternehmen
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number().optional(),
        status: z.enum(["offen", "in_arbeit", "geprueft", "abgeschlossen", "korrektur"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      let conditions = [eq(monatsabschluss.unternehmenId, input.unternehmenId)];

      if (input.jahr) {
        conditions.push(eq(monatsabschluss.jahr, input.jahr));
      }

      if (input.status) {
        conditions.push(eq(monatsabschluss.status, input.status));
      }

      const result = await db
        .select()
        .from(monatsabschluss)
        .where(and(...conditions))
        .orderBy(desc(monatsabschluss.jahr), desc(monatsabschluss.monat));

      return result;
    }),

  // Einzelnen Monatsabschluss mit Checkliste abrufen
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [abschluss] = await db
        .select()
        .from(monatsabschluss)
        .where(eq(monatsabschluss.id, input.id));

      if (!abschluss) {
        throw new Error("Monatsabschluss nicht gefunden");
      }

      // Lade Checkliste
      const checklist = await db
        .select()
        .from(monatsabschlussItems)
        .where(eq(monatsabschlussItems.monatsabschlussId, input.id))
        .orderBy(monatsabschlussItems.sortierung);

      // Berechne Fortschritt
      const erledigtePflicht = checklist.filter((item) => item.pflicht && item.erledigt).length;
      const gesamtPflicht = checklist.filter((item) => item.pflicht).length;
      const fortschritt = gesamtPflicht > 0 ? Math.round((erledigtePflicht / gesamtPflicht) * 100) : 0;

      return {
        ...abschluss,
        checklist,
        fortschritt,
        kannAbgeschlossenWerden: erledigtePflicht === gesamtPflicht,
      };
    }),

  // Monatsabschluss für bestimmten Monat abrufen oder erstellen
  getOrCreate: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number(),
        monat: z.number().min(1).max(12),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Prüfe ob bereits vorhanden
      const [existing] = await db
        .select()
        .from(monatsabschluss)
        .where(
          and(
            eq(monatsabschluss.unternehmenId, input.unternehmenId),
            eq(monatsabschluss.jahr, input.jahr),
            eq(monatsabschluss.monat, input.monat)
          )
        );

      if (existing) {
        // Lade Checkliste
        const checklist = await db
          .select()
          .from(monatsabschlussItems)
          .where(eq(monatsabschlussItems.monatsabschlussId, existing.id))
          .orderBy(monatsabschlussItems.sortierung);

        return { ...existing, checklist };
      }

      // Erstelle neuen Monatsabschluss
      const [result] = await db.insert(monatsabschluss).values({
        unternehmenId: input.unternehmenId,
        jahr: input.jahr,
        monat: input.monat,
        status: "offen",
        erstelltVon: ctx.user.id,
      });

      const monatsabschlussId = result.insertId;

      // Erstelle Standard-Checkliste
      await db.insert(monatsabschlussItems).values(
        STANDARD_CHECKLIST.map((item) => ({
          monatsabschlussId,
          ...item,
        }))
      );

      // Lade erstellte Checkliste
      const checklist = await db
        .select()
        .from(monatsabschlussItems)
        .where(eq(monatsabschlussItems.monatsabschlussId, monatsabschlussId))
        .orderBy(monatsabschlussItems.sortierung);

      const [newAbschluss] = await db
        .select()
        .from(monatsabschluss)
        .where(eq(monatsabschluss.id, monatsabschlussId));

      return {
        ...newAbschluss,
        checklist,
        message: "Monatsabschluss erstellt",
      };
    }),

  // Status aktualisieren
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["offen", "in_arbeit", "geprueft", "abgeschlossen", "korrektur"]),
        notizen: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const updateData: any = {
        status: input.status,
      };

      if (input.notizen !== undefined) {
        updateData.notizen = input.notizen;
      }

      // Wenn abgeschlossen, setze Datum und sperre
      if (input.status === "abgeschlossen") {
        updateData.abgeschlossenAm = new Date();
        updateData.abgeschlossenVon = ctx.user.id;
        updateData.gesperrt = true;
      }

      // Wenn wieder geöffnet, entsperre
      if (input.status === "offen" || input.status === "in_arbeit") {
        updateData.gesperrt = false;
        updateData.abgeschlossenAm = null;
        updateData.abgeschlossenVon = null;
      }

      await db
        .update(monatsabschluss)
        .set(updateData)
        .where(eq(monatsabschluss.id, input.id));

      return {
        success: true,
        message: "Status erfolgreich aktualisiert",
      };
    }),

  // Checklist-Item als erledigt/unerledigt markieren
  toggleItem: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        erledigt: z.boolean(),
        notizen: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const updateData: any = {
        erledigt: input.erledigt,
      };

      if (input.erledigt) {
        updateData.erledigtAm = new Date();
        updateData.erledigtVon = ctx.user.id;
      } else {
        updateData.erledigtAm = null;
        updateData.erledigtVon = null;
      }

      if (input.notizen !== undefined) {
        updateData.notizen = input.notizen;
      }

      await db
        .update(monatsabschlussItems)
        .set(updateData)
        .where(eq(monatsabschlussItems.id, input.itemId));

      return {
        success: true,
        message: input.erledigt ? "Aufgabe erledigt" : "Aufgabe als unerledigt markiert",
      };
    }),

  // Eigene Checklist-Item hinzufügen
  addItem: protectedProcedure
    .input(
      z.object({
        monatsabschlussId: z.number(),
        beschreibung: z.string().min(1, "Beschreibung erforderlich"),
        kategorie: z.enum(["belege", "abstimmung", "steuer", "personal", "pruefung", "bericht", "sonstig"]),
        pflicht: z.boolean().default(false),
        sortierung: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Wenn keine Sortierung angegeben, setze ans Ende
      let sortierung = input.sortierung;
      if (!sortierung) {
        const existing = await db
          .select()
          .from(monatsabschlussItems)
          .where(eq(monatsabschlussItems.monatsabschlussId, input.monatsabschlussId));
        sortierung = existing.length + 1;
      }

      const [result] = await db.insert(monatsabschlussItems).values({
        ...input,
        sortierung,
      });

      return {
        success: true,
        id: result.insertId,
        message: "Aufgabe hinzugefügt",
      };
    }),

  // Checklist-Item löschen (nur eigene, nicht Standard)
  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db.delete(monatsabschlussItems).where(eq(monatsabschlussItems.id, input.itemId));

      return {
        success: true,
        message: "Aufgabe gelöscht",
      };
    }),

  // Übersicht über alle Monate eines Jahres
  jahresUebersicht: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        jahr: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const abschluesse = await db
        .select()
        .from(monatsabschluss)
        .where(
          and(
            eq(monatsabschluss.unternehmenId, input.unternehmenId),
            eq(monatsabschluss.jahr, input.jahr)
          )
        )
        .orderBy(monatsabschluss.monat);

      // Erstelle Array für alle 12 Monate
      const monate = Array.from({ length: 12 }, (_, i) => {
        const monat = i + 1;
        const abschluss = abschluesse.find((a) => a.monat === monat);

        return {
          monat,
          status: abschluss?.status || "offen",
          abgeschlossen: abschluss?.status === "abgeschlossen",
          gesperrt: abschluss?.gesperrt || false,
          id: abschluss?.id,
        };
      });

      const offene = monate.filter((m) => m.status === "offen").length;
      const abgeschlossene = monate.filter((m) => m.abgeschlossen).length;
      const inArbeit = monate.filter((m) => m.status === "in_arbeit").length;

      return {
        monate,
        statistik: {
          offene,
          inArbeit,
          abgeschlossene,
          gesperrt: monate.filter((m) => m.gesperrt).length,
        },
      };
    }),

  // Prüfe ob Buchungen im gesperrten Zeitraum
  checkLocked: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        datum: z.date(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const jahr = input.datum.getFullYear();
      const monat = input.datum.getMonth() + 1;

      const [abschluss] = await db
        .select()
        .from(monatsabschluss)
        .where(
          and(
            eq(monatsabschluss.unternehmenId, input.unternehmenId),
            eq(monatsabschluss.jahr, jahr),
            eq(monatsabschluss.monat, monat),
            eq(monatsabschluss.gesperrt, true)
          )
        );

      return {
        gesperrt: !!abschluss,
        abschluss: abschluss || null,
      };
    }),
});

export type MonatsabschlussRouter = typeof monatsabschlussRouter;
