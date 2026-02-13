/**
 * Qonto CSV Parser
 *
 * Parses Qonto transaction exports in CSV format.
 * Qonto is a European business banking platform.
 *
 * Features:
 * - Automatic delimiter detection (comma or semicolon)
 * - International number formats
 * - International date formats
 * - Status filtering (only "completed" transactions)
 * - Category and VAT support
 */

export interface QontoHeader {
  format: 'QONTO';
  columns: string[];
  hasValidHeader: boolean;
  delimiter: ',' | ';';
}

export interface QontoPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface QontoParseResult {
  header: QontoHeader;
  positionen: QontoPosition[];
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
 * Prüft ob die CSV-Datei im Qonto-Format vorliegt
 */
export function isValidQontoFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0].toLowerCase();

  // Qonto CSV hat typischerweise: "settled_at" oder "emitted_at" + "local_amount"
  // Auch möglich: deutsche/französische Header mit "Date" + "Label" + "Amount"
  return (
    (firstLine.includes('settled_at') || firstLine.includes('emitted_at') ||
     (firstLine.includes('date') && firstLine.includes('label'))) &&
    (firstLine.includes('local_amount') || firstLine.includes('amount'))
  );
}

/**
 * Parst eine Qonto CSV-Datei und extrahiert alle Positionen
 */
export function parseQontoCSV(csvContent: string): QontoParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: QontoPosition[] = [];

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'QONTO', columns: [], hasValidHeader: false, delimiter: ',' },
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

  const header: QontoHeader = {
    format: 'QONTO',
    columns,
    delimiter,
    hasValidHeader: columns.some(c =>
      c.toLowerCase().includes('settled_at') ||
      c.toLowerCase().includes('emitted_at') ||
      c.toLowerCase().includes('date')
    ),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - Qonto-Format erwartet');
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
    c.toLowerCase() === 'settled_at' ||
    c.toLowerCase() === 'emitted_at' ||
    c.toLowerCase() === 'date' ||
    c.toLowerCase() === 'datum'
  );
  const labelIndex = columns.findIndex(c =>
    c.toLowerCase() === 'label' ||
    c.toLowerCase() === 'description' ||
    c.toLowerCase() === 'beschreibung'
  );
  const amountIndex = columns.findIndex(c =>
    c.toLowerCase() === 'local_amount' ||
    c.toLowerCase() === 'amount' ||
    c.toLowerCase() === 'betrag'
  );
  const statusIndex = columns.findIndex(c =>
    c.toLowerCase() === 'status' ||
    c.toLowerCase() === 'transaction_status'
  );
  const categoryIndex = columns.findIndex(c =>
    c.toLowerCase() === 'category' ||
    c.toLowerCase() === 'kategorie'
  );
  const referenceIndex = columns.findIndex(c =>
    c.toLowerCase() === 'reference' ||
    c.toLowerCase() === 'transaction_id' ||
    c.toLowerCase() === 'id'
  );
  const vatIndex = columns.findIndex(c =>
    c.toLowerCase() === 'vat_amount' ||
    c.toLowerCase() === 'vat' ||
    c.toLowerCase() === 'mwst'
  );

  // Validierung
  if (dateIndex === -1) {
    errors.push('Spalte "Date"/"settled_at" nicht gefunden');
  }
  if (amountIndex === -1) {
    errors.push('Spalte "Amount"/"local_amount" nicht gefunden');
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

    // Status prüfen (nur "completed"/"settled" importieren)
    const status = statusIndex !== -1 ? fields[statusIndex] : '';
    const isCompleted =
      status.toLowerCase() === 'completed' ||
      status.toLowerCase() === 'settled' ||
      status.toLowerCase() === 'abgeschlossen' ||
      status === ''; // Wenn kein Status-Feld, alles importieren

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
    const label = labelIndex !== -1 ? fields[labelIndex] : '';
    const buchungstext = label || 'Qonto Transaktion';

    if (!buchungstext.trim()) {
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
      buchungstext: buchungstext.trim(),
      betrag,
      referenz,
      kategorie,
      rowNumber: i + 1,
      errors: posErrors,
      warnings: posWarnings,
    });

    // VAT-Warnung
    if (vatIndex !== -1) {
      const vat = parseFlexibleNumber(fields[vatIndex] || '0');
      if (vat !== 0) {
        posWarnings.push(`MwSt: ${vat.toFixed(2)}€`);
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
