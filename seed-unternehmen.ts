/**
 * Seed-Skript: 5 neue Unternehmen anlegen
 *
 * Ausführung: pnpm tsx seed-unternehmen.ts
 */

import { getDb } from "./server/db";
import { unternehmen, userUnternehmen, type InsertUnternehmen, type InsertUserUnternehmen } from "./drizzle/schema";

const NEUE_UNTERNEHMEN: InsertUnternehmen[] = [
  {
    // FIRMA 2: Angelus Managementberatungs und Service KG (DE)
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
    wirtschaftsjahrBeginn: 1,
    farbe: "#6366f1", // Indigo
    aktiv: true,
    createdBy: 1,
  },
  {
    // FIRMA 3: commercehelden GmbH (AT)
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
    wirtschaftsjahrBeginn: 1,
    farbe: "#ec4899", // Pink
    aktiv: true,
    createdBy: 1,
  },
  {
    // FIRMA 4: Emo Retail OG (AT)
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
    wirtschaftsjahrBeginn: 1,
    farbe: "#f97316", // Orange
    aktiv: true,
    createdBy: 1,
  },
  {
    // FIRMA 5: Trademark24-7 AG (CH)
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
    wirtschaftsjahrBeginn: 1,
    farbe: "#ef4444", // Rot
    aktiv: true,
    createdBy: 1,
  },
  {
    // FIRMA 6: Marketplace24-7 GmbH (CH)
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
    wirtschaftsjahrBeginn: 1,
    farbe: "#8b5cf6", // Lila
    aktiv: true,
    createdBy: 1,
  },
];

async function seedUnternehmen() {
  console.log("🌱 Starte Seeding von Unternehmen...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Fehler: Datenbank nicht verfügbar");
    process.exit(1);
  }

  let erfolge = 0;
  let fehler = 0;

  for (const firma of NEUE_UNTERNEHMEN) {
    try {
      console.log(`📝 Erstelle: ${firma.name} (${firma.landCode})...`);

      // 1. Unternehmen erstellen
      const result = await db.insert(unternehmen).values(firma);
      const unternehmenId = result[0].insertId;

      // 2. Benutzer-Zuordnung mit Admin-Rechten erstellen
      const userZuordnung: InsertUserUnternehmen = {
        userId: 1, // Anpassen an tatsächliche User-ID
        unternehmenId: unternehmenId,
        rolle: "admin",
        buchungenLesen: true,
        buchungenSchreiben: true,
        stammdatenLesen: true,
        stammdatenSchreiben: true,
        berichteLesen: true,
        berichteExportieren: true,
        einladungenVerwalten: true,
      };

      await db.insert(userUnternehmen).values(userZuordnung);

      console.log(`✅ Erfolgreich erstellt (ID: ${unternehmenId})\n`);
      erfolge++;
    } catch (error) {
      console.error(`❌ Fehler bei ${firma.name}:`, error);
      fehler++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Erfolgreich: ${erfolge}`);
  console.log(`❌ Fehler: ${fehler}`);
  console.log("=".repeat(50) + "\n");

  // Übersicht ausgeben
  console.log("📊 Aktuelle Unternehmen in der Datenbank:\n");

  try {
    const alleUnternehmen = await db
      .select({
        id: unternehmen.id,
        name: unternehmen.name,
        landCode: unternehmen.landCode,
        kontenrahmen: unternehmen.kontenrahmen,
        farbe: unternehmen.farbe,
      })
      .from(unternehmen)
      .orderBy(unternehmen.id);

    console.table(alleUnternehmen);
  } catch (error) {
    console.error("Fehler beim Abrufen der Übersicht:", error);
  }

  process.exit(erfolge === NEUE_UNTERNEHMEN.length ? 0 : 1);
}

// Ausführung
seedUnternehmen().catch((error) => {
  console.error("❌ Kritischer Fehler:", error);
  process.exit(1);
});
