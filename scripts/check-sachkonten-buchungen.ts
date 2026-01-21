#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n=== SACHKONTEN IN BUCHUNGEN ===\n");

  const [result] = await conn.execute(`
    SELECT
      sachkonto,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = 1 AND wirtschaftsjahr = 2022
    GROUP BY sachkonto
    ORDER BY anzahl DESC
    LIMIT 15
  `);

  console.log("Top Sachkonten 2022:");
  console.table(result);

  await conn.end();
}

main().catch(console.error);
