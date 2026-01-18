import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  queryClaude,
  createAccountingSystemPrompt,
  generateDatabaseSchema,
  type ClaudeMessage,
} from "./_core/claude";
import { buchungen, kreditoren, debitoren, sachkonten, unternehmen } from "../drizzle/schema";
import { eq, and, gte, lte, like, desc, sql } from "drizzle-orm";

// ============================================
// CHAT ASSISTANT - AI-basierter Buchhaltungs-Assistent
// ============================================

/**
 * Analysiert die Benutzerabfrage und extrahiert Absicht
 */
async function analyzeUserIntent(question: string): Promise<{
  intent: "query_data" | "explain" | "help" | "general";
  keywords: string[];
  dateRange?: { from?: string; to?: string };
  amount?: number;
}> {
  // Einfache Keyword-Extraktion für häufige Abfragen
  const lowerQuestion = question.toLowerCase();

  // Prüfe auf Datenabfrage-Absicht
  if (
    lowerQuestion.includes("zeig") ||
    lowerQuestion.includes("liste") ||
    lowerQuestion.includes("wie viel") ||
    lowerQuestion.includes("wie hoch") ||
    lowerQuestion.includes("wer") ||
    lowerQuestion.includes("welche") ||
    lowerQuestion.includes("überfällig")
  ) {
    return {
      intent: "query_data",
      keywords: extractKeywords(question),
    };
  }

  // Prüfe auf Erklärungs-Absicht
  if (
    lowerQuestion.includes("was ist") ||
    lowerQuestion.includes("erkläre") ||
    lowerQuestion.includes("bedeutet")
  ) {
    return {
      intent: "explain",
      keywords: extractKeywords(question),
    };
  }

  // Prüfe auf Hilfe-Absicht
  if (
    lowerQuestion.includes("hilfe") ||
    lowerQuestion.includes("wie kann") ||
    lowerQuestion.includes("kannst du")
  ) {
    return {
      intent: "help",
      keywords: [],
    };
  }

  return {
    intent: "general",
    keywords: extractKeywords(question),
  };
}

/**
 * Extrahiert relevante Keywords aus der Frage
 */
function extractKeywords(question: string): string[] {
  const stopWords = [
    "der",
    "die",
    "das",
    "und",
    "oder",
    "in",
    "von",
    "zu",
    "mit",
    "für",
    "ist",
    "sind",
    "war",
    "waren",
    "ein",
    "eine",
    "mir",
    "mich",
    "alle",
    "zeig",
    "liste",
    "wie",
    "was",
    "wer",
    "welche",
  ];

  return question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .map((word) => word.replace(/[.,!?;:]/, ""));
}

/**
 * Führt eine Datenbankabfrage basierend auf der Benutzerabsicht aus
 */
async function executeDataQuery(
  unternehmenId: number,
  intent: any,
  question: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");

  const lowerQuestion = question.toLowerCase();

  // Offene Rechnungen
  if (
    lowerQuestion.includes("offen") &&
    (lowerQuestion.includes("rechnung") || lowerQuestion.includes("buchung"))
  ) {
    const offeneBuchungen = await db
      .select()
      .from(buchungen)
      .where(
        and(
          eq(buchungen.unternehmenId, unternehmenId),
          eq(buchungen.zahlungsstatus, "offen")
        )
      )
      .orderBy(desc(buchungen.belegdatum))
      .limit(20);

    if (offeneBuchungen.length === 0) {
      return "Es gibt aktuell keine offenen Rechnungen.";
    }

    const total = offeneBuchungen.reduce(
      (sum, b) => sum + parseFloat(b.bruttobetrag || "0"),
      0
    );

    return `**Offene Rechnungen (${offeneBuchungen.length} Stück, Gesamtbetrag: ${formatCurrency(total)})**\n\n${offeneBuchungen
      .map(
        (b) =>
          `- ${b.belegnummer} | ${b.geschaeftspartner} | ${formatCurrency(parseFloat(b.bruttobetrag || "0"))} | Fällig: ${formatDate(b.faelligkeitsdatum)}`
      )
      .join("\n")}`;
  }

  // Überfällige Rechnungen
  if (lowerQuestion.includes("überfällig")) {
    const heute = new Date().toISOString().split("T")[0];
    const ueberfaellig = await db
      .select()
      .from(buchungen)
      .where(
        and(
          eq(buchungen.unternehmenId, unternehmenId),
          eq(buchungen.zahlungsstatus, "offen"),
          lte(buchungen.faelligkeitsdatum, heute)
        )
      )
      .orderBy(buchungen.faelligkeitsdatum)
      .limit(20);

    if (ueberfaellig.length === 0) {
      return "Es gibt aktuell keine überfälligen Rechnungen. Gut gemacht! 🎉";
    }

    const total = ueberfaellig.reduce(
      (sum, b) => sum + parseFloat(b.bruttobetrag || "0"),
      0
    );

    return `**⚠️ Überfällige Rechnungen (${ueberfaellig.length} Stück, Gesamtbetrag: ${formatCurrency(total)})**\n\n${ueberfaellig
      .map(
        (b) =>
          `- ${b.belegnummer} | ${b.geschaeftspartner} | ${formatCurrency(parseFloat(b.bruttobetrag || "0"))} | Seit: ${formatDate(b.faelligkeitsdatum)}`
      )
      .join("\n")}`;
  }

  // Buchungen nach Lieferant/Geschäftspartner
  if (lowerQuestion.includes("von") || lowerQuestion.includes("lieferant")) {
    const keywords = intent.keywords;
    const partnerKeyword = keywords.find(
      (k: string) =>
        k.length > 3 &&
        !["buchung", "rechnung", "liste", "zeig", "alle"].includes(k)
    );

    if (partnerKeyword) {
      const partnerBuchungen = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, unternehmenId),
            like(buchungen.geschaeftspartner, `%${partnerKeyword}%`)
          )
        )
        .orderBy(desc(buchungen.belegdatum))
        .limit(20);

      if (partnerBuchungen.length === 0) {
        return `Keine Buchungen für "${partnerKeyword}" gefunden.`;
      }

      const total = partnerBuchungen.reduce(
        (sum, b) => sum + parseFloat(b.bruttobetrag || "0"),
        0
      );

      return `**Buchungen von/mit "${partnerKeyword}" (${partnerBuchungen.length} Stück, Gesamtbetrag: ${formatCurrency(total)})**\n\n${partnerBuchungen
        .map(
          (b) =>
            `- ${formatDate(b.belegdatum)} | ${b.belegnummer} | ${b.geschaeftspartner} | ${formatCurrency(parseFloat(b.bruttobetrag || "0"))}`
        )
        .join("\n")}`;
    }
  }

  // Kosten/Ausgaben nach Monat oder Zeitraum
  if (
    (lowerQuestion.includes("kosten") || lowerQuestion.includes("ausgaben")) &&
    (lowerQuestion.includes("monat") || lowerQuestion.includes("im"))
  ) {
    // Versuche Monatsnamen zu erkennen
    const monate = [
      "januar",
      "februar",
      "märz",
      "april",
      "mai",
      "juni",
      "juli",
      "august",
      "september",
      "oktober",
      "november",
      "dezember",
    ];
    const monatIndex = monate.findIndex((m) => lowerQuestion.includes(m));

    if (monatIndex >= 0) {
      const jahr = new Date().getFullYear();
      const monat = monatIndex + 1;
      const vonDatum = `${jahr}-${String(monat).padStart(2, "0")}-01`;
      const bisDatum = new Date(jahr, monat, 0).toISOString().split("T")[0];

      const kosten = await db
        .select({
          summe: sql<number>`SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)))`,
          anzahl: sql<number>`COUNT(*)`,
        })
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, unternehmenId),
            eq(buchungen.buchungsart, "aufwand"),
            gte(buchungen.belegdatum, vonDatum),
            lte(buchungen.belegdatum, bisDatum)
          )
        );

      const summe = kosten[0]?.summe || 0;
      const anzahl = kosten[0]?.anzahl || 0;

      return `**Kosten im ${monate[monatIndex].charAt(0).toUpperCase() + monate[monatIndex].slice(1)} ${jahr}**\n\nGesamtkosten: ${formatCurrency(Number(summe))}\nAnzahl Buchungen: ${anzahl}`;
    }
  }

  // Kontostand (alle Buchungen summieren)
  if (lowerQuestion.includes("kontostand") || lowerQuestion.includes("saldo")) {
    const einnahmen = await db
      .select({
        summe: sql<number>`SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)))`,
      })
      .from(buchungen)
      .where(
        and(
          eq(buchungen.unternehmenId, unternehmenId),
          eq(buchungen.buchungsart, "ertrag")
        )
      );

    const ausgaben = await db
      .select({
        summe: sql<number>`SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)))`,
      })
      .from(buchungen)
      .where(
        and(
          eq(buchungen.unternehmenId, unternehmenId),
          eq(buchungen.buchungsart, "aufwand")
        )
      );

    const einnahmenTotal = Number(einnahmen[0]?.summe || 0);
    const ausgabenTotal = Number(ausgaben[0]?.summe || 0);
    const saldo = einnahmenTotal - ausgabenTotal;

    return `**Finanzieller Überblick**\n\n✅ Einnahmen (Erträge): ${formatCurrency(einnahmenTotal)}\n❌ Ausgaben (Aufwendungen): ${formatCurrency(ausgabenTotal)}\n\n**Saldo: ${formatCurrency(saldo)}**`;
  }

  // Fallback: Keine spezifische Abfrage erkannt
  return "Ich konnte keine passende Datenbankabfrage für Ihre Frage erstellen. Bitte versuchen Sie es mit einer konkreteren Frage.";
}

/**
 * Formatiert ein Datum im deutschen Format
 */
function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE");
}

/**
 * Formatiert einen Betrag als Währung
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

// ============================================
// TRPC ROUTER
// ============================================

export const chatAssistantRouter = router({
  /**
   * Hauptendpunkt für Chat-Abfragen
   */
  query: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1, "Frage darf nicht leer sein"),
        unternehmenId: z.number(),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { question, unternehmenId, conversationHistory = [] } = input;

      try {
        // 1. Analysiere Benutzerabsicht
        const intent = await analyzeUserIntent(question);

        // 2. Falls Datenabfrage: Hole Daten aus DB
        let dataContext = "";
        if (intent.intent === "query_data") {
          dataContext = await executeDataQuery(
            unternehmenId,
            intent,
            question
          );
        }

        // 3. Baue Nachrichtenverlauf auf
        const messages: ClaudeMessage[] = [
          ...conversationHistory.slice(-10), // Letzte 10 Nachrichten für Kontext
          {
            role: "user",
            content:
              dataContext.length > 0
                ? `${question}\n\nRelevante Daten aus der Datenbank:\n${dataContext}`
                : question,
          },
        ];

        // 4. Frage Claude API
        const systemPrompt = createAccountingSystemPrompt(
          generateDatabaseSchema()
        );

        const response = await queryClaude({
          messages,
          systemPrompt,
          maxTokens: 2048,
          temperature: 0.7,
        });

        return {
          success: true,
          answer: response.content,
          usage: response.usage,
          dataQueried: dataContext.length > 0,
        };
      } catch (error) {
        console.error("Chat Assistant Error:", error);
        throw new Error(
          `Fehler beim Verarbeiten Ihrer Anfrage: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
        );
      }
    }),

  /**
   * Gibt Hilfe-Informationen zurück
   */
  help: protectedProcedure.query(async () => {
    return {
      examples: [
        "Zeig mir alle offenen Rechnungen",
        "Welche Rechnungen sind überfällig?",
        "Liste alle Buchungen von Amazon",
        "Wie hoch waren die Kosten im März?",
        "Was ist mein aktueller Kontostand?",
        "Vergleiche die Ausgaben von Januar und Februar",
        "Erkläre mir was ein Sachkonto ist",
        "Zeig mir alle Buchungen von Lieferant XY",
      ],
      tips: [
        "Verwenden Sie konkrete Monatsnamen (z.B. 'im März')",
        "Nennen Sie spezifische Lieferanten- oder Kundennamen",
        "Fragen Sie nach Zeiträumen für bessere Vergleiche",
      ],
    };
  }),
});

export type ChatAssistantRouter = typeof chatAssistantRouter;
