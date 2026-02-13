/**
 * American Express CSV Parser
 *
 * Parses American Express transaction exports in CSV format.
 *
 * Features:
 * - Simple format with few columns
 * - Automatic delimiter detection (comma or semicolon)
 * - International number formats
 * - International date formats
 * - WICHTIG: Beträge sind umgekehrt - Ausgaben sind positiv, Gutschriften negativ
 */

import { parseGermanNumber, parseGermanDate } from './datev-parser';

export interface AmexHeader {
  format: 'AMEX';
  columns: string[];
  hasValidHeader: boolean;
  delimiter: ',' | ';';
}

export interface AmexPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface AmexParseResult {
  header: AmexHeader;
  positionen: AmexPosition[];
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
 * Prüft ob die CSV-Datei im AmEx-Format vorliegt
 */
export function isValidAmexFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0].toLowerCase();

  // AmEx CSV hat typischerweise: "Card Member" oder "Kartenmitglied"
  return (
    firstLine.includes('card member') ||
    firstLine.includes('kartenmitglied')
  );
}

/**
 * Parst eine American Express CSV-Datei und extrahiert alle Positionen
 */
export function parseAmexCSV(csvContent: string): AmexParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: AmexPosition[] = [];

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'AMEX', columns: [], hasValidHeader: false, delimiter: ',' },
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

  const header: AmexHeader = {
    format: 'AMEX',
    columns,
    delimiter,
    hasValidHeader: columns.some(c =>
      c.toLowerCase().includes('card member') || c.toLowerCase().includes('kartenmitglied')
    ),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - American Express-Format erwartet');
    return {
      header,
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Spalten-Indizes ermitteln
  const dateIndex = columns.findIndex(c => c.toLowerCase() === 'date' || c.toLowerCase() === 'datum');
  const descriptionIndex = columns.findIndex(c =>
    c.toLowerCase() === 'description' || c.toLowerCase() === 'beschreibung'
  );
  const cardMemberIndex = columns.findIndex(c =>
    c.toLowerCase().includes('card member') || c.toLowerCase().includes('kartenmitglied')
  );
  const accountIndex = columns.findIndex(c =>
    c.toLowerCase().includes('account') || c.toLowerCase().includes('kontonummer')
  );
  const amountIndex = columns.findIndex(c => c.toLowerCase() === 'amount' || c.toLowerCase() === 'betrag');

  // Validierung
  if (dateIndex === -1) {
    errors.push('Spalte "Date" oder "Datum" nicht gefunden');
  }
  if (amountIndex === -1) {
    errors.push('Spalte "Amount" oder "Betrag" nicht gefunden');
  }
  if (descriptionIndex === -1) {
    errors.push('Spalte "Description" oder "Beschreibung" nicht gefunden');
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

    // Datum parsen
    const datumStr = fields[dateIndex] || '';
    const datum = parseInternationalDate(datumStr);

    if (!datum) {
      posErrors.push(`Ungültiges Datum: ${datumStr}`);
    }

    // Betrag parsen
    // WICHTIG: Bei AmEx sind Ausgaben positiv, also müssen wir negieren!
    const betragStr = fields[amountIndex] || '';
    let betrag = parseFlexibleNumber(betragStr);

    // AmEx: Ausgaben sind positiv in CSV, aber sollen negativ sein für Buchhaltung
    // Gutschriften sind negativ in CSV, sollen positiv sein
    betrag = -betrag;

    if (betrag === 0 && betragStr !== '0' && betragStr !== '0.00' && betragStr !== '0,00') {
      posErrors.push(`Ungültiger Betrag: ${betragStr}`);
    }

    // Buchungstext
    const description = fields[descriptionIndex] || '';
    const cardMember = cardMemberIndex !== -1 ? fields[cardMemberIndex] : '';

    let buchungstext = description;
    if (cardMember) {
      buchungstext += ` (${cardMember})`;
    }

    if (!buchungstext.trim()) {
      posErrors.push('Beschreibung fehlt');
    }

    // Referenz (Kontonummer)
    const referenz = accountIndex !== -1 ? fields[accountIndex] : undefined;

    // Kategorie (Card Member)
    const kategorie = cardMember || undefined;

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
