/**
 * Relio CSV Parser
 *
 * Parses Relio transaction exports in CSV format.
 * Relio is a Swiss business banking platform.
 *
 * Features:
 * - Automatic delimiter detection (comma or semicolon)
 * - Swiss/International number formats
 * - International date formats
 * - Balance field support
 * - CHF currency support
 */

export interface RelioHeader {
  format: 'RELIO';
  columns: string[];
  hasValidHeader: boolean;
  delimiter: ',' | ';';
}

export interface RelioPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface RelioParseResult {
  header: RelioHeader;
  positionen: RelioPosition[];
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

  let normalized = value.replace(/[$€£¥CHF\s]/g, '');
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');

  if (lastComma > lastDot) {
    // German/Swiss format: 1'234,56 or 1.234,56
    normalized = normalized.replace(/['.]/g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // English format: 1,234.56
    normalized = normalized.replace(/[',]/g, '');
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
 * Prüft ob die CSV-Datei im Relio-Format vorliegt
 */
export function isValidRelioFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0].toLowerCase();

  // Relio CSV hat typischerweise: "buchungsdatum" oder "valuta" + "betrag" + "saldo"
  // Oder englisch: "booking date" + "amount" + "balance"
  return (
    (firstLine.includes('buchungsdatum') || firstLine.includes('booking date') ||
     firstLine.includes('valuta') || firstLine.includes('value date')) &&
    (firstLine.includes('betrag') || firstLine.includes('amount')) &&
    (firstLine.includes('saldo') || firstLine.includes('balance'))
  );
}

/**
 * Parst eine Relio CSV-Datei und extrahiert alle Positionen
 */
export function parseRelioCSV(csvContent: string): RelioParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: RelioPosition[] = [];

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'RELIO', columns: [], hasValidHeader: false, delimiter: ',' },
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

  const header: RelioHeader = {
    format: 'RELIO',
    columns,
    delimiter,
    hasValidHeader: columns.some(c =>
      c.toLowerCase().includes('buchungsdatum') ||
      c.toLowerCase().includes('booking date') ||
      c.toLowerCase().includes('valuta')
    ),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - Relio-Format erwartet');
    return {
      header,
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Spalten-Indizes ermitteln (case-insensitive)
  const dateIndex = columns.findIndex(c =>
    c.toLowerCase().includes('buchungsdatum') ||
    c.toLowerCase().includes('booking date') ||
    c.toLowerCase() === 'datum' ||
    c.toLowerCase() === 'date'
  );
  const valutaIndex = columns.findIndex(c =>
    c.toLowerCase().includes('valuta') ||
    c.toLowerCase().includes('value date')
  );
  const descriptionIndex = columns.findIndex(c =>
    c.toLowerCase().includes('buchungstext') ||
    c.toLowerCase().includes('beschreibung') ||
    c.toLowerCase().includes('description') ||
    c.toLowerCase() === 'text'
  );
  const amountIndex = columns.findIndex(c =>
    c.toLowerCase() === 'betrag' ||
    c.toLowerCase() === 'amount'
  );
  const balanceIndex = columns.findIndex(c =>
    c.toLowerCase() === 'saldo' ||
    c.toLowerCase() === 'balance'
  );
  const referenceIndex = columns.findIndex(c =>
    c.toLowerCase().includes('referenz') ||
    c.toLowerCase().includes('reference')
  );
  const categoryIndex = columns.findIndex(c =>
    c.toLowerCase() === 'kategorie' ||
    c.toLowerCase() === 'category'
  );

  // Validierung
  if (dateIndex === -1 && valutaIndex === -1) {
    errors.push('Spalte "Buchungsdatum"/"Date" nicht gefunden');
  }
  if (amountIndex === -1) {
    errors.push('Spalte "Betrag"/"Amount" nicht gefunden');
  }
  if (descriptionIndex === -1) {
    errors.push('Spalte "Buchungstext"/"Description" nicht gefunden');
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

    // Datum parsen (bevorzugt Buchungsdatum, fallback Valuta)
    const datumStr = dateIndex !== -1 ? fields[dateIndex] : fields[valutaIndex];
    const datum = parseInternationalDate(datumStr || '');

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
      posErrors.push('Buchungstext fehlt');
    }

    // Referenz
    const referenz = referenceIndex !== -1 ? fields[referenceIndex] : undefined;

    // Kategorie
    const category = categoryIndex !== -1 ? fields[categoryIndex] : '';
    const kategorie = category || undefined;

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

    // Balance-Info als Warning
    if (balanceIndex !== -1) {
      const balance = parseFlexibleNumber(fields[balanceIndex] || '0');
      if (balance !== 0) {
        posWarnings.push(`Saldo: CHF ${balance.toFixed(2)}`);
      }
    }
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
