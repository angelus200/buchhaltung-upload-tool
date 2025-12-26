import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";

// ============================================
// OCR SERVICE - Automatische Belegerkennung
// ============================================

// Regex-Patterns für deutsche Rechnungen
const PATTERNS = {
  // Datum: DD.MM.YYYY oder DD/MM/YYYY oder YYYY-MM-DD
  datum: /(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}|\d{4}-\d{2}-\d{2})/g,
  
  // Beträge: 1.234,56 € oder 1234.56 EUR oder €1,234.56
  betrag: /(?:€\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(?:€|EUR)?/g,
  
  // Steuersätze: 19%, 7%, MwSt
  steuersatz: /(\d{1,2})\s*%\s*(?:MwSt|USt|Mehrwertsteuer|Umsatzsteuer)?/gi,
  
  // Rechnungsnummer
  rechnungsnummer: /(?:Rechnung(?:s)?(?:nummer|nr\.?)?|Invoice(?:\s*No\.?)?|Beleg(?:nummer|nr\.?)?)\s*[:#]?\s*([A-Z0-9\-\/]+)/gi,
  
  // IBAN
  iban: /[A-Z]{2}\d{2}\s?(?:\d{4}\s?){4}\d{2}/g,
  
  // USt-IdNr
  ustIdNr: /DE\s?\d{9}/g,
  
  // Steuernummer
  steuernummer: /\d{2,3}\/\d{3}\/\d{5}/g,
};

// Bekannte Sachkonten-Keywords für SKR03/SKR04
const SACHKONTO_KEYWORDS: Record<string, { skr03: string; skr04: string; beschreibung: string }> = {
  // Aufwendungen
  "büromaterial": { skr03: "4930", skr04: "6815", beschreibung: "Bürobedarf" },
  "bürobedarf": { skr03: "4930", skr04: "6815", beschreibung: "Bürobedarf" },
  "telefon": { skr03: "4920", skr04: "6805", beschreibung: "Telefon" },
  "internet": { skr03: "4920", skr04: "6805", beschreibung: "Telefon/Internet" },
  "miete": { skr03: "4210", skr04: "6310", beschreibung: "Miete" },
  "strom": { skr03: "4240", skr04: "6325", beschreibung: "Gas, Strom, Wasser" },
  "gas": { skr03: "4240", skr04: "6325", beschreibung: "Gas, Strom, Wasser" },
  "versicherung": { skr03: "4360", skr04: "6400", beschreibung: "Versicherungen" },
  "kfz": { skr03: "4510", skr04: "6520", beschreibung: "Kfz-Kosten" },
  "tanken": { skr03: "4530", skr04: "6530", beschreibung: "Kfz-Betriebskosten" },
  "benzin": { skr03: "4530", skr04: "6530", beschreibung: "Kfz-Betriebskosten" },
  "diesel": { skr03: "4530", skr04: "6530", beschreibung: "Kfz-Betriebskosten" },
  "reise": { skr03: "4660", skr04: "6650", beschreibung: "Reisekosten" },
  "hotel": { skr03: "4660", skr04: "6650", beschreibung: "Reisekosten" },
  "bewirtung": { skr03: "4650", skr04: "6640", beschreibung: "Bewirtungskosten" },
  "restaurant": { skr03: "4650", skr04: "6640", beschreibung: "Bewirtungskosten" },
  "werbung": { skr03: "4600", skr04: "6600", beschreibung: "Werbekosten" },
  "software": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "hardware": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "computer": { skr03: "4964", skr04: "6835", beschreibung: "EDV-Kosten" },
  "porto": { skr03: "4910", skr04: "6800", beschreibung: "Porto" },
  "rechtsanwalt": { skr03: "4950", skr04: "6825", beschreibung: "Rechts- und Beratungskosten" },
  "steuerberater": { skr03: "4955", skr04: "6827", beschreibung: "Buchführungskosten" },
  "fortbildung": { skr03: "4945", skr04: "6821", beschreibung: "Fortbildungskosten" },
  "schulung": { skr03: "4945", skr04: "6821", beschreibung: "Fortbildungskosten" },
  
  // Erträge
  "umsatz": { skr03: "8400", skr04: "4400", beschreibung: "Erlöse" },
  "erlöse": { skr03: "8400", skr04: "4400", beschreibung: "Erlöse" },
  "honorar": { skr03: "8400", skr04: "4400", beschreibung: "Erlöse" },
  "provision": { skr03: "8400", skr04: "4400", beschreibung: "Erlöse" },
};

// Bekannte Lieferanten/Kreditoren
const BEKANNTE_LIEFERANTEN: Record<string, { name: string; typ: string }> = {
  "amazon": { name: "Amazon", typ: "kreditor" },
  "telekom": { name: "Deutsche Telekom", typ: "kreditor" },
  "vodafone": { name: "Vodafone", typ: "kreditor" },
  "o2": { name: "O2/Telefónica", typ: "kreditor" },
  "ikea": { name: "IKEA", typ: "kreditor" },
  "mediamarkt": { name: "MediaMarkt", typ: "kreditor" },
  "saturn": { name: "Saturn", typ: "kreditor" },
  "conrad": { name: "Conrad Electronic", typ: "kreditor" },
  "office depot": { name: "Office Depot", typ: "kreditor" },
  "staples": { name: "Staples", typ: "kreditor" },
  "shell": { name: "Shell", typ: "kreditor" },
  "aral": { name: "Aral", typ: "kreditor" },
  "esso": { name: "Esso", typ: "kreditor" },
  "total": { name: "TotalEnergies", typ: "kreditor" },
  "db": { name: "Deutsche Bahn", typ: "kreditor" },
  "lufthansa": { name: "Lufthansa", typ: "kreditor" },
  "microsoft": { name: "Microsoft", typ: "kreditor" },
  "google": { name: "Google", typ: "kreditor" },
  "apple": { name: "Apple", typ: "kreditor" },
  "adobe": { name: "Adobe", typ: "kreditor" },
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
    // Nimm das erste gefundene Datum (meist Rechnungsdatum)
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
  
  // 3. Beträge extrahieren
  const betragMatches = text.match(PATTERNS.betrag);
  if (betragMatches && betragMatches.length > 0) {
    const betraege = betragMatches
      .map(b => parseGermanAmount(b))
      .filter((b): b is number => b !== null && b > 0)
      .sort((a, b) => b - a); // Größter zuerst
    
    if (betraege.length > 0) {
      // Größter Betrag ist meist Brutto
      result.bruttobetrag = betraege[0];
      result.erkannteFelder.push("bruttobetrag");
      konfidenzPunkte += 20;
      
      // Wenn mehrere Beträge, versuche Netto zu finden
      if (betraege.length > 1) {
        // Suche nach typischen Netto-Brutto-Verhältnissen (19%, 7%)
        for (const netto of betraege.slice(1)) {
          const ratio19 = result.bruttobetrag / netto;
          const ratio7 = result.bruttobetrag / netto;
          
          if (Math.abs(ratio19 - 1.19) < 0.01) {
            result.nettobetrag = netto;
            result.steuersatz = 19;
            result.steuerbetrag = result.bruttobetrag - netto;
            break;
          } else if (Math.abs(ratio7 - 1.07) < 0.01) {
            result.nettobetrag = netto;
            result.steuersatz = 7;
            result.steuerbetrag = result.bruttobetrag - netto;
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
      if (satz === 19 || satz === 7 || satz === 0) {
        result.steuersatz = satz;
        result.erkannteFelder.push("steuersatz");
        konfidenzPunkte += 10;
        
        // Berechne Netto aus Brutto wenn möglich
        if (result.bruttobetrag && !result.nettobetrag) {
          result.nettobetrag = result.bruttobetrag / (1 + satz / 100);
          result.steuerbetrag = result.bruttobetrag - result.nettobetrag;
        }
      }
    }
  }
  
  // 5. Geschäftspartner erkennen
  for (const [keyword, info] of Object.entries(BEKANNTE_LIEFERANTEN)) {
    if (textLower.includes(keyword)) {
      result.geschaeftspartner = info.name;
      result.geschaeftspartnerTyp = info.typ as "kreditor" | "debitor" | "sonstig";
      result.erkannteFelder.push("geschaeftspartner");
      konfidenzPunkte += 15;
      break;
    }
  }
  
  // 6. Sachkonto vorschlagen basierend auf Keywords
  for (const [keyword, konto] of Object.entries(SACHKONTO_KEYWORDS)) {
    if (textLower.includes(keyword)) {
      result.sachkonto = kontenrahmen === "SKR04" ? konto.skr04 : konto.skr03;
      result.sachkontoBeschreibung = konto.beschreibung;
      result.buchungsart = konto.skr03.startsWith("8") || konto.skr04.startsWith("4") ? "ertrag" : "aufwand";
      result.erkannteFelder.push("sachkonto");
      konfidenzPunkte += 10;
      break;
    }
  }
  
  // 7. IBAN extrahieren
  const ibanMatch = text.match(PATTERNS.iban);
  if (ibanMatch) {
    result.iban = ibanMatch[0].replace(/\s/g, "");
    result.erkannteFelder.push("iban");
    konfidenzPunkte += 5;
  }
  
  // 8. USt-IdNr extrahieren
  const ustIdNrMatch = text.match(PATTERNS.ustIdNr);
  if (ustIdNrMatch) {
    result.ustIdNr = ustIdNrMatch[0].replace(/\s/g, "");
    result.erkannteFelder.push("ustIdNr");
    konfidenzPunkte += 5;
  }
  
  // Konfidenz berechnen (max 100)
  result.konfidenz = Math.min(konfidenzPunkte, 100);
  
  // Standardwerte setzen falls nicht erkannt
  if (!result.steuersatz) {
    result.steuersatz = 19; // Standard-Steuersatz
  }
  if (!result.buchungsart) {
    result.buchungsart = "aufwand"; // Standard: Aufwand
  }
  if (!result.geschaeftspartnerTyp) {
    result.geschaeftspartnerTyp = "kreditor"; // Standard: Kreditor
  }
  
  return result;
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
        kontenrahmen: z.enum(["SKR03", "SKR04"]).default("SKR03"),
      })
    )
    .mutation(async ({ input }) => {
      return extractDataFromText(input.text, input.kontenrahmen);
    }),

  // Simulierte OCR für Demo-Zwecke (ohne echte OCR-Engine)
  // In Produktion würde hier eine echte OCR-API (Google Vision, AWS Textract, etc.) verwendet
  simulateOcr: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        kontenrahmen: z.enum(["SKR03", "SKR04"]).default("SKR03"),
      })
    )
    .mutation(async ({ input }) => {
      // Simuliere OCR basierend auf Dateinamen
      const filename = input.filename.toLowerCase();
      let simulatedText = "";
      
      if (filename.includes("rechnung") || filename.includes("invoice")) {
        simulatedText = `
          Rechnung Nr. RE-2024-001
          Datum: 15.12.2024
          
          Amazon EU S.à r.l.
          USt-IdNr: LU26375245
          
          Büromaterial
          Nettobetrag: 84,03 €
          MwSt 19%: 15,97 €
          Bruttobetrag: 100,00 €
          
          IBAN: DE89 3704 0044 0532 0130 00
        `;
      } else if (filename.includes("tankquittung") || filename.includes("tanken")) {
        simulatedText = `
          Shell Station
          Datum: 20.12.2024
          
          Diesel: 45,50 Liter
          Preis: 1,659 €/L
          
          Netto: 63,45 €
          MwSt 19%: 12,06 €
          Brutto: 75,51 €
        `;
      } else if (filename.includes("hotel") || filename.includes("reise")) {
        simulatedText = `
          Hotel Beispiel GmbH
          Rechnung Nr. H-2024-5678
          Datum: 10.12.2024
          
          Übernachtung 2 Nächte
          Netto: 168,07 €
          MwSt 7%: 11,76 €
          Brutto: 179,83 €
        `;
      } else {
        // Generische Rechnung
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
      
      return extractDataFromText(simulatedText, input.kontenrahmen);
    }),
});

export type OcrRouter = typeof ocrRouter;
