/**
 * VR Bank CSV Parser (Volksbank/Raiffeisenbank)
 *
 * Parses VR Bank transaction exports in CSV format.
 * Format is very similar to Sparkasse but with different column names.
 *
 * Features:
 * - Semicolon delimiter, German number format
 * - ISO-8859-1 encoding
 * - Similar structure to Sparkasse
 * - "Saldo nach Buchung" can be used as balance field
 */

import { parseGermanNumber, parseGermanDate } from './datev-parser';

export interface VRBankHeader {
  format: 'VRBANK';
  columns: string[];
  hasValidHeader: boolean;
}

export interface VRBankPosition {
  datum: Date;
  buchungstext: string;
  betrag: number;
  referenz?: string;
  kategorie?: string;

  rowNumber: number;
  errors: string[];
  warnings: string[];
}

export interface VRBankParseResult {
  header: VRBankHeader;
  positionen: VRBankPosition[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Prüft ob die CSV-Datei im VR Bank-Format vorliegt
 */
export function isValidVRBankFile(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const firstLine = content.split(/\r?\n/)[0];

  // VR Bank CSV hat: "Bezeichnung Auftragskonto" UND "IBAN Auftragskonto"
  return (
    firstLine.includes('Bezeichnung Auftragskonto') &&
    firstLine.includes('IBAN Auftragskonto') &&
    firstLine.includes(';') // Semikolon als Delimiter
  );
}

/**
 * Parst eine VR Bank CSV-Datei und extrahiert alle Positionen
 * Format: Semikolon-getrennt, Werte in Anführungszeichen, deutsche Zahlenformate
 */
export function parseVRBankCSV(csvContent: string): VRBankParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const positionen: VRBankPosition[] = [];

  // Zeilen splitten und leere Zeilen entfernen
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    errors.push('CSV-Datei ist leer');
    return {
      header: { format: 'VRBANK', columns: [], hasValidHeader: false },
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Header parsen (erste Zeile)
  const headerLine = lines[0];
  const columns = headerLine.split(';').map(col => col.replace(/^"|"$/g, '').trim());

  const header: VRBankHeader = {
    format: 'VRBANK',
    columns,
    hasValidHeader: columns.includes('Buchungstag') && columns.includes('Betrag'),
  };

  if (!header.hasValidHeader) {
    errors.push('Ungültiger CSV-Header - VR Bank-Format erwartet');
    return {
      header,
      positionen: [],
      errors,
      warnings,
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  // Spalten-Indizes ermitteln
  const buchungstagIndex = columns.indexOf('Buchungstag');
  const verwendungszweckIndex = columns.indexOf('Verwendungszweck');
  const buchungstextIndex = columns.indexOf('Buchungstext');
  const betragIndex = columns.indexOf('Betrag');
  const nameZahlungsbeteiligterIndex = columns.indexOf('Name Zahlungsbeteiligter');
  const kategorieIndex = columns.indexOf('Kategorie');

  // Prüfen ob alle erforderlichen Spalten vorhanden sind
  if (buchungstagIndex === -1) {
    errors.push('Spalte "Buchungstag" nicht gefunden');
  }
  if (verwendungszweckIndex === -1 && buchungstextIndex === -1) {
    errors.push('Weder "Verwendungszweck" noch "Buchungstext" Spalte gefunden');
  }
  if (betragIndex === -1) {
    errors.push('Spalte "Betrag" nicht gefunden');
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

  // Daten-Zeilen parsen (ab Zeile 2)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // CSV-Zeile splitten und Anführungszeichen entfernen
    const fields = line.split(';').map(f => f.replace(/^"|"$/g, '').trim());

    const posErrors: string[] = [];
    const posWarnings: string[] = [];

    // Datum parsen (Format: DD.MM.YYYY)
    const datumStr = fields[buchungstagIndex] || '';
    const datum = parseGermanDate(datumStr.replace(/\./g, '')); // Punkte entfernen für Parser

    if (!datum) {
      posErrors.push(`Ungültiges Datum: ${datumStr}`);
    }

    // Betrag parsen (Format: -1.234,56 oder 1.234,56)
    const betragStr = fields[betragIndex] || '';
    const betrag = parseGermanNumber(betragStr);

    if (betrag === 0 && betragStr !== '0' && betragStr !== '0,00') {
      posErrors.push(`Ungültiger Betrag: ${betragStr}`);
    }

    // Buchungstext (Verwendungszweck ist Pflichtfeld, Fallback auf Buchungstext)
    let buchungstext = '';
    if (verwendungszweckIndex !== -1) {
      buchungstext = fields[verwendungszweckIndex] || '';
    }
    if (!buchungstext && buchungstextIndex !== -1) {
      buchungstext = fields[buchungstextIndex] || '';
    }

    if (!buchungstext) {
      posErrors.push('Verwendungszweck/Buchungstext fehlt');
    }

    // Optionale Felder
    const referenz = nameZahlungsbeteiligterIndex !== -1 && fields[nameZahlungsbeteiligterIndex].length > 0
      ? fields[nameZahlungsbeteiligterIndex]
      : undefined;

    const kategorie = kategorieIndex !== -1 && fields[kategorieIndex].length > 0
      ? fields[kategorieIndex]
      : undefined;

    // Position erstellen (auch bei Fehlern, damit User die Probleme sieht)
    positionen.push({
      datum: datum || new Date(), // Fallback-Datum bei Fehler
      buchungstext,
      betrag,
      referenz,
      kategorie,
      rowNumber: i + 1, // Zeilen-Nummer (1-basiert, inkl. Header)
      errors: posErrors,
      warnings: posWarnings,
    });

    // Warnung bei sehr alten/zukünftigen Daten
    if (datum) {
      const now = new Date();
      const yearsDiff = Math.abs(now.getFullYear() - datum.getFullYear());
      if (yearsDiff > 10) {
        posWarnings.push(`Datum liegt ${yearsDiff} Jahre in der Vergangenheit/Zukunft`);
      }
    }
  }

  // Statistiken berechnen
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
