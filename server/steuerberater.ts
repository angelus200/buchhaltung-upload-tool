import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  steuerberaterUebergaben, 
  steuerberaterUebergabePositionen,
  buchungen,
  users
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql, count, sum } from "drizzle-orm";

export const steuerberaterRouter = router({
  // Liste aller Übergaben für ein Unternehmen
  list: protectedProcedure
    .input(z.object({
      unternehmenId: z.number(),
      zeitraumVon: z.string().optional(),
      zeitraumBis: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db
        .select({
          uebergabe: steuerberaterUebergaben,
          erstelltVonName: users.name,
        })
        .from(steuerberaterUebergaben)
        .leftJoin(users, eq(steuerberaterUebergaben.erstelltVon, users.id))
        .where(eq(steuerberaterUebergaben.unternehmenId, input.unternehmenId))
        .orderBy(desc(steuerberaterUebergaben.uebergabedatum));
      
      const results = await query;
      
      // Filter anwenden
      let filtered = results;
      
      if (input.zeitraumVon) {
        filtered = filtered.filter(r => 
          r.uebergabe.zeitraumVon && r.uebergabe.zeitraumVon >= new Date(input.zeitraumVon!)
        );
      }
      
      if (input.zeitraumBis) {
        filtered = filtered.filter(r => 
          r.uebergabe.zeitraumBis && r.uebergabe.zeitraumBis <= new Date(input.zeitraumBis!)
        );
      }
      
      if (input.status) {
        filtered = filtered.filter(r => r.uebergabe.status === input.status);
      }
      
      return filtered.map(r => ({
        ...r.uebergabe,
        erstelltVonName: r.erstelltVonName,
      }));
    }),

  // Einzelne Übergabe mit Positionen
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [uebergabe] = await db
        .select()
        .from(steuerberaterUebergaben)
        .where(eq(steuerberaterUebergaben.id, input.id));
      
      if (!uebergabe) return null;
      
      const positionen = await db
        .select({
          position: steuerberaterUebergabePositionen,
          buchung: buchungen,
        })
        .from(steuerberaterUebergabePositionen)
        .leftJoin(buchungen, eq(steuerberaterUebergabePositionen.buchungId, buchungen.id))
        .where(eq(steuerberaterUebergabePositionen.uebergabeId, input.id));
      
      return {
        ...uebergabe,
        positionen: positionen.map(p => ({
          ...p.position,
          buchung: p.buchung,
        })),
      };
    }),

  // Neue Übergabe erstellen
  create: protectedProcedure
    .input(z.object({
      unternehmenId: z.number(),
      bezeichnung: z.string(),
      beschreibung: z.string().optional(),
      uebergabeart: z.enum(["datev_export", "email", "portal", "persoenlich", "post", "cloud", "sonstig"]),
      zeitraumVon: z.string().optional(),
      zeitraumBis: z.string().optional(),
      uebergabedatum: z.string(),
      dateiUrl: z.string().optional(),
      dateiName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(steuerberaterUebergaben).values({
        unternehmenId: input.unternehmenId,
        bezeichnung: input.bezeichnung,
        beschreibung: input.beschreibung || null,
        uebergabeart: input.uebergabeart,
        zeitraumVon: input.zeitraumVon ? new Date(input.zeitraumVon) : null,
        zeitraumBis: input.zeitraumBis ? new Date(input.zeitraumBis) : null,
        uebergabedatum: new Date(input.uebergabedatum),
        dateiUrl: input.dateiUrl || null,
        dateiName: input.dateiName || null,
        erstelltVon: ctx.user?.id || null,
        status: "vorbereitet",
      });
      
      return { id: result.insertId };
    }),

  // Übergabe aktualisieren
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      bezeichnung: z.string().optional(),
      beschreibung: z.string().optional(),
      uebergabeart: z.enum(["datev_export", "email", "portal", "persoenlich", "post", "cloud", "sonstig"]).optional(),
      zeitraumVon: z.string().optional(),
      zeitraumBis: z.string().optional(),
      uebergabedatum: z.string().optional(),
      status: z.enum(["vorbereitet", "uebergeben", "bestaetigt", "rueckfrage", "abgeschlossen"]).optional(),
      rueckfragen: z.string().optional(),
      dateiUrl: z.string().optional(),
      dateiName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: Record<string, unknown> = {};
      
      if (input.bezeichnung) updateData.bezeichnung = input.bezeichnung;
      if (input.beschreibung !== undefined) updateData.beschreibung = input.beschreibung;
      if (input.uebergabeart) updateData.uebergabeart = input.uebergabeart;
      if (input.zeitraumVon) updateData.zeitraumVon = new Date(input.zeitraumVon);
      if (input.zeitraumBis) updateData.zeitraumBis = new Date(input.zeitraumBis);
      if (input.uebergabedatum) updateData.uebergabedatum = new Date(input.uebergabedatum);
      if (input.status) {
        updateData.status = input.status;
        if (input.status === "bestaetigt") {
          updateData.bestaetigtAm = new Date();
        }
      }
      if (input.rueckfragen !== undefined) updateData.rueckfragen = input.rueckfragen;
      if (input.dateiUrl !== undefined) updateData.dateiUrl = input.dateiUrl;
      if (input.dateiName !== undefined) updateData.dateiName = input.dateiName;
      
      await db
        .update(steuerberaterUebergaben)
        .set(updateData)
        .where(eq(steuerberaterUebergaben.id, input.id));
      
      return { success: true };
    }),

  // Übergabe löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Erst Positionen löschen
      await db
        .delete(steuerberaterUebergabePositionen)
        .where(eq(steuerberaterUebergabePositionen.uebergabeId, input.id));
      
      // Dann Übergabe löschen
      await db
        .delete(steuerberaterUebergaben)
        .where(eq(steuerberaterUebergaben.id, input.id));
      
      return { success: true };
    }),

  // Buchungen zu einer Übergabe hinzufügen
  addBuchungen: protectedProcedure
    .input(z.object({
      uebergabeId: z.number(),
      buchungIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buchungen abrufen für Beträge
      const buchungenData = await db
        .select()
        .from(buchungen)
        .where(sql`${buchungen.id} IN (${sql.join(input.buchungIds.map(id => sql`${id}`), sql`, `)})`);
      
      // Positionen erstellen
      for (const buchung of buchungenData) {
        await db.insert(steuerberaterUebergabePositionen).values({
          uebergabeId: input.uebergabeId,
          buchungId: buchung.id,
          positionstyp: "buchung",
          betrag: buchung.bruttobetrag,
        });
      }
      
      // Übergabe-Statistiken aktualisieren
      const [stats] = await db
        .select({
          anzahl: count(),
          summe: sum(steuerberaterUebergabePositionen.betrag),
        })
        .from(steuerberaterUebergabePositionen)
        .where(eq(steuerberaterUebergabePositionen.uebergabeId, input.uebergabeId));
      
      await db
        .update(steuerberaterUebergaben)
        .set({
          anzahlBuchungen: Number(stats.anzahl) || 0,
          gesamtbetrag: stats.summe?.toString() || "0",
        })
        .where(eq(steuerberaterUebergaben.id, input.uebergabeId));
      
      return { success: true, count: buchungenData.length };
    }),

  // Position aus Übergabe entfernen
  removePosition: protectedProcedure
    .input(z.object({ positionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Position abrufen für Übergabe-ID
      const [position] = await db
        .select()
        .from(steuerberaterUebergabePositionen)
        .where(eq(steuerberaterUebergabePositionen.id, input.positionId));
      
      if (!position) return { success: false };
      
      // Position löschen
      await db
        .delete(steuerberaterUebergabePositionen)
        .where(eq(steuerberaterUebergabePositionen.id, input.positionId));
      
      // Statistiken aktualisieren
      const [stats] = await db
        .select({
          anzahl: count(),
          summe: sum(steuerberaterUebergabePositionen.betrag),
        })
        .from(steuerberaterUebergabePositionen)
        .where(eq(steuerberaterUebergabePositionen.uebergabeId, position.uebergabeId));
      
      await db
        .update(steuerberaterUebergaben)
        .set({
          anzahlBuchungen: Number(stats.anzahl) || 0,
          gesamtbetrag: stats.summe?.toString() || "0",
        })
        .where(eq(steuerberaterUebergaben.id, position.uebergabeId));
      
      return { success: true };
    }),

  // Statistiken für Dashboard
  statistiken: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const uebergaben = await db
        .select()
        .from(steuerberaterUebergaben)
        .where(eq(steuerberaterUebergaben.unternehmenId, input.unternehmenId));
      
      const gesamt = uebergaben.length;
      const vorbereitet = uebergaben.filter(u => u.status === "vorbereitet").length;
      const uebergeben = uebergaben.filter(u => u.status === "uebergeben").length;
      const rueckfragen = uebergaben.filter(u => u.status === "rueckfrage").length;
      const abgeschlossen = uebergaben.filter(u => u.status === "abgeschlossen").length;
      
      const gesamtBuchungen = uebergaben.reduce((sum, u) => sum + (u.anzahlBuchungen || 0), 0);
      const gesamtBetrag = uebergaben.reduce((sum, u) => sum + parseFloat(u.gesamtbetrag || "0"), 0);
      
      // Letzte Übergabe
      const letzteUebergabe = uebergaben
        .filter(u => u.status !== "vorbereitet")
        .sort((a, b) => new Date(b.uebergabedatum).getTime() - new Date(a.uebergabedatum).getTime())[0];
      
      return {
        gesamt,
        vorbereitet,
        uebergeben,
        rueckfragen,
        abgeschlossen,
        gesamtBuchungen,
        gesamtBetrag,
        letzteUebergabe: letzteUebergabe?.uebergabedatum || null,
      };
    }),

  // Nicht übergebene Buchungen abrufen
  nichtUebergebeneBuchungen: protectedProcedure
    .input(z.object({
      unternehmenId: z.number(),
      zeitraumVon: z.string().optional(),
      zeitraumBis: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Alle Buchungen des Unternehmens
      let alleBuchungen = await db
        .select()
        .from(buchungen)
        .where(eq(buchungen.unternehmenId, input.unternehmenId))
        .orderBy(desc(buchungen.belegdatum));
      
      // Zeitraum-Filter
      if (input.zeitraumVon) {
        alleBuchungen = alleBuchungen.filter(b => 
          new Date(b.belegdatum) >= new Date(input.zeitraumVon!)
        );
      }
      if (input.zeitraumBis) {
        alleBuchungen = alleBuchungen.filter(b => 
          new Date(b.belegdatum) <= new Date(input.zeitraumBis!)
        );
      }
      
      // Bereits übergebene Buchungen
      const uebergebeneBuchungIds = await db
        .select({ buchungId: steuerberaterUebergabePositionen.buchungId })
        .from(steuerberaterUebergabePositionen)
        .where(sql`${steuerberaterUebergabePositionen.buchungId} IS NOT NULL`);
      
      const uebergeben = new Set(uebergebeneBuchungIds.map(p => p.buchungId));
      
      // Nicht übergebene filtern
      return alleBuchungen.filter(b => !uebergeben.has(b.id));
    }),

  // CSV-Export für Übergabe-Protokoll
  exportProtokoll: protectedProcedure
    .input(z.object({ uebergabeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [uebergabe] = await db
        .select()
        .from(steuerberaterUebergaben)
        .where(eq(steuerberaterUebergaben.id, input.uebergabeId));
      
      if (!uebergabe) return null;
      
      const positionen = await db
        .select({
          position: steuerberaterUebergabePositionen,
          buchung: buchungen,
        })
        .from(steuerberaterUebergabePositionen)
        .leftJoin(buchungen, eq(steuerberaterUebergabePositionen.buchungId, buchungen.id))
        .where(eq(steuerberaterUebergabePositionen.uebergabeId, input.uebergabeId));
      
      // CSV erstellen
      const header = "Belegdatum;Belegnummer;Geschäftspartner;Sachkonto;Netto;Brutto;Buchungstext";
      const rows = positionen.map(p => {
        if (p.buchung) {
          return [
            p.buchung.belegdatum,
            p.buchung.belegnummer,
            p.buchung.geschaeftspartner,
            p.buchung.sachkonto,
            p.buchung.nettobetrag,
            p.buchung.bruttobetrag,
            p.buchung.buchungstext || "",
          ].join(";");
        }
        return [
          "",
          "",
          p.position.beschreibung || "",
          "",
          "",
          p.position.betrag || "",
          "",
        ].join(";");
      });
      
      return {
        uebergabe,
        csv: [header, ...rows].join("\n"),
      };
    }),
});
