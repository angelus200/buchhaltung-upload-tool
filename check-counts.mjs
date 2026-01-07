import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(`
  SELECT 
    (SELECT COUNT(*) FROM kreditoren WHERE unternehmenId = 90001) as kreditoren,
    (SELECT COUNT(*) FROM debitoren WHERE unternehmenId = 90001) as debitoren
`);
console.log('Kreditoren:', rows[0].kreditoren);
console.log('Debitoren:', rows[0].debitoren);
await conn.end();
