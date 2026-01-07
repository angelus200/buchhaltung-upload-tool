import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const debitoren = JSON.parse(fs.readFileSync('./angelus-debitoren.json', 'utf-8'));
const kreditoren = JSON.parse(fs.readFileSync('./angelus-kreditoren.json', 'utf-8'));

async function importAngelus() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const companyId = 90002; // Angelus Managementberatung und Service KG
  console.log(`Importiere für Angelus (ID ${companyId})...`);
  
  // Import Debitoren
  console.log('\n=== DEBITOREN ===');
  const [existingDebitoren] = await connection.execute(
    'SELECT kontonummer FROM debitoren WHERE unternehmenId = ?',
    [companyId]
  );
  const existingDebitorenKonten = new Set(existingDebitoren.map(d => d.kontonummer));
  console.log(`Bereits vorhandene Debitoren: ${existingDebitorenKonten.size}`);
  
  let importedDebitoren = 0;
  let skippedDebitoren = 0;
  
  for (const debitor of debitoren.debitoren) {
    if (existingDebitorenKonten.has(debitor.kontonummer)) {
      skippedDebitoren++;
      continue;
    }
    
    try {
      await connection.execute(
        'INSERT INTO debitoren (unternehmenId, kontonummer, name, createdAt) VALUES (?, ?, ?, NOW())',
        [companyId, debitor.kontonummer, debitor.name]
      );
      importedDebitoren++;
      console.log(`✓ Debitor ${debitor.kontonummer} - ${debitor.name}`);
    } catch (error) {
      console.error(`✗ Fehler bei Debitor ${debitor.kontonummer}: ${error.message}`);
    }
  }
  
  console.log(`\nDebitoren importiert: ${importedDebitoren}`);
  console.log(`Debitoren übersprungen: ${skippedDebitoren}`);
  
  // Import Kreditoren
  console.log('\n=== KREDITOREN ===');
  const [existingKreditoren] = await connection.execute(
    'SELECT kontonummer FROM kreditoren WHERE unternehmenId = ?',
    [companyId]
  );
  const existingKreditorenKonten = new Set(existingKreditoren.map(k => k.kontonummer));
  console.log(`Bereits vorhandene Kreditoren: ${existingKreditorenKonten.size}`);
  
  let importedKreditoren = 0;
  let skippedKreditoren = 0;
  
  for (const kreditor of kreditoren.kreditoren) {
    if (existingKreditorenKonten.has(kreditor.kontonummer)) {
      skippedKreditoren++;
      continue;
    }
    
    try {
      await connection.execute(
        'INSERT INTO kreditoren (unternehmenId, kontonummer, name, createdAt) VALUES (?, ?, ?, NOW())',
        [companyId, kreditor.kontonummer, kreditor.name]
      );
      importedKreditoren++;
      console.log(`✓ Kreditor ${kreditor.kontonummer} - ${kreditor.name}`);
    } catch (error) {
      console.error(`✗ Fehler bei Kreditor ${kreditor.kontonummer}: ${error.message}`);
    }
  }
  
  console.log(`\nKreditoren importiert: ${importedKreditoren}`);
  console.log(`Kreditoren übersprungen: ${skippedKreditoren}`);
  
  // Verify totals
  console.log('\n=== ZUSAMMENFASSUNG ===');
  const [debitorenCount] = await connection.execute(
    'SELECT COUNT(*) as total FROM debitoren WHERE unternehmenId = ?',
    [companyId]
  );
  const [kreditorenCount] = await connection.execute(
    'SELECT COUNT(*) as total FROM kreditoren WHERE unternehmenId = ?',
    [companyId]
  );
  
  console.log(`Gesamt Debitoren in DB: ${debitorenCount[0].total}`);
  console.log(`Gesamt Kreditoren in DB: ${kreditorenCount[0].total}`);
  
  await connection.end();
}

importAngelus().catch(console.error);
