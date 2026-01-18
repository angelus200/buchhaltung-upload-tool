import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection);

console.log("🗑️  Lösche alle Tabellen...");

// Get all tables
const [tables] = await connection.query("SHOW TABLES");
const tableNames = tables.map((t: any) => Object.values(t)[0]);

console.log(`Gefunden: ${tableNames.length} Tabellen`);

// Disable foreign key checks temporarily
await connection.query("SET FOREIGN_KEY_CHECKS = 0");

// Drop all tables
for (const tableName of tableNames) {
  console.log(`- Lösche ${tableName}...`);
  await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
}

// Re-enable foreign key checks
await connection.query("SET FOREIGN_KEY_CHECKS = 1");

console.log("✅ Alle Tabellen gelöscht!");

await connection.end();
