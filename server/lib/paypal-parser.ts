/**
 * PayPal CSV Parser
 *
 * Parses PayPal transaction exports in CSV format.
 * Supports both German and English formats with automatic detection.
 *
 * Features:
 * - Automatic delimiter detection (comma or semicolon)
 * - International number formats (1,234.56 and 1.234,56)
 * - International date formats (DD.MM.YYYY, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * - Status filtering (only "Abgeschlossen"/"Completed" transactions)
 */

export interface PayPalHeader {
  format: 'PAYPAL';
  columns: string[];
  hasValidHeader: boolean;
  delimiter: ',' | ';';
}

export interface PayPalPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface PayPalParseResult {
  header: PayPalHeader;
  positionen: PayPalPosition[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Parse internationale Zahlenformate (Punkt als Dezimaltrennzeichen)
 * Beispiele: "1234.56" -> 1234.56, "1,234.56" -> 1234.56, "-100.00" -> -100.00
 */
export function parseInternationalNumber(value: string): number {
  if (!value || value.trim() === '') return 0;

  // Entferne Währungssymbole, Leerzeichen und Tausender-Kommas
  const normalized = value
    .replace(/[$€£¥\s]/g, '')     // Währungssymbole entfernen
    .replace(/,(\d{3})/g, '$1');  // Tausender-Kommas entfernen (1,234 -> 1234)

  const number = parseFloat(normalized);
  return isNaN(number) ? 0 : number;
}

/**
 * Parse internationale Datumsformate
 * Unterstützt: DD.MM.YYYY, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
 */
export function parseInternationalDate(value: string): Date | null {
  if (!value || value.trim() === '') return null;

  // Versuche verschiedene Formate
  const formats = [
    // DD.MM.YYYY (Deutsch)
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    // DD/MM/YYYY (International)
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // YYYY-MM-DD (ISO)
    /^(\d{4})-(\d{2})-(\d{2})$/,
  ];

  for (const regex of formats) {
    const match = value.match(regex);
    if (match) {
      if (regex.source.startsWith('^(\\d{4})')) {
        // YYYY-MM-DD
        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // DD.MM.YYYY oder DD/MM/YYYY
        const [, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
  }

  // Fallback: JavaScript Date-Parser (unterstützt viele Formate)
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Erkennt Delimiter automatisch (Komma oder Semikolon)
 */
export function detectDelimiter(headerLine: string): ',' | ';' {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Prüft ob die CSV-Datei im PayPal-Format vorliegt
 */
export function isValidPayPalFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0].toLowerCase();

  // PayPal CSV hat typischerweise diese Header-Spalten
  // Deutsch: "Datum", "Transaktionscode", "Brutto", "Netto"
  // Englisch: "Date", "Transaction ID", "Gross", "Net"
  return (
    (firstLine.includes('datum') || firstLine.includes('date')) &&
    (firstLine.includes('transaktionscode') || firstLine.includes('transaction id')) &&
    (firstLine.includes('brutto') || firstLine.includes('gross') || firstLine.includes('netto') || firstLine.includes('net'))
  );
}

/**
 * Parst eine PayPal CSV-Datei und extrahiert alle Positionen
 */
export function parsePayPalCSV(csvContent: string): PayPalParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: PayPalPosition[] = [];

  // Zeilen splitten
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'PAYPAL', columns: [], hasValidHeader: false, delimiter: ',' },
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Header parsen
  const headerLine = lines[0];
  const delimiter = detectDelimiter(headerLine);
  const columns = headerLine.split(delimiter).map(col => col.replace(/^"|"$/g, '').trim());

  const header: PayPalHeader = {
    format: 'PAYPAL',
    columns,
    delimiter,
    hasValidHeader: columns.some(c => c.toLowerCase().includes('date') || c.toLowerCase().includes('datum')),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - PayPal-Format erwartet');
    return {
      header,
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Spalten-Indizes ermitteln (case-insensitive)
  const datumIndex = columns.findIndex(c => c.toLowerCase() === 'datum' || c.toLowerCase() === 'date');
  const nameIndex = columns.findIndex(c => c.toLowerCase() === 'name');
  const typIndex = columns.findIndex(c => c.toLowerCase() === 'typ' || c.toLowerCase() === 'type');
  const statusIndex = columns.findIndex(c => c.toLowerCase() === 'status');
  const bruttoIndex = columns.findIndex(c => c.toLowerCase() === 'brutto' || c.toLowerCase() === 'gross');
  const nettoIndex = columns.findIndex(c => c.toLowerCase() === 'netto' || c.toLowerCase() === 'net');
  const transactionIdIndex = columns.findIndex(c =>
    c.toLowerCase().includes('transaktionscode') ||
    c.toLowerCase().includes('transaction id') ||
    c.toLowerCase().includes('transaktions-id')
  );

  // Validierung
  if (datumIndex === -1) {
    errors.push('Spalte "Datum" oder "Date" nicht gefunden');
  }
  if (bruttoIndex === -1 && nettoIndex === -1) {
    errors.push('Weder "Brutto"/"Gross" noch "Netto"/"Net" Spalte gefunden');
  }

  if (errors.length > 0) {
    return {
      header,
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Daten-Zeilen parsen
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = line.split(delimiter).map(f => f.replace(/^"|"$/g, '').trim());

    const posErrors: string[] = [];
    const posWarnings: string[] = [];

    // Status prüfen (nur "Abgeschlossen"/"Completed" importieren)
    const status = statusIndex !== -1 ? fields[statusIndex] : '';
    const isCompleted =
      status.toLowerCase() === 'abgeschlossen' ||
      status.toLowerCase() === 'completed';

    if (!isCompleted) {
      // Zeile überspringen (kein Fehler, nur Info)
      continue;
    }

    // Datum parsen
    const datumStr = fields[datumIndex] || '';
    const datum = parseInternationalDate(datumStr);

    if (!datum) {
      posErrors.push(`Ungültiges Datum: ${datumStr}`);
    }

    // Betrag parsen (bevorzugt Brutto, fallback Netto)
    const betragStr = bruttoIndex !== -1 ? fields[bruttoIndex] : fields[nettoIndex];
    const betrag = parseInternationalNumber(betragStr || '');

    if (betrag === 0 && betragStr !== '0' && betragStr !== '0.00') {
      posErrors.push(`Ungültiger Betrag: ${betragStr}`);
    }

    // Buchungstext zusammensetzen: "Name (Typ)"
    const name = nameIndex !== -1 ? fields[nameIndex] : '';
    const typ = typIndex !== -1 ? fields[typIndex] : '';
    const buchungstext = typ ? `${name} (${typ})` : name;

    if (!buchungstext) {
      posErrors.push('Name/Buchungstext fehlt');
    }

    // Transaktionscode als Referenz
    const referenz = transactionIdIndex !== -1 ? fields[transactionIdIndex] : undefined;

    // Typ als Kategorie
    const kategorie = typ || undefined;

    // Position erstellen
    positionen.push({
      datum: datum || new Date(),
      buchungstext,
      betrag,
      referenz,
      kategorie,
      rowNumber: i + 1,
      errors: posErrors,
      warnings: posWarnings,
    });
  }

  // Statistiken
  const validRows = positionen.filter(p => p.errors.length === 0).length;
  const invalidRows = positionen.length - validRows;

  if (validRows === 0 && positionen.length > 0) {
    warnings.push('Keine gültigen Zeilen gefunden - bitte CSV-Format prüfen');
  }

  return {
    header,
    positionen,
    errors,
    warnings,
    stats: {
      totalRows: positionen.length,
      validRows,
      invalidRows,
    },
  };
}
