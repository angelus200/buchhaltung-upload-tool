import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { finanzierungen, finanzierungZahlungen, finanzierungDokumente, InsertFinanzierung, InsertFinanzierungZahlung, InsertFinanzierungDokument, buchungsvorlagen, InsertBuchungsvorlage } from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { uploadFinanzierungDokument, isStorageAvailable } from "./storage";
import { invokeLLM, type Message } from "./_core/llm";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

// SKR04-Konten für Finanzierungen
const SKR04_FINANZIERUNG_KONTEN = {
  kredit: {
    verbindlichkeitskonto: "0650", // Verbindlichkeiten gegenüber Kreditinstituten
    zinsaufwandskonto: "7300", // Zinsen und ähnliche Aufwendungen
    tilgungskonto: "0650", // Tilgung reduziert Verbindlichkeit
    beschreibung: "Kreditverbindlichkeiten und Zinsaufwand"
  },
  leasing: {
    aufwandskonto: "6520", // Leasingaufwendungen für bewegliche Wirtschaftsgüter
    verbindlichkeitskonto: "1576", // Geleistete Anzahlungen (falls Anzahlung)
    beschreibung: "Leasingaufwendungen"
  },
  mietkauf: {
    aufwandskonto: "6310", // Miete
    verbindlichkeitskonto: "0620", // Verbindlichkeiten aus Lieferungen und Leistungen
    beschreibung: "Mietkauf-Raten"
  },
  factoring: {
    aufwandskonto: "7380", // Sonstige Finanzierungsaufwendungen
    forderungskonto: "1200", // Bank (Auszahlung)
    beschreibung: "Factoring-Gebühren"
  },
};

/**
 * Analysiert ein Vertragsdokument (PDF/Bild) mit AI
 */
async function analyzeFinanzierungVertrag(
  documentBase64: string,
  mimeType: string
): Promise<{
  typ: "kredit" | "leasing" | "mietkauf" | "factoring" | null;
  kreditgeber: string | null;
  gesamtbetrag: number | null;
  zinssatz: number | null;
  vertragsBeginn: string | null; // YYYY-MM-DD
  vertragsEnde: string | null; // YYYY-MM-DD
  ratenBetrag: number | null;
  ratenTyp: "monatlich" | "quartal" | "halbjaehrlich" | "jaehrlich" | null;
  objektBezeichnung: string | null;
  vertragsnummer: string | null;
}> {
  // Wenn PDF, konvertiere zu Bild
  let imageBase64 = documentBase64;
  let imageMimeType = mimeType;

  if (mimeType === "application/pdf") {
    const { imageBase64: converted, mimeType: convertedType } = await convertPdfToImage(documentBase64);
    imageBase64 = converted;
    imageMimeType = convertedType;
  }

  const systemPrompt = `Du bist ein Experte für die Analyse von deutschen Finanzierungsverträgen (Kredite, Leasingverträge, Mietkaufverträge, Factoring).

Analysiere das Dokument und extrahiere folgende Informationen:

1. **Vertragstyp**: kredit, leasing, mietkauf, oder factoring
2. **Kreditgeber/Leasinggeber**: Name der Bank/Finanzierungsgesellschaft
3. **Gesamtbetrag**: Kreditbetrag oder Leasingsumme in EUR
4. **Zinssatz**: Effektiver Jahreszins in Prozent (z.B. 3.5)
5. **Vertragsbeginn**: Startdatum (YYYY-MM-DD)
6. **Vertragsende**: Enddatum (YYYY-MM-DD)
7. **Ratenbetrag**: Höhe der Rate/Monatsrate in EUR
8. **Ratentyp**: monatlich, quartal, halbjaehrlich, oder jaehrlich
9. **Objektbezeichnung**: Was wird finanziert (z.B. "Mercedes Sprinter", "Maschinenpark")
10. **Vertragsnummer**: Vertragsnummer/Referenz

Antworte NUR mit einem JSON-Objekt:
{
  "typ": "kredit" | "leasing" | "mietkauf" | "factoring" | null,
  "kreditgeber": "string" | null,
  "gesamtbetrag": number | null,
  "zinssatz": number | null,
  "vertragsBeginn": "YYYY-MM-DD" | null,
  "vertragsEnde": "YYYY-MM-DD" | null,
  "ratenBetrag": number | null,
  "ratenTyp": "monatlich" | "quartal" | "halbjaehrlich" | "jaehrlich" | null,
  "objektBezeichnung": "string" | null,
  "vertragsnummer": "string" | null
}

Wichtig:
- Beträge als Dezimalzahlen mit Punkt (z.B. 50000.00)
- Zinssatz als Zahl (z.B. 3.5 für 3,5%)
- Datum immer YYYY-MM-DD
- Wenn ein Wert nicht erkennbar ist: null`;

  try {
    const messages: Message[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analysiere diesen Finanzierungsvertrag und extrahiere die Vertragsdaten:",
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
        ],
      },
    ];

    const response = await invokeLLM(messages, {
      temperature: 0,
      max_tokens: 2000,
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Keine JSON-Antwort erhalten");
    }

    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error("Vertragsanalyse Fehler:", error);
    throw new Error(`Vertragsanalyse fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
  }
}

/**
 * Konvertiert PDF zu Bild (erste Seite)
 */
async function convertPdfToImage(pdfBase64: string): Promise<{ imageBase64: string; mimeType: string }> {
  const tmpDir = os.tmpdir();
  const pdfPath = path.join(tmpDir, `pdf_${Date.now()}.pdf`);
  const imgPath = path.join(tmpDir, `pdf_${Date.now()}.jpg`);

  try {
    // Schreibe PDF in temporäre Datei
    fs.writeFileSync(pdfPath, Buffer.from(pdfBase64, "base64"));

    // Konvertiere mit pdftoppm (Teil von poppler-utils)
    await execAsync(`pdftoppm -jpeg -f 1 -l 1 -scale-to 2000 "${pdfPath}" "${imgPath.replace(".jpg", "")}"`);

    // Lese konvertiertes Bild
    const imgFiles = fs.readdirSync(tmpDir).filter(f => f.startsWith(path.basename(imgPath.replace(".jpg", ""))) && f.endsWith(".jpg"));
    if (imgFiles.length === 0) {
      throw new Error("PDF-Konvertierung fehlgeschlagen");
    }

    const finalImgPath = path.join(tmpDir, imgFiles[0]);
    const imgBuffer = fs.readFileSync(finalImgPath);
    const imageBase64 = imgBuffer.toString("base64");

    // Cleanup
    fs.unlinkSync(pdfPath);
    fs.unlinkSync(finalImgPath);

    return { imageBase64, mimeType: "image/jpeg" };
  } catch (error) {
    // Cleanup bei Fehler
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    throw error;
  }
}

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
    .input(z.object({ id: z.number(), unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [finanzierung] = await db
        .select()
        .from(finanzierungen)
        .where(
          and(
            eq(finanzierungen.id, input.id),
            eq(finanzierungen.unternehmenId, input.unternehmenId)
          )
        )
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
        unternehmenId: z.number(),
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
        .where(
          and(
            eq(finanzierungen.id, input.id),
            eq(finanzierungen.unternehmenId, input.unternehmenId)
          )
        );

      return { success: true };
    }),

  /**
   * Finanzierung löschen
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number(), unternehmenId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Prüfe ob Finanzierung existiert und zum Unternehmen gehört
      const [finanzierung] = await db
        .select()
        .from(finanzierungen)
        .where(
          and(
            eq(finanzierungen.id, input.id),
            eq(finanzierungen.unternehmenId, input.unternehmenId)
          )
        )
        .limit(1);

      if (!finanzierung) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Finanzierung nicht gefunden" });
      }

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
    .input(z.object({ finanzierungId: z.number(), unternehmenId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Finanzierung laden
      const [finanzierung] = await db
        .select()
        .from(finanzierungen)
        .where(
          and(
            eq(finanzierungen.id, input.finanzierungId),
            eq(finanzierungen.unternehmenId, input.unternehmenId)
          )
        )
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

  /**
   * Dokument hochladen
   */
  uploadDokument: protectedProcedure
    .input(
      z.object({
        finanzierungId: z.number(),
        unternehmenId: z.number(),
        dateiName: z.string(),
        dateiBase64: z.string(),
        contentType: z.string(),
        beschreibung: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Prüfe ob Finanzierung zum Unternehmen gehört
      const [finanzierung] = await db
        .select()
        .from(finanzierungen)
        .where(
          and(
            eq(finanzierungen.id, input.finanzierungId),
            eq(finanzierungen.unternehmenId, input.unternehmenId)
          )
        )
        .limit(1);

      if (!finanzierung) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Finanzierung nicht gefunden" });
      }

      // Prüfe ob Storage verfügbar ist
      if (!isStorageAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Dokument-Speicher nicht verfügbar",
        });
      }

      // Konvertiere Base64 zu Buffer
      const buffer = Buffer.from(input.dateiBase64, "base64");

      // Speichere Datei im Volume
      const result = await uploadFinanzierungDokument(
        buffer,
        input.dateiName,
        input.unternehmenId,
        input.finanzierungId
      );

      // Speichere Dokument-Metadaten in DB
      await db.insert(finanzierungDokumente).values({
        finanzierungId: input.finanzierungId,
        dateiUrl: result.url,
        dateiName: input.dateiName,
        dateityp: input.contentType,
        dateiGroesse: buffer.length,
        beschreibung: input.beschreibung,
        createdBy: ctx.user.id,
      } as InsertFinanzierungDokument);

      return {
        success: true,
        url: result.url,
        dateiName: input.dateiName,
      };
    }),

  /**
   * Dokumente einer Finanzierung abrufen
   */
  listDokumente: protectedProcedure
    .input(z.object({ finanzierungId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const dokumente = await db
        .select()
        .from(finanzierungDokumente)
        .where(eq(finanzierungDokumente.finanzierungId, input.finanzierungId))
        .orderBy(desc(finanzierungDokumente.createdAt));

      return dokumente;
    }),

  /**
   * Dokument löschen
   */
  deleteDokument: protectedProcedure
    .input(z.object({ dokumentId: z.number(), unternehmenId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Prüfe ob Dokument existiert und Finanzierung zum Unternehmen gehört
      const [dokument] = await db
        .select({
          dokument: finanzierungDokumente,
          finanzierung: finanzierungen,
        })
        .from(finanzierungDokumente)
        .innerJoin(finanzierungen, eq(finanzierungDokumente.finanzierungId, finanzierungen.id))
        .where(
          and(
            eq(finanzierungDokumente.id, input.dokumentId),
            eq(finanzierungen.unternehmenId, input.unternehmenId)
          )
        )
        .limit(1);

      if (!dokument) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dokument nicht gefunden" });
      }

      await db.delete(finanzierungDokumente).where(eq(finanzierungDokumente.id, input.dokumentId));

      return { success: true };
    }),

  /**
   * Vertragsdokument mit AI analysieren
   */
  analyzeVertrag: protectedProcedure
    .input(
      z.object({
        documentBase64: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await analyzeFinanzierungVertrag(input.documentBase64, input.mimeType);

        // SKR04-Konten vorschlagen basierend auf Typ
        let kontenVorschlag = null;
        if (result.typ) {
          kontenVorschlag = SKR04_FINANZIERUNG_KONTEN[result.typ];
        }

        return {
          ...result,
          kontenVorschlag,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Vertragsanalyse fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        });
      }
    }),

  /**
   * SKR04-Konten für Finanzierungstyp vorschlagen
   */
  getKontenVorschlag: protectedProcedure
    .input(
      z.object({
        typ: z.enum(["kredit", "leasing", "mietkauf", "factoring"]),
      })
    )
    .query(async ({ input }) => {
      return SKR04_FINANZIERUNG_KONTEN[input.typ];
    }),

  /**
   * Buchungsvorlage für Finanzierung erstellen
   */
  createBuchungsvorlage: protectedProcedure
    .input(
      z.object({
        finanzierungId: z.number(),
        unternehmenId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Finanzierung laden
      const [finanzierung] = await db
        .select()
        .from(finanzierungen)
        .where(
          and(
            eq(finanzierungen.id, input.finanzierungId),
            eq(finanzierungen.unternehmenId, input.unternehmenId)
          )
        )
        .limit(1);

      if (!finanzierung) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Finanzierung nicht gefunden" });
      }

      const konten = SKR04_FINANZIERUNG_KONTEN[finanzierung.typ];

      // Erstelle Buchungsvorlage basierend auf Typ
      let vorlagenName = "";
      let sollKonto = "";
      let habenKonto = "";
      let buchungstext = "";

      if (finanzierung.typ === "kredit") {
        vorlagenName = `${finanzierung.bezeichnung} - Rate`;
        sollKonto = konten.zinsaufwandskonto; // Zinsaufwand
        habenKonto = "1200"; // Bank
        buchungstext = `Kreditrate ${finanzierung.bezeichnung}`;
      } else if (finanzierung.typ === "leasing") {
        vorlagenName = `${finanzierung.bezeichnung} - Leasingrate`;
        sollKonto = konten.aufwandskonto; // Leasingaufwand
        habenKonto = "1200"; // Bank
        buchungstext = `Leasingrate ${finanzierung.bezeichnung}`;
      } else if (finanzierung.typ === "mietkauf") {
        vorlagenName = `${finanzierung.bezeichnung} - Rate`;
        sollKonto = konten.aufwandskonto; // Mietaufwand
        habenKonto = "1200"; // Bank
        buchungstext = `Mietkaufrate ${finanzierung.bezeichnung}`;
      } else {
        // Factoring
        vorlagenName = `${finanzierung.bezeichnung} - Gebühr`;
        sollKonto = konten.aufwandskonto; // Factoring-Gebühr
        habenKonto = "1200"; // Bank
        buchungstext = `Factoring-Gebühr ${finanzierung.bezeichnung}`;
      }

      // Vorlage in DB erstellen
      await db.insert(buchungsvorlagen).values({
        unternehmenId: input.unternehmenId,
        name: vorlagenName,
        sollKonto,
        habenKonto,
        buchungstext,
        betrag: finanzierung.ratenBetrag.toString(),
        ustSatz: "0", // Finanzierungskosten sind in der Regel nicht umsatzsteuerpflichtig
        kategorie: finanzierung.typ,
      } as InsertBuchungsvorlage);

      return {
        success: true,
        vorlagenName,
        sollKonto,
        habenKonto,
      };
    }),
});
