/**
 * DATEV EXTF/CSV Parser
 *
 * Parses DATEV format files (EXTF header + CSV data) according to DATEV specification.
 * Supports both EXTF format and standard CSV format.
 *
 * EXTF Format:
 * - Line 1: EXTF header with metadata
 * - Line 2: Column headers
 * - Line 3+: Data rows (semicolon-separated)
 *
 * German Formats:
 * - Numbers: Comma as decimal separator (e.g., "1234,56")
 * - Dates: DDMM or DDMMYYYY (e.g., "0101" or "01012025")
 */

export interface DatevHeader {
  format: 'EXTF' | 'CSV';
  version?: string;
  kategorie?: string;
  beraternummer?: string;
  mandantennummer?: string;
  wirtschaftsjahrBeginn?: number;
  sachkontenlaenge?: number;
  datumVon?: Date;
  datumBis?: Date;
  bezeichnung?: string;
  erstellt?: Date;
}

export interface DatevBuchung {
  // Betrag und Währung
  umsatz: number;
  sollHaben: 'S' | 'H';
  waehrung?: string;

  // Konten
  konto: string;
  gegenkonto: string;

  // Beleg
  belegdatum: Date;
  belegnummer: string;
  buchungstext: string;

  // Optional
  kostenstelle?: string;
  buSchluessel?: string;
  skonto?: number;

  // Metadata
  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface DatevParseResult {
  header: DatevHeader;
  buchungen: DatevBuchung[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    totalUmsatz: number;
  };
}

/**
 * Parse German number format (comma as decimal separator)
 * Examples: "1234,56" -> 1234.56, "1.234,56" -> 1234.56
 */
export function parseGermanNumber(value: string): number {
  if (!value || value.trim() === '') return 0;

  // Remove thousand separators (dots) and replace comma with dot
  const normalized = value
    .replace(/\./g, '')
    .replace(',', '.');

  const number = parseFloat(normalized);
  return isNaN(number) ? 0 : number;
}

/**
 * Parse German date format (DDMM or DDMMYYYY)
 * Examples: "0101" -> 01.01.current_year, "01012025" -> 01.01.2025
 */
export function parseGermanDate(value: string, referenceYear?: number): Date | null {
  if (!value || value.trim() === '') return null;

  const cleaned = value.replace(/[^0-9]/g, '');

  if (cleaned.length === 4) {
    // DDMM format
    const day = parseInt(cleaned.substring(0, 2), 10);
    const month = parseInt(cleaned.substring(2, 4), 10);
    const year = referenceYear || new Date().getFullYear();

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return new Date(year, month - 1, day);
    }
  } else if (cleaned.length === 8) {
    // DDMMYYYY format
    const day = parseInt(cleaned.substring(0, 2), 10);
    const month = parseInt(cleaned.substring(2, 4), 10);
    const year = parseInt(cleaned.substring(4, 8), 10);

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return new Date(year, month - 1, day);
    }
  }

  return null;
}

/**
 * Parse EXTF header line
 * Format: "EXTF";Version;Kategorie;...
 */
function parseExtfHeader(line: string): Partial<DatevHeader> {
  const fields = line.split(';').map(f => f.replace(/^"|"$/g, ''));

  if (fields[0] !== 'EXTF') {
    return { format: 'CSV' };
  }

  const header: Partial<DatevHeader> = {
    format: 'EXTF',
    version: fields[1] || undefined,
    kategorie: fields[2] || undefined,
  };

  // Parse common EXTF fields (positions may vary by version)
  // Typical EXTF 510: "EXTF";510;"Buchungsstapel";...;Beraternr;Mandantennr;WJBeginn;...;Datum-von;Datum-bis

  // Try to find Beraternummer (usually around index 6-8)
  for (let i = 6; i < Math.min(fields.length, 10); i++) {
    if (fields[i] && /^\d{4,7}$/.test(fields[i])) {
      header.beraternummer = fields[i];
      break;
    }
  }

  // Try to find Mandantennummer (usually after Beraternummer)
  if (header.beraternummer) {
    const beraterIndex = fields.indexOf(header.beraternummer);
    if (beraterIndex > 0 && beraterIndex < fields.length - 1) {
      const nextField = fields[beraterIndex + 1];
      if (nextField && /^\d{1,5}$/.test(nextField)) {
        header.mandantennummer = nextField;
      }
    }
  }

  // Try to find WJ-Beginn (usually 2-digit month: 01-12)
  for (let i = 8; i < Math.min(fields.length, 12); i++) {
    if (fields[i] && /^(0[1-9]|1[0-2])$/.test(fields[i])) {
      header.wirtschaftsjahrBeginn = parseInt(fields[i], 10);
      break;
    }
  }

  // Try to find date range (usually near the end)
  for (let i = Math.max(0, fields.length - 6); i < fields.length - 1; i++) {
    const date1 = parseGermanDate(fields[i]);
    const date2 = parseGermanDate(fields[i + 1]);
    if (date1 && date2 && date1 < date2) {
      header.datumVon = date1;
      header.datumBis = date2;
      break;
    }
  }

  return header;
}

/**
 * Parse a single DATEV CSV row into a Buchung
 *
 * Standard DATEV column order:
 * 0: Umsatz (Brutto)
 * 1: Soll/Haben (S/H)
 * 2: WKZ Umsatz
 * 3: Kurs
 * 4: Basis-Umsatz
 * 5: WKZ Basis-Umsatz
 * 6: Konto
 * 7: Gegenkonto
 * 8: BU-Schlüssel
 * 9: Belegdatum
 * 10: Belegfeld 1
 * 11: Belegfeld 2
 * 12: Skonto
 * 13: Buchungstext
 * ...more fields possible
 */
function parseDatevRow(
  fields: string[],
  rowNumber: number,
  referenceYear?: number
): DatevBuchung {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Clean fields (remove quotes)
  const cleanFields = fields.map(f => f.replace(/^"|"$/g, '').trim());

  // Parse Umsatz (required)
  const umsatz = parseGermanNumber(cleanFields[0] || '0');
  if (umsatz === 0) {
    errors.push('Umsatz ist erforderlich und muss > 0 sein');
  }

  // Parse Soll/Haben (required)
  const sollHaben = (cleanFields[1] || '').toUpperCase();
  if (sollHaben !== 'S' && sollHaben !== 'H') {
    errors.push('Soll/Haben muss "S" oder "H" sein');
  }

  // Parse Konto (required)
  const konto = cleanFields[6] || '';
  if (!konto) {
    errors.push('Konto ist erforderlich');
  }

  // Parse Gegenkonto (required)
  const gegenkonto = cleanFields[7] || '';
  if (!gegenkonto) {
    errors.push('Gegenkonto ist erforderlich');
  }

  // Parse Belegdatum (required)
  const belegdatum = parseGermanDate(cleanFields[9] || '', referenceYear);
  if (!belegdatum) {
    errors.push('Belegdatum ist erforderlich (Format: DDMM oder DDMMYYYY)');
  }

  // Parse Belegnummer (combine Belegfeld 1 and 2 if needed)
  const belegfeld1 = cleanFields[10] || '';
  const belegfeld2 = cleanFields[11] || '';
  const belegnummer = belegfeld1 || belegfeld2 || `${rowNumber}`;
  if (!belegfeld1 && !belegfeld2) {
    warnings.push('Keine Belegnummer angegeben, verwende Zeilennummer');
  }

  // Parse Buchungstext (required)
  const buchungstext = cleanFields[13] || '';
  if (!buchungstext) {
    warnings.push('Buchungstext fehlt');
  }

  // Optional fields
  const waehrung = cleanFields[2] || 'EUR';
  const buSchluessel = cleanFields[8] || undefined;
  const skonto = parseGermanNumber(cleanFields[12] || '0');

  return {
    umsatz,
    sollHaben: (sollHaben as 'S' | 'H') || 'S',
    waehrung,
    konto,
    gegenkonto,
    belegdatum: belegdatum || new Date(),
    belegnummer,
    buchungstext,
    buSchluessel,
    skonto: skonto > 0 ? skonto : undefined,
    rowNumber,
    errors,
    warnings,
  };
}

/**
 * Main parser function
 * Accepts file content as string and returns parsed result
 */
export function parseDatevFile(content: string): DatevParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      header: { format: 'CSV' },
      buchungen: [],
      errors: ['Datei ist leer oder hat zu wenig Zeilen'],
      warnings: [],
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        totalUmsatz: 0,
      },
    };
  }

  // Parse header
  const header: DatevHeader = {
    format: 'CSV',
    ...parseExtfHeader(lines[0]),
  };

  const errors: string[] = [];
  const warnings: string[] = [];
  const buchungen: DatevBuchung[] = [];

  // Determine reference year for DDMM dates
  const referenceYear = header.datumVon?.getFullYear() || new Date().getFullYear();

  // Find start of data rows
  // If EXTF format: skip header (line 0) and column headers (line 1)
  // If CSV format: assume first line is column headers
  const dataStartIndex = header.format === 'EXTF' ? 2 : 1;

  // Parse data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split(';');

    // Skip if line doesn't look like a data row (too few fields)
    if (fields.length < 10) {
      warnings.push(`Zeile ${i + 1}: Zu wenige Felder (${fields.length}), übersprungen`);
      continue;
    }

    const buchung = parseDatevRow(fields, i + 1 - dataStartIndex, referenceYear);
    buchungen.push(buchung);

    if (buchung.errors.length > 0) {
      errors.push(`Zeile ${buchung.rowNumber}: ${buchung.errors.join(', ')}`);
    }
  }

  // Calculate stats
  const validRows = buchungen.filter(b => b.errors.length === 0).length;
  const invalidRows = buchungen.length - validRows;
  const totalUmsatz = buchungen
    .filter(b => b.errors.length === 0)
    .reduce((sum, b) => sum + b.umsatz, 0);

  return {
    header,
    buchungen,
    errors,
    warnings,
    stats: {
      totalRows: buchungen.length,
      validRows,
      invalidRows,
      totalUmsatz,
    },
  };
}

/**
 * Export Buchungen to DATEV EXTF format
 */
export function exportToDatev(
  buchungen: Array<{
    belegdatum: Date;
    belegnummer: string;
    bruttobetrag: number;
    sachkonto: string;
    geschaeftspartnerKonto: string;
    buchungstext: string;
    steuersatz: number;
    nettobetrag: number;
  }>,
  metadata: {
    beraternummer?: string;
    mandantennummer?: string;
    wirtschaftsjahrBeginn?: number;
    datumVon?: Date;
    datumBis?: Date;
  }
): string {
  const lines: string[] = [];

  // EXTF Header
  const now = new Date();
  const formatDatev = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  };

  const datumVon = metadata.datumVon || new Date(now.getFullYear(), 0, 1);
  const datumBis = metadata.datumBis || new Date(now.getFullYear(), 11, 31);

  const headerFields = [
    '"EXTF"',
    '510',
    '"Buchungsstapel"',
    '16',
    '1',
    formatDatev(now),
    '',
    '"RE"',
    '"Buchhaltung Upload Tool"',
    '',
    metadata.beraternummer || '',
    metadata.mandantennummer || '',
    (metadata.wirtschaftsjahrBeginn || 1).toString().padStart(2, '0'),
    '4',
    formatDatev(datumVon),
    formatDatev(datumBis),
  ];

  lines.push(headerFields.join(';'));

  // Column headers
  const columnHeaders = [
    '"Umsatz (ohne Soll/Haben-Kz)"',
    '"Soll/Haben-Kennzeichen"',
    '"WKZ Umsatz"',
    '"Kurs"',
    '"Basis-Umsatz"',
    '"WKZ Basis-Umsatz"',
    '"Konto"',
    '"Gegenkonto (ohne BU-Schlüssel)"',
    '"BU-Schlüssel"',
    '"Belegdatum"',
    '"Belegfeld 1"',
    '"Belegfeld 2"',
    '"Skonto"',
    '"Buchungstext"',
  ];

  lines.push(columnHeaders.join(';'));

  // Data rows
  for (const buchung of buchungen) {
    const formatNumber = (num: number) => num.toFixed(2).replace('.', ',');
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}${month}`;
    };

    // Determine Soll/Haben based on account type
    // Simplification: Sachkonto starting with 4-7 = Haben, otherwise Soll
    const firstDigit = parseInt(buchung.sachkonto.charAt(0), 10);
    const sollHaben = (firstDigit >= 4 && firstDigit <= 7) ? 'H' : 'S';

    const row = [
      formatNumber(buchung.bruttobetrag),
      sollHaben,
      'EUR',
      '',
      formatNumber(buchung.nettobetrag),
      'EUR',
      buchung.sachkonto,
      buchung.geschaeftspartnerKonto,
      '', // BU-Schlüssel
      formatDate(buchung.belegdatum),
      buchung.belegnummer,
      '',
      '',
      `"${buchung.buchungstext.replace(/"/g, '""')}"`,
    ];

    lines.push(row.join(';'));
  }

  return lines.join('\n');
}

/**
 * Validate DATEV file format (quick check without full parsing)
 */
export function isValidDatevFile(content: string): boolean {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length < 2) return false;

  // Check if first line is EXTF header or looks like CSV
  const firstLine = lines[0];
  if (firstLine.startsWith('"EXTF"') || firstLine.startsWith('EXTF')) {
    return true;
  }

  // Check if it's semicolon-separated and has enough fields
  const fields = firstLine.split(';');
  return fields.length >= 10;
}
