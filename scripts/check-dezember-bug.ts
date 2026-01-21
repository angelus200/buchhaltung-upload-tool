#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("=== BUCHUNGEN PRO MONAT 2024/2025 ===\n");
  const [rows] = await conn.execute(`
    SELECT
      YEAR(belegdatum) as jahr,
      MONTH(belegdatum) as monat,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = 1
      AND YEAR(belegdatum) IN (2024, 2025)
    GROUP BY YEAR(belegdatum), MONTH(belegdatum)
    ORDER BY YEAR(belegdatum), MONTH(belegdatum)
  `);

  console.table(rows);

  console.log("\n=== BEISPIEL DEZEMBER 2024 BUCHUNGEN ===\n");
  const [dez2024] = await conn.execute(`
    SELECT
      belegnummer,
      belegdatum,
      geschaeftspartner,
      sachkonto,
      CAST(bruttobetrag AS DECIMAL(15,2)) as brutto
    FROM buchungen
    WHERE unternehmenId = 1
      AND YEAR(belegdatum) = 2024
      AND MONTH(belegdatum) = 12
    LIMIT 10
  `);

  console.table(dez2024);

  console.log("\n=== BEISPIEL DEZEMBER 2025 BUCHUNGEN ===\n");
  const [dez2025] = await conn.execute(`
    SELECT
      belegnummer,
      belegdatum,
      geschaeftspartner,
      sachkonto,
      CAST(bruttobetrag AS DECIMAL(15,2)) as brutto
    FROM buchungen
    WHERE unternehmenId = 1
      AND YEAR(belegdatum) = 2025
      AND MONTH(belegdatum) = 12
    LIMIT 10
  `);

  console.table(dez2025);

  await conn.end();
}

main().catch(console.error);
