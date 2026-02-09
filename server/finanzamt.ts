import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { finanzamtDokumente, aufgaben, finanzamtDokumentVersionen, type FinanzamtDokument, type FinanzamtDokumentVersion } from "../drizzle/schema";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";
import { uploadBelegLocal } from "./storage";

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

  // Datei zu S3 hochladen
  uploadDatei: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        dateiName: z.string(),
        dateiBase64: z.string(), // Base64-kodierte Datei
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Konvertiere Base64 zu Buffer
      const base64Data = input.dateiBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Upload zum lokalen Storage (Finanzamt-Ordner)
      // Verwende "finanzamt_" Prefix für eindeutige Identifikation
      const prefixedFilename = `finanzamt_${input.dateiName}`;
      const result = await uploadBelegLocal(buffer, prefixedFilename, input.unternehmenId);

      return {
        url: result.url,
        path: result.path,
        dateiName: input.dateiName,
      };
    }),

  // ============================================
  // DOKUMENTEN-VERSIONIERUNG
  // ============================================

  // Versionen eines Dokuments abrufen
  versionen: protectedProcedure
    .input(z.object({ dokumentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(finanzamtDokumentVersionen)
        .where(eq(finanzamtDokumentVersionen.dokumentId, input.dokumentId))
        .orderBy(asc(finanzamtDokumentVersionen.version));
    }),

  // Neue Version hinzufügen
  addVersion: protectedProcedure
    .input(
      z.object({
        dokumentId: z.number(),
        versionTyp: z.enum(["original", "einspruch", "antwort", "ergaenzung", "korrektur", "anlage"]),
        betreff: z.string().optional(),
        beschreibung: z.string().optional(),
        datum: z.string(),
        dateiUrl: z.string().optional(),
        dateiName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Nächste Versionsnummer ermitteln
      const existingVersions = await db
        .select()
        .from(finanzamtDokumentVersionen)
        .where(eq(finanzamtDokumentVersionen.dokumentId, input.dokumentId));

      const nextVersion = existingVersions.length + 1;

      const [result] = await db.insert(finanzamtDokumentVersionen).values({
        dokumentId: input.dokumentId,
        version: nextVersion,
        versionTyp: input.versionTyp,
        betreff: input.betreff || null,
        beschreibung: input.beschreibung || null,
        datum: new Date(input.datum),
        dateiUrl: input.dateiUrl || null,
        dateiName: input.dateiName || null,
        erstelltVon: ctx.user?.id || null,
      });

      return { id: result.insertId, version: nextVersion };
    }),

  // Version löschen
  deleteVersion: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db
        .delete(finanzamtDokumentVersionen)
        .where(eq(finanzamtDokumentVersionen.id, input.id));

      return { success: true };
    }),

  // ============================================
  // OCR FÜR FINANZAMT-DOKUMENTE
  // ============================================

  // OCR-Analyse eines Dokuments
  ocrAnalyse: protectedProcedure
    .input(
      z.object({
        dateiBase64: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[FINANZAMT-OCR] 🚀 Starte OCR-Analyse...");
      console.log("[FINANZAMT-OCR] 📄 ContentType:", input.contentType);

      // Verwende die richtige Anthropic API
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        console.error("[FINANZAMT-OCR] ❌ ANTHROPIC_API_KEY nicht konfiguriert!");
        // ⚠️ WICHTIG: Nicht werfen, sondern leere Werte zurückgeben
        // So kann der User trotzdem manuell eingeben!
        return {
          dokumentTyp: null,
          steuerart: null,
          aktenzeichen: null,
          steuerjahr: null,
          betreff: null,
          betrag: null,
          frist: null,
          zahlungsfrist: null,
          eingangsdatum: null,
          zusammenfassung: null,
          fehler: "OCR-Service ist aktuell nicht verfügbar. Bitte Daten manuell eingeben.",
        };
      }

      try {
        // Importiere Anthropic SDK
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const anthropic = new Anthropic({ apiKey });

        // Entferne data:image/...-Prefix falls vorhanden
        const base64Data = input.dateiBase64.replace(/^data:[^;]+;base64,/, "");

        const systemPrompt = `Du bist ein Experte für die OCR-Analyse von deutschen Finanzamt-Dokumenten (Steuerbescheide, Mahnungen, Einsprüche).

Analysiere das Dokument und extrahiere folgende Informationen:

**Dokumenttyp** (dokumentTyp):
- "bescheid" = Steuerbescheid, Festsetzung
- "einspruch" = Einspruch gegen Bescheid
- "mahnung" = Zahlungserinnerung, Mahnung
- "anfrage" = Anfrage, Auskunftsersuchen
- "pruefung" = Betriebsprüfung, Außenprüfung
- "schriftverkehr" = Allgemeiner Schriftverkehr
- "sonstiges" = Sonstiges

**Steuerart** (steuerart):
- "USt" = Umsatzsteuer
- "ESt" = Einkommensteuer
- "KSt" = Körperschaftsteuer
- "GewSt" = Gewerbesteuer
- "LSt" = Lohnsteuer
- "KapESt" = Kapitalertragsteuer
- "sonstige" = Sonstige

**Wichtige Felder:**
- aktenzeichen: Steuernummer, Aktenzeichen (z.B. "123/456/78901", "St.-Nr. 12345")
- steuerjahr: Betroffenes Steuerjahr als Zahl (z.B. 2024)
- betreff: Kurzer Betreff (z.B. "Umsatzsteuerbescheid 2024")
- betrag: Nachzahlung/Erstattung als Zahl ohne Währungssymbol
- frist: Einspruchsfrist oder sonstige Frist im Format YYYY-MM-DD
- zahlungsfrist: Zahlungsfrist im Format YYYY-MM-DD
- eingangsdatum: Datum des Dokuments (meist oben rechts) im Format YYYY-MM-DD
- zusammenfassung: Kurze Zusammenfassung (1-2 Sätze)

## OUTPUT FORMAT

Antworte NUR mit diesem JSON-Objekt (keine zusätzlichen Texte):

{
  "dokumentTyp": "bescheid" | "einspruch" | "mahnung" | "anfrage" | "pruefung" | "schriftverkehr" | "sonstiges",
  "steuerart": "USt" | "ESt" | "KSt" | "GewSt" | "LSt" | "KapESt" | "sonstige" | null,
  "aktenzeichen": "123/456/78901" | null,
  "steuerjahr": 2024 | null,
  "betreff": "Umsatzsteuerbescheid 2024" | null,
  "betrag": 1234.56 | null,
  "frist": "2025-02-15" | null,
  "zahlungsfrist": "2025-03-01" | null,
  "eingangsdatum": "2025-01-15" | null,
  "zusammenfassung": "Kurze Beschreibung..." | null
}`;

        console.log("[FINANZAMT-OCR] 📤 Sende Anfrage an Claude Vision API...");

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: input.contentType.includes("pdf")
                      ? "image/png" // PDFs werden zu PNG konvertiert
                      : (input.contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp"),
                    data: base64Data,
                  },
                },
                {
                  type: "text",
                  text: "Analysiere dieses Finanzamt-Dokument und extrahiere die Daten als JSON:",
                },
              ],
            },
          ],
        });

        console.log("[FINANZAMT-OCR] ✅ Claude Response erhalten");

        // Extract text from Claude response
        const textContent = message.content.find((block) => block.type === "text");
        if (!textContent || textContent.type !== "text") {
          console.error("[FINANZAMT-OCR] ❌ Keine Text-Antwort von Claude");
          throw new Error("Keine Text-Antwort von Claude erhalten");
        }

        const content = textContent.text;
        console.log("[FINANZAMT-OCR] 📝 Raw Content (erste 300 Zeichen):", content.substring(0, 300));

        // Parse JSON aus der Antwort
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("[FINANZAMT-OCR] ❌ Kein JSON gefunden in:", content);
          return {
            dokumentTyp: null,
            steuerart: null,
            aktenzeichen: null,
            steuerjahr: null,
            betreff: null,
            betrag: null,
            frist: null,
            zahlungsfrist: null,
            eingangsdatum: null,
            zusammenfassung: null,
            rohtext: content,
          };
        }

        console.log("[FINANZAMT-OCR] 🔍 JSON Match gefunden");
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("[FINANZAMT-OCR] ✅ JSON geparsed:", JSON.stringify(parsed, null, 2));

        return {
          dokumentTyp: parsed.dokumentTyp || null,
          steuerart: parsed.steuerart || null,
          aktenzeichen: parsed.aktenzeichen || null,
          steuerjahr: parsed.steuerjahr || null,
          betreff: parsed.betreff || null,
          betrag: parsed.betrag || null,
          frist: parsed.frist || null,
          zahlungsfrist: parsed.zahlungsfrist || null,
          eingangsdatum: parsed.eingangsdatum || null,
          zusammenfassung: parsed.zusammenfassung || null,
          rohtext: null,
        };
      } catch (error) {
        console.error("[FINANZAMT-OCR] ❌ OCR-Fehler:", error);
        console.error("[FINANZAMT-OCR] ❌ Error Stack:", error instanceof Error ? error.stack : "No stack");

        // ⚠️ WICHTIG: Nicht werfen, sondern leere Werte mit Fehlermeldung zurückgeben
        // So kann der User trotzdem manuell eingeben!
        return {
          dokumentTyp: null,
          steuerart: null,
          aktenzeichen: null,
          steuerjahr: null,
          betreff: null,
          betrag: null,
          frist: null,
          zahlungsfrist: null,
          eingangsdatum: null,
          zusammenfassung: null,
          fehler: error instanceof Error ? error.message : "OCR-Analyse fehlgeschlagen. Bitte Daten manuell eingeben.",
        };
      }
    }),
});

export type FinanzamtRouter = typeof finanzamtRouter;
