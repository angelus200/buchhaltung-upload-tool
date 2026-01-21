#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n=== CASHFLOW-KENNZAHLEN TEST (Bank-basiert) ===\n");

  for (const jahr of [2022, 2023, 2024, 2025]) {
    // Einnahmen: SOLL Bank (Geld kommt rein)
    const [einnahmen] = await conn.execute(`
      SELECT
        COALESCE(SUM(CAST(nettobetrag AS DECIMAL(15,2))), 0) as summe
      FROM buchungen
      WHERE unternehmenId = 1
      AND wirtschaftsjahr = ?
      AND sollKonto LIKE '12%'
    `, [jahr]);

    // Ausgaben: HABEN Bank (Geld geht raus)
    const [ausgaben] = await conn.execute(`
      SELECT
        COALESCE(SUM(CAST(nettobetrag AS DECIMAL(15,2))), 0) as summe
      FROM buchungen
      WHERE unternehmenId = 1
      AND wirtschaftsjahr = ?
      AND habenKonto LIKE '12%'
    `, [jahr]);

    const ein = parseFloat((einnahmen as any[])[0]?.summe || "0");
    const aus = parseFloat((ausgaben as any[])[0]?.summe || "0");
    const gewinn = ein - aus;

    console.log(`${jahr}:`);
    console.log(`  Einnahmen: ${ein.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`);
    console.log(`  Ausgaben:  ${aus.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`);
    console.log(`  Gewinn:    ${gewinn.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`);
    console.log();
  }

  await conn.end();
}

main().catch(console.error);
