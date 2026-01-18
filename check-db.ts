import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

console.log("📊 Datenbank-Status:\n");

// Get all tables
const [tables] = await connection.query("SHOW TABLES");
const tableNames = tables.map((t: any) => Object.values(t)[0]);

console.log(`✅ ${tableNames.length} Tabellen erstellt:\n`);
tableNames.forEach((name, i) => console.log(`${i + 1}. ${name}`));

// Check users table structure
console.log("\n👤 users-Tabelle Struktur:");
const [columns] = await connection.query("SHOW COLUMNS FROM users");
(columns as any[]).forEach(c => {
  const key = c.Key ? ` [${c.Key}]` : '';
  console.log(`  - ${c.Field}: ${c.Type}${key}`);
});

await connection.end();
