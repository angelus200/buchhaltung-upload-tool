#!/usr/bin/env tsx
/**
 * BELEGE MULTI-JAHR IMPORT
 * Importiert Belege aus belege.csv für alle Jahre (2022-2025)
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

function parseDatevDate(datevDate: string): string | null {
  if (!datevDate || datevDate === "") return null;
  const parts = datevDate.split(".");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function extractBediId(bediField: string): string | null {
  // BEDI "94239C24-C1E0-5549-B5A5-06128EEA7C9C" -> 94239C24-C1E0-5549-B5A5-06128EEA7C9C
  const match = bediField.match(/BEDI\s+"([^"]+)"/);
  return match ? match[1] : null;
}

async function importBelegeJahr(conn: mysql.Connection, jahr: number) {
  const jahrOrdner = path.join(DATEV_BASE_PATH, `${jahr}0101`);
  const importReferenz = jahr === 2025 ? "DATEV_2025_VERBESSERT" : `DATEV_${jahr}`;

  console.log(`\n${"═".repeat(70)}`);
  console.log(`JAHR ${jahr} - BELEGE IMPORTIEREN`);
  console.log("═".repeat(70));

  const belegeFilePath = path.join(jahrOrdner, "belege.csv");

  if (!fs.existsSync(belegeFilePath)) {
    console.log(`❌ Datei ${belegeFilePath} nicht gefunden!`);
    return { importiert: 0, uebersprungen: 0 };
  }

  console.log(`📂 Lese ${belegeFilePath}...`);
  const fileContent = fs.readFileSync(belegeFilePath, "latin1");
  const rows = parseCSV(fileContent);
  console.log(`📊 CSV enthält ${rows.length} Zeilen`);

  // Dedupliziere Belege basierend auf BEDI-ID
  const belegeMap = new Map<string, any>();

  for (const row of rows) {
    if (row.length < 10) continue;

    // CSV Struktur: 0;konto;datum;gegenkonto;geschaeftspartner;belegnummer;periode;stapel;bedi;pdf;hyperlink;pages;...
    const [_, konto, datum, gegenkonto, geschaeftspartner, belegnummer, periode, stapel, bediField, pdfFilename] = row;

    const bediId = extractBediId(bediField);
    if (!bediId) continue;

    const belegdatum = parseDatevDate(datum);
    if (!belegdatum) continue;

    // Nur erste Zeile pro BEDI-ID behalten (Soll/Haben-Paare)
    if (!belegeMap.has(bediId)) {
      belegeMap.set(bediId, {
        bediId,
        belegnummer: belegnummer || null,
        belegdatum,
        pdfFilename: pdfFilename || null,
        geschaeftspartner: geschaeftspartner || null,
        periode: periode || null,
      });
    }
  }

  const uniqueBelege = Array.from(belegeMap.values());
  console.log(`📊 ${uniqueBelege.length} eindeutige Belege gefunden`);

  // Prüfe welche Belege bereits existieren (eine Query statt viele)
  const existingIds = new Set<string>();
  if (uniqueBelege.length > 0) {
    const bediIds = uniqueBelege.map(b => b.bediId);
    const placeholders = bediIds.map(() => '?').join(',');
    const [existing] = await conn.execute(
      `SELECT datevBelegId FROM belege WHERE unternehmenId = ? AND datevBelegId IN (${placeholders})`,
      [ANGELUS_UNTERNEHMEN_ID, ...bediIds]
    );
    (existing as any[]).forEach(row => existingIds.add(row.datevBelegId));
  }

  // Filtere bereits existierende Belege aus
  const neueBelege = uniqueBelege.filter(b => !existingIds.has(b.bediId));
  console.log(`📊 ${neueBelege.length} neue Belege zu importieren`);

  // Importiere Belege in Batches mit Batch INSERT
  let importiert = 0;
  const uebersprungen = uniqueBelege.length - neueBelege.length;

  for (let i = 0; i < neueBelege.length; i += BATCH_SIZE) {
    const batch = neueBelege.slice(i, i + BATCH_SIZE);

    // Baue Batch INSERT Query
    const values: any[] = [];
    const valuePlaceholders: string[] = [];

    for (const beleg of batch) {
      const dateiPfad = beleg.pdfFilename
        ? path.join(jahrOrdner, "Belege", beleg.pdfFilename)
        : null;

      const dateiExists = dateiPfad && fs.existsSync(dateiPfad);
      const dateiGroesse = dateiExists ? fs.statSync(dateiPfad).size : null;

      valuePlaceholders.push('(?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
      values.push(
        ANGELUS_UNTERNEHMEN_ID,
        beleg.bediId,
        beleg.belegnummer,
        beleg.pdfFilename || "unbekannt.pdf",
        dateiPfad,
        dateiGroesse,
        "pdf",
        beleg.belegdatum,
        beleg.geschaeftspartner || null
      );
    }

    try {
      await conn.execute(
        `INSERT INTO belege (
          unternehmenId,
          buchungId,
          datevBelegId,
          externeReferenz,
          dateiName,
          dateiPfad,
          dateiGroesse,
          dateiTyp,
          belegdatum,
          beschreibung,
          createdAt,
          updatedAt
        ) VALUES ${valuePlaceholders.join(', ')}`,
        values
      );

      importiert += batch.length;

      if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= neueBelege.length) {
        console.log(`📊 ${Math.min(i + BATCH_SIZE, neueBelege.length)} Belege importiert...`);
      }
    } catch (error: any) {
      console.error(`❌ Fehler bei Batch ab Index ${i}:`, error.message);
    }
  }

  console.log(`\n✅ Jahr ${jahr} abgeschlossen!`);
  console.log(`   Importiert: ${importiert}`);
  console.log(`   Übersprungen: ${uebersprungen}`);

  return { importiert, uebersprungen };
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n╔════════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                    ║");
  console.log("║  BELEGE MULTI-JAHR IMPORT: 2022-2025                               ║");
  console.log("║                                                                    ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  let totalImportiert = 0;
  let totalUebersprungen = 0;

  for (const jahr of JAHRE_ZU_IMPORTIEREN) {
    const result = await importBelegeJahr(conn, jahr);
    totalImportiert += result.importiert;
    totalUebersprungen += result.uebersprungen;
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log("GESAMT-ERGEBNIS");
  console.log("═".repeat(70));
  console.log(`✅ Importiert: ${totalImportiert} Belege`);
  console.log(`ℹ️  Übersprungen: ${totalUebersprungen} Belege`);
  console.log("═".repeat(70));

  // Finale Statistik
  const [stats] = await conn.execute(`
    SELECT
      YEAR(belegdatum) as jahr,
      COUNT(*) as anzahl,
      SUM(CASE WHEN dateiGroesse IS NOT NULL THEN 1 ELSE 0 END) as mitDatei
    FROM belege
    WHERE unternehmenId = ?
    GROUP BY YEAR(belegdatum)
    ORDER BY jahr
  `, [ANGELUS_UNTERNEHMEN_ID]);

  console.log(`\n📊 FINALE ÜBERSICHT - BELEGE ANGELUS KG:`);
  console.log("─".repeat(70));
  (stats as any[]).forEach((row) => {
    console.log(`   ${row.jahr || "NULL"}: ${row.anzahl} Belege (${row.mitDatei} mit Datei)`);
  });

  await conn.end();
}

main().catch(console.error);
