import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { auszuege, auszugPositionen, buchungen, InsertAuszug, InsertAuszugPosition } from "../drizzle/schema";
import { eq, and, gte, lte, sql, or, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { uploadAuszug } from "./storage";

/**
 * Auszüge Router - Verwaltung von Kontoauszügen, Kreditkartenauszügen, Zahlungsdienstleister-Auszügen
 */
export const auszuegeRouter = router({
  /**
   * Alle Auszüge eines Unternehmens abrufen
   */
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        typ: z.enum(["bankkonto", "kreditkarte", "zahlungsdienstleister"]).optional(),
        status: z.enum(["neu", "in_bearbeitung", "abgeschlossen"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(auszuege.unternehmenId, input.unternehmenId)];

      if (input.typ) {
        conditions.push(eq(auszuege.typ, input.typ));
      }

      if (input.status) {
        conditions.push(eq(auszuege.status, input.status));
      }

      const result = await db
        .select()
        .from(auszuege)
        .where(and(...conditions))
        .orderBy(desc(auszuege.zeitraumBis), desc(auszuege.createdAt));

      return result;
    }),

  /**
   * Einzelnen Auszug mit Positionen abrufen
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [auszug] = await db
        .select()
        .from(auszuege)
        .where(eq(auszuege.id, input.id))
        .limit(1);

      if (!auszug) return null;

      const positionen = await db
        .select()
        .from(auszugPositionen)
        .where(eq(auszugPositionen.auszugId, input.id))
        .orderBy(auszugPositionen.datum, desc(auszugPositionen.datum));

      return { auszug, positionen };
    }),

  /**
   * Auszug hochladen
   */
  upload: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        typ: z.enum(["bankkonto", "kreditkarte", "zahlungsdienstleister"]),
        kontoId: z.number().optional(),
        kontoBezeichnung: z.string().optional(),
        dateiBase64: z.string(),
        dateiname: z.string(),
        zeitraumVon: z.string(),
        zeitraumBis: z.string(),
        saldoAnfang: z.string().optional(),
        saldoEnde: z.string().optional(),
        waehrung: z.string().default("EUR"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      try {
        // Base64 zu Buffer konvertieren
        const base64Data = input.dateiBase64.split(',')[1] || input.dateiBase64;
        const buffer = Buffer.from(base64Data, 'base64');

        // Datei hochladen
        const uploadResult = await uploadAuszug(
          buffer,
          input.dateiname,
          input.unternehmenId,
          input.typ
        );

        // Auszug in Datenbank speichern
        const [result] = await db.insert(auszuege).values({
          unternehmenId: input.unternehmenId,
          typ: input.typ,
          kontoId: input.kontoId,
          kontoBezeichnung: input.kontoBezeichnung,
          dateiUrl: uploadResult.url,
          dateiname: input.dateiname,
          zeitraumVon: new Date(input.zeitraumVon),
          zeitraumBis: new Date(input.zeitraumBis),
          saldoAnfang: input.saldoAnfang,
          saldoEnde: input.saldoEnde,
          waehrung: input.waehrung,
          status: "neu",
          erstelltVon: ctx.user.id,
        } as InsertAuszug);

        return { success: true, id: result.insertId };
      } catch (error) {
        console.error("Upload fehlgeschlagen:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Upload fehlgeschlagen",
        });
      }
    }),

  /**
   * Position hinzufügen (manuell oder nach Parsing)
   */
  addPosition: protectedProcedure
    .input(
      z.object({
        auszugId: z.number(),
        datum: z.string(),
        buchungstext: z.string(),
        betrag: z.string(),
        saldo: z.string().optional(),
        referenz: z.string().optional(),
        kategorie: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [result] = await db.insert(auszugPositionen).values({
        auszugId: input.auszugId,
        datum: new Date(input.datum),
        buchungstext: input.buchungstext,
        betrag: input.betrag,
        saldo: input.saldo,
        referenz: input.referenz,
        kategorie: input.kategorie,
        status: "offen",
      } as InsertAuszugPosition);

      return { success: true, id: result.insertId };
    }),

  /**
   * Position einer Buchung zuordnen
   */
  zuordnen: protectedProcedure
    .input(
      z.object({
        positionId: z.number(),
        buchungId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(auszugPositionen)
        .set({
          zugeordneteBuchungId: input.buchungId,
          status: "zugeordnet",
        })
        .where(eq(auszugPositionen.id, input.positionId));

      return { success: true };
    }),

  /**
   * Zuordnung aufheben
   */
  zuordnungAufheben: protectedProcedure
    .input(z.object({ positionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(auszugPositionen)
        .set({
          zugeordneteBuchungId: null,
          status: "offen",
        })
        .where(eq(auszugPositionen.id, input.positionId));

      return { success: true };
    }),

  /**
   * Position als "ignoriert" markieren
   */
  ignorieren: protectedProcedure
    .input(z.object({ positionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(auszugPositionen)
        .set({ status: "ignoriert" })
        .where(eq(auszugPositionen.id, input.positionId));

      return { success: true };
    }),

  /**
   * Automatische Zuordnung basierend auf Betrag + Datum + Text
   */
  autoZuordnen: protectedProcedure
    .input(z.object({ auszugId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Auszug laden
      const [auszug] = await db
        .select()
        .from(auszuege)
        .where(eq(auszuege.id, input.auszugId))
        .limit(1);

      if (!auszug) throw new TRPCError({ code: "NOT_FOUND", message: "Auszug nicht gefunden" });

      // Alle offenen Positionen laden
      const positionen = await db
        .select()
        .from(auszugPositionen)
        .where(
          and(
            eq(auszugPositionen.auszugId, input.auszugId),
            eq(auszugPositionen.status, "offen")
          )
        );

      let zugeordnet = 0;

      // Für jede Position versuchen, eine passende Buchung zu finden
      for (const position of positionen) {
        // Betrag als Zahl
        const betrag = Math.abs(parseFloat(position.betrag.toString()));

        // Datumsbereich: ±3 Tage
        const datumVon = new Date(position.datum);
        datumVon.setDate(datumVon.getDate() - 3);
        const datumBis = new Date(position.datum);
        datumBis.setDate(datumBis.getDate() + 3);

        // Suche passende Buchungen
        const passendeBuchungen = await db
          .select()
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, auszug.unternehmenId),
              gte(buchungen.belegdatum, datumVon),
              lte(buchungen.belegdatum, datumBis),
              // Betrag muss gleich sein (Toleranz 0.01)
              sql`ABS(ABS(${buchungen.bruttobetrag}) - ${betrag}) < 0.02`
            )
          )
          .limit(1);

        if (passendeBuchungen.length > 0) {
          // Zuordnen
          await db
            .update(auszugPositionen)
            .set({
              zugeordneteBuchungId: passendeBuchungen[0].id,
              status: "zugeordnet",
            })
            .where(eq(auszugPositionen.id, position.id));

          zugeordnet++;
        }
      }

      // Status des Auszugs aktualisieren
      const allePositionen = await db
        .select()
        .from(auszugPositionen)
        .where(eq(auszugPositionen.auszugId, input.auszugId));

      const alleZugeordnet = allePositionen.every(
        (p) => p.status === "zugeordnet" || p.status === "ignoriert"
      );

      if (alleZugeordnet) {
        await db
          .update(auszuege)
          .set({ status: "abgeschlossen" })
          .where(eq(auszuege.id, input.auszugId));
      } else if (zugeordnet > 0) {
        await db
          .update(auszuege)
          .set({ status: "in_bearbeitung" })
          .where(eq(auszuege.id, input.auszugId));
      }

      return { success: true, zugeordnet };
    }),

  /**
   * Passende Buchungen für eine Position finden
   */
  findePassendeBuchungen: protectedProcedure
    .input(z.object({ positionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Position laden
      const [position] = await db
        .select()
        .from(auszugPositionen)
        .where(eq(auszugPositionen.id, input.positionId))
        .limit(1);

      if (!position) return [];

      // Auszug laden
      const [auszug] = await db
        .select()
        .from(auszuege)
        .where(eq(auszuege.id, position.auszugId))
        .limit(1);

      if (!auszug) return [];

      // Betrag als Zahl
      const betrag = Math.abs(parseFloat(position.betrag.toString()));

      // Datumsbereich: ±7 Tage (erweitert für manuelle Suche)
      const datumVon = new Date(position.datum);
      datumVon.setDate(datumVon.getDate() - 7);
      const datumBis = new Date(position.datum);
      datumBis.setDate(datumBis.getDate() + 7);

      // Suche passende Buchungen
      const passendeBuchungen = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, auszug.unternehmenId),
            gte(buchungen.belegdatum, datumVon),
            lte(buchungen.belegdatum, datumBis),
            // Betrag muss gleich sein (Toleranz 0.05)
            sql`ABS(ABS(${buchungen.bruttobetrag}) - ${betrag}) < 0.05`
          )
        )
        .orderBy(buchungen.belegdatum)
        .limit(10);

      return passendeBuchungen;
    }),

  /**
   * Auszug Status ändern
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["neu", "in_bearbeitung", "abgeschlossen"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(auszuege)
        .set({ status: input.status })
        .where(eq(auszuege.id, input.id));

      return { success: true };
    }),

  /**
   * Auszug löschen (inkl. aller Positionen)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Erst alle Positionen löschen
      await db.delete(auszugPositionen).where(eq(auszugPositionen.auszugId, input.id));

      // Dann Auszug löschen
      await db.delete(auszuege).where(eq(auszuege.id, input.id));

      return { success: true };
    }),

  /**
   * Statistiken für Auszüge
   */
  stats: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        return {
          gesamt: 0,
          neu: 0,
          inBearbeitung: 0,
          abgeschlossen: 0,
        };

      const alleAuszuege = await db
        .select()
        .from(auszuege)
        .where(eq(auszuege.unternehmenId, input.unternehmenId));

      return {
        gesamt: alleAuszuege.length,
        neu: alleAuszuege.filter((a) => a.status === "neu").length,
        inBearbeitung: alleAuszuege.filter((a) => a.status === "in_bearbeitung").length,
        abgeschlossen: alleAuszuege.filter((a) => a.status === "abgeschlossen").length,
      };
    }),
});
