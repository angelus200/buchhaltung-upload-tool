#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n=== DATENBANK-STATUS: ANGELUS KG ===\n");

  // Buchungen nach Wirtschaftsjahr
  const [jahreResult] = await conn.execute(`
    SELECT
      wirtschaftsjahr,
      COUNT(*) as anzahl
    FROM buchungen
    WHERE unternehmenId = 1
    GROUP BY wirtschaftsjahr
    ORDER BY wirtschaftsjahr
  `);

  console.log("Buchungen in Datenbank nach Wirtschaftsjahr:");
  console.log("────────────────────────────────────────────");
  (jahreResult as any[]).forEach((row) => {
    console.log(`Jahr ${row.wirtschaftsjahr || "NULL"}: ${row.anzahl} Buchungen`);
  });

  // Import-Referenzen
  const [refsResult] = await conn.execute(`
    SELECT
      importReferenz,
      COUNT(*) as anzahl,
      MIN(belegdatum) as von,
      MAX(belegdatum) as bis
    FROM buchungen
    WHERE unternehmenId = 1
    GROUP BY importReferenz
    ORDER BY importReferenz
  `);

  console.log("\nImport-Referenzen:");
  console.log("────────────────────────────────────────────");
  (refsResult as any[]).forEach((row) => {
    const von = row.von ? new Date(row.von).toLocaleDateString("de-DE") : "?";
    const bis = row.bis ? new Date(row.bis).toLocaleDateString("de-DE") : "?";
    console.log(`${row.importReferenz || "NULL"}: ${row.anzahl} Buchungen (${von} - ${bis})`);
  });

  // Perioden
  const [periodenResult] = await conn.execute(`
    SELECT
      wirtschaftsjahr,
      periode,
      COUNT(*) as anzahl
    FROM buchungen
    WHERE unternehmenId = 1 AND wirtschaftsjahr = 2025
    GROUP BY wirtschaftsjahr, periode
    ORDER BY periode
  `);

  console.log("\nPerioden (Monate) für 2025:");
  console.log("────────────────────────────────────────────");
  (periodenResult as any[]).forEach((row) => {
    const monate = ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    console.log(`${monate[row.periode]} 2025: ${row.anzahl} Buchungen`);
  });

  // Belege
  const [belegeResult] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM belege WHERE unternehmenId = 1
  `);

  console.log("\nBelege:");
  console.log("────────────────────────────────────────────");
  console.log(`Total: ${(belegeResult as any[])[0].anzahl} Belege`);

  // Stammdaten
  const [kreditoren] = await conn.execute(`SELECT COUNT(*) as anzahl FROM kreditoren WHERE unternehmenId = 1`);
  const [debitoren] = await conn.execute(`SELECT COUNT(*) as anzahl FROM debitoren WHERE unternehmenId = 1`);
  const [sachkonten] = await conn.execute(`SELECT COUNT(*) as anzahl FROM sachkonten WHERE unternehmenId = 1`);

  console.log("\nStammdaten:");
  console.log("────────────────────────────────────────────");
  console.log(`Kreditoren: ${(kreditoren as any[])[0].anzahl}`);
  console.log(`Debitoren: ${(debitoren as any[])[0].anzahl}`);
  console.log(`Sachkonten: ${(sachkonten as any[])[0].anzahl}`);

  console.log("\n");

  await conn.end();
}

main().catch(console.error);
