import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";

// BWA-Daten laden
const bwaData = JSON.parse(fs.readFileSync("./bwa-import/alpenland-konten.json", "utf8"));

// Datenbank-Verbindung
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(connection);

// Firma-ID für Alpenland Heizungswasser KG
const UNTERNEHMEN_ID = 90001;

console.log("=== BWA-Import für Alpenland Heizungswasser KG ===\n");

// 1. Kreditoren importieren
console.log("Importiere Kreditoren (Lieferanten)...");
let kreditorenCount = 0;

for (const kreditor of bwaData.kreditoren) {
  try {
    await connection.execute(
      `INSERT INTO kreditoren (unternehmenId, kontonummer, name, aktiv) 
       VALUES (?, ?, ?, true)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [UNTERNEHMEN_ID, kreditor.konto, kreditor.name]
    );
    kreditorenCount++;
  } catch (error) {
    console.error(`Fehler bei Kreditor ${kreditor.name}:`, error.message);
  }
}
console.log(`✓ ${kreditorenCount} Kreditoren importiert\n`);

// 2. Debitoren importieren
console.log("Importiere Debitoren (Kunden)...");
let debitorenCount = 0;

for (const debitor of bwaData.debitoren) {
  try {
    await connection.execute(
      `INSERT INTO debitoren (unternehmenId, kontonummer, name, aktiv) 
       VALUES (?, ?, ?, true)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [UNTERNEHMEN_ID, debitor.konto, debitor.name]
    );
    debitorenCount++;
  } catch (error) {
    console.error(`Fehler bei Debitor ${debitor.name}:`, error.message);
  }
}
console.log(`✓ ${debitorenCount} Debitoren importiert\n`);

// 3. Sachkonten importieren (falls Tabelle existiert)
console.log("Prüfe Sachkonten-Tabelle...");
try {
  const [tables] = await connection.execute(
    "SHOW TABLES LIKE 'sachkonten'"
  );
  
  if (tables.length > 0) {
    console.log("Importiere Sachkonten...");
    let sachkontenCount = 0;
    
    for (const konto of bwaData.sachkonten) {
      try {
        await connection.execute(
          `INSERT INTO sachkonten (unternehmenId, kontonummer, bezeichnung, kategorie, aktiv) 
           VALUES (?, ?, ?, ?, true)
           ON DUPLICATE KEY UPDATE bezeichnung = VALUES(bezeichnung)`,
          [UNTERNEHMEN_ID, konto.konto, konto.bezeichnung, konto.kategorie]
        );
        sachkontenCount++;
      } catch (error) {
        console.error(`Fehler bei Sachkonto ${konto.konto}:`, error.message);
      }
    }
    console.log(`✓ ${sachkontenCount} Sachkonten importiert\n`);
  } else {
    console.log("Sachkonten-Tabelle existiert nicht - übersprungen\n");
  }
} catch (error) {
  console.log("Sachkonten-Import übersprungen:", error.message);
}

// Zusammenfassung
console.log("=== Import abgeschlossen ===");
console.log(`Kreditoren: ${kreditorenCount}`);
console.log(`Debitoren: ${debitorenCount}`);

await connection.end();
