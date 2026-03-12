import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./_core/env";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getDb } from "./db";
import { buchungen } from "../drizzle/schema";
import { like, desc, and, eq } from "drizzle-orm";

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

  // Leistungszeitraum (optional, für Steuerberater-Rechnungen etc.)
  zeitraumVon?: string | null;
  zeitraumBis?: string | null;

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

/**
 * Extrahiert Belegnummer aus Dateinamen als Fallback
 * Beispiele:
 * - "Rechnung_Amazon_RE-12345.pdf" → "RE-12345"
 * - "Invoice_INV-98765_2025.pdf" → "INV-98765"
 * - "Beleg_2025-001.pdf" → "2025-001"
 */
function extractBelegnummerFromFilename(filename: string): string | null {
  if (!filename) return null;

  // Entferne Dateiendung
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  // Pattern: Suche nach gängigen Rechnungsnummer-Formaten
  // RE-12345, INV-98765, R-2025-001, 2025/001, etc.
  const patterns = [
    /([A-Z]{2,4}[-_]?\d+[-_/]?\d*)/i,  // RE-12345, INV-001, R-2025-001
    /(\d{4}[-_/]\d+)/,                  // 2025-001, 2025/13266
    /([A-Z]\d{6})/,                     // T218680
    /(RG\d+)/i,                         // RG12345
  ];

  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback: Verwende den kompletten Dateinamen (ohne Extension)
  return nameWithoutExt;
}

function extractDataFromText(text: string, kontenrahmen: string = "SKR03", filename?: string): OcrResult {
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

  // Fallback: Wenn keine Belegnummer gefunden, versuche aus Dateiname zu extrahieren
  if (!result.belegnummer && filename) {
    const extractedFromFilename = extractBelegnummerFromFilename(filename);
    if (extractedFromFilename) {
      result.belegnummer = extractedFromFilename;
      result.erkannteFelder.push("belegnummer (aus Dateiname)");
    }
  }

  return result;
}

// Gemeinsamer System-Prompt für Image- und PDF-Analyse
const PDF_SYSTEM_PROMPT = `Du bist ein Experte für die OCR-Analyse von deutschen Geschäftsbelegen, Rechnungen und Quittungen.
Deine Aufgabe ist es, alle relevanten Buchhaltungsdaten aus dem Beleg zu extrahieren.

## ⚠️ KRITISCH: Rechnungsnummer und Datum sind PFLICHTFELDER!

### 1. RECHNUNGSDATUM (belegdatum) - PRIORITÄT 1!
**SEHR WICHTIG**: Das Rechnungsdatum ist das wichtigste Feld!

**Wo suchen:**
- Oberer Bereich der Rechnung, oft rechts oben
- Neben oder unter der Rechnungsnummer
- Im Briefkopf des Absenders

**Beschriftungen:**
- "Rechnungsdatum:", "Datum:", "Date:", "Invoice Date:"
- "Ausstellungsdatum:", "Belegdatum:", "vom", "ausgestellt am"
- Bei Behörden: "Bescheid vom", "Steuerbescheid vom"
- Manchmal OHNE Label, nur das Datum selbst

**Formate erkennen:**
- DD.MM.YYYY: 15.01.2025, 06.11.2024, 1.3.2025
- DD/MM/YYYY: 15/01/2025, 06/11/2024
- DD-MM-YYYY: 15-01-2025
- YYYY-MM-DD: 2025-01-15
- Textform: "15. Januar 2025", "6. November 2024"

**WICHTIG - Datum-Konvertierung:**
- **ALLE** Formate zu YYYY-MM-DD konvertieren!
- Bei einstelligen Tagen/Monaten: Führende Null hinzufügen
- Beispiele:
  * "6.11.2024" → "2024-11-06"
  * "15.1.2025" → "2025-01-15"
  * "15/01/2025" → "2025-01-15"
  * "15. Januar 2025" → "2025-01-15"

**Falls mehrere Datumsangaben:**
- Nimm das Datum beim Label "Rechnungsdatum" / "Datum"
- NICHT das Lieferdatum oder Fälligkeitsdatum!
- NICHT das heutige Datum verwenden wenn unsicher!

### 2. RECHNUNGSNUMMER (belegnummer) - PRIORITÄT 1!
**SEHR WICHTIG**: Die Rechnungsnummer ist eindeutig und MUSS gefunden werden!

**Wo suchen:**
- Prominent im oberen Bereich, oft fett gedruckt
- Meist direkt unter oder neben dem Logo
- Neben dem Wort "Rechnung" / "Invoice"

**Beschriftungen (alle Varianten):**
- "Rechnungsnummer:", "Rechnung Nr.", "Rg-Nr.", "RE-Nr."
- "Invoice No:", "Invoice Number:", "Inv. No."
- "Belegnummer:", "Beleg-Nr.", "Dok-Nr."
- Bei Behörden: "Aktenzeichen:", "Kassenzeichen:", "Bescheid-Nr.", "Steuernummer:"
- Bei Banken: "Referenz:", "Referenznummer:", "Ref-Nr."
- Manchmal nur "Nr:" oder "#"

**Format erkennen:**
- Kann ALLES sein: Zahlen, Buchstaben, Sonderzeichen
- Beispiele: "RE-2025-001", "2025:13266", "T218680", "INV-2024-12-001", "RG123456", "2025/001"

**WICHTIG:**
- Nimm die KOMPLETTE Nummer inklusive aller Zeichen
- Auch wenn es mehrere Nummern gibt: Nimm die beim Label "Rechnungsnummer"
- Bei Behörden: Aktenzeichen ist oft die wichtigste Nummer

### 3. GESCHÄFTSPARTNER (geschaeftspartner)
- Der **ABSENDER** der Rechnung (Lieferant/Kreditor), NICHT der Empfänger!
- Suche im **KOPFBEREICH** der Rechnung nach dem Firmennamen

### 4. BETRÄGE
**A) NETTOBETRAG** - Betrag VOR der Mehrwertsteuer
**B) BRUTTOBETRAG** - Betrag INKLUSIVE Mehrwertsteuer (der größte Betrag)
**C) STEUERBETRAG** - Der reine MwSt-Betrag
**D) STEUERSATZ** - Nur die Zahl (19, 7, 20, 8.1 etc.)

**Deutsche Notation:** 1.234,56 € → 1234.56 (Punkte entfernen, Komma durch Punkt ersetzen)

**AUSGABE:** Immer Dezimalzahl mit Punkt, OHNE Währungssymbol, OHNE Tausendertrennzeichen

### 5. LEISTUNGSZEITRAUM (optional)
- zeitraumVon / zeitraumBis als YYYY-MM-DD
- Nur bei laufenden Leistungen (Steuerberater, Buchhaltung etc.)

### 6. ZUSATZINFORMATIONEN
- IBAN: ohne Leerzeichen
- USt-IdNr: Ländercode + Nummer

---

## OUTPUT FORMAT

Antworte NUR mit diesem JSON-Objekt (keine zusätzlichen Texte):

{
  "belegdatum": "YYYY-MM-DD" oder null,
  "belegnummer": "RE-2025-001" oder null,
  "nettobetrag": 100.00 oder null,
  "bruttobetrag": 119.00 oder null,
  "steuersatz": 19 oder null,
  "steuerbetrag": 19.00 oder null,
  "zeitraumVon": "YYYY-MM-DD" oder null,
  "zeitraumBis": "YYYY-MM-DD" oder null,
  "geschaeftspartner": "Amazon EU S.à r.l." oder null,
  "iban": "DE89370400440532013000" oder null,
  "ustIdNr": "DE123456789" oder null,
  "erkannterText": "Vollständiger OCR-Text aus dem Beleg..."
}

Falls ein Wert nicht erkennbar ist, setze **null**.
Rechnungsnummer und Datum sind PFLICHTFELDER - suche besonders intensiv danach!`;

// Vision-AI basierte OCR-Analyse
async function analyzeImageWithVision(
  imageBase64: string,
  mimeType: string,
  kontenrahmen: string = "SKR03",
  unternehmenId?: number,
  filename?: string
): Promise<OcrResult> {
  console.log("[OCR] 🚀 Starte Claude Vision Analyse...");
  console.log("[OCR] 🖼️ Image MIME Type:", mimeType);
  console.log("[OCR] 🖼️ Image Base64 Länge:", imageBase64.length);
  if (unternehmenId) {
    console.log("[OCR] 🏢 UnternehmenId für Sachkonto-Lookup:", unternehmenId);
  }

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: ENV.anthropicApiKey,
  });

  if (!ENV.anthropicApiKey) {
    console.error("[OCR] ❌ ANTHROPIC_API_KEY nicht konfiguriert!");
    throw new Error("ANTHROPIC_API_KEY ist nicht konfiguriert");
  }

  const systemPrompt = PDF_SYSTEM_PROMPT;

  const _UNUSED = `Du bist ein Experte für die OCR-Analyse von deutschen Geschäftsbelegen, Rechnungen und Quittungen.
Deine Aufgabe ist es, alle relevanten Buchhaltungsdaten aus dem Beleg zu extrahieren.

## ⚠️ KRITISCH: Rechnungsnummer und Datum sind PFLICHTFELDER!

### 1. RECHNUNGSDATUM (belegdatum) - PRIORITÄT 1!
**SEHR WICHTIG**: Das Rechnungsdatum ist das wichtigste Feld!

**Wo suchen:**
- Oberer Bereich der Rechnung, oft rechts oben
- Neben oder unter der Rechnungsnummer
- Im Briefkopf des Absenders

**Beschriftungen:**
- "Rechnungsdatum:", "Datum:", "Date:", "Invoice Date:"
- "Ausstellungsdatum:", "Belegdatum:", "vom", "ausgestellt am"
- Bei Behörden: "Bescheid vom", "Steuerbescheid vom"
- Manchmal OHNE Label, nur das Datum selbst

**Formate erkennen:**
- DD.MM.YYYY: 15.01.2025, 06.11.2024, 1.3.2025
- DD/MM/YYYY: 15/01/2025, 06/11/2024
- DD-MM-YYYY: 15-01-2025
- YYYY-MM-DD: 2025-01-15
- Textform: "15. Januar 2025", "6. November 2024"

**WICHTIG - Datum-Konvertierung:**
- **ALLE** Formate zu YYYY-MM-DD konvertieren!
- Bei einstelligen Tagen/Monaten: Führende Null hinzufügen
- Beispiele:
  * "6.11.2024" → "2024-11-06"
  * "15.1.2025" → "2025-01-15"
  * "15/01/2025" → "2025-01-15"
  * "15. Januar 2025" → "2025-01-15"

**Falls mehrere Datumsangaben:**
- Nimm das Datum beim Label "Rechnungsdatum" / "Datum"
- NICHT das Lieferdatum oder Fälligkeitsdatum!
- NICHT das heutige Datum verwenden wenn unsicher!

### 2. RECHNUNGSNUMMER (belegnummer) - PRIORITÄT 1!
**SEHR WICHTIG**: Die Rechnungsnummer ist eindeutig und MUSS gefunden werden!

**Wo suchen:**
- Prominent im oberen Bereich, oft fett gedruckt
- Meist direkt unter oder neben dem Logo
- Neben dem Wort "Rechnung" / "Invoice"

**Beschriftungen (alle Varianten):**
- "Rechnungsnummer:", "Rechnung Nr.", "Rg-Nr.", "RE-Nr."
- "Invoice No:", "Invoice Number:", "Inv. No."
- "Belegnummer:", "Beleg-Nr.", "Dok-Nr."
- Bei Behörden: "Aktenzeichen:", "Kassenzeichen:", "Bescheid-Nr.", "Steuernummer:"
- Bei Banken: "Referenz:", "Referenznummer:", "Ref-Nr."
- Manchmal nur "Nr:" oder "#"

**Format erkennen:**
- Kann ALLES sein: Zahlen, Buchstaben, Sonderzeichen
- Beispiele:
  * "RE-2025-001"
  * "2025:13266"
  * "T218680"
  * "INV-2024-12-001"
  * "RG123456"
  * "2025/001"
  * "240512-001"
  * Nur Zahlen: "123456789"

**WICHTIG:**
- Nimm die KOMPLETTE Nummer inklusive aller Zeichen
- Auch wenn es mehrere Nummern gibt: Nimm die beim Label "Rechnungsnummer"
- Bei Behörden: Aktenzeichen ist oft die wichtigste Nummer
- Wenn keine explizite Nummer gefunden: Suche nach längeren Zahlenketten im Kopfbereich

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

**BETRAGS-FORMATIERUNG - KRITISCH WICHTIG:**

**Schritt 1: Erkenne das Format**
- Deutsche Notation: Punkt = Tausender, Komma = Dezimal
  * 1.234,56 € (Eintausend zweihundertvierunddreißig Euro sechsundfünfzig Cent)
  * 19.288,46 € (Neunzehntausend zweihundertachtundachtzig Euro sechsundvierzig Cent)
  * 100,00 € (Einhundert Euro)

- Englische Notation: Komma = Tausender, Punkt = Dezimal
  * 1,234.56 $ (rare in deutschen Rechnungen!)

**Schritt 2: Konvertiere zu Dezimalzahl**
- Deutsche Notation umwandeln:
  1. ENTFERNE alle Punkte (Tausendertrennzeichen)
  2. ERSETZE Komma durch Punkt (Dezimaltrennzeichen)

**Beispiele:**
- "1.234,56" → Entferne "." → "1234,56" → Ersetze "," → 1234.56
- "19.288,46" → Entferne "." → "19288,46" → Ersetze "," → 19288.46
- "100,00" → (kein Punkt) → "100,00" → Ersetze "," → 100.00
- "1.234.567,89" → Entferne "." → "1234567,89" → Ersetze "," → 1234567.89

**Schritt 3: Validierung**
- Prüfe ob das Ergebnis sinnvoll ist:
  * Netto sollte kleiner als Brutto sein
  * Steuerbetrag = Brutto - Netto (ca.)
  * Typische Rechnungsbeträge: 10€ bis 100.000€
  * WARNUNG: Wenn Betrag > 1.000.000 → wahrscheinlich Fehler!

**AUSGABE-FORMAT:**
- Immer als Dezimalzahl mit Punkt
- OHNE Währungssymbol (€, $, etc.)
- OHNE Tausendertrennzeichen
- Mit 2 Nachkommastellen
- Beispiele: 100.00, 1234.56, 19288.46

### 5. LEISTUNGSZEITRAUM (OPTIONAL)

**Leistungszeitraum Von (zeitraumVon)**
**Leistungszeitraum Bis (zeitraumBis)**

**WICHTIG**: Nur bei Rechnungen für laufende Leistungen (z.B. Steuerberater, Buchhaltung, Lohnabrechnung)

**Wo suchen:**
- Suche nach: "Leistungszeitraum", "Abrechnungszeitraum", "Zeitraum", "für den Zeitraum"
- "vom ... bis ...", "Monat ...", "Quartal ..."
- Manchmal steht es bei der Rechnungsposition, z.B. "Buchführung Januar 2025"

**Format:**
- Beide Datumsangaben im Format YYYY-MM-DD
- Beispiele:
  * "Leistungszeitraum: 01.01.2025 - 31.01.2025" → zeitraumVon: "2025-01-01", zeitraumBis: "2025-01-31"
  * "für den Monat Januar 2025" → zeitraumVon: "2025-01-01", zeitraumBis: "2025-01-31"
  * "Quartal Q1/2025" → zeitraumVon: "2025-01-01", zeitraumBis: "2025-03-31"
  * "bis 31.08.2025" (ohne "von") → zeitraumVon: null, zeitraumBis: "2025-08-31"

**Falls nicht vorhanden**: Beide auf null setzen

### 6. ZUSATZINFORMATIONEN

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
  "zeitraumVon": "YYYY-MM-DD" oder null,
  "zeitraumBis": "YYYY-MM-DD" oder null,
  "geschaeftspartner": "Amazon EU S.à r.l." oder null,
  "iban": "DE89370400440532013000" oder null,
  "ustIdNr": "DE123456789" oder null,
  "erkannterText": "Vollständiger OCR-Text aus dem Beleg..."
}

## BEISPIELE

**Beispiel 1: Typische deutsche Rechnung**
Auf dem Beleg steht:
- Rechnung Nr. 2025:13266
- vom 11.06.2025
- Crowe Kleeberg GmbH
- Nettobetrag: 19.288,46 €
- MwSt 19%: 3.664,81 €
- Gesamtbetrag: 22.953,27 €

Antwort:
{
  "belegdatum": "2025-06-11",
  "belegnummer": "2025:13266",
  "nettobetrag": 19288.46,
  "bruttobetrag": 22953.27,
  "steuersatz": 19,
  "steuerbetrag": 3664.81,
  "geschaeftspartner": "Crowe Kleeberg GmbH",
  "iban": null,
  "ustIdNr": null,
  "erkannterText": "..."
}

**Beispiel 2: Kleine Rechnung**
Auf dem Beleg steht:
- Datum: 15.1.2025
- RE-2025-001
- Amazon Business
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

**Beispiel 3: Behörde/Finanzamt**
Auf dem Beleg steht:
- Steuerbescheid vom 03.12.2024
- Aktenzeichen: 12345/2024
- Finanzamt München
- Nachzahlung: 1.234,00 €

Antwort:
{
  "belegdatum": "2024-12-03",
  "belegnummer": "12345/2024",
  "nettobetrag": null,
  "bruttobetrag": 1234.00,
  "steuersatz": null,
  "steuerbetrag": null,
  "geschaeftspartner": "Finanzamt München",
  "iban": null,
  "ustIdNr": null,
  "erkannterText": "..."
}

## FEHLERBEHANDLUNG

Falls ein Wert nicht erkennbar ist, setze **null** (nicht "unbekannt" oder "").
Wenn du dir bei einem Wert unsicher bist, setze trotzdem deinen besten Guess (besser als null).

**WICHTIG**:
- Prüfe das Bild SEHR GRÜNDLICH! Oft sind Werte da, aber an unerwarteten Stellen!
- Rechnungsnummer und Datum sind PFLICHTFELDER - suche besonders intensiv danach!
- Bei Beträgen: IMMER Punkt als Tausendertrennzeichen entfernen!`;
  void _UNUSED;

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
      zeitraumVon: parsed.zeitraumVon || null,
      zeitraumBis: parsed.zeitraumBis || null,
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
    if (result.zeitraumVon) { konfidenzPunkte += 5; result.erkannteFelder.push("zeitraumVon"); }
    if (result.zeitraumBis) { konfidenzPunkte += 5; result.erkannteFelder.push("zeitraumBis"); }
    if (result.iban) { konfidenzPunkte += 5; result.erkannteFelder.push("iban"); }
    if (result.ustIdNr) { konfidenzPunkte += 5; result.erkannteFelder.push("ustIdNr"); }

    result.konfidenz = Math.min(konfidenzPunkte, 100);

    // 🔍 SCHRITT 1: Suche nach letzter Buchung für diesen Geschäftspartner (Vorrang!)
    if (result.geschaeftspartner && unternehmenId) {
      try {
        const db = await getDb();
        if (db) {
          console.log("[OCR] 🔍 Suche letzte Buchung für Geschäftspartner:", result.geschaeftspartner);
          console.log("[OCR]    im Unternehmen:", unternehmenId);

          // Suche nach ähnlichem Geschäftspartner (case-insensitive LIKE) im selben Unternehmen
          const lastBooking = await db
            .select({
              sachkonto: buchungen.sachkonto,
              geschaeftspartner: buchungen.geschaeftspartner,
              buchungstext: buchungen.buchungstext,
              belegdatum: buchungen.belegdatum,
            })
            .from(buchungen)
            .where(
              and(
                eq(buchungen.unternehmenId, unternehmenId),
                like(buchungen.geschaeftspartner, `%${result.geschaeftspartner}%`)
              )
            )
            .orderBy(desc(buchungen.belegdatum))
            .limit(1);

          if (lastBooking.length > 0 && lastBooking[0].sachkonto) {
            result.sachkonto = lastBooking[0].sachkonto;
            result.sachkontoBeschreibung = `Aus letzter Buchung für ${lastBooking[0].geschaeftspartner}`;
            result.erkannteFelder.push("sachkonto");
            console.log("[OCR] ✅ Sachkonto aus letzter Buchung übernommen:", result.sachkonto);
            console.log("[OCR]    Letzte Buchung vom:", lastBooking[0].belegdatum);
          } else {
            console.log("[OCR] ℹ️ Keine frühere Buchung für diesen Geschäftspartner gefunden");
          }
        }
      } catch (dbError) {
        console.error("[OCR] ⚠️ Fehler beim Lookup der letzten Buchung:", dbError);
        // Fahre fort mit Keyword-Matching als Fallback
      }
    }

    // 🔍 SCHRITT 2: Sachkonto basierend auf Keywords vorschlagen (Fallback)
    if (!result.sachkonto && result.geschaeftspartner) {
      const partnerLower = result.geschaeftspartner.toLowerCase();
      for (const [keyword, konto] of Object.entries(SACHKONTO_KEYWORDS)) {
        if (partnerLower.includes(keyword.toLowerCase())) {
          result.sachkonto = kontenrahmen === "SKR04" ? konto.skr04 : konto.skr03;
          result.sachkontoBeschreibung = konto.beschreibung;
          result.erkannteFelder.push("sachkonto");
          console.log("[OCR] ✅ Sachkonto aus Keyword-Matching:", result.sachkonto);
          break;
        }
      }
    }

    // 🔍 SCHRITT 3: Fallback - Versuche Sachkonto aus dem Rohtext zu ermitteln
    if (!result.sachkonto && result.rohtext) {
      const textLower = result.rohtext.toLowerCase();
      for (const [keyword, konto] of Object.entries(SACHKONTO_KEYWORDS)) {
        if (textLower.includes(keyword.toLowerCase())) {
          result.sachkonto = kontenrahmen === "SKR04" ? konto.skr04 : konto.skr03;
          result.sachkontoBeschreibung = konto.beschreibung;
          result.erkannteFelder.push("sachkonto");
          console.log("[OCR] ✅ Sachkonto aus Rohtext-Keyword-Matching:", result.sachkonto);
          break;
        }
      }
    }

    // Standardwerte
    if (!result.steuersatz) {
      result.steuersatz = 19;
    }

    // Fallback: Wenn keine Belegnummer gefunden, versuche aus Dateiname zu extrahieren
    if (!result.belegnummer && filename) {
      const extractedFromFilename = extractBelegnummerFromFilename(filename);
      if (extractedFromFilename) {
        result.belegnummer = extractedFromFilename;
        result.erkannteFelder.push("belegnummer (aus Dateiname)");
      }
    }

    return result;
  } catch (error) {
    console.error("[OCR] Vision-AI Fehler:", error);
    // Fallback auf Text-basierte Extraktion
    return extractDataFromText("", kontenrahmen, filename);
  }
}

// ============================================
// PDF DIREKTE ANALYSE (ohne Bild-Konvertierung)
// ============================================
async function analyzePdfWithClaude(
  pdfBase64: string,
  kontenrahmen: string = "SKR03",
  unternehmenId?: number,
  filename?: string
): Promise<OcrResult> {
  console.log("[OCR] 🚀 Starte Claude PDF Direkt-Analyse...");
  console.log("[OCR] 📄 PDF Base64 Länge:", pdfBase64.length);

  const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

  if (!ENV.anthropicApiKey) {
    console.error("[OCR] ❌ ANTHROPIC_API_KEY nicht konfiguriert!");
    throw new Error("ANTHROPIC_API_KEY ist nicht konfiguriert");
  }

  // Strip DataURL prefix if present
  const rawPdfBase64 = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;

  try {
    console.log("[OCR] 📤 Sende PDF direkt an Claude API...");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: PDF_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: rawPdfBase64,
              },
            } as any,
            {
              type: "text",
              text: "Analysiere diesen Beleg und extrahiere die Rechnungsdaten als JSON:",
            },
          ],
        },
      ],
    });

    console.log("[OCR] ✅ Claude PDF Response erhalten");

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("Keine Text-Antwort von Claude erhalten");
    }

    const content = textContent.text;
    console.log("[OCR] 📝 Raw Content (erste 500 Zeichen):", content.substring(0, 500));

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[OCR] ❌ Kein JSON gefunden in:", content);
      throw new Error("Keine JSON-Antwort gefunden");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[OCR] ✅ JSON geparsed:", JSON.stringify(parsed, null, 2));

    const result: OcrResult = {
      belegdatum: parsed.belegdatum || null,
      belegnummer: parsed.belegnummer || null,
      nettobetrag: typeof parsed.nettobetrag === "number" ? parsed.nettobetrag : null,
      bruttobetrag: typeof parsed.bruttobetrag === "number" ? parsed.bruttobetrag : null,
      steuersatz: typeof parsed.steuersatz === "number" ? parsed.steuersatz : null,
      steuerbetrag: typeof parsed.steuerbetrag === "number" ? parsed.steuerbetrag : null,
      zeitraumVon: parsed.zeitraumVon || null,
      zeitraumBis: parsed.zeitraumBis || null,
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

    // Konfidenz berechnen
    let konfidenzPunkte = 0;
    if (result.belegdatum) { konfidenzPunkte += 15; result.erkannteFelder.push("belegdatum"); }
    if (result.belegnummer) { konfidenzPunkte += 10; result.erkannteFelder.push("belegnummer"); }
    if (result.bruttobetrag) { konfidenzPunkte += 20; result.erkannteFelder.push("bruttobetrag"); }
    if (result.nettobetrag) { konfidenzPunkte += 15; result.erkannteFelder.push("nettobetrag"); }
    if (result.steuersatz) { konfidenzPunkte += 10; result.erkannteFelder.push("steuersatz"); }
    if (result.geschaeftspartner) { konfidenzPunkte += 15; result.erkannteFelder.push("geschaeftspartner"); }
    if (result.zeitraumVon) { konfidenzPunkte += 5; result.erkannteFelder.push("zeitraumVon"); }
    if (result.zeitraumBis) { konfidenzPunkte += 5; result.erkannteFelder.push("zeitraumBis"); }
    if (result.iban) { konfidenzPunkte += 5; result.erkannteFelder.push("iban"); }
    if (result.ustIdNr) { konfidenzPunkte += 5; result.erkannteFelder.push("ustIdNr"); }
    result.konfidenz = Math.min(konfidenzPunkte, 100);

    // Sachkonto-Lookup aus letzter Buchung
    if (result.geschaeftspartner && unternehmenId) {
      try {
        const db = await getDb();
        if (db) {
          const lastBooking = await db
            .select({ sachkonto: buchungen.sachkonto, geschaeftspartner: buchungen.geschaeftspartner, belegdatum: buchungen.belegdatum })
            .from(buchungen)
            .where(and(eq(buchungen.unternehmenId, unternehmenId), like(buchungen.geschaeftspartner, `%${result.geschaeftspartner}%`)))
            .orderBy(desc(buchungen.belegdatum))
            .limit(1);

          if (lastBooking.length > 0 && lastBooking[0].sachkonto) {
            result.sachkonto = lastBooking[0].sachkonto;
            result.sachkontoBeschreibung = `Aus letzter Buchung für ${lastBooking[0].geschaeftspartner}`;
            result.erkannteFelder.push("sachkonto");
            console.log("[OCR] ✅ Sachkonto aus letzter Buchung:", result.sachkonto);
          }
        }
      } catch (dbError) {
        console.error("[OCR] ⚠️ Fehler beim Sachkonto-Lookup:", dbError);
      }
    }

    // Keyword-Fallback für Sachkonto
    if (!result.sachkonto && result.geschaeftspartner) {
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

    if (!result.steuersatz) result.steuersatz = 19;

    if (!result.belegnummer && filename) {
      const fromFilename = extractBelegnummerFromFilename(filename);
      if (fromFilename) {
        result.belegnummer = fromFilename;
        result.erkannteFelder.push("belegnummer (aus Dateiname)");
      }
    }

    return result;
  } catch (error) {
    console.error("[OCR] PDF Direkt-Analyse Fehler:", error);
    return extractDataFromText("", kontenrahmen, filename);
  }
}

// ============================================
// PDF ZU BILD KONVERTIERUNG (Legacy, nicht mehr verwendet für direkte Claude-Analyse)
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
        filename: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Konvertiere internationale Kontenrahmen zu SKR03/SKR04 für die Kontenzuordnung
      const effectiveKontenrahmen = ["SKR03", "SKR04"].includes(input.kontenrahmen)
        ? input.kontenrahmen
        : "SKR03";
      return extractDataFromText(input.text, effectiveKontenrahmen, input.filename);
    }),

  // Vision-AI basierte OCR für Bilder
  analyzeImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        mimeType: z.string(),
        kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).default("SKR03"),
        unternehmenId: z.number().optional(), // Optional: für Sachkonto-Lookup aus vorherigen Buchungen
        filename: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const effectiveKontenrahmen = ["SKR03", "SKR04"].includes(input.kontenrahmen)
        ? input.kontenrahmen
        : "SKR03";
      return analyzeImageWithVision(input.imageBase64, input.mimeType, effectiveKontenrahmen, input.unternehmenId, input.filename);
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
      return extractDataFromText(simulatedText, effectiveKontenrahmen, input.filename);
    }),

  // PDF-OCR: Konvertiert PDF zu Bild und analysiert mit Vision-AI
  analyzePdf: protectedProcedure
    .input(
      z.object({
        pdfBase64: z.string(),
        kontenrahmen: z.enum(["SKR03", "SKR04", "OeKR", "RLG", "KMU", "OR", "UK_GAAP", "IFRS", "CY_GAAP"]).default("SKR03"),
        unternehmenId: z.number().optional(), // Optional: für Sachkonto-Lookup aus vorherigen Buchungen
        filename: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[OCR] 🚀 PDF-Analyse gestartet...");
      console.log("[OCR] 📄 PDF Base64 Länge:", input.pdfBase64.length);
      console.log("[OCR] 🔧 Kontenrahmen:", input.kontenrahmen);
      if (input.unternehmenId) {
        console.log("[OCR] 🏢 UnternehmenId:", input.unternehmenId);
      }

      try {
        // PDF direkt an Claude senden (kein pdftoppm mehr nötig)
        const effectiveKontenrahmen = ["SKR03", "SKR04"].includes(input.kontenrahmen)
          ? input.kontenrahmen
          : "SKR03";

        console.log("[OCR] 🤖 Sende PDF direkt an Claude (ohne Bild-Konvertierung)...");
        const result = await analyzePdfWithClaude(input.pdfBase64, effectiveKontenrahmen, input.unternehmenId, input.filename);

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
