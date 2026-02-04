import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./_core/env";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

// ============================================
// OCR SERVICE - Automatische Belegerkennung mit Vision-AI
// ============================================

// Regex-Patterns für deutsche Rechnungen (Fallback)
const PATTERNS = {
  // Datum: DD.MM.YYYY oder DD/MM/YYYY oder YYYY-MM-DD
  datum: /(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}|\d{4}-\d{2}-\d{2})/g,
  
  // Beträge: verschiedene Formate
  betrag: /(?:€\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(?:€|EUR)?/g,
  
  // Steuersätze
  steuersatz: /(\d{1,2})\s*%\s*(?:MwSt|USt|Mehrwertsteuer|Umsatzsteuer)?/gi,
  
  // Rechnungsnummer
  rechnungsnummer: /(?:Rechnung(?:s)?(?:nummer|nr\.?)?|Invoice(?:\s*No\.?)?|Beleg(?:nummer|nr\.?)?|Nr\.?)\s*[:#]?\s*([A-Z0-9\-\/]+)/gi,
  
  // IBAN
  iban: /[A-Z]{2}\d{2}\s?(?:\d{4}\s?){4}\d{2}/g,
  
  // USt-IdNr
  ustIdNr: /(?:DE|AT|CH)\s?\d{9}/g,
};

// Bekannte Sachkonten-Keywords für SKR03/SKR04
const SACHKONTO_KEYWORDS: Record<string, { skr03: string; skr04: string; beschreibung: string }> = {
  // Telekommunikation
  "telefon": { skr03: "4920", skr04: "6805", beschreibung: "Telefon" },
  "telekom": { skr03: "4920", skr04: "6805", beschreibung: "Telefon" },
  "vodafone": { skr03: "4920", skr04: "6805", beschreibung: "Telefon" },
  "o2": { skr03: "4920", skr04: "6805", beschreibung: "Telefon" },
  "internet": { skr03: "4920", skr04: "6805", beschreibung: "Telefon/Internet" },
  "tenios": { skr03: "4920", skr04: "6805", beschreibung: "Telefon/VoIP" },
  "sipgate": { skr03: "4920", skr04: "6805", beschreibung: "Telefon/VoIP" },
  "voip": { skr03: "4920", skr04: "6805", beschreibung: "Telefon/VoIP" },
  
  // Büro
  "büromaterial": { skr03: "4930", skr04: "6815", beschreibung: "Bürobedarf" },
  "bürobedarf": { skr03: "4930", skr04: "6815", beschreibung: "Bürobedarf" },
  "amazon": { skr03: "4930", skr04: "6815", beschreibung: "Bürobedarf" },
  
  // Miete & Nebenkosten
  "miete": { skr03: "4210", skr04: "6310", beschreibung: "Miete" },
  "strom": { skr03: "4240", skr04: "6325", beschreibung: "Gas, Strom, Wasser" },
  "gas": { skr03: "4240", skr04: "6325", beschreibung: "Gas, Strom, Wasser" },
  "heizung": { skr03: "4240", skr04: "6325", beschreibung: "Gas, Strom, Wasser" },
  
  // Versicherungen
  "versicherung": { skr03: "4360", skr04: "6400", beschreibung: "Versicherungen" },
  "allianz": { skr03: "4360", skr04: "6400", beschreibung: "Versicherungen" },
  "axa": { skr03: "4360", skr04: "6400", beschreibung: "Versicherungen" },
  
  // KFZ
  "kfz": { skr03: "4510", skr04: "6520", beschreibung: "Kfz-Kosten" },
  "tanken": { skr03: "4530", skr04: "6530", beschreibung: "Kfz-Betriebskosten" },
  "benzin": { skr03: "4530", skr04: "6530", beschreibung: "Kfz-Betriebskosten" },
  "diesel": { skr03: "4530", skr04: "6530", beschreibung: "Kfz-Betriebskosten" },
  "shell": { skr03: "4530", skr04: "6530", beschreibung: "Kfz-Betriebskosten" },
  "aral": { skr03: "4530", skr04: "6530", beschreibung: "Kfz-Betriebskosten" },
  
  // Reise
  "reise": { skr03: "4660", skr04: "6650", beschreibung: "Reisekosten" },
  "hotel": { skr03: "4660", skr04: "6650", beschreibung: "Reisekosten" },
  "flug": { skr03: "4660", skr04: "6650", beschreibung: "Reisekosten" },
  "bahn": { skr03: "4660", skr04: "6650", beschreibung: "Reisekosten" },
  "db": { skr03: "4660", skr04: "6650", beschreibung: "Reisekosten" },
  
  // Bewirtung
  "bewirtung": { skr03: "4650", skr04: "6640", beschreibung: "Bewirtungskosten" },
  "restaurant": { skr03: "4650", skr04: "6640", beschreibung: "Bewirtungskosten" },
  
  // Werbung
  "werbung": { skr03: "4600", skr04: "6600", beschreibung: "Werbekosten" },
  "marketing": { skr03: "4600", skr04: "6600", beschreibung: "Werbekosten" },
  "google ads": { skr03: "4600", skr04: "6600", beschreibung: "Werbekosten" },
  "facebook": { skr03: "4600", skr04: "6600", beschreibung: "Werbekosten" },
  
  // EDV
  "software": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "hardware": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "computer": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "microsoft": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "adobe": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "hosting": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "server": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "cloud": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "aws": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  
  // Porto
  "porto": { skr03: "4910", skr04: "6800", beschreibung: "Porto" },
  "dhl": { skr03: "4910", skr04: "6800", beschreibung: "Porto/Versand" },
  "ups": { skr03: "4910", skr04: "6800", beschreibung: "Porto/Versand" },
  "dpd": { skr03: "4910", skr04: "6800", beschreibung: "Porto/Versand" },
  
  // Beratung
  "rechtsanwalt": { skr03: "4950", skr04: "6825", beschreibung: "Rechts- und Beratungskosten" },
  "steuerberater": { skr03: "4955", skr04: "6827", beschreibung: "Buchführungskosten" },
  "beratung": { skr03: "4950", skr04: "6825", beschreibung: "Beratungskosten" },
  
  // Fortbildung
  "fortbildung": { skr03: "4945", skr04: "6821", beschreibung: "Fortbildungskosten" },
  "schulung": { skr03: "4945", skr04: "6821", beschreibung: "Fortbildungskosten" },
  "seminar": { skr03: "4945", skr04: "6821", beschreibung: "Fortbildungskosten" },
  
  // Erträge
  "umsatz": { skr03: "8400", skr04: "4400", beschreibung: "Erlöse" },
  "erlöse": { skr03: "8400", skr04: "4400", beschreibung: "Erlöse" },
  "honorar": { skr03: "8400", skr04: "4400", beschreibung: "Erlöse" },
  "provision": { skr03: "8400", skr04: "4400", beschreibung: "Erlöse" },
};

interface OcrResult {
  // Erkannte Daten
  belegdatum: string | null;
  belegnummer: string | null;
  nettobetrag: number | null;
  bruttobetrag: number | null;
  steuersatz: number | null;
  steuerbetrag: number | null;
  
  // Geschäftspartner
  geschaeftspartner: string | null;
  geschaeftspartnerTyp: "kreditor" | "debitor" | "sonstig" | null;
  
  // Kontierung
  sachkonto: string | null;
  sachkontoBeschreibung: string | null;
  buchungsart: "aufwand" | "ertrag" | "sonstig" | null;
  
  // Zusätzliche Infos
  iban: string | null;
  ustIdNr: string | null;
  
  // Konfidenz
  konfidenz: number;
  erkannteFelder: string[];
  rohtext: string;
}

function parseGermanDate(dateStr: string): string | null {
  // DD.MM.YYYY oder DD/MM/YYYY
  const match1 = dateStr.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (match1) {
    const day = match1[1].padStart(2, "0");
    const month = match1[2].padStart(2, "0");
    let year = match1[3];
    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }
  
  // YYYY-MM-DD
  const match2 = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match2) {
    return dateStr;
  }
  
  return null;
}

function parseGermanAmount(amountStr: string): number | null {
  // Entferne Währungssymbole und Leerzeichen
  let cleaned = amountStr.replace(/[€EUR\s]/gi, "").trim();
  
  // Deutsche Notation: 1.234,56 -> 1234.56
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

function extractDataFromText(text: string, kontenrahmen: string = "SKR03"): OcrResult {
  const result: OcrResult = {
    belegdatum: null,
    belegnummer: null,
    nettobetrag: null,
    bruttobetrag: null,
    steuersatz: null,
    steuerbetrag: null,
    geschaeftspartner: null,
    geschaeftspartnerTyp: null,
    sachkonto: null,
    sachkontoBeschreibung: null,
    buchungsart: null,
    iban: null,
    ustIdNr: null,
    konfidenz: 0,
    erkannteFelder: [],
    rohtext: text,
  };
  
  const textLower = text.toLowerCase();
  let konfidenzPunkte = 0;
  
  // 1. Datum extrahieren
  const datumMatches = text.match(PATTERNS.datum);
  if (datumMatches && datumMatches.length > 0) {
    const parsedDate = parseGermanDate(datumMatches[0]);
    if (parsedDate) {
      result.belegdatum = parsedDate;
      result.erkannteFelder.push("belegdatum");
      konfidenzPunkte += 15;
    }
  }
  
  // 2. Rechnungsnummer extrahieren
  const rechnungsnummerMatch = PATTERNS.rechnungsnummer.exec(text);
  if (rechnungsnummerMatch) {
    result.belegnummer = rechnungsnummerMatch[1];
    result.erkannteFelder.push("belegnummer");
    konfidenzPunkte += 10;
  }
  
  // 3. Beträge extrahieren - verbesserte Logik
  const betragMatches = text.match(PATTERNS.betrag);
  if (betragMatches && betragMatches.length > 0) {
    const betraege = betragMatches
      .map(b => parseGermanAmount(b))
      .filter((b): b is number => b !== null && b > 0)
      .sort((a, b) => b - a);
    
    if (betraege.length > 0) {
      result.bruttobetrag = betraege[0];
      result.erkannteFelder.push("bruttobetrag");
      konfidenzPunkte += 20;
      
      // Suche nach Netto-Brutto-Verhältnissen
      if (betraege.length > 1) {
        for (const netto of betraege.slice(1)) {
          const ratio = result.bruttobetrag / netto;
          
          if (Math.abs(ratio - 1.19) < 0.02) {
            result.nettobetrag = netto;
            result.steuersatz = 19;
            result.steuerbetrag = result.bruttobetrag - netto;
            result.erkannteFelder.push("nettobetrag");
            konfidenzPunkte += 15;
            break;
          } else if (Math.abs(ratio - 1.07) < 0.02) {
            result.nettobetrag = netto;
            result.steuersatz = 7;
            result.steuerbetrag = result.bruttobetrag - netto;
            result.erkannteFelder.push("nettobetrag");
            konfidenzPunkte += 15;
            break;
          } else if (Math.abs(ratio - 1.20) < 0.02) {
            // Österreich 20%
            result.nettobetrag = netto;
            result.steuersatz = 20;
            result.steuerbetrag = result.bruttobetrag - netto;
            result.erkannteFelder.push("nettobetrag");
            konfidenzPunkte += 15;
            break;
          }
        }
      }
    }
  }
  
  // 4. Steuersatz extrahieren (falls nicht schon gefunden)
  if (!result.steuersatz) {
    const steuersatzMatch = PATTERNS.steuersatz.exec(text);
    if (steuersatzMatch) {
      const satz = parseInt(steuersatzMatch[1]);
      if ([0, 7, 10, 13, 19, 20].includes(satz)) {
        result.steuersatz = satz;
        result.erkannteFelder.push("steuersatz");
        konfidenzPunkte += 10;
        
        if (result.bruttobetrag && !result.nettobetrag) {
          result.nettobetrag = result.bruttobetrag / (1 + satz / 100);
          result.steuerbetrag = result.bruttobetrag - result.nettobetrag;
        }
      }
    }
  }
  
  // 5. Geschäftspartner und Sachkonto erkennen
  for (const [keyword, konto] of Object.entries(SACHKONTO_KEYWORDS)) {
    if (textLower.includes(keyword.toLowerCase())) {
      if (!result.geschaeftspartner) {
        // Kapitalisiere den ersten Buchstaben
        result.geschaeftspartner = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        result.geschaeftspartnerTyp = "kreditor";
        result.erkannteFelder.push("geschaeftspartner");
        konfidenzPunkte += 15;
      }
      
      if (!result.sachkonto) {
        result.sachkonto = kontenrahmen === "SKR04" ? konto.skr04 : konto.skr03;
        result.sachkontoBeschreibung = konto.beschreibung;
        result.buchungsart = konto.skr03.startsWith("8") || konto.skr04.startsWith("4") ? "ertrag" : "aufwand";
        result.erkannteFelder.push("sachkonto");
        konfidenzPunkte += 10;
      }
      break;
    }
  }
  
  // 6. IBAN extrahieren
  const ibanMatch = text.match(PATTERNS.iban);
  if (ibanMatch) {
    result.iban = ibanMatch[0].replace(/\s/g, "");
    result.erkannteFelder.push("iban");
    konfidenzPunkte += 5;
  }
  
  // 7. USt-IdNr extrahieren
  const ustIdNrMatch = text.match(PATTERNS.ustIdNr);
  if (ustIdNrMatch) {
    result.ustIdNr = ustIdNrMatch[0].replace(/\s/g, "");
    result.erkannteFelder.push("ustIdNr");
    konfidenzPunkte += 5;
  }
  
  // Konfidenz berechnen
  result.konfidenz = Math.min(konfidenzPunkte, 100);
  
  // Standardwerte
  if (!result.steuersatz) {
    result.steuersatz = 19;
  }
  if (!result.buchungsart) {
    result.buchungsart = "aufwand";
  }
  if (!result.geschaeftspartnerTyp) {
    result.geschaeftspartnerTyp = "kreditor";
  }
  
  return result;
}

// Vision-AI basierte OCR-Analyse
async function analyzeImageWithVision(
  imageBase64: string,
  mimeType: string,
  kontenrahmen: string = "SKR03"
): Promise<OcrResult> {
  console.log("[OCR] 🚀 Starte Claude Vision Analyse...");
  console.log("[OCR] 🖼️ Image MIME Type:", mimeType);
  console.log("[OCR] 🖼️ Image Base64 Länge:", imageBase64.length);

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: ENV.anthropicApiKey,
  });

  if (!ENV.anthropicApiKey) {
    console.error("[OCR] ❌ ANTHROPIC_API_KEY nicht konfiguriert!");
    throw new Error("ANTHROPIC_API_KEY ist nicht konfiguriert");
  }

  const systemPrompt = `Du bist ein Experte für die OCR-Analyse von deutschen Geschäftsbelegen, Rechnungen und Quittungen.
Deine Aufgabe ist es, alle relevanten Buchhaltungsdaten aus dem Beleg zu extrahieren.

## WICHTIG: Suche sehr gründlich nach allen Feldern!

### 1. RECHNUNGSDATUM (belegdatum)
- Suche nach: "Datum:", "Rechnungsdatum:", "Invoice Date:", "Ausstellungsdatum:", oder einfach einem Datum im Kopf der Rechnung
- Häufige Formate: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
- Beispiele: "15.01.2025", "01/15/2025", "2025-01-15"
- **KONVERTIERE IMMER ZU: YYYY-MM-DD Format**
- Falls mehrere Datumsangaben: Nimm das FRÜHESTE (= Rechnungsdatum)

### 2. RECHNUNGSNUMMER (belegnummer)
- Suche nach: "Rechnung Nr.", "Rechnungsnummer:", "Invoice No:", "RE-", "RG-", "Beleg-Nr.", "Belegnummer:"
- Format: Kann alphanumerisch sein (z.B. "RE-2025-001", "T218680", "INV-12345")
- **SEHR WICHTIG**: Diese steht oft prominent im oberen Bereich!

### 3. GESCHÄFTSPARTNER (geschaeftspartner)
- Der **ABSENDER** der Rechnung (Lieferant/Kreditor), NICHT der Empfänger!
- Suche im **KOPFBEREICH** der Rechnung nach dem Firmennamen
- Meist über oder neben dem Logo
- Beispiele: "Amazon EU S.à r.l.", "Telekom Deutschland GmbH", "Vodafone GmbH"
- Falls mehrere Namen: Nimm den PROMINENTESTEN im Kopf (nicht den Empfänger unten!)

### 4. BETRÄGE
**KRITISCH WICHTIG**: Suche nach ALLEN drei Beträgen!

**A) NETTOBETRAG (nettobetrag)**
- Beschriftung: "Netto", "Nettobetrag", "Summe netto", "Zwischensumme", "Subtotal"
- Der Betrag VOR der Mehrwertsteuer
- Beispiel: Bei Brutto 119,00€ und 19% → Netto = 100,00€

**B) BRUTTOBETRAG (bruttobetrag)**
- Beschriftung: "Brutto", "Bruttobetrag", "Gesamt", "Gesamtbetrag", "Endsumme", "Total", "zu zahlen"
- Der Betrag INKLUSIVE Mehrwertsteuer
- **WICHTIG**: Meist der GRÖSSTE und prominenteste Betrag auf der Rechnung!
- Beispiel: 119,00€

**C) STEUERBETRAG (steuerbetrag)**
- Beschriftung: "MwSt", "USt", "Mehrwertsteuer", "Umsatzsteuer", "VAT", "19% MwSt"
- Der reine Steuerbetrag
- Beispiel: Bei Brutto 119,00€ und Netto 100,00€ → Steuer = 19,00€

**D) STEUERSATZ (steuersatz)**
- Suche nach: "19%", "7%", "20%", "MwSt 19%", "USt 19%"
- Nur die Zahl ohne % (z.B. 19, nicht "19%")
- Häufigste Sätze: 19 (Deutschland), 7 (ermäßigt), 20 (Österreich), 8.1 (Schweiz)

**BETRAGS-FORMATIERUNG**:
- Deutsche Schreibweise: 1.234,56 → Umwandeln zu: 1234.56
- Englische Schreibweise: 1,234.56 → Umwandeln zu: 1234.56
- AUSGABE IMMER: Dezimalzahl mit Punkt (z.B. 100.00)

### 5. ZUSATZINFORMATIONEN

**IBAN (iban)**
- Format: 2 Buchstaben + 2 Ziffern + Bankcode + Kontonummer
- Beispiel: "DE89 3704 0044 0532 0130 00"
- Entferne alle Leerzeichen in der Ausgabe

**USt-IdNr (ustIdNr)**
- Format: Ländercode + Nummer (z.B. "DE123456789", "ATU12345678")
- Suche nach: "USt-IdNr:", "Steuernummer:", "VAT No:", "Tax ID:"

---

## OUTPUT FORMAT

Antworte NUR mit diesem JSON-Objekt (keine zusätzlichen Texte davor oder danach):

{
  "belegdatum": "YYYY-MM-DD" oder null,
  "belegnummer": "RE-2025-001" oder null,
  "nettobetrag": 100.00 oder null,
  "bruttobetrag": 119.00 oder null,
  "steuersatz": 19 oder null,
  "steuerbetrag": 19.00 oder null,
  "geschaeftspartner": "Amazon EU S.à r.l." oder null,
  "iban": "DE89370400440532013000" oder null,
  "ustIdNr": "DE123456789" oder null,
  "erkannterText": "Vollständiger OCR-Text aus dem Beleg..."
}

## BEISPIEL

Für eine Rechnung mit:
- Datum: 15.01.2025
- Rechnung Nr.: RE-2025-001
- Von: Amazon Business
- Netto: 84,03 €
- MwSt 19%: 15,97 €
- Brutto: 100,00 €

Antwort:
{
  "belegdatum": "2025-01-15",
  "belegnummer": "RE-2025-001",
  "nettobetrag": 84.03,
  "bruttobetrag": 100.00,
  "steuersatz": 19,
  "steuerbetrag": 15.97,
  "geschaeftspartner": "Amazon Business",
  "iban": null,
  "ustIdNr": null,
  "erkannterText": "..."
}

## FEHLERBEHANDLUNG

Falls ein Wert nicht erkennbar ist, setze **null** (nicht "unbekannt" oder "").
Wenn du dir bei einem Wert unsicher bist, setze trotzdem deinen besten Guess (besser als null).

**WICHTIG**: Prüfe das Bild SEHR GRÜNDLICH! Oft sind Werte da, aber an unerwarteten Stellen!`;

  try {
    console.log("[OCR] 📤 Sende Anfrage an Claude Vision API...");

    // Call Claude Vision API with proper format
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
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Analysiere diesen Beleg und extrahiere die Rechnungsdaten als JSON:",
            },
          ],
        },
      ],
    });

    console.log("[OCR] ✅ Claude Response erhalten");
    console.log("[OCR] 📦 Response Structure:", JSON.stringify({
      id: message.id,
      model: message.model,
      role: message.role,
      contentLength: message.content?.length,
      stopReason: message.stop_reason,
    }, null, 2));

    // Extract text from Claude response
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      console.error("[OCR] ❌ Keine Text-Antwort von Claude");
      throw new Error("Keine Text-Antwort von Claude erhalten");
    }

    const content = textContent.text;
    console.log("[OCR] 📝 Raw Content (erste 500 Zeichen):", content.substring(0, 500));

    // Parse JSON aus der Antwort
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[OCR] ❌ Kein JSON gefunden in:", content);
      throw new Error("Keine JSON-Antwort gefunden");
    }

    console.log("[OCR] 🔍 JSON Match gefunden:", jsonMatch[0].substring(0, 200));
    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[OCR] ✅ JSON geparsed:", JSON.stringify(parsed, null, 2));
    
    // Erstelle OcrResult aus der Vision-Antwort
    const result: OcrResult = {
      belegdatum: parsed.belegdatum || null,
      belegnummer: parsed.belegnummer || null,
      nettobetrag: typeof parsed.nettobetrag === "number" ? parsed.nettobetrag : null,
      bruttobetrag: typeof parsed.bruttobetrag === "number" ? parsed.bruttobetrag : null,
      steuersatz: typeof parsed.steuersatz === "number" ? parsed.steuersatz : null,
      steuerbetrag: typeof parsed.steuerbetrag === "number" ? parsed.steuerbetrag : null,
      geschaeftspartner: parsed.geschaeftspartner || null,
      geschaeftspartnerTyp: "kreditor",
      sachkonto: null,
      sachkontoBeschreibung: null,
      buchungsart: "aufwand",
      iban: parsed.iban || null,
      ustIdNr: parsed.ustIdNr || null,
      konfidenz: 0,
      erkannteFelder: [],
      rohtext: parsed.erkannterText || "",
    };

    // Berechne Konfidenz basierend auf erkannten Feldern
    let konfidenzPunkte = 0;
    if (result.belegdatum) { konfidenzPunkte += 15; result.erkannteFelder.push("belegdatum"); }
    if (result.belegnummer) { konfidenzPunkte += 10; result.erkannteFelder.push("belegnummer"); }
    if (result.bruttobetrag) { konfidenzPunkte += 20; result.erkannteFelder.push("bruttobetrag"); }
    if (result.nettobetrag) { konfidenzPunkte += 15; result.erkannteFelder.push("nettobetrag"); }
    if (result.steuersatz) { konfidenzPunkte += 10; result.erkannteFelder.push("steuersatz"); }
    if (result.geschaeftspartner) { konfidenzPunkte += 15; result.erkannteFelder.push("geschaeftspartner"); }
    if (result.iban) { konfidenzPunkte += 5; result.erkannteFelder.push("iban"); }
    if (result.ustIdNr) { konfidenzPunkte += 5; result.erkannteFelder.push("ustIdNr"); }
    
    result.konfidenz = Math.min(konfidenzPunkte, 100);

    // Sachkonto basierend auf Geschäftspartner vorschlagen
    if (result.geschaeftspartner) {
      const partnerLower = result.geschaeftspartner.toLowerCase();
      for (const [keyword, konto] of Object.entries(SACHKONTO_KEYWORDS)) {
        if (partnerLower.includes(keyword.toLowerCase())) {
          result.sachkonto = kontenrahmen === "SKR04" ? konto.skr04 : konto.skr03;
          result.sachkontoBeschreibung = konto.beschreibung;
          result.erkannteFelder.push("sachkonto");
          break;
        }
      }
    }

    // Fallback: Versuche Sachkonto aus dem Rohtext zu ermitteln
    if (!result.sachkonto && result.rohtext) {
      const textLower = result.rohtext.toLowerCase();
      for (const [keyword, konto] of Object.entries(SACHKONTO_KEYWORDS)) {
        if (textLower.includes(keyword.toLowerCase())) {
          result.sachkonto = kontenrahmen === "SKR04" ? konto.skr04 : konto.skr03;
          result.sachkontoBeschreibung = konto.beschreibung;
          result.erkannteFelder.push("sachkonto");
          break;
        }
      }
    }

    // Standardwerte
    if (!result.steuersatz) {
      result.steuersatz = 19;
    }

    return result;
  } catch (error) {
    console.error("[OCR] Vision-AI Fehler:", error);
    // Fallback auf Text-basierte Extraktion
    return extractDataFromText("", kontenrahmen);
  }
}

// ============================================
// PDF ZU BILD KONVERTIERUNG
// ============================================
async function convertPdfToImage(pdfBase64: string): Promise<{ imageBase64: string; mimeType: string }> {
  console.log("[PDF→IMG] 🚀 Starte Konvertierung...");

  // Erstelle temporäres Verzeichnis
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "pdf-ocr-"));
  console.log("[PDF→IMG] 📁 Temp-Verzeichnis:", tempDir);

  const pdfPath = path.join(tempDir, "input.pdf");
  const outputPrefix = path.join(tempDir, "page");

  try {
    // Schreibe PDF in temporäre Datei
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    console.log("[PDF→IMG] 💾 Schreibe PDF (Größe:", pdfBuffer.length, "bytes)...");
    await fs.promises.writeFile(pdfPath, pdfBuffer);
    console.log("[PDF→IMG] ✅ PDF geschrieben:", pdfPath);

    // Konvertiere erste Seite zu PNG mit pdftoppm
    // -png: Output als PNG
    // -f 1 -l 1: Nur erste Seite
    // -r 200: 200 DPI für gute Qualität
    const command = `pdftoppm -png -f 1 -l 1 -r 200 "${pdfPath}" "${outputPrefix}"`;
    console.log("[PDF→IMG] 🔧 Führe aus:", command);

    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log("[PDF→IMG] 📤 stdout:", stdout);
    if (stderr) console.log("[PDF→IMG] ⚠️ stderr:", stderr);

    console.log("[PDF→IMG] ✅ pdftoppm abgeschlossen");

    // Finde die generierte Bilddatei
    const files = await fs.promises.readdir(tempDir);
    console.log("[PDF→IMG] 📂 Dateien im Temp-Verzeichnis:", files);

    const imageFile = files.find(f => f.startsWith("page") && f.endsWith(".png"));

    if (!imageFile) {
      console.error("[PDF→IMG] ❌ Keine PNG-Datei gefunden!");
      throw new Error("PDF-Konvertierung fehlgeschlagen: Keine Bilddatei generiert");
    }

    console.log("[PDF→IMG] 🖼️ Gefundenes Bild:", imageFile);

    const imagePath = path.join(tempDir, imageFile);
    const imageBuffer = await fs.promises.readFile(imagePath);
    console.log("[PDF→IMG] 📖 Bild gelesen (Größe:", imageBuffer.length, "bytes)");

    const imageBase64 = imageBuffer.toString("base64");
    console.log("[PDF→IMG] ✅ Base64-Konvertierung abgeschlossen (Länge:", imageBase64.length, ")");

    return {
      imageBase64,
      mimeType: "image/png"
    };
  } catch (error) {
    console.error("[PDF→IMG] ❌ FEHLER:", error);
    console.error("[PDF→IMG] ❌ Error Message:", error instanceof Error ? error.message : "Unknown");
    console.error("[PDF→IMG] ❌ Error Stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
  } finally {
    // Aufräumen: Lösche temporäre Dateien
    try {
      const files = await fs.promises.readdir(tempDir);
      for (const file of files) {
        await fs.promises.unlink(path.join(tempDir, file));
      }
      await fs.promises.rmdir(tempDir);
    } catch (cleanupError) {
      console.error("[OCR] Cleanup-Fehler:", cleanupError);
    }
  }
}

// ============================================
// OCR ROUTER
// ============================================
export const ocrRouter = router({
  // OCR-Analyse eines Textes (für bereits extrahierten Text)
  analyzeText: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).default("SKR03"),
      })
    )
    .mutation(async ({ input }) => {
      // Konvertiere internationale Kontenrahmen zu SKR03/SKR04 für die Kontenzuordnung
      const effectiveKontenrahmen = ["SKR03", "SKR04"].includes(input.kontenrahmen) 
        ? input.kontenrahmen 
        : "SKR03";
      return extractDataFromText(input.text, effectiveKontenrahmen);
    }),

  // Vision-AI basierte OCR für Bilder
  analyzeImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        mimeType: z.string(),
        kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).default("SKR03"),
      })
    )
    .mutation(async ({ input }) => {
      const effectiveKontenrahmen = ["SKR03", "SKR04"].includes(input.kontenrahmen) 
        ? input.kontenrahmen 
        : "SKR03";
      return analyzeImageWithVision(input.imageBase64, input.mimeType, effectiveKontenrahmen);
    }),

  // Simulierte OCR für Demo-Zwecke (Fallback)
  simulateOcr: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).default("SKR03"),
      })
    )
    .mutation(async ({ input }) => {
      const filename = input.filename.toLowerCase();
      let simulatedText = "";
      
      if (filename.includes("tenios")) {
        simulatedText = `
          Tenios GmbH
          Rechnung Nr. T218680
          Datum: 06.01.2026
          
          VoIP Telefonie Services
          Nettobetrag: 50,42 €
          MwSt 19%: 9,58 €
          Bruttobetrag: 60,00 €
        `;
      } else if (filename.includes("rechnung") || filename.includes("invoice")) {
        simulatedText = `
          Rechnung Nr. RE-2024-001
          Datum: 15.12.2024
          
          Amazon EU S.à r.l.
          Büromaterial
          Nettobetrag: 84,03 €
          MwSt 19%: 15,97 €
          Bruttobetrag: 100,00 €
        `;
      } else {
        simulatedText = `
          Lieferant GmbH
          Rechnung Nr. R-${Date.now()}
          Datum: ${new Date().toLocaleDateString("de-DE")}
          
          Dienstleistung/Ware
          Netto: 100,00 €
          MwSt 19%: 19,00 €
          Brutto: 119,00 €
        `;
      }
      
      const effectiveKontenrahmen = ["SKR03", "SKR04"].includes(input.kontenrahmen) 
        ? input.kontenrahmen 
        : "SKR03";
      return extractDataFromText(simulatedText, effectiveKontenrahmen);
    }),

  // PDF-OCR: Konvertiert PDF zu Bild und analysiert mit Vision-AI
  analyzePdf: protectedProcedure
    .input(
      z.object({
        pdfBase64: z.string(),
        kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).default("SKR03"),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[OCR] 🚀 PDF-Analyse gestartet...");
      console.log("[OCR] 📄 PDF Base64 Länge:", input.pdfBase64.length);
      console.log("[OCR] 🔧 Kontenrahmen:", input.kontenrahmen);

      try {
        // Konvertiere PDF zu Bild
        console.log("[OCR] 🔄 Starte PDF→Bild Konvertierung...");
        const { imageBase64, mimeType } = await convertPdfToImage(input.pdfBase64);
        console.log("[OCR] ✅ PDF erfolgreich zu Bild konvertiert");
        console.log("[OCR] 🖼️ Bild MIME Type:", mimeType);
        console.log("[OCR] 🖼️ Bild Base64 Länge:", imageBase64.length);

        // Analysiere das Bild mit Vision-AI
        const effectiveKontenrahmen = ["SKR03", "SKR04"].includes(input.kontenrahmen)
          ? input.kontenrahmen
          : "SKR03";

        console.log("[OCR] 🤖 Rufe analyzeImageWithVision auf...");
        const result = await analyzeImageWithVision(imageBase64, mimeType, effectiveKontenrahmen);

        console.log("[OCR] ✅ PDF-Analyse abgeschlossen!");
        console.log("[OCR] 📊 Ergebnis:", JSON.stringify({
          konfidenz: result.konfidenz,
          erkannteFelder: result.erkannteFelder,
          belegdatum: result.belegdatum,
          belegnummer: result.belegnummer,
          nettobetrag: result.nettobetrag,
          bruttobetrag: result.bruttobetrag,
          geschaeftspartner: result.geschaeftspartner,
        }, null, 2));

        return result;
      } catch (error) {
        console.error("[OCR] ❌ PDF-Analyse Fehler:", error);
        console.error("[OCR] ❌ Error Stack:", error instanceof Error ? error.stack : "No stack");
        throw new Error(`PDF-Analyse fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
      }
    }),
});

export type OcrRouter = typeof ocrRouter;
