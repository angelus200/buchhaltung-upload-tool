// Quick database check for Isabel's TM company
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'metro.proxy.rlwy.net',
  port: 55757,
  user: 'root',
  password: 'TAEHGznuWgeXvPzAavbveUaAobHQoQTG',
  database: 'railway'
});

console.log('\n=== UNTERNEHMEN ===');
const [unternehmen] = await connection.execute(
  'SELECT id, name, rechtsform FROM unternehmen ORDER BY id'
);
console.table(unternehmen);

console.log('\n=== BUCHUNGEN COUNT PER UNTERNEHMEN ===');
const [buchungenCount] = await connection.execute(
  'SELECT unternehmenId, COUNT(*) as count FROM buchungen GROUP BY unternehmenId'
);
console.table(buchungenCount);

console.log('\n=== BUCHUNGSVORSCHLAEGE COUNT PER UNTERNEHMEN ===');
const [vorschlaegeCount] = await connection.execute(
  'SELECT unternehmenId, status, COUNT(*) as count FROM buchungsvorschlaege GROUP BY unternehmenId, status'
);
console.table(vorschlaegeCount);

console.log('\n=== AUSZUG-POSITIONEN COUNT PER UNTERNEHMEN ===');
const [auszugPositionenCount] = await connection.execute(`
  SELECT a.unternehmenId, COUNT(ap.id) as count
  FROM auszuege a
  LEFT JOIN auszug_positionen ap ON ap.auszugId = a.id
  GROUP BY a.unternehmenId
`);
console.table(auszugPositionenCount);

await connection.end();
