#!/usr/bin/env tsx
/**
 * MULTI-JAHR DATEV-IMPORT
 * Importiert alle fehlenden Jahre (2021-2024) in die Datenbank
 * Basiert auf dem verbesserten Import-Script für 2025
 */
import "dotenv/config";
import * as mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

const DATEV_BASE_PATH = path.join(process.env.HOME!, "Downloads", "download_krwe_22593_28245_20260115");
const ANGELUS_UNTERNEHMEN_ID = 1;
const BATCH_SIZE = 50;

// Jahre die importiert werden sollen (2025 ist bereits importiert)
const JAHRE_ZU_IMPORTIEREN = [2021, 2022, 2023, 2024];

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

function parseDatevDate(datevDate: string): string | null {
  if (!datevDate || datevDate === "") return null;
  const parts = datevDate.split(".");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseDatevAmount(amount: string): number {
  if (!amount || amount === "") return 0;
  return parseFloat(amount.replace(/\./g, "").replace(",", "."));
}

function getPeriodeFromDate(datevDate: string): number {
  if (!datevDate) return 1;
  const parts = datevDate.split(".");
  if (parts.length !== 3) return 1;
  return parseInt(parts[1]) || 1;
}

function getBuchungsart(kontonr: string): string {
  // SKR04 Kontenrahmen Logik (6-stellige Konten)
  // Erste Ziffer bestimmt die Kontenklasse
  const firstDigit = parseInt(kontonr.charAt(0));

  // 0-3: Bilanzkonten (Aktiva/Passiva)
  if (firstDigit >= 0 && firstDigit <= 3) return "anlage";

  // 4: Betriebliche Erträge
  if (firstDigit === 4) return "ertrag";

  // 5-8: Betriebliche Aufwendungen
  if (firstDigit >= 5 && firstDigit <= 8) return "aufwand";

  // 9: Vortragskonten
  return "sonstig";
}

function getGeschaeftspartnerTyp(kontonr: string): string {
  const nr = parseInt(kontonr);
  if (nr >= 10000 && nr <= 69999) return "debitor";
  if (nr >= 70000 && nr <= 99999) return "kreditor";
  return "sonstig";
}

function createBatchInsert(
  tableName: string,
  columns: string[],
  rows: any[][]
): { sql: string; values: any[] } {
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
  sollHaben: string;
  buchungstext: string;
  konto: string;
  sollUmsatz: number;
  habenUmsatz: number;
  steuersatz: number;
  gegenkonto: string;
  belegId: string;
}

async function importJahr(conn: mysql.Connection, jahr: number) {
  const jahrOrdner = path.join(DATEV_BASE_PATH, `${jahr}0101`);
  const importReferenz = `DATEV_${jahr}`;

  console.log("\n" + "═".repeat(70));
  console.log(`JAHR ${jahr} IMPORTIEREN`);
  console.log("═".repeat(70) + "\n");

  // Prüfe ob Ordner existiert
  if (!fs.existsSync(jahrOrdner)) {
    console.log(`❌ Ordner ${jahrOrdner} nicht gefunden!`);
    return { imported: 0, skipped: 0, errors: 0 };
  }

  // Prüfe ob bereits importiert
  const [existing] = await conn.execute(
    `SELECT COUNT(*) as count FROM buchungen WHERE unternehmenId = ? AND importReferenz = ?`,
    [ANGELUS_UNTERNEHMEN_ID, importReferenz]
  );
  const existingCount = (existing as any[])[0].count;

  if (existingCount > 0) {
    console.log(`ℹ️  Jahr ${jahr} bereits importiert (${existingCount} Buchungen)`);
    console.log(`   Überspringe Import...`);
    return { imported: 0, skipped: existingCount, errors: 0 };
  }

  // Lese CSV
  const filePath = path.join(jahrOrdner, "buchungssatzprotokoll.csv");

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Datei ${filePath} nicht gefunden!`);
    return { imported: 0, skipped: 0, errors: 0 };
  }

  console.log(`📂 Lese ${filePath}...`);

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    content = fs.readFileSync(filePath, "latin1");
  }

  const lines = parseCSV(content);
  console.log(`📊 CSV enthält ${lines.length} Zeilen`);

  if (lines.length === 0) {
    console.log(`⚠️  Keine Daten in CSV-Datei für Jahr ${jahr}`);
    return { imported: 0, skipped: 0, errors: 0 };
  }

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

  console.log(`📊 ${buchungsZeilen.length} gültige Buchungszeilen gefunden`);

  // Gruppiere nach Belegnummer + Zeilennummer
  const buchungspaare = new Map<string, BuchungsZeile[]>();

  for (const zeile of buchungsZeilen) {
    const key = `${zeile.belegnr}_${zeile.zeilennr}`;
    if (!buchungspaare.has(key)) {
      buchungspaare.set(key, []);
    }
    buchungspaare.get(key)!.push(zeile);
  }

  console.log(`📊 ${buchungspaare.size} Buchungssätze (Soll/Haben-Paare) gefunden`);

  // Importiere Buchungen
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const batch: any[][] = [];

  for (const [key, zeilen] of Array.from(buchungspaare.entries())) {
    try {
      const sollZeile = zeilen.find((z) => z.sollHaben === "S");
      const habenZeile = zeilen.find((z) => z.sollHaben === "H");

      if (!sollZeile || !habenZeile) {
        // Einzelne Zeile (z.B. Eröffnungsbuchungen)
        const zeile = zeilen[0];
        const betrag = zeile.sollUmsatz || zeile.habenUmsatz;

        const belegdatum = parseDatevDate(zeile.belegdatum);
        const buchungsart = getBuchungsart(zeile.konto);
        const geschaeftspartnerTyp = getGeschaeftspartnerTyp(zeile.gegenkonto);
        const periode = getPeriodeFromDate(zeile.belegdatum);
        const wirtschaftsjahr = belegdatum ? parseInt(belegdatum.split("-")[0]) : jahr;

        batch.push([
          ANGELUS_UNTERNEHMEN_ID,
          buchungsart,
          belegdatum,
          zeile.belegnr,
          geschaeftspartnerTyp,
          zeile.buchungstext || "Unbekannt",
          zeile.gegenkonto || zeile.konto,
          zeile.konto,
          null,
          betrag,
          zeile.steuersatz,
          betrag,
          zeile.buchungstext,
          null,
          "geprueft",
          null,
          "offen",
          null,
          null,
          null,
          null,
          zeile.sollHaben === "S" ? zeile.konto : zeile.gegenkonto,
          zeile.sollHaben === "H" ? zeile.konto : zeile.gegenkonto,
          zeile.belegnr,
          zeile.zeilennr,
          zeile.belegId || null,
          wirtschaftsjahr,
          periode,
          zeile.buchungstext,
          "datev_gdpdu",
          new Date().toISOString().slice(0, 19).replace("T", " "),
          importReferenz,
          null,
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
      const wirtschaftsjahr = belegdatum ? parseInt(belegdatum.split("-")[0]) : jahr;

      let nettobetrag = betrag;
      let bruttobetrag = betrag;

      if (steuersatz > 0) {
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
        null,
        nettobetrag,
        steuersatz,
        bruttobetrag,
        sollZeile.buchungstext,
        null,
        "geprueft",
        null,
        "offen",
        null,
        null,
        null,
        null,
        sollZeile.konto,
        habenZeile.konto,
        sollZeile.belegnr,
        sollZeile.zeilennr,
        sollZeile.belegId || null,
        wirtschaftsjahr,
        periode,
        sollZeile.buchungstext,
        "datev_gdpdu",
        new Date().toISOString().slice(0, 19).replace("T", " "),
        importReferenz,
        null,
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
          console.log(`📊 ${imported} Buchungen importiert...`);
        } catch (error: any) {
          if (error.code === "ER_DUP_ENTRY") {
            skipped += batch.length;
          } else {
            console.error(`❌ Fehler: ${error.message}`);
            errors += batch.length;
          }
        }

        batch.length = 0;
      }
    } catch (error: any) {
      console.error(`❌ Fehler bei Buchung ${key}: ${error.message}`);
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

  console.log(`\n✅ Jahr ${jahr} abgeschlossen!`);
  console.log(`   Importiert: ${imported}`);
  console.log(`   Übersprungen: ${skipped}`);
  if (errors > 0) {
    console.log(`   Fehler: ${errors}`);
  }

  return { imported, skipped, errors };
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n" + "╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(68) + "║");
  console.log("║" + "  MULTI-JAHR DATEV-IMPORT: 2021-2024".padEnd(69) + "║");
  console.log("║" + " ".repeat(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝\n");

  const gesamtErgebnis = {
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  for (const jahr of JAHRE_ZU_IMPORTIEREN) {
    const ergebnis = await importJahr(conn, jahr);
    gesamtErgebnis.imported += ergebnis.imported;
    gesamtErgebnis.skipped += ergebnis.skipped;
    gesamtErgebnis.errors += ergebnis.errors;
  }

  console.log("\n" + "═".repeat(70));
  console.log("GESAMT-ERGEBNIS");
  console.log("═".repeat(70));
  console.log(`✅ Importiert: ${gesamtErgebnis.imported} Buchungen`);
  console.log(`ℹ️  Übersprungen: ${gesamtErgebnis.skipped} Buchungen`);
  if (gesamtErgebnis.errors > 0) {
    console.log(`❌ Fehler: ${gesamtErgebnis.errors} Buchungen`);
  }
  console.log("═".repeat(70) + "\n");

  // Zeige finalen Status
  const [result] = await conn.execute(`
    SELECT
      wirtschaftsjahr,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = 1
    GROUP BY wirtschaftsjahr
    ORDER BY wirtschaftsjahr
  `);

  console.log("📊 FINALE ÜBERSICHT - ANGELUS KG:");
  console.log("─".repeat(70));
  (result as any[]).forEach((row) => {
    const summe = parseFloat(row.summe || "0").toLocaleString("de-DE", { minimumFractionDigits: 2 });
    console.log(`   ${row.wirtschaftsjahr}: ${row.anzahl} Buchungen, Summe: ${summe} EUR`);
  });
  console.log("");

  await conn.end();
}

main().catch(console.error);
