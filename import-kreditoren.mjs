import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const kreditoren = JSON.parse(fs.readFileSync('./kreditoren-import.json', 'utf-8'));

async function importKreditoren() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get company ID for Alpenland Heizungswasser KG
  const [companies] = await connection.execute(
    'SELECT id FROM unternehmen WHERE name LIKE ?',
    ['%Alpenland%']
  );
  
  if (companies.length === 0) {
    console.error('Firma Alpenland Heizungswasser KG nicht gefunden!');
    await connection.end();
    return;
  }
  
  const companyId = companies[0].id;
  console.log(`Firma gefunden: ID ${companyId}`);
  
  // Check existing kreditoren
  const [existing] = await connection.execute(
    'SELECT kontonummer FROM kreditoren WHERE unternehmenId = ?',
    [companyId]
  );
  const existingKonten = new Set(existing.map(k => k.kontonummer));
  console.log(`Bereits vorhandene Kreditoren: ${existingKonten.size}`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const kreditor of kreditoren.kreditoren) {
    if (existingKonten.has(kreditor.kontonummer)) {
      skipped++;
      continue;
    }
    
    try {
      await connection.execute(
        'INSERT INTO kreditoren (unternehmenId, kontonummer, name, createdAt) VALUES (?, ?, ?, NOW())',
        [companyId, kreditor.kontonummer, kreditor.name]
      );
      imported++;
      console.log(`✓ ${kreditor.kontonummer} - ${kreditor.name}`);
    } catch (error) {
      console.error(`✗ Fehler bei ${kreditor.kontonummer}: ${error.message}`);
    }
  }
  
  console.log(`\n=== Import abgeschlossen ===`);
  console.log(`Importiert: ${imported}`);
  console.log(`Übersprungen (bereits vorhanden): ${skipped}`);
  
  // Verify total count
  const [count] = await connection.execute(
    'SELECT COUNT(*) as total FROM kreditoren WHERE unternehmenId = ?',
    [companyId]
  );
  console.log(`Gesamt Kreditoren in DB: ${count[0].total}`);
  
  await connection.end();
}

importKreditoren().catch(console.error);
