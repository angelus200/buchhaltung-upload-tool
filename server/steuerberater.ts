import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  steuerberaterUebergaben,
  steuerberaterUebergabePositionen,
  steuerberaterRechnungen,
  steuerberaterRechnungPositionen,
  buchungen,
  users,
  finanzamtDokumente,
  unternehmen
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql, count, sum } from "drizzle-orm";

/**
 * Berechnet Wirtschaftsjahr und Periode basierend auf Belegdatum und Wirtschaftsjahrbeginn
 *
 * Beispiel 1: wirtschaftsjahrBeginn = 1 (Kalenderjahr)
 *   - 15.03.2026 → WJ 2026, Periode 3
 *
 * Beispiel 2: wirtschaftsjahrBeginn = 7 (beginnt am 1. Juli)
 *   - 15.01.2026 → WJ 2025, Periode 7 (7. Monat des am 1.7.2025 begonnenen GJ)
 *   - 15.07.2026 → WJ 2026, Periode 1 (1. Monat des am 1.7.2026 begonnenen GJ)
 */
function calculateWirtschaftsjahrPeriode(
  belegdatum: Date,
  wirtschaftsjahrBeginn: number
): { wirtschaftsjahr: number; periode: number } {
  const jahr = belegdatum.getFullYear();
  const monat = belegdatum.getMonth() + 1; // 1-12

  if (wirtschaftsjahrBeginn === 1) {
    // Einfacher Fall: Kalenderjahr = Geschäftsjahr
    return {
      wirtschaftsjahr: jahr,
      periode: monat
    };
  }

  // Geschäftsjahr beginnt in einem anderen Monat
  if (monat >= wirtschaftsjahrBeginn) {
    // Wir sind im aktuellen Geschäftsjahr (beginnt in diesem Kalenderjahr)
    return {
      wirtschaftsjahr: jahr,
      periode: monat - wirtschaftsjahrBeginn + 1
    };
  } else {
    // Wir sind noch im vorherigen Geschäftsjahr (begann im letzten Kalenderjahr)
    return {
      wirtschaftsjahr: jahr - 1,
      periode: 12 - wirtschaftsjahrBeginn + monat + 1
    };
  }
}

// Hilfsfunktion: Empfehlungen basierend auf Analyse generieren
function generateEmpfehlungen(
  vermeidbarNachUrsache: Record<string, number>,
  vermeidbarkeitsquote: number
): string[] {
  const empfehlungen: string[] = [];
  
  if (vermeidbarkeitsquote > 20) {
    empfehlungen.push(
      `⚠️ Hohe Vermeidbarkeitsquote (${vermeidbarkeitsquote.toFixed(1)}%): Überprüfen Sie Ihre internen Prozesse.`
    );
  }
  
  if (vermeidbarNachUrsache["vermeidbar_nachfrage"] > 0) {
    empfehlungen.push(
      `📝 Nachfragen wegen fehlender Unterlagen: Erstellen Sie eine Checkliste für vollständige Belegabgabe.`
    );
  }
  
  if (vermeidbarNachUrsache["vermeidbar_korrektur"] > 0) {
    empfehlungen.push(
      `🔄 Korrekturen erforderlich: Implementieren Sie eine Prüfung vor der Übergabe an den Steuerberater.`
    );
  }
  
  if (vermeidbarNachUrsache["vermeidbar_beleg"] > 0) {
    empfehlungen.push(
      `📄 Fehlende Belege: Digitalisieren Sie Belege sofort nach Erhalt und ordnen Sie diese zu.`
    );
  }
  
  if (vermeidbarNachUrsache["vermeidbar_info"] > 0) {
    empfehlungen.push(
      `ℹ️ Fehlende Informationen: Führen Sie detailliertere Buchungstexte und Notizen.`
    );
  }
  
  if (empfehlungen.length === 0 && vermeidbarkeitsquote < 5) {
    empfehlungen.push(
      `✅ Sehr gute Vorbereitung! Ihre Vermeidbarkeitsquote ist niedrig.`
    );
  }
  
  return empfehlungen;
}

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

  // ============================================
  // RECHNUNGEN - Phase 2: Aufwands-Kontrolle
  // ============================================

  // Liste aller Rechnungen für ein Unternehmen
  rechnungenList: protectedProcedure
    .input(z.object({
      unternehmenId: z.number(),
      jahr: z.number().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = await db
        .select()
        .from(steuerberaterRechnungen)
        .where(eq(steuerberaterRechnungen.unternehmenId, input.unternehmenId))
        .orderBy(desc(steuerberaterRechnungen.rechnungsdatum));
      
      let filtered = results;
      
      if (input.jahr) {
        filtered = filtered.filter(r => 
          new Date(r.rechnungsdatum).getFullYear() === input.jahr
        );
      }
      
      if (input.status) {
        filtered = filtered.filter(r => r.status === input.status);
      }
      
      return filtered;
    }),

  // Einzelne Rechnung mit Positionen abrufen
  rechnungGetById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [rechnung] = await db
        .select()
        .from(steuerberaterRechnungen)
        .where(eq(steuerberaterRechnungen.id, input.id));
      
      if (!rechnung) return null;
      
      const positionen = await db
        .select()
        .from(steuerberaterRechnungPositionen)
        .where(eq(steuerberaterRechnungPositionen.rechnungId, input.id))
        .orderBy(steuerberaterRechnungPositionen.positionsnummer);
      
      return { rechnung, positionen };
    }),

  // Neue Rechnung erstellen
  rechnungCreate: protectedProcedure
    .input(z.object({
      unternehmenId: z.number(),
      rechnungsnummer: z.string(),
      rechnungsdatum: z.string(),
      zeitraumVon: z.string().optional(),
      zeitraumBis: z.string().optional(),
      nettobetrag: z.string(),
      steuersatz: z.string().optional(),
      bruttobetrag: z.string(),
      beschreibung: z.string().optional(),
      dateiBase64: z.string().optional(),
      dateiName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let dateiUrl: string | null = null;
      let savedFileName: string | null = null;

      // Upload Datei falls vorhanden
      if (input.dateiBase64 && input.dateiName) {
        try {
          const { uploadSteuerberaterRechnung } = await import('./storage');

          // Base64 zu Buffer konvertieren
          const base64Data = input.dateiBase64.split(',')[1] || input.dateiBase64;
          const buffer = Buffer.from(base64Data, 'base64');

          const uploadResult = await uploadSteuerberaterRechnung(
            buffer,
            input.dateiName,
            input.unternehmenId
          );

          dateiUrl = uploadResult.url;
          savedFileName = input.dateiName;
        } catch (error) {
          console.error('File upload failed:', error);
          // Fahre ohne Datei fort
        }
      }

      const [result] = await db.insert(steuerberaterRechnungen).values({
        unternehmenId: input.unternehmenId,
        rechnungsnummer: input.rechnungsnummer,
        rechnungsdatum: new Date(input.rechnungsdatum),
        zeitraumVon: input.zeitraumVon ? new Date(input.zeitraumVon) : null,
        zeitraumBis: input.zeitraumBis ? new Date(input.zeitraumBis) : null,
        nettobetrag: input.nettobetrag,
        steuersatz: input.steuersatz || "19.00",
        bruttobetrag: input.bruttobetrag,
        beschreibung: input.beschreibung || null,
        dateiUrl: dateiUrl,
        dateiName: savedFileName,
        erstelltVon: ctx.user?.id || null,
      });
      
      return { success: true };
    }),

  // Rechnung aktualisieren
  rechnungUpdate: protectedProcedure
    .input(z.object({
      id: z.number(),
      rechnungsnummer: z.string().optional(),
      rechnungsdatum: z.string().optional(),
      zeitraumVon: z.string().optional(),
      zeitraumBis: z.string().optional(),
      nettobetrag: z.string().optional(),
      steuersatz: z.string().optional(),
      bruttobetrag: z.string().optional(),
      status: z.string().optional(),
      zahlungsdatum: z.string().optional(),
      beschreibung: z.string().optional(),
      dateiUrl: z.string().optional(),
      dateiName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {};
      if (input.rechnungsnummer) updateData.rechnungsnummer = input.rechnungsnummer;
      if (input.rechnungsdatum) updateData.rechnungsdatum = new Date(input.rechnungsdatum);
      if (input.zeitraumVon) updateData.zeitraumVon = new Date(input.zeitraumVon);
      if (input.zeitraumBis) updateData.zeitraumBis = new Date(input.zeitraumBis);
      if (input.nettobetrag) updateData.nettobetrag = input.nettobetrag;
      if (input.steuersatz) updateData.steuersatz = input.steuersatz;
      if (input.bruttobetrag) updateData.bruttobetrag = input.bruttobetrag;
      if (input.status) updateData.status = input.status;
      if (input.zahlungsdatum) updateData.zahlungsdatum = new Date(input.zahlungsdatum);
      if (input.beschreibung !== undefined) updateData.beschreibung = input.beschreibung;
      if (input.dateiUrl !== undefined) updateData.dateiUrl = input.dateiUrl;
      if (input.dateiName !== undefined) updateData.dateiName = input.dateiName;
      
      await db
        .update(steuerberaterRechnungen)
        .set(updateData)
        .where(eq(steuerberaterRechnungen.id, input.id));
      
      return { success: true };
    }),

  // Rechnung löschen
  rechnungDelete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Erst Positionen löschen
      await db
        .delete(steuerberaterRechnungPositionen)
        .where(eq(steuerberaterRechnungPositionen.rechnungId, input.id));
      
      // Dann Rechnung löschen
      await db
        .delete(steuerberaterRechnungen)
        .where(eq(steuerberaterRechnungen.id, input.id));
      
      return { success: true };
    }),

  // Rechnungsposition hinzufügen
  rechnungAddPosition: protectedProcedure
    .input(z.object({
      rechnungId: z.number(),
      beschreibung: z.string(),
      kategorie: z.string(),
      bewertung: z.string(),
      vermeidbarUrsache: z.string().optional(),
      menge: z.string().optional(),
      einzelpreis: z.string(),
      gesamtpreis: z.string(),
      uebergabeId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      console.log("[STB-POSITION] 🚀 Füge Position hinzu:", {
        rechnungId: input.rechnungId,
        beschreibung: input.beschreibung.substring(0, 50),
        kategorie: input.kategorie,
        bewertung: input.bewertung,
        einzelpreis: input.einzelpreis,
        gesamtpreis: input.gesamtpreis,
        userId: ctx.user.id,
      });

      try {
        // Prüfe ob Rechnung existiert
        const [rechnung] = await db
          .select()
          .from(steuerberaterRechnungen)
          .where(eq(steuerberaterRechnungen.id, input.rechnungId));

        if (!rechnung) {
          console.error("[STB-POSITION] ❌ Rechnung nicht gefunden:", input.rechnungId);
          throw new Error("Rechnung nicht gefunden");
        }

        console.log("[STB-POSITION] ✅ Rechnung gefunden, UnternehmenId:", rechnung.unternehmenId);

        // Nächste Positionsnummer ermitteln
        const existingPositions = await db
          .select({ positionsnummer: steuerberaterRechnungPositionen.positionsnummer })
          .from(steuerberaterRechnungPositionen)
          .where(eq(steuerberaterRechnungPositionen.rechnungId, input.rechnungId));

        const maxPos = Math.max(0, ...existingPositions.map(p => p.positionsnummer || 0));
        console.log("[STB-POSITION] 📊 Existierende Positionen:", existingPositions.length, "Nächste Nr:", maxPos + 1);

        const [result] = await db.insert(steuerberaterRechnungPositionen).values({
          rechnungId: input.rechnungId,
          positionsnummer: maxPos + 1,
          beschreibung: input.beschreibung,
          kategorie: input.kategorie as any,
          bewertung: input.bewertung as any,
          vermeidbarUrsache: input.vermeidbarUrsache || null,
          menge: input.menge || "1.00",
          einzelpreis: input.einzelpreis,
          gesamtpreis: input.gesamtpreis,
          uebergabeId: input.uebergabeId || null,
        });

        const insertId = Number(result.insertId);
        console.log("[STB-POSITION] ✅ Position erfolgreich eingefügt, ID:", insertId);

        return { success: true, id: insertId };
      } catch (error) {
        console.error("[STB-POSITION] ❌ Fehler beim Einfügen:", error);
        console.error("[STB-POSITION] ❌ Error Stack:", error instanceof Error ? error.stack : "No stack");
        throw error;
      }
    }),

  // Rechnungsposition aktualisieren
  rechnungUpdatePosition: protectedProcedure
    .input(z.object({
      id: z.number(),
      beschreibung: z.string().optional(),
      kategorie: z.string().optional(),
      bewertung: z.string().optional(),
      vermeidbarUrsache: z.string().optional(),
      menge: z.string().optional(),
      einzelpreis: z.string().optional(),
      gesamtpreis: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {};
      if (input.beschreibung) updateData.beschreibung = input.beschreibung;
      if (input.kategorie) updateData.kategorie = input.kategorie;
      if (input.bewertung) updateData.bewertung = input.bewertung;
      if (input.vermeidbarUrsache !== undefined) updateData.vermeidbarUrsache = input.vermeidbarUrsache;
      if (input.menge) updateData.menge = input.menge;
      if (input.einzelpreis) updateData.einzelpreis = input.einzelpreis;
      if (input.gesamtpreis) updateData.gesamtpreis = input.gesamtpreis;
      
      await db
        .update(steuerberaterRechnungPositionen)
        .set(updateData)
        .where(eq(steuerberaterRechnungPositionen.id, input.id));
      
      return { success: true };
    }),

  // Rechnungsposition löschen
  rechnungDeletePosition: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(steuerberaterRechnungPositionen)
        .where(eq(steuerberaterRechnungPositionen.id, input.id));
      
      return { success: true };
    }),

  // Aufwands-Analyse: Statistiken und Kennzahlen
  aufwandsAnalyse: protectedProcedure
    .input(z.object({
      unternehmenId: z.number(),
      jahr: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Alle Rechnungen des Unternehmens
      let rechnungen = await db
        .select()
        .from(steuerberaterRechnungen)
        .where(eq(steuerberaterRechnungen.unternehmenId, input.unternehmenId));
      
      if (input.jahr) {
        rechnungen = rechnungen.filter(r => 
          new Date(r.rechnungsdatum).getFullYear() === input.jahr
        );
      }
      
      // Alle Positionen dieser Rechnungen
      const rechnungIds = rechnungen.map(r => r.id);
      let positionen: any[] = [];
      
      if (rechnungIds.length > 0) {
        positionen = await db
          .select()
          .from(steuerberaterRechnungPositionen)
          .where(sql`${steuerberaterRechnungPositionen.rechnungId} IN (${sql.join(rechnungIds, sql`, `)})`);
      }
      
      // Gesamtkosten
      const gesamtkosten = rechnungen.reduce((sum, r) => sum + parseFloat(r.bruttobetrag || "0"), 0);

      // Kosten nach Kategorie
      const kostenNachKategorie: Record<string, number> = {};

      // Rechnungen, die Positionen haben
      const rechnungenMitPositionen = new Set(positionen.map(p => p.rechnungId));

      // Positionen zu Kategorien zuordnen
      positionen.forEach(p => {
        const kat = p.kategorie || "sonstig";
        kostenNachKategorie[kat] = (kostenNachKategorie[kat] || 0) + parseFloat(p.gesamtpreis || "0");
      });

      // Rechnungen ohne Positionen als "nicht_kategorisiert" hinzufügen
      rechnungen.forEach(r => {
        if (!rechnungenMitPositionen.has(r.id)) {
          kostenNachKategorie["nicht_kategorisiert"] = (kostenNachKategorie["nicht_kategorisiert"] || 0) + parseFloat(r.bruttobetrag || "0");
        }
      });
      
      // Vermeidbare Kosten
      const vermeidbarePositionen = positionen.filter(p => 
        p.bewertung && p.bewertung.startsWith("vermeidbar")
      );
      const vermeidbareKosten = vermeidbarePositionen.reduce(
        (sum, p) => sum + parseFloat(p.gesamtpreis || "0"), 0
      );
      
      // Vermeidbare Kosten nach Ursache
      const vermeidbarNachUrsache: Record<string, number> = {};
      vermeidbarePositionen.forEach(p => {
        const ursache = p.bewertung || "unklar";
        vermeidbarNachUrsache[ursache] = (vermeidbarNachUrsache[ursache] || 0) + parseFloat(p.gesamtpreis || "0");
      });
      
      // Anzahl Buchungen im Zeitraum (für Kosten pro Buchung)
      let buchungenCount = 0;
      if (input.jahr) {
        const jahresStart = `${input.jahr}-01-01`;
        const jahresEnde = `${input.jahr}-12-31`;
        const buchungenResult = await db
          .select({ count: count() })
          .from(buchungen)
          .where(and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            gte(buchungen.belegdatum, new Date(jahresStart)),
            lte(buchungen.belegdatum, new Date(jahresEnde))
          ));
        buchungenCount = buchungenResult[0]?.count || 0;
      } else {
        const buchungenResult = await db
          .select({ count: count() })
          .from(buchungen)
          .where(eq(buchungen.unternehmenId, input.unternehmenId));
        buchungenCount = buchungenResult[0]?.count || 0;
      }
      
      // Kosten pro Buchung
      const kostenProBuchung = buchungenCount > 0 ? gesamtkosten / buchungenCount : 0;
      
      // Vermeidbarkeitsquote
      const vermeidbarkeitsquote = gesamtkosten > 0 ? (vermeidbareKosten / gesamtkosten) * 100 : 0;
      
      return {
        gesamtkosten,
        anzahlRechnungen: rechnungen.length,
        anzahlPositionen: positionen.length,
        kostenNachKategorie,
        vermeidbareKosten,
        vermeidbarNachUrsache,
        buchungenCount,
        kostenProBuchung,
        vermeidbarkeitsquote,
        // Empfehlungen basierend auf Analyse
        empfehlungen: generateEmpfehlungen(vermeidbarNachUrsache, vermeidbarkeitsquote),
      };
    }),

  // Jahresvergleich der Steuerberater-Kosten
  jahresvergleich: protectedProcedure
    .input(z.object({
      unternehmenId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const rechnungen = await db
        .select()
        .from(steuerberaterRechnungen)
        .where(eq(steuerberaterRechnungen.unternehmenId, input.unternehmenId))
        .orderBy(steuerberaterRechnungen.rechnungsdatum);
      
      // Nach Jahr gruppieren
      const nachJahr: Record<number, { kosten: number; anzahl: number }> = {};
      
      rechnungen.forEach(r => {
        const jahr = new Date(r.rechnungsdatum).getFullYear();
        if (!nachJahr[jahr]) {
          nachJahr[jahr] = { kosten: 0, anzahl: 0 };
        }
        nachJahr[jahr].kosten += parseFloat(r.bruttobetrag || "0");
        nachJahr[jahr].anzahl += 1;
      });
      
      return Object.entries(nachJahr)
        .map(([jahr, data]) => ({
          jahr: parseInt(jahr),
          kosten: data.kosten,
          anzahl: data.anzahl,
        }))
        .sort((a, b) => a.jahr - b.jahr);
    }),

  // Rechnungs-Statistiken für Dashboard
  rechnungenStatistiken: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const rechnungen = await db
        .select()
        .from(steuerberaterRechnungen)
        .where(eq(steuerberaterRechnungen.unternehmenId, input.unternehmenId));
      
      const gesamt = rechnungen.length;
      const offen = rechnungen.filter(r => r.status === "offen").length;
      const bezahlt = rechnungen.filter(r => r.status === "bezahlt").length;
      const gesamtBetrag = rechnungen.reduce((sum, r) => sum + parseFloat(r.bruttobetrag || "0"), 0);
      const offenerBetrag = rechnungen
        .filter(r => r.status === "offen")
        .reduce((sum, r) => sum + parseFloat(r.bruttobetrag || "0"), 0);
      
      // Aktuelles Jahr
      const aktuellesJahr = new Date().getFullYear();
      const rechnungenAktuellesJahr = rechnungen.filter(r => 
        new Date(r.rechnungsdatum).getFullYear() === aktuellesJahr
      );
      const kostenAktuellesJahr = rechnungenAktuellesJahr.reduce(
        (sum, r) => sum + parseFloat(r.bruttobetrag || "0"), 0
      );
      
      return {
        gesamt,
        offen,
        bezahlt,
        gesamtBetrag,
        offenerBetrag,
        kostenAktuellesJahr,
      };
    }),

  // Finanzamt-Dokument zu Übergabe hinzufügen
  addFinanzamtDokument: protectedProcedure
    .input(z.object({
      uebergabeId: z.number(),
      finanzamtDokumentId: z.number(),
      beschreibung: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Finanzamt-Dokument laden für Betrag
      const [dokument] = await db
        .select()
        .from(finanzamtDokumente)
        .where(eq(finanzamtDokumente.id, input.finanzamtDokumentId));
      
      if (!dokument) throw new Error("Finanzamt-Dokument nicht gefunden");
      
      await db.insert(steuerberaterUebergabePositionen).values({
        uebergabeId: input.uebergabeId,
        finanzamtDokumentId: input.finanzamtDokumentId,
        positionstyp: "finanzamt",
        beschreibung: input.beschreibung || `${dokument.dokumentTyp}: ${dokument.betreff}`,
        betrag: dokument.betrag || null,
        dateiUrl: dokument.dateiUrl || null,
        dateiName: dokument.dateiName || null,
      });
      
      return { success: true };
    }),

  // Offene Finanzamt-Dokumente für Steuerberater-Übergabe abrufen
  offeneFinanzamtDokumente: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Alle Finanzamt-Dokumente die noch nicht in einer Übergabe sind
      const alleDokumente = await db
        .select()
        .from(finanzamtDokumente)
        .where(eq(finanzamtDokumente.unternehmenId, input.unternehmenId))
        .orderBy(desc(finanzamtDokumente.eingangsdatum));
      
      // Bereits übergebene Dokumente
      const uebergebeneDokumente = await db
        .select({ finanzamtDokumentId: steuerberaterUebergabePositionen.finanzamtDokumentId })
        .from(steuerberaterUebergabePositionen)
        .where(sql`${steuerberaterUebergabePositionen.finanzamtDokumentId} IS NOT NULL`);
      
      const uebergebeneIds = new Set(uebergebeneDokumente.map(d => d.finanzamtDokumentId));
      
      return alleDokumente.filter(d => !uebergebeneIds.has(d.id));
    }),

  // Finanzamt-Dokumente einer Übergabe abrufen
  finanzamtDokumenteByUebergabe: protectedProcedure
    .input(z.object({ uebergabeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const positionen = await db
        .select({
          position: steuerberaterUebergabePositionen,
          dokument: finanzamtDokumente,
        })
        .from(steuerberaterUebergabePositionen)
        .leftJoin(finanzamtDokumente, eq(steuerberaterUebergabePositionen.finanzamtDokumentId, finanzamtDokumente.id))
        .where(and(
          eq(steuerberaterUebergabePositionen.uebergabeId, input.uebergabeId),
          eq(steuerberaterUebergabePositionen.positionstyp, "finanzamt")
        ));
      
      return positionen;
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

  // Steuerberater-Rechnung in Buchungen übernehmen
  rechnungInBuchungenUebernehmen: protectedProcedure
    .input(z.object({
      rechnungId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      console.log("[STB→BUCHUNG] 🚀 Starte Übernahme von Rechnung ID:", input.rechnungId);

      // Hole Rechnungsdetails
      const [rechnung] = await db
        .select()
        .from(steuerberaterRechnungen)
        .where(eq(steuerberaterRechnungen.id, input.rechnungId));

      if (!rechnung) {
        throw new Error("Rechnung nicht gefunden");
      }

      console.log("[STB→BUCHUNG] 📄 Rechnung gefunden:", {
        rechnungsnummer: rechnung.rechnungsnummer,
        bruttobetrag: rechnung.bruttobetrag,
        unternehmenId: rechnung.unternehmenId,
      });

      // Erstelle Buchung aus Rechnung
      // Sachkonto: 6827 (Buchführungskosten / Steuerberater - SKR04)
      // Personenkonto: 70000 (Kreditor-Konto - User kann es später anpassen)

      // Berechne Nettobetrag falls nicht vorhanden
      const nettobetrag = rechnung.nettobetrag
        ? parseFloat(rechnung.nettobetrag.toString())
        : parseFloat(rechnung.bruttobetrag.toString()) / (1 + parseFloat(rechnung.steuersatz.toString()) / 100);

      // 🔧 FIX: Unternehmen laden um wirtschaftsjahrBeginn zu bekommen
      const [company] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, rechnung.unternehmenId))
        .limit(1);

      if (!company) throw new Error("Unternehmen nicht gefunden");

      // 🔧 FIX: Wirtschaftsjahr und Periode aus Rechnungsdatum berechnen
      const belegdatum = new Date(rechnung.rechnungsdatum);
      const { wirtschaftsjahr, periode } = calculateWirtschaftsjahrPeriode(
        belegdatum,
        company.wirtschaftsjahrBeginn
      );

      console.log("[STB→BUCHUNG] 📅 Berechnete Periode:", { wirtschaftsjahr, periode, belegdatum: rechnung.rechnungsdatum, wirtschaftsjahrBeginn: company.wirtschaftsjahrBeginn });

      const [buchungResult] = await db.insert(buchungen).values({
        unternehmenId: rechnung.unternehmenId,
        buchungsart: "aufwand", // Steuerberaterrechnung ist Aufwand
        belegdatum: rechnung.rechnungsdatum,
        belegnummer: rechnung.rechnungsnummer,
        geschaeftspartnerTyp: "kreditor", // Steuerberater ist Kreditor
        geschaeftspartner: "Steuerberater",
        geschaeftspartnerKonto: "70000", // Placeholder - User kann anpassen
        sachkonto: "6827", // Buchführungskosten (SKR04)
        nettobetrag: nettobetrag.toFixed(2),
        steuersatz: rechnung.steuersatz,
        bruttobetrag: rechnung.bruttobetrag,
        buchungstext: `Steuerberater-Rechnung ${rechnung.rechnungsnummer}${rechnung.beschreibung ? ` - ${rechnung.beschreibung}` : ""}`,
        sollKonto: "6827", // Buchführungskosten (für doppelte Buchführung)
        habenKonto: "70000", // Kreditor (für doppelte Buchführung)
        status: "entwurf", // Buchung muss noch geprüft werden
        wirtschaftsjahr,  // 🔧 FIX: Jetzt korrekt berechnet
        periode,          // 🔧 FIX: Jetzt korrekt berechnet
      });

      const buchungId = Number(buchungResult.insertId);

      console.log("[STB→BUCHUNG] ✅ Buchung erstellt, ID:", buchungId);

      // Markiere Rechnung als "bezahlt" (optional - erstmal nicht)
      // await db
      //   .update(steuerberaterRechnungen)
      //   .set({ status: "bezahlt" })
      //   .where(eq(steuerberaterRechnungen.id, input.rechnungId));

      return {
        success: true,
        buchungId,
        message: `Rechnung ${rechnung.rechnungsnummer} wurde als Buchung übernommen`,
      };
    }),
});
