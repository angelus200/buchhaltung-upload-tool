#!/usr/bin/env tsx
/**
 * Schritt 3: Importiere restliche Belege
 * Importiert die fehlenden Belege ab ID 2.401
 */
import "dotenv/config";
import * as mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

const DATEV_IMPORT_PATH = path.join(process.env.HOME!, "Downloads", "datev-import");
const ANGELUS_UNTERNEHMEN_ID = 1;
const BATCH_SIZE = 50; // Kleinere Batches

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

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n" + "=".repeat(70));
  console.log("SCHRITT 3: RESTLICHE BELEGE IMPORTIEREN");
  console.log("=".repeat(70) + "\n");

  // Prüfe aktuellen Status
  const [aktuelleAnzahl] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM belege WHERE unternehmenId = 1
  `);

  const aktuell = (aktuelleAnzahl as any[])[0].anzahl;
  console.log(`📊 Aktuell: ${aktuell} Belege in Datenbank`);

  // Lese CSV
  const filePath = path.join(DATEV_IMPORT_PATH, "belege.csv");
  console.log(`📂 Lese ${filePath}...`);

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    content = fs.readFileSync(filePath, "latin1");
  }

  const lines = parseCSV(content);
  console.log(`📊 CSV enthält ${lines.length} Belege gesamt`);

  const fehlend = lines.length - aktuell;
  console.log(`🔄 Importiere ${fehlend} fehlende Belege...`);

  if (fehlend <= 0) {
    console.log("✅ Alle Belege bereits importiert!\n");
    await conn.end();
    return;
  }

  // Importiere fehlende Belege (ab Index aktuell)
  let imported = 0;
  let skipped = 0;
  const batch: any[][] = [];

  for (let i = aktuell; i < lines.length; i++) {
    const line = lines[i];

    const datevBelegId = line[7] || null;
    const dateiName = line[8];
    const externeReferenz = line[4] || null;
    const belegdatum = parseDatevDate(line[1]);

    if (!dateiName) {
      skipped++;
      continue;
    }

    const ext = path.extname(dateiName).toLowerCase().slice(1);
    let dateiTyp = "sonstig";
    if (["pdf"].includes(ext)) dateiTyp = "pdf";
    if (["png", "jpg", "jpeg", "tiff"].includes(ext)) dateiTyp = ext as any;

    const dateiPfad = path.join(DATEV_IMPORT_PATH, "Belege", dateiName);

    let dateiGroesse = null;
    if (fs.existsSync(dateiPfad)) {
      dateiGroesse = fs.statSync(dateiPfad).size;
    }

    batch.push([
      ANGELUS_UNTERNEHMEN_ID,
      null, // buchungId
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
        console.log(`📊 ${aktuell + imported} Belege importiert...`);
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          skipped += batch.length;
        } else {
          console.error(`❌ Fehler: ${error.message}`);
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
      }
    }
  }

  console.log(`\n✅ Import abgeschlossen!`);
  console.log(`   Importiert: ${imported}`);
  console.log(`   Übersprungen: ${skipped}`);

  // Zeige finalen Status
  const [finaleAnzahl] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM belege WHERE unternehmenId = 1
  `);

  const final = (finaleAnzahl as any[])[0].anzahl;
  console.log(`\n📊 Finaler Status: ${final} Belege in Datenbank`);

  console.log("\n" + "=".repeat(70) + "\n");

  await conn.end();
}

main().catch(console.error);
