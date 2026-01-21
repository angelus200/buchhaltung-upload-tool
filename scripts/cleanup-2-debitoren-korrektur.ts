#!/usr/bin/env tsx
/**
 * Schritt 2: Debitoren-Korrektur
 * Verschiebe Geschäftspartner mit Kontonr 10000-69999 von kreditoren nach debitoren
 */
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n" + "=".repeat(70));
  console.log("SCHRITT 2: DEBITOREN-KORREKTUR");
  console.log("=".repeat(70) + "\n");

  // Finde falsch klassifizierte Debitoren
  const [falscheKreditoren] = await conn.execute(`
    SELECT
      id,
      kontonummer,
      name
    FROM kreditoren
    WHERE unternehmenId = 1
      AND CAST(kontonummer AS UNSIGNED) BETWEEN 10000 AND 69999
    ORDER BY kontonummer
  `);

  const zuVerschieben = falscheKreditoren as any[];

  if (zuVerschieben.length === 0) {
    console.log("✅ Keine Debitoren in der Kreditoren-Tabelle gefunden.\n");
    await conn.end();
    return;
  }

  console.log(`📊 Gefunden: ${zuVerschieben.length} Debitoren in kreditoren-Tabelle`);
  console.log("\nBeispiele:");
  zuVerschieben.slice(0, 5).forEach((k: any) => {
    console.log(`  - ${k.kontonummer}: ${k.name}`);
  });

  if (zuVerschieben.length > 5) {
    console.log(`  ... und ${zuVerschieben.length - 5} weitere`);
  }

  console.log(`\n🔄 Verschiebe ${zuVerschieben.length} Debitoren...`);

  // Verschiebe nach debitoren
  await conn.execute(`
    INSERT INTO debitoren (
      unternehmenId, kontonummer, name, kurzbezeichnung, strasse, plz, ort, land,
      telefon, email, ustIdNr, datevKontonummer, aktiv, createdAt, updatedAt
    )
    SELECT
      unternehmenId, kontonummer, name, kurzbezeichnung, strasse, plz, ort, land,
      telefon, email, ustIdNr, datevKontonummer, aktiv, createdAt, updatedAt
    FROM kreditoren
    WHERE unternehmenId = 1
      AND CAST(kontonummer AS UNSIGNED) BETWEEN 10000 AND 69999
  `);

  console.log("✅ Debitoren erfolgreich in debitoren-Tabelle kopiert!");

  // Lösche aus kreditoren
  console.log("🗑️  Entferne Debitoren aus kreditoren-Tabelle...");

  await conn.execute(`
    DELETE FROM kreditoren
    WHERE unternehmenId = 1
      AND CAST(kontonummer AS UNSIGNED) BETWEEN 10000 AND 69999
  `);

  console.log("✅ Debitoren aus kreditoren-Tabelle entfernt!");

  // Zeige neuen Status
  const [debitoren] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM debitoren WHERE unternehmenId = 1
  `);

  const [kreditoren] = await conn.execute(`
    SELECT COUNT(*) as anzahl FROM kreditoren WHERE unternehmenId = 1
  `);

  const debAnzahl = (debitoren as any[])[0].anzahl;
  const kredAnzahl = (kreditoren as any[])[0].anzahl;

  console.log(`\n📊 Neuer Status:`);
  console.log(`   Debitoren (Kunden):     ${debAnzahl}`);
  console.log(`   Kreditoren (Lieferanten): ${kredAnzahl}`);

  console.log("\n" + "=".repeat(70) + "\n");

  await conn.end();
}

main().catch(console.error);
