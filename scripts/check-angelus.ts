#!/usr/bin/env tsx
import "dotenv/config";
import * as mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // Prüfe ob Angelus existiert
  const [rows] = await conn.execute(
    "SELECT id, name, kontenrahmen FROM unternehmen WHERE name LIKE ?",
    ['%Angelus%']
  );

  const unternehmen = rows as any[];

  if (unternehmen.length > 0) {
    console.log("✅ Angelus KG gefunden:");
    console.log(`   ID: ${unternehmen[0].id}`);
    console.log(`   Name: ${unternehmen[0].name}`);
    console.log(`   Kontenrahmen: ${unternehmen[0].kontenrahmen}`);
    await conn.end();
    return;
  }

  console.log("⚠️  Angelus KG nicht gefunden, lege Unternehmen an...");

  // Erstelle Angelus KG
  await conn.execute(`
    INSERT INTO unternehmen (
      name, rechtsform, landCode, waehrung, kontenrahmen,
      wirtschaftsjahrBeginn, aktiv
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'Angelus Managementberatungs und Service KG',
    'KG',
    'DE',
    'EUR',
    'SKR03',
    1,
    true
  ]);

  // Hole ID
  const [newRows] = await conn.execute(
    "SELECT id, name FROM unternehmen WHERE name LIKE ?",
    ['%Angelus%']
  );

  const newUnternehmen = newRows as any[];
  console.log("✅ Angelus KG erfolgreich angelegt:");
  console.log(`   ID: ${newUnternehmen[0].id}`);
  console.log(`   Name: ${newUnternehmen[0].name}`);

  await conn.end();
}

main().catch(console.error);
