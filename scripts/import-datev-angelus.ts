#!/usr/bin/env tsx
/**
 * DATEV GDPdU Import Script für Angelus Managementberatungs und Service KG
 *
 * Importiert DATEV-Export-Daten in die Datenbank:
 * - Sachkontenstamm.csv → sachkonten
 * - DebitorenKreditorenstammdaten.csv → kreditoren + debitoren
 * - buchungssatzprotokoll.csv → buchungen
 * - belege.csv → belege
 *
 * Verwendung:
 *   tsx scripts/import-datev-angelus.ts
 *
 * Voraussetzungen:
 *   - DATEV-Export unter ~/Downloads/datev-import/
 *   - DATABASE_URL in .env gesetzt
 *   - Angelus KG als Unternehmen in DB vorhanden
 */

import "dotenv/config";
import * as mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

// Konstanten
const DATEV_IMPORT_PATH = path.join(process.env.HOME!, "Downloads", "datev-import");
const ANGELUS_UNTERNEHMEN_NAME = "Angelus Managementberatungs und Service KG";
const IMPORT_REFERENZ = "DATEV_2025_Q1";
const BATCH_SIZE = 100; // Anzahl Datensätze pro Batch-Insert

// Farben für Console-Output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(70));
  log(title, colors.bright + colors.cyan);
  console.log("=".repeat(70));
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

/**
 * CSV-Parser für DATEV-Dateien
 * DATEV verwendet Semikolon als Separator und Anführungszeichen für Strings
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
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      // Field separator
      currentLine.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      // Line break
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some((field) => field !== "")) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = "";
      }
      // Skip \r\n combination
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  // Add last field and line if not empty
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((field) => field !== "")) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Liest CSV-Datei und parst sie
 */
function readCSV(filename: string): string[][] {
  const filePath = path.join(DATEV_IMPORT_PATH, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Datei nicht gefunden: ${filePath}`);
  }

  logInfo(`Lese ${filename}...`);

  // Versuche UTF-8, falls das fehlschlägt ISO-8859-1 (DATEV-Standard)
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    logWarning("UTF-8 fehlgeschlagen, versuche ISO-8859-1...");
    content = fs.readFileSync(filePath, "latin1");
  }

  const lines = parseCSV(content);
  logInfo(`${lines.length} Zeilen eingelesen`);

  return lines;
}

/**
 * Erstellt WHERE IN Klausel für Batch-Inserts
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

/**
 * Konvertiert DATEV-Datum (DD.MM.YYYY) in MySQL-Datum (YYYY-MM-DD)
 */
function parseDatevDate(datevDate: string): string | null {
  if (!datevDate || datevDate === "") return null;

  const parts = datevDate.split(".");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * Konvertiert DATEV-Betrag (1.234,56) in Dezimalzahl (1234.56)
 */
function parseDatevAmount(amount: string): number {
  if (!amount || amount === "") return 0;

  // Entferne Tausender-Trennzeichen und ersetze Komma durch Punkt
  return parseFloat(amount.replace(/\./g, "").replace(",", "."));
}

/**
 * Ermittelt Kontotyp aus Kontonummer (SKR03)
 */
function getKontotypFromKontonummer(kontonummer: string): string {
  const nr = parseInt(kontonummer);

  if (nr >= 0 && nr <= 999) return "aktiv"; // Anlagevermögen
  if (nr >= 1000 && nr <= 1999) return "aktiv"; // Umlaufvermögen
  if (nr >= 2000 && nr <= 2999) return "passiv"; // Eigenkapital
  if (nr >= 3000 && nr <= 3999) return "passiv"; // Rückstellungen
  if (nr >= 4000 && nr <= 4999) return "passiv"; // Verbindlichkeiten
  if (nr >= 5000 && nr <= 6999) return "neutral"; // Kontokorrent/Kasse/Bank
  if (nr >= 7000 && nr <= 7999) return "ertrag"; // Erlöse
  if (nr >= 8000 && nr <= 9999) return "aufwand"; // Aufwendungen

  return "neutral";
}

/**
 * 1. SACHKONTEN IMPORTIEREN
 */
async function importSachkonten(conn: mysql.Connection, unternehmenId: number) {
  logSection("1. SACHKONTEN IMPORTIEREN");

  const lines = readCSV("Sachkontenstamm.csv");

  if (lines.length === 0) {
    logWarning("Keine Sachkonten gefunden");
    return;
  }

  logInfo(`Verarbeite ${lines.length} Sachkonten...`);

  let imported = 0;
  let skipped = 0;
  const batch: any[][] = [];

  for (const line of lines) {
    const kontonummer = line[0]; // Ktonr
    const bezeichnung = line[1]; // Text

    if (!kontonummer || !bezeichnung) {
      skipped++;
      continue;
    }

    const kontotyp = getKontotypFromKontonummer(kontonummer);

    batch.push([
      unternehmenId,
      "SKR03", // Kontenrahmen
      kontonummer,
      bezeichnung,
      null, // kategorie
      kontotyp,
      null, // standardSteuersatz
      true, // aktiv
      null, // notizen
    ]);

    if (batch.length >= BATCH_SIZE) {
      const { sql, values } = createBatchInsert(
        "sachkonten",
        ["unternehmenId", "kontenrahmen", "kontonummer", "bezeichnung", "kategorie", "kontotyp", "standardSteuersatz", "aktiv", "notizen"],
        batch
      );

      try {
        await conn.execute(sql, values);
        imported += batch.length;
        logInfo(`${imported} Sachkonten importiert...`);
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          logWarning(`Duplikate übersprungen (${batch.length} Einträge)`);
          skipped += batch.length;
        } else {
          throw error;
        }
      }

      batch.length = 0;
    }
  }

  // Restliche Einträge importieren
  if (batch.length > 0) {
    const { sql, values } = createBatchInsert(
      "sachkonten",
      ["unternehmenId", "kontenrahmen", "kontonummer", "bezeichnung", "kategorie", "kontotyp", "standardSteuersatz", "aktiv", "notizen"],
      batch
    );

    try {
      await conn.execute(sql, values);
      imported += batch.length;
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        skipped += batch.length;
      } else {
        throw error;
      }
    }
  }

  logSuccess(`Sachkonten-Import abgeschlossen: ${imported} importiert, ${skipped} übersprungen`);
}

/**
 * 2. DEBITOREN/KREDITOREN IMPORTIEREN
 */
async function importDebitorenKreditoren(conn: mysql.Connection, unternehmenId: number) {
  logSection("2. DEBITOREN/KREDITOREN IMPORTIEREN");

  const lines = readCSV("DebitorenKreditorenstammdaten.csv");

  if (lines.length === 0) {
    logWarning("Keine Debitoren/Kreditoren gefunden");
    return;
  }

  logInfo(`Verarbeite ${lines.length} Geschäftspartner...`);

  let importedDebitoren = 0;
  let importedKreditoren = 0;
  let skipped = 0;

  const debitorenBatch: any[][] = [];
  const kreditorenBatch: any[][] = [];

  for (const line of lines) {
    const kontonummer = line[0]; // PKKtonr
    const name = line[1]; // Name_Unternehmen
    const typ = line[90]; // Geschaeftspartner-Typ (Position 90 laut XML, aber kann variieren)

    // Fallback: Typ aus Kontonummer ableiten (10000-69999 = Debitor, 70000-99999 = Kreditor)
    const kontonr = parseInt(kontonummer);
    let geschaeftspartnerTyp = typ || "";

    if (!geschaeftspartnerTyp) {
      if (kontonr >= 10000 && kontonr <= 69999) {
        geschaeftspartnerTyp = "D"; // Debitor
      } else if (kontonr >= 70000 && kontonr <= 99999) {
        geschaeftspartnerTyp = "K"; // Kreditor
      } else {
        geschaeftspartnerTyp = "K"; // Default Kreditor
      }
    }

    if (!kontonummer || !name) {
      skipped++;
      continue;
    }

    // Adressdaten extrahieren
    const strasse = line[10] || null; // Strasse
    const plz = line[12] || null; // PLZ
    const ort = line[13] || null; // Ort
    const land = line[14] || null; // Nation
    const ustIdNr = line[8] || null; // EU_UStID
    const iban = line[20] || null; // IBAN_1
    let bic = line[21] || null; // BIC_1

    // BIC auf maximal 11 Zeichen kürzen (SWIFT-Standard)
    if (bic && bic.length > 11) {
      bic = bic.substring(0, 11);
    }

    const row = [
      unternehmenId,
      kontonummer,
      name,
      null, // kurzbezeichnung
      strasse,
      plz,
      ort,
      land,
      null, // telefon
      null, // email
      ustIdNr,
      kontonummer, // datevKontonummer
      true, // aktiv
    ];

    if (geschaeftspartnerTyp === "D") {
      // Debitor
      debitorenBatch.push(row);

      if (debitorenBatch.length >= BATCH_SIZE) {
        const { sql, values } = createBatchInsert(
          "debitoren",
          ["unternehmenId", "kontonummer", "name", "kurzbezeichnung", "strasse", "plz", "ort", "land", "telefon", "email", "ustIdNr", "datevKontonummer", "aktiv"],
          debitorenBatch
        );

        try {
          await conn.execute(sql, values);
          importedDebitoren += debitorenBatch.length;
          logInfo(`${importedDebitoren} Debitoren importiert...`);
        } catch (error: any) {
          if (error.code === "ER_DUP_ENTRY") {
            skipped += debitorenBatch.length;
          } else {
            throw error;
          }
        }

        debitorenBatch.length = 0;
      }
    } else {
      // Kreditor
      const kreditorRow = [
        ...row,
        null, // steuernummer
        iban,
        bic,
        30, // zahlungsziel
        null, // skonto
        null, // skontofrist
        null, // standardSachkonto
        null, // notizen
      ];

      kreditorenBatch.push(kreditorRow);

      if (kreditorenBatch.length >= BATCH_SIZE) {
        const { sql, values } = createBatchInsert(
          "kreditoren",
          ["unternehmenId", "kontonummer", "name", "kurzbezeichnung", "strasse", "plz", "ort", "land", "telefon", "email", "ustIdNr", "datevKontonummer", "aktiv", "steuernummer", "iban", "bic", "zahlungsziel", "skonto", "skontofrist", "standardSachkonto", "notizen"],
          kreditorenBatch
        );

        try {
          await conn.execute(sql, values);
          importedKreditoren += kreditorenBatch.length;
          logInfo(`${importedKreditoren} Kreditoren importiert...`);
        } catch (error: any) {
          if (error.code === "ER_DUP_ENTRY") {
            skipped += kreditorenBatch.length;
          } else {
            throw error;
          }
        }

        kreditorenBatch.length = 0;
      }
    }
  }

  // Restliche Debitoren
  if (debitorenBatch.length > 0) {
    const { sql, values } = createBatchInsert(
      "debitoren",
      ["unternehmenId", "kontonummer", "name", "kurzbezeichnung", "strasse", "plz", "ort", "land", "telefon", "email", "ustIdNr", "datevKontonummer", "aktiv"],
      debitorenBatch
    );

    try {
      await conn.execute(sql, values);
      importedDebitoren += debitorenBatch.length;
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        skipped += debitorenBatch.length;
      } else {
        throw error;
      }
    }
  }

  // Restliche Kreditoren
  if (kreditorenBatch.length > 0) {
    const { sql, values } = createBatchInsert(
      "kreditoren",
      ["unternehmenId", "kontonummer", "name", "kurzbezeichnung", "strasse", "plz", "ort", "land", "telefon", "email", "ustIdNr", "datevKontonummer", "aktiv", "steuernummer", "iban", "bic", "zahlungsziel", "skonto", "skontofrist", "standardSachkonto", "notizen"],
      kreditorenBatch
    );

    try {
      await conn.execute(sql, values);
      importedKreditoren += kreditorenBatch.length;
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        skipped += kreditorenBatch.length;
      } else {
        throw error;
      }
    }
  }

  logSuccess(`Debitoren: ${importedDebitoren}, Kreditoren: ${importedKreditoren}, Übersprungen: ${skipped}`);
}

/**
 * 3. BUCHUNGEN IMPORTIEREN
 */
async function importBuchungen(conn: mysql.Connection, unternehmenId: number) {
  logSection("3. BUCHUNGEN IMPORTIEREN");

  const lines = readCSV("buchungssatzprotokoll.csv");

  if (lines.length === 0) {
    logWarning("Keine Buchungen gefunden");
    return;
  }

  logInfo(`Verarbeite ${lines.length} Buchungszeilen...`);
  logWarning("Hinweis: Buchungen werden als Soll/Haben-Paare gruppiert (vereinfachte Logik)");

  let imported = 0;
  let skipped = 0;

  // Gruppiere Buchungen nach Belegnummer
  const buchungGroups = new Map<string, string[][]>();

  for (const line of lines) {
    const belegnr = line[1]; // Belegnr
    if (!buchungGroups.has(belegnr)) {
      buchungGroups.set(belegnr, []);
    }
    buchungGroups.get(belegnr)!.push(line);
  }

  logInfo(`${buchungGroups.size} Buchungssätze gefunden`);

  const batch: any[][] = [];

  for (const [belegnr, zeilen] of Array.from(buchungGroups.entries())) {
    // Vereinfachte Logik: Nehme erste Zeile als Basis
    const firstLine = zeilen[0];

    const belegdatum = parseDatevDate(firstLine[3]); // Belegdatum
    const buchungstext = firstLine[17] || ""; // Buchungstext
    const konto = firstLine[18]; // Konto
    const sollUmsatz = parseDatevAmount(firstLine[19]); // SollUmsatz
    const habenUmsatz = parseDatevAmount(firstLine[20]); // HabenUmsatz
    const gegenkonto = firstLine[23]; // Gegenkonto
    const sollHaben = firstLine[11]; // S_H

    // Bestimme Buchungsart
    let buchungsart = "sonstig";
    const kontoNr = parseInt(konto);
    if (kontoNr >= 8000 && kontoNr <= 9999) buchungsart = "aufwand";
    if (kontoNr >= 7000 && kontoNr <= 7999) buchungsart = "ertrag";
    if (kontoNr >= 0 && kontoNr <= 999) buchungsart = "anlage";

    // Geschäftspartner ermitteln
    let geschaeftspartnerKonto = gegenkonto;
    let geschaeftspartner = "Unbekannt";
    let geschaeftspartnerTyp = "sonstig";

    const gegenkontoNr = parseInt(gegenkonto);
    if (gegenkontoNr >= 10000 && gegenkontoNr <= 69999) {
      geschaeftspartnerTyp = "debitor";
      geschaeftspartner = `Debitor ${gegenkonto}`;
    } else if (gegenkontoNr >= 70000 && gegenkontoNr <= 99999) {
      geschaeftspartnerTyp = "kreditor";
      geschaeftspartner = `Kreditor ${gegenkonto}`;
    }

    const betrag = sollUmsatz || habenUmsatz;
    const sollKonto = sollHaben === "S" ? konto : gegenkonto;
    const habenKonto = sollHaben === "S" ? gegenkonto : konto;

    batch.push([
      unternehmenId,
      buchungsart,
      belegdatum,
      belegnr,
      geschaeftspartnerTyp,
      geschaeftspartner,
      geschaeftspartnerKonto,
      konto,
      null, // kostenstelleId
      betrag, // nettobetrag
      0, // steuersatz (TODO: aus DATEV extrahieren)
      betrag, // bruttobetrag
      buchungstext,
      null, // belegUrl
      "geprueft", // status
      null, // exportiertAm
      "offen", // zahlungsstatus
      null, // faelligkeitsdatum
      null, // bezahltAm
      null, // bezahlterBetrag
      null, // zahlungsreferenz
      sollKonto,
      habenKonto,
      belegnr, // datevBelegnummer
      zeilen.length, // datevBuchungszeile
      null, // datevBelegId
      2025, // wirtschaftsjahr
      1, // periode (TODO: aus Datum extrahieren)
      buchungstext, // datevBuchungstext
      "datev_gdpdu", // importQuelle
      new Date().toISOString().slice(0, 19).replace("T", " "), // importDatum
      IMPORT_REFERENZ, // importReferenz
      null, // createdBy
    ]);

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
          logError(`Fehler beim Buchungs-Import: ${error.message}`);
          throw error;
        }
      }

      batch.length = 0;
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
        throw error;
      }
    }
  }

  logSuccess(`Buchungen-Import abgeschlossen: ${imported} importiert, ${skipped} übersprungen`);
}

/**
 * 4. BELEGE IMPORTIEREN (Metadaten)
 */
async function importBelege(conn: mysql.Connection, unternehmenId: number) {
  logSection("4. BELEGE IMPORTIEREN (Metadaten)");

  const lines = readCSV("belege.csv");

  if (lines.length === 0) {
    logWarning("Keine Belege gefunden");
    return;
  }

  logInfo(`Verarbeite ${lines.length} Belege...`);
  logWarning("Hinweis: Nur Metadaten werden importiert, Dateien müssen separat kopiert werden");

  let imported = 0;
  let skipped = 0;
  const batch: any[][] = [];

  for (const line of lines) {
    const datevBelegId = line[7] || null; // Beleg-ID (BEDI)
    const dateiName = line[8]; // Dateiname
    const externeReferenz = line[4] || null; // Externe Belegnr
    const belegdatum = parseDatevDate(line[1]); // Datum

    if (!dateiName) {
      skipped++;
      continue;
    }

    // Datei-Typ ermitteln
    const ext = path.extname(dateiName).toLowerCase().slice(1);
    let dateiTyp = "sonstig";
    if (["pdf"].includes(ext)) dateiTyp = "pdf";
    if (["png", "jpg", "jpeg", "tiff"].includes(ext)) dateiTyp = ext as any;

    const dateiPfad = path.join(DATEV_IMPORT_PATH, "Belege", dateiName);

    // Dateigröße ermitteln (falls Datei existiert)
    let dateiGroesse = null;
    if (fs.existsSync(dateiPfad)) {
      dateiGroesse = fs.statSync(dateiPfad).size;
    }

    batch.push([
      unternehmenId,
      null, // buchungId (TODO: später verknüpfen)
      datevBelegId,
      externeReferenz,
      dateiName,
      dateiPfad,
      null, // dateiUrl
      dateiGroesse,
      dateiTyp,
      belegdatum,
      null, // beschreibung
      null, // notizen
      null, // uploadedBy
    ]);

    if (batch.length >= BATCH_SIZE) {
      const { sql, values } = createBatchInsert(
        "belege",
        ["unternehmenId", "buchungId", "datevBelegId", "externeReferenz", "dateiName", "dateiPfad", "dateiUrl", "dateiGroesse", "dateiTyp", "belegdatum", "beschreibung", "notizen", "uploadedBy"],
        batch
      );

      try {
        await conn.execute(sql, values);
        imported += batch.length;
        logInfo(`${imported} Belege importiert...`);
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          skipped += batch.length;
        } else {
          throw error;
        }
      }

      batch.length = 0;
    }
  }

  // Restliche Belege
  if (batch.length > 0) {
    const { sql, values } = createBatchInsert(
      "belege",
      ["unternehmenId", "buchungId", "datevBelegId", "externeReferenz", "dateiName", "dateiPfad", "dateiUrl", "dateiGroesse", "dateiTyp", "belegdatum", "beschreibung", "notizen", "uploadedBy"],
      batch
    );

    try {
      await conn.execute(sql, values);
      imported += batch.length;
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        skipped += batch.length;
      } else {
        throw error;
      }
    }
  }

  logSuccess(`Belege-Import abgeschlossen: ${imported} importiert, ${skipped} übersprungen`);
}

/**
 * HAUPTFUNKTION
 */
async function main() {
  console.clear();
  logSection("DATEV GDPDU IMPORT - ANGELUS KG");

  // Prüfe DATEV-Import-Ordner
  if (!fs.existsSync(DATEV_IMPORT_PATH)) {
    logError(`DATEV-Import-Ordner nicht gefunden: ${DATEV_IMPORT_PATH}`);
    process.exit(1);
  }
  logSuccess(`DATEV-Import-Ordner gefunden: ${DATEV_IMPORT_PATH}`);

  // Verbinde zur Datenbank
  logInfo("Verbinde zur Datenbank...");
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  logSuccess("Datenbankverbindung hergestellt");

  try {
    // Finde Angelus KG in der Datenbank
    logInfo(`Suche Unternehmen: ${ANGELUS_UNTERNEHMEN_NAME}...`);
    const [rows] = await conn.execute(
      "SELECT id, name FROM unternehmen WHERE name LIKE ?",
      [`%${ANGELUS_UNTERNEHMEN_NAME}%`]
    );

    const unternehmenList = rows as any[];

    if (unternehmenList.length === 0) {
      logError(`Unternehmen "${ANGELUS_UNTERNEHMEN_NAME}" nicht in Datenbank gefunden!`);
      logInfo("Bitte erstelle zuerst das Unternehmen in der Datenbank.");
      process.exit(1);
    }

    const unternehmen = unternehmenList[0];
    const unternehmenId = unternehmen.id;

    logSuccess(`Unternehmen gefunden: ${unternehmen.name} (ID: ${unternehmenId})`);

    // Starte Import
    const startTime = Date.now();

    await importSachkonten(conn, unternehmenId);
    await importDebitorenKreditoren(conn, unternehmenId);
    await importBuchungen(conn, unternehmenId);
    await importBelege(conn, unternehmenId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection("IMPORT ABGESCHLOSSEN");
    logSuccess(`Gesamtdauer: ${duration} Sekunden`);
    logInfo(`Import-Referenz: ${IMPORT_REFERENZ}`);

    console.log("\n" + "=".repeat(70));
    logInfo("Nächste Schritte:");
    console.log("  1. Prüfe die importierten Daten in der Datenbank");
    console.log("  2. Verknüpfe Belege mit Buchungen (optional)");
    console.log("  3. Kopiere Belegdateien in Cloud-Storage (optional)");
    console.log("=".repeat(70) + "\n");

  } catch (error: any) {
    logError(`Import fehlgeschlagen: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await conn.end();
    logInfo("Datenbankverbindung geschlossen");
  }
}

// Führe Import aus
main();
