#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n=== BUCHUNGSARTEN PRÜFUNG ===\n");

  const [result] = await conn.execute(`
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

  console.log("Buchungsarten nach Jahr:");
  console.table(result);

  await conn.end();
}

main().catch(console.error);
