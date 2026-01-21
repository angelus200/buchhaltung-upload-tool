#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n=== DETAILLIERTE BUCHUNGS-ANALYSE 2022 ===\n");

  // Schaue dir ALLE Buchungen von 2022 an
  const [buchungen] = await conn.execute(`
    SELECT
      sachkonto,
      sollKonto,
      habenKonto,
      buchungsart,
      geschaeftspartner,
      CAST(nettobetrag AS DECIMAL(15,2)) as netto,
      CAST(bruttobetrag AS DECIMAL(15,2)) as brutto,
      belegdatum
    FROM buchungen
    WHERE unternehmenId = 1 AND wirtschaftsjahr = 2022
    ORDER BY belegdatum
    LIMIT 50
  `);

  console.log("Erste 50 Buchungen 2022:");
  console.table(buchungen);

  // Summen nach Kontenart
  const [kontenklassen] = await conn.execute(`
    SELECT
      SUBSTRING(sachkonto, 1, 1) as kontenklasse,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = 1 AND wirtschaftsjahr = 2022
    GROUP BY SUBSTRING(sachkonto, 1, 1)
    ORDER BY kontenklasse
  `);

  console.log("\nSummen nach Kontenklasse (erste Ziffer):");
  console.table(kontenklassen);

  // Schaue Soll/Haben an
  const [sollHaben] = await conn.execute(`
    SELECT
      'SOLL' as typ,
      sollKonto as konto,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = 1 AND wirtschaftsjahr = 2022 AND sollKonto IS NOT NULL
    GROUP BY sollKonto
    UNION ALL
    SELECT
      'HABEN' as typ,
      habenKonto as konto,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = 1 AND wirtschaftsjahr = 2022 AND habenKonto IS NOT NULL
    GROUP BY habenKonto
    ORDER BY summe DESC
    LIMIT 20
  `);

  console.log("\nTop Soll/Haben Konten:");
  console.table(sollHaben);

  await conn.end();
}

main().catch(console.error);
