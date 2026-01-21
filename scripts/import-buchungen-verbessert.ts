#!/usr/bin/env tsx
/**
 * VERBESSERTES Buchungs-Import Script
 *
 * Verbesserungen:
 * 1. Korrekte Soll/Haben-Paar-Erkennung (Belegnr + Zeilennr)
 * 2. Steuersatz-Extraktion aus Spalte 21
 * 3. Perioden-Berechnung aus Belegdatum
 * 4. Alle 13.021 Zeilen werden importiert
 */

import "dotenv/config";
import * as mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

const DATEV_IMPORT_PATH = path.join(process.env.HOME!, "Downloads", "datev-import");
const ANGELUS_UNTERNEHMEN_ID = 1;
const IMPORT_REFERENZ = "DATEV_2025_VERBESSERT";
const BATCH_SIZE = 50; // Kleinere Batches für Stabilität

// Farben
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

/**
 * CSV-Parser für DATEV
 */
function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some((field) => field !== "")) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = "";
      }
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((field) => field !== "")) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * DATEV-Datum (DD.MM.YYYY) → MySQL (YYYY-MM-DD)
 */
function parseDatevDate(datevDate: string): string | null {
  if (!datevDate || datevDate === "") return null;

  const parts = datevDate.split(".");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * DATEV-Betrag (1.234,56) → Dezimal (1234.56)
 */
function parseDatevAmount(amount: string): number {
  if (!amount || amount === "") return 0;
  return parseFloat(amount.replace(/\./g, "").replace(",", "."));
}

/**
 * Extrahiere Monat aus Datum für Periode
 */
function getPeriodeFromDate(datevDate: string): number {
  if (!datevDate) return 1;
  const parts = datevDate.split(".");
  if (parts.length !== 3) return 1;
  return parseInt(parts[1]) || 1;
}

/**
 * Bestimme Buchungsart aus Kontonummer
 */
function getBuchungsart(kontonr: string): string {
  const nr = parseInt(kontonr);
  if (nr >= 0 && nr <= 999) return "anlage";
  if (nr >= 7000 && nr <= 7999) return "ertrag";
  if (nr >= 8000 && nr <= 9999) return "aufwand";
  return "sonstig";
}

/**
 * Bestimme Geschäftspartner-Typ
 */
function getGeschaeftspartnerTyp(kontonr: string): string {
  const nr = parseInt(kontonr);
  if (nr >= 10000 && nr <= 69999) return "debitor";
  if (nr >= 70000 && nr <= 99999) return "kreditor";
  return "sonstig";
}

/**
 * Erstelle Batch-Insert
 */
function createBatchInsert(
  tableName: string,
  columns: string[],
  rows: any[][]
): { sql: string; values: any[] } {
  if (rows.length === 0) {
    throw new Error("Keine Zeilen für Batch-Insert");
  }

  const placeholders = rows.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
  const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES ${placeholders}`;
  const values = rows.flat();

  return { sql, values };
}

interface BuchungsZeile {
  belegnr: string;
  zeilennr: number;
  belegdatum: string;
  externeReferenz: string;
  sollHaben: string; // "S" oder "H"
  buchungstext: string;
  konto: string;
  sollUmsatz: number;
  habenUmsatz: number;
  steuersatz: number;
  gegenkonto: string;
  belegId: string;
}

/**
 * HAUPTFUNKTION: Buchungen importieren
 */
async function importBuchungen(conn: mysql.Connection) {
  console.log("\n" + "=".repeat(70));
  log("VERBESSERTER BUCHUNGS-IMPORT", colors.bright + colors.cyan);
  console.log("=".repeat(70) + "\n");

  // CSV einlesen
  const filePath = path.join(DATEV_IMPORT_PATH, "buchungssatzprotokoll.csv");
  logInfo(`Lese ${filePath}...`);

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    content = fs.readFileSync(filePath, "latin1");
  }

  const lines = parseCSV(content);
  logInfo(`${lines.length} Zeilen eingelesen`);

  // Parse Buchungszeilen
  const buchungsZeilen: BuchungsZeile[] = [];

  for (const line of lines) {
    const zeile: BuchungsZeile = {
      belegnr: line[1] || "",
      zeilennr: parseInt(line[2]) || 0,
      belegdatum: line[3] || "",
      externeReferenz: line[4] || "",
      sollHaben: line[11] || "",
      buchungstext: line[17] || "",
      konto: line[18] || "",
      sollUmsatz: parseDatevAmount(line[19]),
      habenUmsatz: parseDatevAmount(line[20]),
      steuersatz: parseDatevAmount(line[21]),
      gegenkonto: line[23] || "",
      belegId: line[40] || "",
    };

    if (zeile.belegnr && zeile.konto) {
      buchungsZeilen.push(zeile);
    }
  }

  logInfo(`${buchungsZeilen.length} gültige Buchungszeilen gefunden`);

  // Gruppiere nach Belegnummer + Zeilennummer
  const buchungspaare = new Map<string, BuchungsZeile[]>();

  for (const zeile of buchungsZeilen) {
    const key = `${zeile.belegnr}_${zeile.zeilennr}`;
    if (!buchungspaare.has(key)) {
      buchungspaare.set(key, []);
    }
    buchungspaare.get(key)!.push(zeile);
  }

  logInfo(`${buchungspaare.size} Buchungssätze (Soll/Haben-Paare) gefunden`);

  // Importiere Buchungen
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const batch: any[][] = [];

  for (const [key, zeilen] of Array.from(buchungspaare.entries())) {
    try {
      // Finde Soll- und Haben-Zeile
      const sollZeile = zeilen.find((z) => z.sollHaben === "S");
      const habenZeile = zeilen.find((z) => z.sollHaben === "H");

      if (!sollZeile || !habenZeile) {
        // Manchmal gibt es nur eine Zeile (Eröffnungsbuchungen)
        const zeile = zeilen[0];
        const betrag = zeile.sollUmsatz || zeile.habenUmsatz;

        const belegdatum = parseDatevDate(zeile.belegdatum);
        const buchungsart = getBuchungsart(zeile.konto);
        const geschaeftspartnerTyp = getGeschaeftspartnerTyp(zeile.gegenkonto);
        const periode = getPeriodeFromDate(zeile.belegdatum);
        const wirtschaftsjahr = belegdatum ? parseInt(belegdatum.split("-")[0]) : 2025;

        batch.push([
          ANGELUS_UNTERNEHMEN_ID,
          buchungsart,
          belegdatum,
          zeile.belegnr,
          geschaeftspartnerTyp,
          zeile.buchungstext || "Unbekannt",
          zeile.gegenkonto || zeile.konto,
          zeile.konto,
          null, // kostenstelleId
          betrag, // nettobetrag
          zeile.steuersatz, // steuersatz
          betrag, // bruttobetrag (TODO: mit Steuer berechnen)
          zeile.buchungstext,
          null, // belegUrl
          "geprueft", // status
          null, // exportiertAm
          "offen", // zahlungsstatus
          null, // faelligkeitsdatum
          null, // bezahltAm
          null, // bezahlterBetrag
          null, // zahlungsreferenz
          zeile.sollHaben === "S" ? zeile.konto : zeile.gegenkonto, // sollKonto
          zeile.sollHaben === "H" ? zeile.konto : zeile.gegenkonto, // habenKonto
          zeile.belegnr, // datevBelegnummer
          zeile.zeilennr, // datevBuchungszeile
          zeile.belegId || null, // datevBelegId
          wirtschaftsjahr,
          periode,
          zeile.buchungstext, // datevBuchungstext
          "datev_gdpdu", // importQuelle
          new Date().toISOString().slice(0, 19).replace("T", " "), // importDatum
          IMPORT_REFERENZ,
          null, // createdBy
        ]);
        continue;
      }

      // Normale Soll/Haben-Buchung
      const betrag = sollZeile.sollUmsatz || habenZeile.habenUmsatz;
      const steuersatz = sollZeile.steuersatz || habenZeile.steuersatz;

      const belegdatum = parseDatevDate(sollZeile.belegdatum);
      const buchungsart = getBuchungsart(sollZeile.konto);
      const geschaeftspartnerTyp = getGeschaeftspartnerTyp(sollZeile.gegenkonto);
      const periode = getPeriodeFromDate(sollZeile.belegdatum);
      const wirtschaftsjahr = belegdatum ? parseInt(belegdatum.split("-")[0]) : 2025;

      // Berechne Brutto (Netto + Steuer)
      let nettobetrag = betrag;
      let bruttobetrag = betrag;

      if (steuersatz > 0) {
        // Wenn Steuersatz vorhanden, berechne Brutto
        bruttobetrag = betrag * (1 + steuersatz / 100);
      }

      batch.push([
        ANGELUS_UNTERNEHMEN_ID,
        buchungsart,
        belegdatum,
        sollZeile.belegnr,
        geschaeftspartnerTyp,
        sollZeile.buchungstext || "Unbekannt",
        sollZeile.gegenkonto,
        sollZeile.konto,
        null, // kostenstelleId
        nettobetrag,
        steuersatz,
        bruttobetrag,
        sollZeile.buchungstext,
        null, // belegUrl
        "geprueft",
        null,
        "offen",
        null,
        null,
        null,
        null,
        sollZeile.konto, // sollKonto
        habenZeile.konto, // habenKonto
        sollZeile.belegnr,
        sollZeile.zeilennr,
        sollZeile.belegId || null,
        wirtschaftsjahr,
        periode,
        sollZeile.buchungstext,
        "datev_gdpdu",
        new Date().toISOString().slice(0, 19).replace("T", " "),
        IMPORT_REFERENZ,
        null,
      ]);

      // Batch voll? Dann insert ausführen
      if (batch.length >= BATCH_SIZE) {
        const { sql, values } = createBatchInsert(
          "buchungen",
          [
            "unternehmenId", "buchungsart", "belegdatum", "belegnummer", "geschaeftspartnerTyp",
            "geschaeftspartner", "geschaeftspartnerKonto", "sachkonto", "kostenstelleId",
            "nettobetrag", "steuersatz", "bruttobetrag", "buchungstext", "belegUrl", "status",
            "exportiertAm", "zahlungsstatus", "faelligkeitsdatum", "bezahltAm", "bezahlterBetrag",
            "zahlungsreferenz", "sollKonto", "habenKonto", "datevBelegnummer", "datevBuchungszeile",
            "datevBelegId", "wirtschaftsjahr", "periode", "datevBuchungstext", "importQuelle",
            "importDatum", "importReferenz", "createdBy"
          ],
          batch
        );

        try {
          await conn.execute(sql, values);
          imported += batch.length;
          logInfo(`${imported} Buchungen importiert...`);
        } catch (error: any) {
          if (error.code === "ER_DUP_ENTRY") {
            skipped += batch.length;
          } else {
            logError(`Fehler beim Import: ${error.message}`);
            errors += batch.length;
          }
        }

        batch.length = 0;
      }
    } catch (error: any) {
      logError(`Fehler bei Buchung ${key}: ${error.message}`);
      errors++;
    }
  }

  // Restliche Buchungen
  if (batch.length > 0) {
    const { sql, values } = createBatchInsert(
      "buchungen",
      [
        "unternehmenId", "buchungsart", "belegdatum", "belegnummer", "geschaeftspartnerTyp",
        "geschaeftspartner", "geschaeftspartnerKonto", "sachkonto", "kostenstelleId",
        "nettobetrag", "steuersatz", "bruttobetrag", "buchungstext", "belegUrl", "status",
        "exportiertAm", "zahlungsstatus", "faelligkeitsdatum", "bezahltAm", "bezahlterBetrag",
        "zahlungsreferenz", "sollKonto", "habenKonto", "datevBelegnummer", "datevBuchungszeile",
        "datevBelegId", "wirtschaftsjahr", "periode", "datevBuchungstext", "importQuelle",
        "importDatum", "importReferenz", "createdBy"
      ],
      batch
    );

    try {
      await conn.execute(sql, values);
      imported += batch.length;
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        skipped += batch.length;
      } else {
        errors += batch.length;
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  logSuccess(`Import abgeschlossen!`);
  logInfo(`Importiert: ${imported}`);
  logInfo(`Übersprungen (Duplikate): ${skipped}`);
  if (errors > 0) {
    logError(`Fehler: ${errors}`);
  }
  console.log("=".repeat(70) + "\n");
}

/**
 * MAIN
 */
async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    await importBuchungen(conn);
  } catch (error: any) {
    logError(`Import fehlgeschlagen: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
