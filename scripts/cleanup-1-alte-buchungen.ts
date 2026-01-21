#!/usr/bin/env tsx
/**
 * Schritt 1: Lösche alte Test-Buchungen
 */
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n" + "=".repeat(70));
  console.log("SCHRITT 1: ALTE TEST-BUCHUNGEN LÖSCHEN");
  console.log("=".repeat(70) + "\n");

  // Zeige alte Buchungen
  const [alteBuchungen] = await conn.execute(`
    SELECT COUNT(*) as anzahl, importReferenz
    FROM buchungen
    WHERE unternehmenId = 1 AND importReferenz = 'DATEV_2025_Q1'
  `);

  const alte = (alteBuchungen as any[])[0];
  console.log(`📊 Gefunden: ${alte.anzahl} alte Test-Buchungen (${alte.importReferenz})`);

  if (alte.anzahl === 0) {
    console.log("✅ Keine alten Buchungen zum Löschen vorhanden.\n");
    await conn.end();
    return;
  }

  // Lösche alte Buchungen
  console.log(`🗑️  Lösche ${alte.anzahl} alte Buchungen...`);

  await conn.execute(`
    DELETE FROM buchungen
    WHERE unternehmenId = 1 AND importReferenz = 'DATEV_2025_Q1'
  `);

  console.log("✅ Alte Test-Buchungen erfolgreich gelöscht!");

  // Zeige neuen Status
  const [neueBuchungen] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM buchungen WHERE unternehmenId = 1
  `);

  const neu = (neueBuchungen as any[])[0];
  console.log(`\n📊 Aktueller Status: ${neu.anzahl} Buchungen in der Datenbank`);

  console.log("\n" + "=".repeat(70) + "\n");

  await conn.end();
}

main().catch(console.error);
