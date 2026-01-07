import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Zeige einige Einträge
const [rows] = await connection.query('SELECT id, name, kontonummer, unternehmenId FROM kreditoren LIMIT 5');
console.log('Kreditoren Einträge:');
console.log(rows);

// Zähle pro Unternehmen
const [counts] = await connection.query(`
  SELECT k.unternehmenId, u.name as firma, COUNT(*) as anzahl
  FROM kreditoren k
  LEFT JOIN unternehmen u ON k.unternehmenId = u.id
  GROUP BY k.unternehmenId, u.name
`);
console.log('\nKreditoren pro Firma:');
console.log(counts);

// Zeige alle Unternehmen
const [unternehmen] = await connection.query('SELECT id, name FROM unternehmen');
console.log('\nAlle Unternehmen:');
console.log(unternehmen);

await connection.end();
