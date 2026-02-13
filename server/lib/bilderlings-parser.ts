/**
 * Bilderlings CSV Parser
 *
 * Parses Bilderlings transaction exports in CSV format.
 * Bilderlings is an EU fintech bank.
 *
 * Features:
 * - Semicolon delimiter
 * - Status filtering (only "Completed" transactions)
 * - Balance field available
 * - Simple format
 */

export interface BilderlingsHeader {
  format: 'BILDERLINGS';
  columns: string[];
  hasValidHeader: boolean;
  delimiter: ';';
}

export interface BilderlingsPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface BilderlingsParseResult {
  header: BilderlingsHeader;
  positionen: BilderlingsPosition[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Parse flexible number formats
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
 * Prüft ob die CSV-Datei im Bilderlings-Format vorliegt
 */
export function isValidBilderlingsFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0].toLowerCase();

  // Bilderlings CSV hat typischerweise: "Date", "Time", "Description", "Amount", "Balance", "Reference", "Status"
  // Sehr spezifisch: Date + Time + Balance + Reference zusammen
  return (
    firstLine.includes('date') &&
    firstLine.includes('time') &&
    firstLine.includes('balance') &&
    firstLine.includes('reference') &&
    firstLine.includes(';') // Semikolon als Delimiter
  );
}

/**
 * Parst eine Bilderlings CSV-Datei und extrahiert alle Positionen
 */
export function parseBilderlingsCSV(csvContent: string): BilderlingsParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: BilderlingsPosition[] = [];

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'BILDERLINGS', columns: [], hasValidHeader: false, delimiter: ';' },
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Header parsen (Semikolon-Delimiter)
  const headerLine = lines[0];
  const columns = headerLine.split(';').map(col => col.replace(/^"|"$/g, '').trim());

  const header: BilderlingsHeader = {
    format: 'BILDERLINGS',
    columns,
    delimiter: ';',
    hasValidHeader: columns.some(c => c.toLowerCase() === 'date') &&
                     columns.some(c => c.toLowerCase() === 'amount'),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - Bilderlings-Format erwartet');
    return {
      header,
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Spalten-Indizes ermitteln
  const dateIndex = columns.findIndex(c => c.toLowerCase() === 'date');
  const timeIndex = columns.findIndex(c => c.toLowerCase() === 'time');
  const descriptionIndex = columns.findIndex(c => c.toLowerCase() === 'description');
  const amountIndex = columns.findIndex(c => c.toLowerCase() === 'amount');
  const currencyIndex = columns.findIndex(c => c.toLowerCase() === 'currency');
  const balanceIndex = columns.findIndex(c => c.toLowerCase() === 'balance');
  const referenceIndex = columns.findIndex(c => c.toLowerCase() === 'reference');
  const statusIndex = columns.findIndex(c => c.toLowerCase() === 'status');

  // Validierung
  if (dateIndex === -1) {
    errors.push('Spalte "Date" nicht gefunden');
  }
  if (amountIndex === -1) {
    errors.push('Spalte "Amount" nicht gefunden');
  }
  if (descriptionIndex === -1) {
    errors.push('Spalte "Description" nicht gefunden');
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
    const fields = line.split(';').map(f => f.replace(/^"|"$/g, '').trim());

    const posErrors: string[] = [];
    const posWarnings: string[] = [];

    // Status prüfen (nur "Completed" importieren)
    const status = statusIndex !== -1 ? fields[statusIndex] : '';
    const isCompleted = status.toLowerCase() === 'completed' || status.toLowerCase() === 'complete';

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

    // Buchungstext
    const description = fields[descriptionIndex] || '';

    if (!description.trim()) {
      posErrors.push('Beschreibung fehlt');
    }

    // Referenz
    const referenz = referenceIndex !== -1 ? fields[referenceIndex] : undefined;

    // Kategorie (Currency kann als Kategorie verwendet werden)
    const currency = currencyIndex !== -1 ? fields[currencyIndex] : undefined;
    const kategorie = currency || undefined;

    // Position erstellen
    positionen.push({
      datum: datum || new Date(),
      buchungstext: description.trim(),
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
