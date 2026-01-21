#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n=== PRODUCTION DB STATUS ===\n");

  // 1. Import-Referenzen
  console.log("1. IMPORT-REFERENZEN:");
  const [importRefs] = await conn.execute(`
    SELECT DISTINCT importReferenz, COUNT(*) as anzahl
    FROM buchungen
    WHERE unternehmenId = 1
    GROUP BY importReferenz
    ORDER BY importReferenz
  `);
  console.table(importRefs);

  // 2. Buchungsarten
  console.log("\n2. BUCHUNGSARTEN:");
  const [buchungsarten] = await conn.execute(`
    SELECT
      buchungsart,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = 1
    GROUP BY buchungsart
    ORDER BY buchungsart
  `);
  console.table(buchungsarten);

  // 3. Buchungsarten pro Jahr
  console.log("\n3. BUCHUNGSARTEN PRO JAHR:");
  const [jahresarten] = await conn.execute(`
    SELECT
      wirtschaftsjahr,
      buchungsart,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = 1
    GROUP BY wirtschaftsjahr, buchungsart
    ORDER BY wirtschaftsjahr, buchungsart
  `);
  console.table(jahresarten);

  // 4. Beispiel Buchungen 2022
  console.log("\n4. BEISPIEL BUCHUNGEN 2022:");
  const [beispiel] = await conn.execute(`
    SELECT
      sachkonto,
      buchungsart,
      geschaeftspartner,
      CAST(bruttobetrag AS DECIMAL(15,2)) as brutto
    FROM buchungen
    WHERE unternehmenId = 1 AND wirtschaftsjahr = 2022
    LIMIT 10
  `);
  console.table(beispiel);

  await conn.end();
}

main().catch(console.error);
