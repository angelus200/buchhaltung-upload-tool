/**
 * Prüfe ob einladungen-Tabelle existiert
 */
import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL nicht gefunden");
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("✅ Datenbankverbindung hergestellt\n");

    // Prüfe ob Tabelle existiert
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'einladungen'"
    );

    if (tables.length === 0) {
      console.log("❌ Tabelle 'einladungen' existiert NICHT");
      console.log("\n📝 Führe aus: pnpm db:push");
    } else {
      console.log("✅ Tabelle 'einladungen' existiert");

      // Zeige Struktur
      const [columns] = await connection.execute(
        "DESCRIBE einladungen"
      );
      console.log("\n📊 Spalten:");
      console.table(columns);

      // Zähle Einladungen
      const [count] = await connection.execute(
        "SELECT COUNT(*) as total FROM einladungen"
      );
      console.log(`\n📧 Anzahl Einladungen: ${count[0].total}`);
    }

  } catch (error) {
    console.error("❌ Fehler:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
