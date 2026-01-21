#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n" + "=".repeat(70));
  console.log("DETAILLIERTE BUCHUNGS-VALIDIERUNG - ANGELUS KG");
  console.log("=".repeat(70) + "\n");

  // 1. Buchungen nach Periode
  const [perioden] = await conn.execute(`
    SELECT
      periode,
      COUNT(*) as Anzahl,
      SUM(bruttobetrag) as Summe
    FROM buchungen
    WHERE unternehmenId = 1 AND importReferenz = 'DATEV_2025_VERBESSERT'
    GROUP BY periode
    ORDER BY periode
  `);

  console.log("Buchungen nach Periode (Monat):");
  console.log("─".repeat(70));
  (perioden as any[]).forEach((row: any) => {
    const monat = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][row.periode - 1];
    const summe = parseFloat(row.Summe).toFixed(2);
    console.log(`  ${monat} 2025:  ${String(row.Anzahl).padStart(4)} Buchungen    Summe: ${summe.padStart(15)} EUR`);
  });

  // 2. Buchungen nach Buchungsart
  const [arten] = await conn.execute(`
    SELECT
      buchungsart,
      COUNT(*) as Anzahl,
      SUM(bruttobetrag) as Summe
    FROM buchungen
    WHERE unternehmenId = 1 AND importReferenz = 'DATEV_2025_VERBESSERT'
    GROUP BY buchungsart
  `);

  console.log("\n" + "─".repeat(70));
  console.log("Buchungen nach Art:");
  console.log("─".repeat(70));
  (arten as any[]).forEach((row: any) => {
    const summe = parseFloat(row.Summe).toFixed(2);
    console.log(`  ${row.buchungsart.padEnd(15)} ${String(row.Anzahl).padStart(4)} Buchungen    Summe: ${summe.padStart(15)} EUR`);
  });

  // 3. Buchungen mit Umsatzsteuer
  const [steuern] = await conn.execute(`
    SELECT
      steuersatz,
      COUNT(*) as Anzahl,
      SUM(nettobetrag) as Netto,
      SUM(bruttobetrag) as Brutto
    FROM buchungen
    WHERE unternehmenId = 1 AND importReferenz = 'DATEV_2025_VERBESSERT' AND steuersatz > 0
    GROUP BY steuersatz
    ORDER BY steuersatz DESC
  `);

  console.log("\n" + "─".repeat(70));
  console.log("Buchungen mit Umsatzsteuer:");
  console.log("─".repeat(70));
  (steuern as any[]).forEach((row: any) => {
    const netto = parseFloat(row.Netto).toFixed(2);
    const brutto = parseFloat(row.Brutto).toFixed(2);
    console.log(`  ${row.steuersatz}%:  ${String(row.Anzahl).padStart(4)} Buchungen    Netto: ${netto.padStart(12)} EUR    Brutto: ${brutto.padStart(12)} EUR`);
  });

  // 4. Geschäftspartner-Typen
  const [partner] = await conn.execute(`
    SELECT
      geschaeftspartnerTyp,
      COUNT(*) as Anzahl
    FROM buchungen
    WHERE unternehmenId = 1 AND importReferenz = 'DATEV_2025_VERBESSERT'
    GROUP BY geschaeftspartnerTyp
  `);

  console.log("\n" + "─".repeat(70));
  console.log("Buchungen nach Geschäftspartner-Typ:");
  console.log("─".repeat(70));
  (partner as any[]).forEach((row: any) => {
    console.log(`  ${row.geschaeftspartnerTyp.padEnd(20)} ${String(row.Anzahl).padStart(6)} Buchungen`);
  });

  // 5. Stichprobe: Erste 5 Buchungen
  const [sample] = await conn.execute(`
    SELECT
      belegnummer,
      DATE_FORMAT(belegdatum, '%d.%m.%Y') as datum,
      buchungstext,
      sollKonto,
      habenKonto,
      nettobetrag,
      steuersatz,
      bruttobetrag,
      periode
    FROM buchungen
    WHERE unternehmenId = 1 AND importReferenz = 'DATEV_2025_VERBESSERT'
    ORDER BY belegdatum
    LIMIT 5
  `);

  console.log("\n" + "─".repeat(70));
  console.log("Stichprobe - Erste 5 Buchungen:");
  console.log("─".repeat(70));
  (sample as any[]).forEach((row: any, index: number) => {
    console.log(`\n${index + 1}. ${row.belegnummer} vom ${row.datum} (Periode ${row.periode})`);
    console.log(`   Text: ${row.buchungstext}`);
    console.log(`   Soll: ${row.sollKonto} → Haben: ${row.habenKonto}`);
    console.log(`   Betrag: ${parseFloat(row.nettobetrag).toFixed(2)} EUR (USt: ${row.steuersatz}%) = ${parseFloat(row.bruttobetrag).toFixed(2)} EUR`);
  });

  console.log("\n" + "=".repeat(70) + "\n");

  await conn.end();
}

main().catch(console.error);
