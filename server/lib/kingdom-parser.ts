/**
 * The Kingdom Bank CSV Parser
 *
 * Parses The Kingdom Bank transaction exports in CSV format.
 * Small online bank with English format.
 *
 * Features:
 * - English format, comma delimiter
 * - Debit and Credit in SEPARATE columns
 * - Balance field available
 * - Amount calculation: Credit > 0 → positive, Debit > 0 → negative
 */

export interface KingdomHeader {
  format: 'KINGDOM';
  columns: string[];
  hasValidHeader: boolean;
  delimiter: ',';
}

export interface KingdomPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface KingdomParseResult {
  header: KingdomHeader;
  positionen: KingdomPosition[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Parse international number format
 */
function parseInternationalNumber(value: string): number {
  if (!value || value.trim() === '') return 0;

  const normalized = value
    .replace(/[$€£¥\s]/g, '')
    .replace(/,(\d{3})/g, '$1');

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
 * Prüft ob die CSV-Datei im Kingdom Bank-Format vorliegt
 */
export function isValidKingdomFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0].toLowerCase();

  // Kingdom Bank CSV hat: "Debit" UND "Credit" UND "Balance"
  return (
    firstLine.includes('debit') &&
    firstLine.includes('credit') &&
    firstLine.includes('balance')
  );
}

/**
 * Parst eine Kingdom Bank CSV-Datei und extrahiert alle Positionen
 */
export function parseKingdomCSV(csvContent: string): KingdomParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: KingdomPosition[] = [];

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'KINGDOM', columns: [], hasValidHeader: false, delimiter: ',' },
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Header parsen (Komma-Delimiter)
  const headerLine = lines[0];
  const columns = headerLine.split(',').map(col => col.replace(/^"|"$/g, '').trim());

  const header: KingdomHeader = {
    format: 'KINGDOM',
    columns,
    delimiter: ',',
    hasValidHeader: columns.some(c => c.toLowerCase() === 'debit') &&
                     columns.some(c => c.toLowerCase() === 'credit'),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - Kingdom Bank-Format erwartet');
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
  const valueDateIndex = columns.findIndex(c => c.toLowerCase() === 'value date');
  const descriptionIndex = columns.findIndex(c => c.toLowerCase() === 'description');
  const referenceIndex = columns.findIndex(c => c.toLowerCase() === 'reference');
  const debitIndex = columns.findIndex(c => c.toLowerCase() === 'debit');
  const creditIndex = columns.findIndex(c => c.toLowerCase() === 'credit');
  const balanceIndex = columns.findIndex(c => c.toLowerCase() === 'balance');

  // Validierung
  if (dateIndex === -1) {
    errors.push('Spalte "Date" nicht gefunden');
  }
  if (debitIndex === -1 || creditIndex === -1) {
    errors.push('Spalten "Debit" und "Credit" müssen vorhanden sein');
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
    const fields = line.split(',').map(f => f.replace(/^"|"$/g, '').trim());

    const posErrors: string[] = [];
    const posWarnings: string[] = [];

    // Datum parsen
    const datumStr = fields[dateIndex] || '';
    const datum = parseInternationalDate(datumStr);

    if (!datum) {
      posErrors.push(`Ungültiges Datum: ${datumStr}`);
    }

    // Betrag berechnen: Credit > 0 → positiv, Debit > 0 → negativ
    const debitStr = fields[debitIndex] || '';
    const creditStr = fields[creditIndex] || '';

    const debit = parseInternationalNumber(debitStr);
    const credit = parseInternationalNumber(creditStr);

    let betrag = 0;
    if (credit > 0) {
      betrag = credit; // Einzahlung (positiv)
    } else if (debit > 0) {
      betrag = -debit; // Ausgabe (negativ)
    }

    if (betrag === 0 && debitStr === '' && creditStr === '') {
      posErrors.push('Weder Debit noch Credit vorhanden');
    }

    // Buchungstext
    const description = fields[descriptionIndex] || '';

    if (!description.trim()) {
      posErrors.push('Beschreibung fehlt');
    }

    // Referenz
    const referenz = referenceIndex !== -1 ? fields[referenceIndex] : undefined;

    // Kategorie (kann aus Balance abgeleitet werden, falls gewünscht)
    const kategorie = undefined;

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
