import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { aufgaben, users, finanzamtDokumente, type Aufgabe } from "../drizzle/schema";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";

// ============================================
// AUFGABEN/TO-DOS ROUTER
// ============================================

export const aufgabenRouter = router({
  // Liste aller Aufgaben für ein Unternehmen
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        kategorie: z.enum(["finanzamt", "buchhaltung", "steuern", "personal", "allgemein", "frist", "zahlung", "pruefung"]).optional(),
        status: z.enum(["offen", "in_bearbeitung", "wartend", "erledigt", "storniert"]).optional(),
        prioritaet: z.enum(["niedrig", "normal", "hoch", "dringend"]).optional(),
        nurMeine: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(aufgaben.unternehmenId, input.unternehmenId)];
      
      if (input.kategorie) {
        conditions.push(eq(aufgaben.kategorie, input.kategorie));
      }
      if (input.status) {
        conditions.push(eq(aufgaben.status, input.status));
      }
      if (input.prioritaet) {
        conditions.push(eq(aufgaben.prioritaet, input.prioritaet));
      }
      if (input.nurMeine) {
        conditions.push(eq(aufgaben.zugewiesenAn, ctx.user.id));
      }

      return db
        .select()
        .from(aufgaben)
        .where(and(...conditions))
        .orderBy(
          desc(sql`CASE 
            WHEN ${aufgaben.prioritaet} = 'dringend' THEN 4
            WHEN ${aufgaben.prioritaet} = 'hoch' THEN 3
            WHEN ${aufgaben.prioritaet} = 'normal' THEN 2
            ELSE 1
          END`),
          asc(aufgaben.faelligkeitsdatum)
        );
    }),

  // Einzelne Aufgabe abrufen
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [aufgabe] = await db
        .select()
        .from(aufgaben)
        .where(eq(aufgaben.id, input.id));
      return aufgabe || null;
    }),

  // Neue Aufgabe erstellen
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        titel: z.string(),
        beschreibung: z.string().optional(),
        kategorie: z.enum(["finanzamt", "buchhaltung", "steuern", "personal", "allgemein", "frist", "zahlung", "pruefung"]),
        prioritaet: z.enum(["niedrig", "normal", "hoch", "dringend"]),
        faelligkeitsdatum: z.string().optional(),
        erinnerungsdatum: z.string().optional(),
        zugewiesenAn: z.number().optional(),
        finanzamtDokumentId: z.number().optional(),
        notizen: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [result] = await db.insert(aufgaben).values({
        unternehmenId: input.unternehmenId,
        titel: input.titel,
        beschreibung: input.beschreibung,
        kategorie: input.kategorie,
        prioritaet: input.prioritaet,
        status: "offen",
        faelligkeitsdatum: input.faelligkeitsdatum ? new Date(input.faelligkeitsdatum) : undefined,
        erinnerungsdatum: input.erinnerungsdatum ? new Date(input.erinnerungsdatum) : undefined,
        zugewiesenAn: input.zugewiesenAn,
        finanzamtDokumentId: input.finanzamtDokumentId,
        notizen: input.notizen,
        erstelltVon: ctx.user.id,
      });

      return { id: Number(result.insertId) };
    }),

  // Aufgabe aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        titel: z.string().optional(),
        beschreibung: z.string().optional(),
        kategorie: z.enum(["finanzamt", "buchhaltung", "steuern", "personal", "allgemein", "frist", "zahlung", "pruefung"]).optional(),
        prioritaet: z.enum(["niedrig", "normal", "hoch", "dringend"]).optional(),
        status: z.enum(["offen", "in_bearbeitung", "wartend", "erledigt", "storniert"]).optional(),
        faelligkeitsdatum: z.string().optional(),
        erinnerungsdatum: z.string().optional(),
        zugewiesenAn: z.number().optional(),
        notizen: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, ...updateData } = input;
      const cleanData: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          if (key === 'faelligkeitsdatum' || key === 'erinnerungsdatum') {
            cleanData[key] = new Date(value as string);
          } else {
            cleanData[key] = value;
          }
        }
      }

      // Wenn Status auf "erledigt" gesetzt wird, Erledigungsdatum setzen
      if (input.status === "erledigt") {
        cleanData.erledigtAm = new Date();
        cleanData.erledigtVon = ctx.user.id;
      }

      await db
        .update(aufgaben)
        .set(cleanData)
        .where(eq(aufgaben.id, id));

      return { success: true };
    }),

  // Aufgabe als erledigt markieren
  erledigen: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db
        .update(aufgaben)
        .set({
          status: "erledigt",
          erledigtAm: new Date(),
          erledigtVon: ctx.user.id,
        })
        .where(eq(aufgaben.id, input.id));

      return { success: true };
    }),

  // Aufgabe löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db
        .delete(aufgaben)
        .where(eq(aufgaben.id, input.id));

      return { success: true };
    }),

  // Offene Aufgaben (für Dashboard)
  offene: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(aufgaben)
        .where(
          and(
            eq(aufgaben.unternehmenId, input.unternehmenId),
            or(
              eq(aufgaben.status, "offen"),
              eq(aufgaben.status, "in_bearbeitung")
            )
          )
        )
        .orderBy(asc(aufgaben.faelligkeitsdatum))
        .limit(10);
    }),

  // Statistiken
  statistiken: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        gesamt: 0,
        offen: 0,
        inBearbeitung: 0,
        erledigt: 0,
        ueberfaellig: 0,
        dringend: 0,
        finanzamt: 0,
      };

      const alle = await db
        .select()
        .from(aufgaben)
        .where(eq(aufgaben.unternehmenId, input.unternehmenId));

      const heute = new Date();
      
      return {
        gesamt: alle.length,
        offen: alle.filter((a: Aufgabe) => a.status === "offen").length,
        inBearbeitung: alle.filter((a: Aufgabe) => a.status === "in_bearbeitung").length,
        erledigt: alle.filter((a: Aufgabe) => a.status === "erledigt").length,
        ueberfaellig: alle.filter((a: Aufgabe) => 
          a.faelligkeitsdatum && 
          new Date(a.faelligkeitsdatum) < heute && 
          a.status !== "erledigt" && 
          a.status !== "storniert"
        ).length,
        dringend: alle.filter((a: Aufgabe) => a.prioritaet === "dringend" && a.status !== "erledigt").length,
        finanzamt: alle.filter((a: Aufgabe) => a.kategorie === "finanzamt" && a.status !== "erledigt").length,
      };
    }),

  // Export als CSV
  exportCsv: protectedProcedure
    .input(z.object({ 
      unternehmenId: z.number(),
      nurOffen: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { csv: "", count: 0 };

      const conditions = [eq(aufgaben.unternehmenId, input.unternehmenId)];
      
      if (input.nurOffen) {
        conditions.push(
          or(
            eq(aufgaben.status, "offen"),
            eq(aufgaben.status, "in_bearbeitung")
          )!
        );
      }

      const liste = await db
        .select()
        .from(aufgaben)
        .where(and(...conditions))
        .orderBy(asc(aufgaben.faelligkeitsdatum));

      // CSV Header
      const header = "Titel;Kategorie;Priorität;Status;Fälligkeit;Beschreibung\n";
      
      // CSV Zeilen
      const rows = liste.map((a: Aufgabe) => {
        const faelligkeit = a.faelligkeitsdatum 
          ? new Date(a.faelligkeitsdatum).toLocaleDateString('de-DE')
          : "";
        return `"${a.titel}";"${a.kategorie}";"${a.prioritaet}";"${a.status}";"${faelligkeit}";"${a.beschreibung || ""}"`;
      }).join("\n");

      return {
        csv: header + rows,
        count: liste.length,
      };
    }),
});

export type AufgabenRouter = typeof aufgabenRouter;
