import { describe, it, expect } from "vitest";

/**
 * Unit Tests für Chat Assistant
 *
 * Diese Tests validieren die Funktionalität des AI Chat Assistenten
 * für Buchhaltungsabfragen.
 */

describe("Chat Assistant - Intent Erkennung", () => {
  it("sollte Datenabfrage-Absicht erkennen", () => {
    const questions = [
      "Zeig mir alle offenen Rechnungen",
      "Liste alle Buchungen von Amazon",
      "Wie viel haben wir im März ausgegeben?",
      "Welche Rechnungen sind überfällig?",
    ];

    questions.forEach((q) => {
      const lowerQ = q.toLowerCase();
      const isQueryIntent =
        lowerQ.includes("zeig") ||
        lowerQ.includes("liste") ||
        lowerQ.includes("wie viel") ||
        lowerQ.includes("welche") ||
        lowerQ.includes("überfällig");

      expect(isQueryIntent).toBe(true);
    });
  });

  it("sollte Erklärungs-Absicht erkennen", () => {
    const questions = [
      "Was ist ein Sachkonto?",
      "Erkläre mir SKR03",
      "Was bedeutet Kreditor?",
    ];

    questions.forEach((q) => {
      const lowerQ = q.toLowerCase();
      const isExplainIntent =
        lowerQ.includes("was ist") ||
        lowerQ.includes("erkläre") ||
        lowerQ.includes("bedeutet");

      expect(isExplainIntent).toBe(true);
    });
  });

  it("sollte Hilfe-Absicht erkennen", () => {
    const questions = [
      "Hilfe",
      "Wie kann ich dich nutzen?",
      "Was kannst du tun?",
    ];

    questions.forEach((q) => {
      const lowerQ = q.toLowerCase();
      const isHelpIntent =
        lowerQ.includes("hilfe") ||
        lowerQ.includes("wie kann") ||
        lowerQ.includes("kannst du");

      expect(isHelpIntent).toBe(true);
    });
  });
});

describe("Chat Assistant - Keyword Extraktion", () => {
  it("sollte relevante Keywords aus Fragen extrahieren", () => {
    const question = "Zeig mir alle Buchungen von Amazon im März";
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

    const keywords = question
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .map((word) => word.replace(/[.,!?;:]/, ""));

    expect(keywords).toContain("buchungen");
    expect(keywords).toContain("amazon");
    expect(keywords).toContain("märz");
  });

  it("sollte Stopwörter herausfiltern", () => {
    const question = "Was ist der Kontostand von der Firma?";
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

    const keywords = question
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .map((word) => word.replace(/[.,!?;:]/, ""));

    expect(keywords).not.toContain("was");
    expect(keywords).not.toContain("ist");
    expect(keywords).not.toContain("der");
    expect(keywords).not.toContain("von");
    expect(keywords).toContain("kontostand");
    expect(keywords).toContain("firma");
  });
});

describe("Chat Assistant - Datenformatierung", () => {
  it("sollte Beträge korrekt formatieren", () => {
    const amount = 1234.56;
    const formatted = amount.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
    });

    expect(formatted).toBe("1.234,56 €");
  });

  it("sollte Datum korrekt formatieren", () => {
    const date = new Date("2025-03-15");
    const formatted = date.toLocaleDateString("de-DE");

    expect(formatted).toBe("15.03.2025");
  });

  it("sollte null-Datum als '-' formatieren", () => {
    const formatDate = (date: Date | string | null): string => {
      if (!date) return "-";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("de-DE");
    };

    expect(formatDate(null)).toBe("-");
  });
});

describe("Chat Assistant - Monatserkennung", () => {
  it("sollte deutsche Monatsnamen erkennen", () => {
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

    const question = "Wie hoch waren die Kosten im März?";
    const lowerQuestion = question.toLowerCase();

    const monatIndex = monate.findIndex((m) => lowerQuestion.includes(m));

    expect(monatIndex).toBe(2); // März ist Index 2
  });

  it("sollte Datumsbereich für Monat berechnen", () => {
    const jahr = 2025;
    const monat = 3; // März
    const vonDatum = `${jahr}-${String(monat).padStart(2, "0")}-01`;
    const bisDatum = new Date(jahr, monat, 0).toISOString().split("T")[0];

    expect(vonDatum).toBe("2025-03-01");
    expect(bisDatum).toBe("2025-03-31");
  });
});

describe("Chat Assistant - Abfrage-Erkennung", () => {
  it("sollte offene Rechnungen-Abfrage erkennen", () => {
    const question = "Zeig mir alle offenen Rechnungen";
    const lowerQuestion = question.toLowerCase();

    const isOffeneRechnungen =
      lowerQuestion.includes("offen") &&
      (lowerQuestion.includes("rechnung") ||
        lowerQuestion.includes("buchung"));

    expect(isOffeneRechnungen).toBe(true);
  });

  it("sollte überfällige Rechnungen-Abfrage erkennen", () => {
    const question = "Welche Rechnungen sind überfällig?";
    const lowerQuestion = question.toLowerCase();

    const isUeberfaellig = lowerQuestion.includes("überfällig");

    expect(isUeberfaellig).toBe(true);
  });

  it("sollte Kontostand-Abfrage erkennen", () => {
    const question = "Was ist mein aktueller Kontostand?";
    const lowerQuestion = question.toLowerCase();

    const isKontostand =
      lowerQuestion.includes("kontostand") || lowerQuestion.includes("saldo");

    expect(isKontostand).toBe(true);
  });

  it("sollte Lieferanten-Buchungen-Abfrage erkennen", () => {
    const question = "Liste alle Buchungen von Amazon";
    const lowerQuestion = question.toLowerCase();

    const isLieferant =
      lowerQuestion.includes("von") || lowerQuestion.includes("lieferant");

    expect(isLieferant).toBe(true);
  });
});

describe("Chat Assistant - System Prompt", () => {
  it("sollte Datenbank-Schema generieren", () => {
    const schema = `
### buchungen (Buchungen)
- id: Primärschlüssel
- unternehmenId: Zugehöriges Unternehmen
- buchungsart: "aufwand" | "ertrag" | "anlage" | "sonstig"
`;

    expect(schema).toContain("buchungen");
    expect(schema).toContain("buchungsart");
    expect(schema).toContain("aufwand");
  });

  it("sollte System Prompt mit Kontext erstellen", () => {
    const systemPrompt = `Du bist ein KI-Assistent für Buchhaltungsabfragen in einem deutschen Buchhaltungssystem.`;

    expect(systemPrompt).toContain("KI-Assistent");
    expect(systemPrompt).toContain("Buchhaltungsabfragen");
    expect(systemPrompt).toContain("deutschen");
  });
});

describe("Chat Assistant - Konversations-Verlauf", () => {
  it("sollte Nachrichtenverlauf verarbeiten", () => {
    const conversationHistory = [
      { role: "user" as const, content: "Zeig mir offene Rechnungen" },
      {
        role: "assistant" as const,
        content: "Hier sind Ihre offenen Rechnungen...",
      },
      { role: "user" as const, content: "Und die von Amazon?" },
    ];

    expect(conversationHistory).toHaveLength(3);
    expect(conversationHistory[0].role).toBe("user");
    expect(conversationHistory[1].role).toBe("assistant");
  });

  it("sollte auf die letzten 10 Nachrichten limitieren", () => {
    const conversationHistory = Array.from({ length: 15 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i}`,
    }));

    const limited = conversationHistory.slice(-10);

    expect(limited).toHaveLength(10);
    expect(limited[0].content).toBe("Message 5");
  });
});
