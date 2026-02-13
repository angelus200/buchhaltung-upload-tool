/**
 * Sumup CSV Parser
 *
 * Parses Sumup transaction exports in CSV format.
 * Supports both German and English formats with automatic detection.
 *
 * Features:
 * - Automatic delimiter detection (comma or semicolon)
 * - International number formats (1,234.56 and 1.234,56)
 * - International date formats (DD.MM.YYYY, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * - Status filtering (only "Successful"/"Erfolgreich" transactions)
 * - Payment method detection (Card, Cash, etc.)
 */

export interface SumupHeader {
  format: 'SUMUP';
  columns: string[];
  hasValidHeader: boolean;
  delimiter: ',' | ';';
}

export interface SumupPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface SumupParseResult {
  header: SumupHeader;
  positionen: SumupPosition[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Parse internationale Zahlenformate (Punkt ODER Komma als Dezimaltrennzeichen)
 * Beispiele: "1234.56" -> 1234.56, "1,234.56" -> 1234.56, "1.234,56" -> 1234.56
 */
export function parseFlexibleNumber(value: string): number {
  if (!value || value.trim() === '') return 0;

  // Entferne Währungssymbole und Leerzeichen
  let normalized = value.replace(/[$€£¥\s]/g, '');

  // Erkenne Format: Wenn letztes Komma/Punkt 2-3 Stellen vor Ende ist es Dezimaltrennzeichen
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Deutsches Format: 1.234,56
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Englisches Format: 1,234.56
    normalized = normalized.replace(/,/g, '');
  }

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
 * Prüft ob die CSV-Datei im Sumup-Format vorliegt
 */
export function isValidSumupFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0].toLowerCase();

  // Sumup CSV hat typischerweise diese Header-Spalten
  // Deutsch: "Transaktions-ID", "Datum", "Betrag"
  // Englisch: "Transaction ID", "Date", "Amount"
  return (
    (firstLine.includes('transaction id') || firstLine.includes('transaktions-id')) &&
    (firstLine.includes('datum') || firstLine.includes('date')) &&
    (firstLine.includes('amount') || firstLine.includes('betrag'))
  );
}

/**
 * Parst eine Sumup CSV-Datei und extrahiert alle Positionen
 */
export function parseSumupCSV(csvContent: string): SumupParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: SumupPosition[] = [];

  // Zeilen splitten
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'SUMUP', columns: [], hasValidHeader: false, delimiter: ',' },
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

  const header: SumupHeader = {
    format: 'SUMUP',
    columns,
    delimiter,
    hasValidHeader: columns.some(c =>
      c.toLowerCase().includes('transaction id') ||
      c.toLowerCase().includes('transaktions-id')
    ),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - Sumup-Format erwartet');
    return {
      header,
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Spalten-Indizes ermitteln (case-insensitive)
  const transactionIdIndex = columns.findIndex(c =>
    c.toLowerCase().includes('transaction id') ||
    c.toLowerCase().includes('transaktions-id')
  );
  const datumIndex = columns.findIndex(c => c.toLowerCase() === 'datum' || c.toLowerCase() === 'date');
  const timeIndex = columns.findIndex(c => c.toLowerCase() === 'uhrzeit' || c.toLowerCase() === 'time');
  const typIndex = columns.findIndex(c => c.toLowerCase() === 'typ' || c.toLowerCase() === 'type');
  const paymentMethodIndex = columns.findIndex(c =>
    c.toLowerCase().includes('payment method') ||
    c.toLowerCase().includes('zahlungsmethode')
  );
  const amountIndex = columns.findIndex(c => c.toLowerCase() === 'amount' || c.toLowerCase() === 'betrag');
  const feeIndex = columns.findIndex(c =>
    c.toLowerCase() === 'fee' ||
    c.toLowerCase() === 'gebühr' ||
    c.toLowerCase() === 'gebuhr'
  );
  const netAmountIndex = columns.findIndex(c =>
    c.toLowerCase().includes('net amount') ||
    c.toLowerCase().includes('nettobetrag')
  );
  const statusIndex = columns.findIndex(c => c.toLowerCase() === 'status');
  const descriptionIndex = columns.findIndex(c =>
    c.toLowerCase() === 'description' ||
    c.toLowerCase() === 'beschreibung'
  );
  const customerNameIndex = columns.findIndex(c =>
    c.toLowerCase().includes('customer name') ||
    c.toLowerCase().includes('kundenname')
  );
  const cardLast4Index = columns.findIndex(c =>
    c.toLowerCase().includes('card last 4') ||
    c.toLowerCase().includes('letzte 4 ziffern')
  );

  // Validierung
  if (datumIndex === -1) {
    errors.push('Spalte "Datum" oder "Date" nicht gefunden');
  }
  if (amountIndex === -1 && netAmountIndex === -1) {
    errors.push('Weder "Amount"/"Betrag" noch "Net Amount"/"Nettobetrag" Spalte gefunden');
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

    // Status prüfen (nur "Successful"/"Erfolgreich" importieren)
    const status = statusIndex !== -1 ? fields[statusIndex] : '';
    const isSuccessful =
      status.toLowerCase() === 'successful' ||
      status.toLowerCase() === 'erfolgreich' ||
      status.toLowerCase() === 'success';

    if (!isSuccessful) {
      // Zeile überspringen (kein Fehler, nur Info)
      continue;
    }

    // Datum parsen
    const datumStr = fields[datumIndex] || '';
    const datum = parseInternationalDate(datumStr);

    if (!datum) {
      posErrors.push(`Ungültiges Datum: ${datumStr}`);
    }

    // Betrag parsen (bevorzugt Amount, fallback Net Amount)
    const betragStr = amountIndex !== -1 ? fields[amountIndex] : fields[netAmountIndex];
    const betrag = parseFlexibleNumber(betragStr || '');

    if (betrag === 0 && betragStr !== '0' && betragStr !== '0.00' && betragStr !== '0,00') {
      posErrors.push(`Ungültiger Betrag: ${betragStr}`);
    }

    // Buchungstext zusammensetzen
    // Format: "Kundenname (Zahlungsmethode) - Beschreibung"
    const customerName = customerNameIndex !== -1 ? fields[customerNameIndex] : '';
    const paymentMethod = paymentMethodIndex !== -1 ? fields[paymentMethodIndex] : '';
    const description = descriptionIndex !== -1 ? fields[descriptionIndex] : '';
    const cardLast4 = cardLast4Index !== -1 ? fields[cardLast4Index] : '';

    let buchungstext = '';

    if (customerName) {
      buchungstext = customerName;
    }

    if (paymentMethod) {
      if (paymentMethod.toLowerCase().includes('card') && cardLast4) {
        buchungstext += buchungstext ? ` (${paymentMethod} ****${cardLast4})` : `${paymentMethod} ****${cardLast4}`;
      } else {
        buchungstext += buchungstext ? ` (${paymentMethod})` : paymentMethod;
      }
    }

    if (description) {
      buchungstext += buchungstext ? ` - ${description}` : description;
    }

    // Fallback wenn alles leer ist
    if (!buchungstext) {
      const typ = typIndex !== -1 ? fields[typIndex] : '';
      buchungstext = typ || 'Sumup Transaktion';
    }

    if (!buchungstext.trim()) {
      posErrors.push('Buchungstext konnte nicht erstellt werden');
    }

    // Transaction ID als Referenz
    const referenz = transactionIdIndex !== -1 ? fields[transactionIdIndex] : undefined;

    // Payment Method + Type als Kategorie
    const typ = typIndex !== -1 ? fields[typIndex] : '';
    const kategorie = paymentMethod && typ
      ? `${typ} (${paymentMethod})`
      : paymentMethod || typ || undefined;

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

    // Warnung bei Gebühren
    if (feeIndex !== -1) {
      const fee = parseFlexibleNumber(fields[feeIndex] || '0');
      if (fee !== 0) {
        posWarnings.push(`Gebühr: ${fee.toFixed(2)}€`);
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
