import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const data = JSON.parse(fs.readFileSync('./bwa-import/alpenland-debitoren-vollstaendig.json', 'utf8'));

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log(`Importiere ${data.debitoren.length} Debitoren für ${data.firma}...`);

let imported = 0;
for (const debitor of data.debitoren) {
  try {
    await conn.execute(
      `INSERT INTO debitoren (unternehmenId, kontonummer, name) VALUES (?, ?, ?)`,
      [data.firmaId, debitor.kontonummer, debitor.name]
    );
    imported++;
  } catch (err) {
    console.error(`Fehler bei ${debitor.kontonummer} ${debitor.name}:`, err.message);
  }
}

console.log(`✅ ${imported} Debitoren importiert`);

const [count] = await conn.execute('SELECT COUNT(*) as total FROM debitoren WHERE unternehmenId = ?', [data.firmaId]);
console.log(`Gesamt in DB: ${count[0].total} Debitoren`);

await conn.end();
