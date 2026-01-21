#!/usr/bin/env tsx
/**
 * STAMMDATEN MULTI-JAHR IMPORT
 * Importiert Kreditoren, Debitoren und Sachkonten für alle Jahre
 */
import "dotenv/config";
import * as mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

const DATEV_BASE_PATH = path.join(process.env.HOME!, "Downloads", "download_krwe_22593_28245_20260115");
const ANGELUS_UNTERNEHMEN_ID = 1;
const BATCH_SIZE = 50;

// Jahre die importiert werden sollen
const JAHRE_ZU_IMPORTIEREN = [2022, 2023, 2024, 2025];

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

async function importDebitorenKreditoren(conn: mysql.Connection, jahr: number) {
  const jahrOrdner = path.join(DATEV_BASE_PATH, `${jahr}0101`);

  console.log(`\n${"═".repeat(70)}`);
  console.log(`JAHR ${jahr} - DEBITOREN/KREDITOREN IMPORTIEREN`);
  console.log("═".repeat(70));

  const stammdatenFilePath = path.join(jahrOrdner, "DebitorenKreditorenstammdaten.csv");

  if (!fs.existsSync(stammdatenFilePath)) {
    console.log(`❌ Datei ${stammdatenFilePath} nicht gefunden!`);
    return { kreditoren: 0, debitoren: 0 };
  }

  console.log(`📂 Lese ${stammdatenFilePath}...`);
  const fileContent = fs.readFileSync(stammdatenFilePath, "latin1");
  const rows = parseCSV(fileContent);
  console.log(`📊 CSV enthält ${rows.length} Zeilen`);

  // Dedupliziere basierend auf Kontonummer
  const stammdatenMap = new Map<string, any>();

  for (const row of rows) {
    if (row.length < 2) continue;

    // CSV Struktur: kontonr;name;...viele weitere Felder...
    const kontonr = row[0];
    const name = row[1];

    if (!kontonr || !name) continue;

    const kontoNr = parseInt(kontonr);
    if (isNaN(kontoNr)) continue;

    // Bestimme Typ basierend auf Kontonummer (DATEV-Logik)
    // Debitoren: Konten die mit 1 beginnen (10000-19999999)
    // Kreditoren: Konten die mit 7 beginnen (70000-79999999)
    let typ: "debitor" | "kreditor" | "sonstig";
    const firstDigit = Math.floor(kontoNr / Math.pow(10, Math.floor(Math.log10(kontoNr))));

    if (firstDigit === 1) {
      typ = "debitor";
    } else if (firstDigit === 7) {
      typ = "kreditor";
    } else {
      continue; // Ignoriere Sachkonten
    }

    stammdatenMap.set(kontonr, {
      kontonummer: kontonr,
      name,
      typ,
    });
  }

  console.log(`📊 ${stammdatenMap.size} eindeutige Stammdaten gefunden`);

  // Filtere nach Typ
  const debitoren = Array.from(stammdatenMap.values()).filter(s => s.typ === "debitor");
  const kreditoren = Array.from(stammdatenMap.values()).filter(s => s.typ === "kreditor");

  console.log(`📊 ${debitoren.length} Debitoren, ${kreditoren.length} Kreditoren`);

  // Prüfe welche Debitoren bereits existieren
  const existingDebitorenIds = new Set<string>();
  if (debitoren.length > 0) {
    const kontonummern = debitoren.map(d => d.kontonummer);
    const placeholders = kontonummern.map(() => '?').join(',');
    const [existing] = await conn.execute(
      `SELECT kontonummer FROM debitoren WHERE unternehmenId = ? AND kontonummer IN (${placeholders})`,
      [ANGELUS_UNTERNEHMEN_ID, ...kontonummern]
    );
    (existing as any[]).forEach(row => existingDebitorenIds.add(row.kontonummer));
  }

  // Prüfe welche Kreditoren bereits existieren
  const existingKreditorenIds = new Set<string>();
  if (kreditoren.length > 0) {
    const kontonummern = kreditoren.map(k => k.kontonummer);
    const placeholders = kontonummern.map(() => '?').join(',');
    const [existing] = await conn.execute(
      `SELECT kontonummer FROM kreditoren WHERE unternehmenId = ? AND kontonummer IN (${placeholders})`,
      [ANGELUS_UNTERNEHMEN_ID, ...kontonummern]
    );
    (existing as any[]).forEach(row => existingKreditorenIds.add(row.kontonummer));
  }

  const neueDebitoren = debitoren.filter(d => !existingDebitorenIds.has(d.kontonummer));
  const neueKreditoren = kreditoren.filter(k => !existingKreditorenIds.has(k.kontonummer));

  console.log(`📊 ${neueDebitoren.length} neue Debitoren, ${neueKreditoren.length} neue Kreditoren`);

  // Importiere Debitoren in Batches
  let debitorenImportiert = 0;
  for (let i = 0; i < neueDebitoren.length; i += BATCH_SIZE) {
    const batch = neueDebitoren.slice(i, i + BATCH_SIZE);

    const values: any[] = [];
    const valuePlaceholders: string[] = [];

    for (const debitor of batch) {
      valuePlaceholders.push('(?, ?, ?, NULL, NOW(), NOW())');
      values.push(
        ANGELUS_UNTERNEHMEN_ID,
        debitor.kontonummer,
        debitor.name
      );
    }

    try {
      await conn.execute(
        `INSERT INTO debitoren (
          unternehmenId,
          kontonummer,
          name,
          datevKontonummer,
          createdAt,
          updatedAt
        ) VALUES ${valuePlaceholders.join(', ')}`,
        values
      );

      debitorenImportiert += batch.length;
    } catch (error: any) {
      console.error(`❌ Fehler bei Debitoren-Batch ab Index ${i}:`, error.message);
    }
  }

  // Importiere Kreditoren in Batches
  let kreditorenImportiert = 0;
  for (let i = 0; i < neueKreditoren.length; i += BATCH_SIZE) {
    const batch = neueKreditoren.slice(i, i + BATCH_SIZE);

    const values: any[] = [];
    const valuePlaceholders: string[] = [];

    for (const kreditor of batch) {
      valuePlaceholders.push('(?, ?, ?, NULL, NOW(), NOW())');
      values.push(
        ANGELUS_UNTERNEHMEN_ID,
        kreditor.kontonummer,
        kreditor.name
      );
    }

    try {
      await conn.execute(
        `INSERT INTO kreditoren (
          unternehmenId,
          kontonummer,
          name,
          datevKontonummer,
          createdAt,
          updatedAt
        ) VALUES ${valuePlaceholders.join(', ')}`,
        values
      );

      kreditorenImportiert += batch.length;
    } catch (error: any) {
      console.error(`❌ Fehler bei Kreditoren-Batch ab Index ${i}:`, error.message);
    }
  }

  console.log(`\n✅ Jahr ${jahr} abgeschlossen!`);
  console.log(`   Debitoren importiert: ${debitorenImportiert}`);
  console.log(`   Kreditoren importiert: ${kreditorenImportiert}`);

  return {
    debitoren: debitorenImportiert,
    kreditoren: kreditorenImportiert,
  };
}

async function importSachkonten(conn: mysql.Connection, jahr: number) {
  const jahrOrdner = path.join(DATEV_BASE_PATH, `${jahr}0101`);

  console.log(`\n${"═".repeat(70)}`);
  console.log(`JAHR ${jahr} - SACHKONTEN IMPORTIEREN`);
  console.log("═".repeat(70));

  const sachkontenFilePath = path.join(jahrOrdner, "Sachkontenstamm.csv");

  if (!fs.existsSync(sachkontenFilePath)) {
    console.log(`❌ Datei ${sachkontenFilePath} nicht gefunden!`);
    return 0;
  }

  console.log(`📂 Lese ${sachkontenFilePath}...`);
  const fileContent = fs.readFileSync(sachkontenFilePath, "latin1");
  const rows = parseCSV(fileContent);
  console.log(`📊 CSV enthält ${rows.length} Zeilen`);

  // Dedupliziere basierend auf Kontonummer
  const sachkontenMap = new Map<string, any>();

  for (const row of rows) {
    if (row.length < 2) continue;

    // CSV Struktur: kontonr;bezeichnung;...
    const kontonr = row[0];
    const bezeichnung = row[1];

    if (!kontonr || !bezeichnung) continue;

    sachkontenMap.set(kontonr, {
      kontonummer: kontonr,
      bezeichnung,
    });
  }

  console.log(`📊 ${sachkontenMap.size} eindeutige Sachkonten gefunden`);

  const sachkonten = Array.from(sachkontenMap.values());

  // Prüfe welche Sachkonten bereits existieren
  const existingSachkontenIds = new Set<string>();
  if (sachkonten.length > 0) {
    const kontonummern = sachkonten.map(s => s.kontonummer);
    const placeholders = kontonummern.map(() => '?').join(',');
    const [existing] = await conn.execute(
      `SELECT kontonummer FROM sachkonten WHERE unternehmenId = ? AND kontonummer IN (${placeholders})`,
      [ANGELUS_UNTERNEHMEN_ID, ...kontonummern]
    );
    (existing as any[]).forEach(row => existingSachkontenIds.add(row.kontonummer));
  }

  const neueSachkonten = sachkonten.filter(s => !existingSachkontenIds.has(s.kontonummer));
  console.log(`📊 ${neueSachkonten.length} neue Sachkonten zu importieren`);

  // Importiere Sachkonten in Batches
  let importiert = 0;
  for (let i = 0; i < neueSachkonten.length; i += BATCH_SIZE) {
    const batch = neueSachkonten.slice(i, i + BATCH_SIZE);

    const values: any[] = [];
    const valuePlaceholders: string[] = [];

    for (const sachkonto of batch) {
      valuePlaceholders.push('(?, ?, ?, ?, NOW(), NOW())');
      values.push(
        ANGELUS_UNTERNEHMEN_ID,
        "SKR04", // Kontenrahmen
        sachkonto.kontonummer,
        sachkonto.bezeichnung
      );
    }

    try {
      await conn.execute(
        `INSERT INTO sachkonten (
          unternehmenId,
          kontenrahmen,
          kontonummer,
          bezeichnung,
          createdAt,
          updatedAt
        ) VALUES ${valuePlaceholders.join(', ')}`,
        values
      );

      importiert += batch.length;
    } catch (error: any) {
      console.error(`❌ Fehler bei Sachkonten-Batch ab Index ${i}:`, error.message);
    }
  }

  console.log(`\n✅ Jahr ${jahr} abgeschlossen!`);
  console.log(`   Sachkonten importiert: ${importiert}`);

  return importiert;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n╔════════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                    ║");
  console.log("║  STAMMDATEN MULTI-JAHR IMPORT: 2022-2025                           ║");
  console.log("║                                                                    ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  let totalDebitoren = 0;
  let totalKreditoren = 0;
  let totalSachkonten = 0;

  for (const jahr of JAHRE_ZU_IMPORTIEREN) {
    const debKredResult = await importDebitorenKreditoren(conn, jahr);
    totalDebitoren += debKredResult.debitoren;
    totalKreditoren += debKredResult.kreditoren;

    const sachkontenResult = await importSachkonten(conn, jahr);
    totalSachkonten += sachkontenResult;
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log("GESAMT-ERGEBNIS");
  console.log("═".repeat(70));
  console.log(`✅ Debitoren importiert: ${totalDebitoren}`);
  console.log(`✅ Kreditoren importiert: ${totalKreditoren}`);
  console.log(`✅ Sachkonten importiert: ${totalSachkonten}`);
  console.log("═".repeat(70));

  // Finale Statistik
  const [debStats] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM debitoren WHERE unternehmenId = ?
  `, [ANGELUS_UNTERNEHMEN_ID]);

  const [kredStats] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM kreditoren WHERE unternehmenId = ?
  `, [ANGELUS_UNTERNEHMEN_ID]);

  const [sachStats] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM sachkonten WHERE unternehmenId = ?
  `, [ANGELUS_UNTERNEHMEN_ID]);

  console.log(`\n📊 FINALE ÜBERSICHT - STAMMDATEN ANGELUS KG:`);
  console.log("─".repeat(70));
  console.log(`   Debitoren: ${(debStats as any[])[0].anzahl}`);
  console.log(`   Kreditoren: ${(kredStats as any[])[0].anzahl}`);
  console.log(`   Sachkonten: ${(sachStats as any[])[0].anzahl}`);

  await conn.end();
}

main().catch(console.error);
