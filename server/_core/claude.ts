import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";

// ============================================
// CLAUDE API SERVICE
// ============================================

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeQueryParams {
  messages: ClaudeMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!ENV.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ist nicht konfiguriert. Bitte setzen Sie die Environment Variable."
    );
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: ENV.anthropicApiKey,
    });
  }

  return anthropicClient;
}

/**
 * Sendet eine Anfrage an Claude API
 */
export async function queryClaude(
  params: ClaudeQueryParams
): Promise<ClaudeResponse> {
  const client = getAnthropicClient();

  const {
    messages,
    systemPrompt,
    maxTokens = 4096,
    temperature = 0.7,
  } = params;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Extract text content from response
    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n");

    return {
      content: textContent,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("Claude API Error:", error);
    throw new Error(
      `Claude API Fehler: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
    );
  }
}

/**
 * Erstellt einen System-Prompt für Buchhaltungs-Abfragen
 */
export function createAccountingSystemPrompt(
  databaseSchema: string
): string {
  return `Du bist ein KI-Assistent für Buchhaltungsabfragen in einem deutschen Buchhaltungssystem.

## Deine Aufgabe:
- Beantworte Fragen zu Buchungen, Finanzen und Buchhaltungsdaten
- Analysiere und erkläre Buchhaltungsdaten auf Deutsch
- Verwende deutsches Buchhaltungsvokabular (SKR03/SKR04)
- Sei präzise und professionell

## Verfügbare Datenbank-Tabellen:
${databaseSchema}

## Wichtige Regeln:
1. Antworten immer auf Deutsch
2. Verwende deutsche Datumsformate (DD.MM.YYYY)
3. Beträge mit Punkt als Tausendertrennzeichen und Komma als Dezimaltrennzeichen (z.B. 1.234,56 €)
4. Bei SQL-Abfragen: Nutze MySQL-Syntax
5. Erkläre Fachbegriffe wenn nötig
6. Wenn Daten fehlen oder unklar sind, frage nach

## Beispiel-Abfragen die du verstehen solltest:
- "Zeig mir alle offenen Rechnungen"
- "Wie hoch waren die Kosten für Telefon im März?"
- "Liste alle Buchungen von Amazon"
- "Vergleiche die Ausgaben von Januar und Februar"
- "Welche Rechnungen sind überfällig?"
- "Was ist der aktuelle Kontostand?"

Antworte präzise, hilfreich und in klarem Deutsch.`;
}

/**
 * Generiert ein vereinfachtes Datenbank-Schema für den System-Prompt
 */
export function generateDatabaseSchema(): string {
  return `
### buchungen (Buchungen)
- id: Primärschlüssel
- unternehmenId: Zugehöriges Unternehmen
- buchungsart: "aufwand" | "ertrag" | "anlage" | "sonstig"
- belegdatum: Datum des Belegs (DATE)
- belegnummer: Rechnungs-/Belegnummer
- geschaeftspartner: Name des Geschäftspartners
- geschaeftspartnerTyp: "kreditor" (Lieferant) | "debitor" (Kunde) | "gesellschafter" | "sonstig"
- geschaeftspartnerKonto: Personenkonto (z.B. 70000)
- sachkonto: Sachkontonummer (z.B. 4910 für Miete)
- kostenstelle: Optional
- nettobetrag: Nettobetrag (DECIMAL)
- bruttobetrag: Bruttobetrag (DECIMAL)
- steuersatz: Umsatzsteuersatz (DECIMAL, z.B. 19.00 für 19%)
- buchungstext: Beschreibung der Buchung
- zahlungsstatus: "offen" | "bezahlt" | "teilbezahlt" | "storniert"
- faelligkeitsdatum: Fälligkeitsdatum (DATE)
- zahlungsdatum: Zahlungsdatum (DATE, optional)
- belegUrl: URL zum Belegdokument (S3)
- createdAt: Erstellungszeitpunkt

### kreditoren (Lieferanten-Stammdaten)
- id: Primärschlüssel
- unternehmenId: Zugehöriges Unternehmen
- kontonummer: Personenkonto (z.B. 70001)
- name: Name des Kreditors
- adresse: Adresse
- iban: IBAN
- bic: BIC
- ustIdNr: Umsatzsteuer-ID
- standardSachkonto: Standard-Sachkonto für Buchungen
- zahlungsziel: Zahlungsziel in Tagen

### debitoren (Kunden-Stammdaten)
- id: Primärschlüssel
- unternehmenId: Zugehöriges Unternehmen
- kontonummer: Personenkonto (z.B. 10001)
- name: Name des Debitors
- adresse: Adresse
- iban: IBAN
- bic: BIC
- ustIdNr: Umsatzsteuer-ID
- zahlungsziel: Zahlungsziel in Tagen

### sachkonten (Kontenplan)
- id: Primärschlüssel
- unternehmenId: Zugehöriges Unternehmen
- kontonummer: Sachkontonummer (z.B. 4910)
- bezeichnung: Kontobezeichnung (z.B. "Miete")
- kontenrahmen: SKR03 | SKR04 | OeKR | ...
- kategorie: "aufwand" | "ertrag" | "aktiva" | "passiva"

### unternehmen (Firmen-Stammdaten)
- id: Primärschlüssel
- name: Firmenname
- rechtsform: GmbH, UG, AG, etc.
- steuernummer: Steuernummer
- ustIdNr: Umsatzsteuer-ID
- kontenrahmen: SKR03 | SKR04 | ...

### buchungsvorlagen (Templates)
- id: Primärschlüssel
- unternehmenId: Zugehöriges Unternehmen
- name: Vorlagenname
- sollKonto: Soll-Konto
- habenKonto: Haben-Konto
- buchungstext: Standard-Buchungstext
- ustSatz: Standard-USt-Satz
- kategorie: miete | gehalt | versicherung | ...

### Wichtige SKR03-Konten (Beispiele):
- 1200: Bank
- 1000: Kasse
- 4120-4199: Mieten
- 4200-4299: Kommunikation (Telefon, Internet)
- 4500-4599: KFZ-Kosten
- 4600-4699: Werbekosten
- 4900-4999: Sonstige Aufwendungen
- 8400: Erlöse 19% USt
- 8300: Erlöse 7% USt
`;
}
