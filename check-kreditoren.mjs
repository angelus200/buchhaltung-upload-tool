import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Zeige Tabellenstruktur
const [columns] = await connection.query('SHOW COLUMNS FROM kreditoren');
console.log('Kreditoren Spalten:');
columns.forEach(col => console.log(`  - ${col.Field}: ${col.Type}`));

// Zeige einige Einträge
const [rows] = await connection.query('SELECT id, name, kontonummer, unternehmens_id FROM kreditoren LIMIT 5');
console.log('\nKreditoren Einträge:');
console.log(rows);

// Zähle pro Unternehmen
const [counts] = await connection.query(`
  SELECT k.unternehmens_id, u.name as firma, COUNT(*) as anzahl
  FROM kreditoren k
  LEFT JOIN unternehmen u ON k.unternehmens_id = u.id
  GROUP BY k.unternehmens_id, u.name
`);
console.log('\nKreditoren pro Firma:');
console.log(counts);

await connection.end();
