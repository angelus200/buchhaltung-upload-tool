/**
 * Einfaches Seed-Skript mit mysql2
 * Ausführung: node seed-unternehmen-simple.mjs
 */

import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// .env laden
config();

const NEUE_UNTERNEHMEN = [
  {
    name: "Angelus Managementberatungs und Service KG",
    rechtsform: "KG",
    landCode: "DE",
    land: "Deutschland",
    waehrung: "EUR",
    kontenrahmen: "SKR04",
    steuernummer: "143/501/60818",
    ustIdNr: "DE279532189",
    strasse: "Konrad-Zuse-Platz 8",
    plz: "81829",
    ort: "München",
    telefon: "0800 175 077 0",
    email: "office@angelus.group",
    website: "www.angelus.group",
    handelsregister: "Amtsgericht München, HRA 102 679",
    farbe: "#6366f1",
  },
  {
    name: "commercehelden GmbH",
    rechtsform: "GmbH",
    landCode: "AT",
    land: "Österreich",
    waehrung: "EUR",
    kontenrahmen: "OeKR",
    steuernummer: "81 505/0224",
    strasse: "Pembaurstraße 14",
    plz: "6020",
    ort: "Innsbruck",
    farbe: "#ec4899",
  },
  {
    name: "Emo Retail OG",
    rechtsform: "OG",
    landCode: "AT",
    land: "Österreich",
    waehrung: "EUR",
    kontenrahmen: "OeKR",
    steuernummer: "90 348/9649",
    strasse: "Pembaurstraße 14",
    plz: "6020",
    ort: "Innsbruck",
    farbe: "#f97316",
  },
  {
    name: "Trademark24-7 AG",
    rechtsform: "AG",
    landCode: "CH",
    land: "Schweiz",
    waehrung: "CHF",
    kontenrahmen: "KMU",
    ustIdNr: "CHE-246.473.858",
    handelsregister: "CH-130-3033361-7",
    strasse: "Kantonsstrasse 1",
    plz: "8807",
    ort: "Freienbach",
    website: "www.brands-wanted.com",
    farbe: "#ef4444",
  },
  {
    name: "Marketplace24-7 GmbH",
    rechtsform: "GmbH",
    landCode: "CH",
    land: "Schweiz",
    waehrung: "CHF",
    kontenrahmen: "KMU",
    ustIdNr: "CHE-351.662.058",
    handelsregister: "CH-130-4033363-2",
    strasse: "Kantonsstrasse 1",
    plz: "8807",
    ort: "Freienbach",
    website: "www.non-dom.group",
    farbe: "#8b5cf6",
  },
];

async function main() {
  console.log("🌱 Starte Seeding von Unternehmen...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL nicht gefunden in .env");
    process.exit(1);
  }

  let connection;
  try {
    // Verbindung zur Datenbank herstellen
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("✅ Datenbankverbindung hergestellt\n");

    let erfolge = 0;
    let fehler = 0;

    for (const firma of NEUE_UNTERNEHMEN) {
      try {
        console.log(`📝 Erstelle: ${firma.name} (${firma.landCode})...`);

        // 1. Unternehmen erstellen
        const [result] = await connection.execute(
          `INSERT INTO unternehmen (
            name, rechtsform, landCode, land, waehrung, kontenrahmen,
            steuernummer, ustIdNr, strasse, plz, ort,
            telefon, email, website, handelsregister,
            wirtschaftsjahrBeginn, farbe, aktiv, createdBy, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            firma.name,
            firma.rechtsform,
            firma.landCode,
            firma.land,
            firma.waehrung,
            firma.kontenrahmen,
            firma.steuernummer || null,
            firma.ustIdNr || null,
            firma.strasse || null,
            firma.plz || null,
            firma.ort || null,
            firma.telefon || null,
            firma.email || null,
            firma.website || null,
            firma.handelsregister || null,
            1, // wirtschaftsjahrBeginn
            firma.farbe,
            1, // aktiv
            1, // createdBy
          ]
        );

        const unternehmenId = result.insertId;

        // 2. Benutzer-Zuordnung erstellen
        await connection.execute(
          `INSERT INTO user_unternehmen (
            userId, unternehmenId, rolle,
            buchungenLesen, buchungenSchreiben,
            stammdatenLesen, stammdatenSchreiben,
            berichteLesen, berichteExportieren,
            einladungenVerwalten, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [1, unternehmenId, 'admin', 1, 1, 1, 1, 1, 1, 1]
        );

        console.log(`✅ Erfolgreich erstellt (ID: ${unternehmenId})\n`);
        erfolge++;
      } catch (error) {
        console.error(`❌ Fehler bei ${firma.name}:`, error.message);
        fehler++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Erfolgreich: ${erfolge}`);
    console.log(`❌ Fehler: ${fehler}`);
    console.log("=".repeat(50) + "\n");

    // Übersicht ausgeben
    console.log("📊 Aktuelle Unternehmen in der Datenbank:\n");
    const [rows] = await connection.execute(
      `SELECT id, name, landCode, kontenrahmen, farbe FROM unternehmen ORDER BY id`
    );
    console.table(rows);

  } catch (error) {
    console.error("❌ Kritischer Fehler:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n✅ Datenbankverbindung geschlossen");
    }
  }
}

main();
