/**
 * Soldo CSV Parser
 *
 * Parses Soldo transaction exports in CSV format.
 * Soldo is used with 30+ virtual cards requiring detailed card tracking.
 *
 * Features:
 * - Automatic delimiter detection (comma or semicolon)
 * - International number formats
 * - International date formats
 * - Status filtering (only "Completed"/"Abgeschlossen" transactions)
 * - Card tracking (Card Name + Last 4 digits)
 */

import { parseGermanNumber, parseGermanDate } from './datev-parser';

export interface SoldoHeader {
  format: 'SOLDO';
  columns: string[];
  hasValidHeader: boolean;
  delimiter: ',' | ';';
}

export interface SoldoPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface SoldoParseResult {
  header: SoldoHeader;
  positionen: SoldoPosition[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Parse flexible number formats (German and English)
 */
function parseFlexibleNumber(value: string): number {
  if (!value || value.trim() === '') return 0;

  let normalized = value.replace(/[$€£¥\s]/g, '');
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');

  if (lastComma > lastDot) {
    // German format: 1.234,56
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // English format: 1,234.56
    normalized = normalized.replace(/,/g, '');
  }

  const number = parseFloat(normalized);
  return isNaN(number) ? 0 : number;
}

/**
 * Parse international date formats
 */
function parseInternationalDate(value: string): Date | null {
  if (!value || value.trim() === '') return null;

  const formats = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
  ];

  for (const regex of formats) {
    const match = value.match(regex);
    if (match) {
      if (regex.source.startsWith('^(\\d{4})')) {
        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        const [, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Detect delimiter automatically
 */
function detectDelimiter(headerLine: string): ',' | ';' {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Prüft ob die CSV-Datei im Soldo-Format vorliegt
 */
export function isValidSoldoFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0].toLowerCase();

  // Soldo CSV hat typischerweise: "Card Name" + "Wallet"
  return (
    (firstLine.includes('card name') || firstLine.includes('kartenname')) &&
    (firstLine.includes('wallet') || firstLine.includes('konto'))
  );
}

/**
 * Parst eine Soldo CSV-Datei und extrahiert alle Positionen
 */
export function parseSoldoCSV(csvContent: string): SoldoParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: SoldoPosition[] = [];

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'SOLDO', columns: [], hasValidHeader: false, delimiter: ',' },
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

  const header: SoldoHeader = {
    format: 'SOLDO',
    columns,
    delimiter,
    hasValidHeader: columns.some(c =>
      c.toLowerCase().includes('card name') || c.toLowerCase().includes('kartenname')
    ),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - Soldo-Format erwartet');
    return {
      header,
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Spalten-Indizes ermitteln
  const transactionIdIndex = columns.findIndex(c =>
    c.toLowerCase().includes('transaction id') || c.toLowerCase().includes('transaktions-id')
  );
  const dateIndex = columns.findIndex(c => c.toLowerCase() === 'date' || c.toLowerCase() === 'datum');
  const descriptionIndex = columns.findIndex(c =>
    c.toLowerCase() === 'description' || c.toLowerCase() === 'beschreibung'
  );
  const categoryIndex = columns.findIndex(c =>
    c.toLowerCase() === 'category' || c.toLowerCase() === 'kategorie'
  );
  const cardNameIndex = columns.findIndex(c =>
    c.toLowerCase().includes('card name') || c.toLowerCase().includes('kartenname')
  );
  const cardLast4Index = columns.findIndex(c =>
    c.toLowerCase().includes('card last 4') || c.toLowerCase().includes('letzte 4')
  );
  const amountIndex = columns.findIndex(c => c.toLowerCase() === 'amount' || c.toLowerCase() === 'betrag');
  const statusIndex = columns.findIndex(c => c.toLowerCase() === 'status');
  const walletIndex = columns.findIndex(c => c.toLowerCase() === 'wallet' || c.toLowerCase() === 'konto');

  // Validierung
  if (dateIndex === -1) {
    errors.push('Spalte "Date" oder "Datum" nicht gefunden');
  }
  if (amountIndex === -1) {
    errors.push('Spalte "Amount" oder "Betrag" nicht gefunden');
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

    // Status prüfen
    const status = statusIndex !== -1 ? fields[statusIndex] : '';
    const isCompleted =
      status.toLowerCase() === 'completed' ||
      status.toLowerCase() === 'abgeschlossen' ||
      status.toLowerCase() === 'complete';

    if (statusIndex !== -1 && !isCompleted) {
      continue; // Überspringe nicht-abgeschlossene Transaktionen
    }

    // Datum parsen
    const datumStr = fields[dateIndex] || '';
    const datum = parseInternationalDate(datumStr);

    if (!datum) {
      posErrors.push(`Ungültiges Datum: ${datumStr}`);
    }

    // Betrag parsen
    const betragStr = fields[amountIndex] || '';
    const betrag = parseFlexibleNumber(betragStr);

    if (betrag === 0 && betragStr !== '0' && betragStr !== '0.00' && betragStr !== '0,00') {
      posErrors.push(`Ungültiger Betrag: ${betragStr}`);
    }

    // Buchungstext: "{Description} (Karte: {Card Name} ****{Card Last 4})"
    const description = descriptionIndex !== -1 ? fields[descriptionIndex] : '';
    const cardName = cardNameIndex !== -1 ? fields[cardNameIndex] : '';
    const cardLast4 = cardLast4Index !== -1 ? fields[cardLast4Index] : '';

    let buchungstext = description || 'Soldo Transaktion';

    if (cardName && cardLast4) {
      buchungstext += ` (Karte: ${cardName} ****${cardLast4})`;
    } else if (cardName) {
      buchungstext += ` (Karte: ${cardName})`;
    }

    if (!buchungstext.trim()) {
      posErrors.push('Buchungstext fehlt');
    }

    // Referenz
    const referenz = transactionIdIndex !== -1 ? fields[transactionIdIndex] : undefined;

    // Kategorie
    const category = categoryIndex !== -1 ? fields[categoryIndex] : '';
    const wallet = walletIndex !== -1 ? fields[walletIndex] : '';
    const kategorie = category && wallet ? `${category} (${wallet})` : category || wallet || undefined;

    // Position erstellen
    positionen.push({
      datum: datum || new Date(),
      buchungstext: buchungstext.trim(),
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
