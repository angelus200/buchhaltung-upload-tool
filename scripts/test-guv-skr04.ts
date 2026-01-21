#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n=== GuV-TEST nach SKR04 ===\n");

  for (const jahr of [2022, 2023, 2024, 2025]) {
    console.log(`\n${jahr}:`);
    console.log("─".repeat(70));

    // Erträge (Klasse 4): Im HABEN gebucht
    const [ertraege] = await conn.execute(`
      SELECT
        COALESCE(SUM(CAST(nettobetrag AS DECIMAL(15,2))), 0) as summe,
        COUNT(*) as anzahl
      FROM buchungen
      WHERE unternehmenId = 1
      AND wirtschaftsjahr = ?
      AND (habenKonto LIKE '4%' OR sachkonto LIKE '4%')
    `, [jahr]);

    // Aufwendungen (Klassen 5-7): Im SOLL gebucht
    const [aufwendungen] = await conn.execute(`
      SELECT
        COALESCE(SUM(CAST(nettobetrag AS DECIMAL(15,2))), 0) as summe,
        COUNT(*) as anzahl
      FROM buchungen
      WHERE unternehmenId = 1
      AND wirtschaftsjahr = ?
      AND (sollKonto LIKE '5%' OR sollKonto LIKE '6%' OR sollKonto LIKE '7%'
           OR sachkonto LIKE '5%' OR sachkonto LIKE '6%' OR sachkonto LIKE '7%')
    `, [jahr]);

    // Beispiel Ertragskonten
    const [beispielErtraege] = await conn.execute(`
      SELECT DISTINCT sachkonto, habenKonto, sollKonto
      FROM buchungen
      WHERE unternehmenId = 1
      AND wirtschaftsjahr = ?
      AND (habenKonto LIKE '4%' OR sachkonto LIKE '4%')
      LIMIT 5
    `, [jahr]);

    // Beispiel Aufwandskonten
    const [beispielAufwand] = await conn.execute(`
      SELECT DISTINCT sachkonto, sollKonto, habenKonto
      FROM buchungen
      WHERE unternehmenId = 1
      AND wirtschaftsjahr = ?
      AND (sollKonto LIKE '5%' OR sollKonto LIKE '6%' OR sollKonto LIKE '7%'
           OR sachkonto LIKE '5%' OR sachkonto LIKE '6%' OR sachkonto LIKE '7%')
      LIMIT 5
    `, [jahr]);

    const ert = parseFloat((ertraege as any[])[0]?.summe || "0");
    const ertAnz = (ertraege as any[])[0]?.anzahl || 0;
    const aufw = parseFloat((aufwendungen as any[])[0]?.summe || "0");
    const aufwAnz = (aufwendungen as any[])[0]?.anzahl || 0;
    const gewinn = ert - aufw;

    console.log(`Erträge (Klasse 4):    ${ert.toLocaleString('de-DE', {minimumFractionDigits: 2})} € (${ertAnz} Buchungen)`);
    console.log(`Aufwendungen (5-7):    ${aufw.toLocaleString('de-DE', {minimumFractionDigits: 2})} € (${aufwAnz} Buchungen)`);
    console.log(`Gewinn/Verlust:        ${gewinn.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`);

    if ((beispielErtraege as any[]).length > 0) {
      console.log("\nBeispiel Ertragskonten:");
      console.table(beispielErtraege);
    }

    if ((beispielAufwand as any[]).length > 0) {
      console.log("\nBeispiel Aufwandskonten:");
      console.table(beispielAufwand);
    }
  }

  await conn.end();
}

main().catch(console.error);
