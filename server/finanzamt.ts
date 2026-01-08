import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { finanzamtDokumente, aufgaben, type FinanzamtDokument } from "../drizzle/schema";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";

// ============================================
// FINANZAMT-DOKUMENTE ROUTER
// ============================================

export const finanzamtRouter = router({
  // Liste aller Dokumente für ein Unternehmen
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        dokumentTyp: z.enum(["schriftverkehr", "bescheid", "einspruch", "mahnung", "anfrage", "pruefung", "sonstiges"]).optional(),
        steuerart: z.enum(["USt", "ESt", "KSt", "GewSt", "LSt", "KapESt", "sonstige"]).optional(),
        status: z.enum(["neu", "in_bearbeitung", "einspruch", "erledigt", "archiviert"]).optional(),
        steuerjahr: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(finanzamtDokumente.unternehmenId, input.unternehmenId)];
      
      if (input.dokumentTyp) {
        conditions.push(eq(finanzamtDokumente.dokumentTyp, input.dokumentTyp));
      }
      if (input.steuerart) {
        conditions.push(eq(finanzamtDokumente.steuerart, input.steuerart));
      }
      if (input.status) {
        conditions.push(eq(finanzamtDokumente.status, input.status));
      }
      if (input.steuerjahr) {
        conditions.push(eq(finanzamtDokumente.steuerjahr, input.steuerjahr));
      }

      return db
        .select()
        .from(finanzamtDokumente)
        .where(and(...conditions))
        .orderBy(desc(finanzamtDokumente.eingangsdatum));
    }),

  // Einzelnes Dokument abrufen
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [dokument] = await db
        .select()
        .from(finanzamtDokumente)
        .where(eq(finanzamtDokumente.id, input.id));
      return dokument || null;
    }),

  // Neues Dokument erstellen
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        dokumentTyp: z.enum(["schriftverkehr", "bescheid", "einspruch", "mahnung", "anfrage", "pruefung", "sonstiges"]),
        steuerart: z.enum(["USt", "ESt", "KSt", "GewSt", "LSt", "KapESt", "sonstige"]).optional(),
        zeitraumVon: z.string().optional(),
        zeitraumBis: z.string().optional(),
        steuerjahr: z.number().optional(),
        aktenzeichen: z.string().optional(),
        betreff: z.string(),
        beschreibung: z.string().optional(),
        eingangsdatum: z.string(),
        frist: z.string().optional(),
        betrag: z.number().optional(),
        zahlungsfrist: z.string().optional(),
        bezugDokumentId: z.number().optional(),
        dateiUrl: z.string().optional(),
        dateiName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [result] = await db.insert(finanzamtDokumente).values({
        unternehmenId: input.unternehmenId,
        dokumentTyp: input.dokumentTyp,
        steuerart: input.steuerart,
        zeitraumVon: input.zeitraumVon ? new Date(input.zeitraumVon) : undefined,
        zeitraumBis: input.zeitraumBis ? new Date(input.zeitraumBis) : undefined,
        steuerjahr: input.steuerjahr,
        aktenzeichen: input.aktenzeichen,
        betreff: input.betreff,
        beschreibung: input.beschreibung,
        eingangsdatum: new Date(input.eingangsdatum),
        frist: input.frist ? new Date(input.frist) : undefined,
        betrag: input.betrag ? String(input.betrag) : undefined,
        zahlungsfrist: input.zahlungsfrist ? new Date(input.zahlungsfrist) : undefined,
        bezugDokumentId: input.bezugDokumentId,
        dateiUrl: input.dateiUrl,
        dateiName: input.dateiName,
        erstelltVon: ctx.user.id,
        status: "neu",
      });

      // Automatisch Aufgaben erstellen bei Fristen
      const insertId = result.insertId;
      
      if (input.frist) {
        await db.insert(aufgaben).values({
          unternehmenId: input.unternehmenId,
          titel: `Frist beachten: ${input.betreff}`,
          beschreibung: `Frist für ${input.dokumentTyp}: ${input.betreff}`,
          kategorie: "finanzamt",
          prioritaet: "hoch",
          status: "offen",
          faelligkeitsdatum: new Date(input.frist),
          finanzamtDokumentId: Number(insertId),
          erstelltVon: ctx.user.id,
        });
      }

      if (input.zahlungsfrist && input.betrag) {
        await db.insert(aufgaben).values({
          unternehmenId: input.unternehmenId,
          titel: `Zahlung: ${input.betrag.toLocaleString('de-DE')} € - ${input.betreff}`,
          beschreibung: `Zahlung an Finanzamt für ${input.steuerart || 'Steuer'}: ${input.betreff}`,
          kategorie: "zahlung",
          prioritaet: "hoch",
          status: "offen",
          faelligkeitsdatum: new Date(input.zahlungsfrist),
          finanzamtDokumentId: Number(insertId),
          erstelltVon: ctx.user.id,
        });
      }

      return { id: Number(insertId) };
    }),

  // Dokument aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        dokumentTyp: z.enum(["schriftverkehr", "bescheid", "einspruch", "mahnung", "anfrage", "pruefung", "sonstiges"]).optional(),
        steuerart: z.enum(["USt", "ESt", "KSt", "GewSt", "LSt", "KapESt", "sonstige"]).optional(),
        zeitraumVon: z.string().optional(),
        zeitraumBis: z.string().optional(),
        steuerjahr: z.number().optional(),
        aktenzeichen: z.string().optional(),
        betreff: z.string().optional(),
        beschreibung: z.string().optional(),
        eingangsdatum: z.string().optional(),
        frist: z.string().optional(),
        betrag: z.number().optional(),
        zahlungsfrist: z.string().optional(),
        status: z.enum(["neu", "in_bearbeitung", "einspruch", "erledigt", "archiviert"]).optional(),
        dateiUrl: z.string().optional(),
        dateiName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, ...updateData } = input;
      const cleanData: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          if (key === 'betrag') {
            cleanData[key] = String(value);
          } else {
            cleanData[key] = value;
          }
        }
      }

      await db
        .update(finanzamtDokumente)
        .set(cleanData)
        .where(eq(finanzamtDokumente.id, id));

      return { success: true };
    }),

  // Dokument löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Zuerst verknüpfte Aufgaben löschen
      await db
        .delete(aufgaben)
        .where(eq(aufgaben.finanzamtDokumentId, input.id));
      
      await db
        .delete(finanzamtDokumente)
        .where(eq(finanzamtDokumente.id, input.id));

      return { success: true };
    }),

  // Offene Fristen abrufen
  offeneFristen: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const heute = new Date().toISOString().split('T')[0];
      
      return db
        .select()
        .from(finanzamtDokumente)
        .where(
          and(
            eq(finanzamtDokumente.unternehmenId, input.unternehmenId),
            or(
              eq(finanzamtDokumente.status, "neu"),
              eq(finanzamtDokumente.status, "in_bearbeitung")
            ),
            sql`${finanzamtDokumente.frist} >= ${heute}`
          )
        )
        .orderBy(asc(finanzamtDokumente.frist));
    }),

  // Statistiken
  statistiken: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        gesamt: 0,
        neu: 0,
        inBearbeitung: 0,
        mitEinspruch: 0,
        erledigt: 0,
        ueberfaelligeFristen: 0,
        bescheide: 0,
        einsprueche: 0,
      };

      const alle = await db
        .select()
        .from(finanzamtDokumente)
        .where(eq(finanzamtDokumente.unternehmenId, input.unternehmenId));

      const heute = new Date();
      
      return {
        gesamt: alle.length,
        neu: alle.filter((d: FinanzamtDokument) => d.status === "neu").length,
        inBearbeitung: alle.filter((d: FinanzamtDokument) => d.status === "in_bearbeitung").length,
        mitEinspruch: alle.filter((d: FinanzamtDokument) => d.status === "einspruch").length,
        erledigt: alle.filter((d: FinanzamtDokument) => d.status === "erledigt").length,
        ueberfaelligeFristen: alle.filter((d: FinanzamtDokument) => 
          d.frist && 
          new Date(d.frist) < heute && 
          d.status !== "erledigt" && 
          d.status !== "archiviert"
        ).length,
        bescheide: alle.filter((d: FinanzamtDokument) => d.dokumentTyp === "bescheid").length,
        einsprueche: alle.filter((d: FinanzamtDokument) => d.dokumentTyp === "einspruch").length,
      };
    }),
});

export type FinanzamtRouter = typeof finanzamtRouter;
