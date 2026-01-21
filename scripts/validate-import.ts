#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n" + "=".repeat(70));
  console.log("IMPORT-VALIDIERUNG - ANGELUS KG");
  console.log("=".repeat(70) + "\n");

  // Anzahl importierter Datensätze
  const [results] = await conn.execute(`
    SELECT 'Sachkonten' as Typ, COUNT(*) as Anzahl
    FROM sachkonten WHERE unternehmenId = 1
    UNION ALL
    SELECT 'Debitoren', COUNT(*) FROM debitoren WHERE unternehmenId = 1
    UNION ALL
    SELECT 'Kreditoren', COUNT(*) FROM kreditoren WHERE unternehmenId = 1
    UNION ALL
    SELECT 'Buchungen', COUNT(*) FROM buchungen WHERE unternehmenId = 1
    UNION ALL
    SELECT 'Belege', COUNT(*) FROM belege WHERE unternehmenId = 1
  `);

  console.log("Importierte Datensätze:");
  console.log("─".repeat(70));
  (results as any[]).forEach((row: any) => {
    console.log(`  ${row.Typ.padEnd(20)} ${String(row.Anzahl).padStart(6)}`);
  });

  // Import-Quelle prüfen
  const [importResults] = await conn.execute(`
    SELECT importQuelle, importReferenz, COUNT(*) as Anzahl
    FROM buchungen
    WHERE unternehmenId = 1
    GROUP BY importQuelle, importReferenz
  `);

  console.log("\n" + "─".repeat(70));
  console.log("Buchungen nach Import-Quelle:");
  console.log("─".repeat(70));
  (importResults as any[]).forEach((row: any) => {
    console.log(`  ${(row.importQuelle || 'NULL').padEnd(20)} ${(row.importReferenz || 'NULL').padEnd(20)} ${String(row.Anzahl).padStart(6)}`);
  });

  // Buchungssummen
  const [sumResults] = await conn.execute(`
    SELECT
      buchungsart,
      COUNT(*) as Anzahl,
      SUM(bruttobetrag) as Summe
    FROM buchungen
    WHERE unternehmenId = 1
    GROUP BY buchungsart
  `);

  console.log("\n" + "─".repeat(70));
  console.log("Buchungen nach Art:");
  console.log("─".repeat(70));
  (sumResults as any[]).forEach((row: any) => {
    const summe = parseFloat(row.Summe).toFixed(2);
    console.log(`  ${row.buchungsart.padEnd(20)} ${String(row.Anzahl).padStart(6)} Buchungen    Summe: ${summe.padStart(15)} EUR`);
  });

  console.log("\n" + "=".repeat(70) + "\n");

  await conn.end();
}

main().catch(console.error);
