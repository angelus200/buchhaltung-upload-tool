import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM, type Message } from "./_core/llm";
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
  const systemPrompt = `Du bist ein Experte für die Analyse von deutschen Geschäftsbelegen und Rechnungen.
Analysiere das Bild und extrahiere folgende Informationen:

1. Belegdatum (im Format YYYY-MM-DD)
2. Belegnummer/Rechnungsnummer
3. Nettobetrag (als Zahl, z.B. 84.03)
4. Bruttobetrag (als Zahl, z.B. 100.00)
5. Steuersatz (als Zahl, z.B. 19)
6. Steuerbetrag (als Zahl)
7. Name des Geschäftspartners/Lieferanten
8. IBAN (falls vorhanden)
9. USt-IdNr (falls vorhanden)

Antworte NUR mit einem JSON-Objekt im folgenden Format:
{
  "belegdatum": "YYYY-MM-DD" oder null,
  "belegnummer": "string" oder null,
  "nettobetrag": number oder null,
  "bruttobetrag": number oder null,
  "steuersatz": number oder null,
  "steuerbetrag": number oder null,
  "geschaeftspartner": "string" oder null,
  "iban": "string" oder null,
  "ustIdNr": "string" oder null,
  "erkannterText": "Der vollständige erkannte Text aus dem Beleg"
}

Wichtig:
- Beträge immer als Dezimalzahlen mit Punkt als Dezimaltrennzeichen (z.B. 100.00, nicht 100,00)
- Datum immer im Format YYYY-MM-DD
- Wenn ein Wert nicht erkennbar ist, setze null
- Der Geschäftspartner ist der Rechnungssteller/Lieferant, NICHT der Empfänger`;

  try {
    const messages: Message[] = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analysiere diesen Beleg und extrahiere die Rechnungsdaten:"
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: "high"
            }
          }
        ]
      }
    ];

    const response = await invokeLLM({ messages });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Keine Antwort von Vision-AI erhalten");
    }

    // Parse JSON aus der Antwort
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Keine JSON-Antwort gefunden");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
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
  // Erstelle temporäres Verzeichnis
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "pdf-ocr-"));
  const pdfPath = path.join(tempDir, "input.pdf");
  const outputPrefix = path.join(tempDir, "page");
  
  try {
    // Schreibe PDF in temporäre Datei
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    await fs.promises.writeFile(pdfPath, pdfBuffer);
    
    // Konvertiere erste Seite zu PNG mit pdftoppm
    // -png: Output als PNG
    // -f 1 -l 1: Nur erste Seite
    // -r 200: 200 DPI für gute Qualität
    await execAsync(`pdftoppm -png -f 1 -l 1 -r 200 "${pdfPath}" "${outputPrefix}"`);
    
    // Finde die generierte Bilddatei
    const files = await fs.promises.readdir(tempDir);
    const imageFile = files.find(f => f.startsWith("page") && f.endsWith(".png"));
    
    if (!imageFile) {
      throw new Error("PDF-Konvertierung fehlgeschlagen: Keine Bilddatei generiert");
    }
    
    const imagePath = path.join(tempDir, imageFile);
    const imageBuffer = await fs.promises.readFile(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    
    return {
      imageBase64,
      mimeType: "image/png"
    };
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
      console.log("[OCR] PDF-Analyse gestartet...");
      
      try {
        // Konvertiere PDF zu Bild
        const { imageBase64, mimeType } = await convertPdfToImage(input.pdfBase64);
        console.log("[OCR] PDF erfolgreich zu Bild konvertiert");
        
        // Analysiere das Bild mit Vision-AI
        const effectiveKontenrahmen = ["SKR03", "SKR04"].includes(input.kontenrahmen) 
          ? input.kontenrahmen 
          : "SKR03";
        
        const result = await analyzeImageWithVision(imageBase64, mimeType, effectiveKontenrahmen);
        console.log("[OCR] PDF-Analyse abgeschlossen, Konfidenz:", result.konfidenz);
        
        return result;
      } catch (error) {
        console.error("[OCR] PDF-Analyse Fehler:", error);
        throw new Error(`PDF-Analyse fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
      }
    }),
});

export type OcrRouter = typeof ocrRouter;
