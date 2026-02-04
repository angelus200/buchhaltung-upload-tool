import { getDb } from "../server/db";
import { gesellschafter, unternehmen } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Diagnose-Script: Prüft Gesellschafter-Zuordnung zu Firmen
 *
 * Problem: ALP und ANG haben die gleichen Gesellschafter
 * Lösung: Prüfe unternehmenId-Zuordnung
 */

async function checkGesellschafterZuordnung() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Datenbank nicht verfügbar");
    return;
  }

  console.log("🔍 Prüfe Gesellschafter-Zuordnung...\n");

  // 1. Alle Firmen laden
  const firmen = await db.select().from(unternehmen);
  console.log(`📊 Gefunden: ${firmen.length} Firmen\n`);

  for (const firma of firmen) {
    console.log(`\n📂 Firma: ${firma.name} (ID: ${firma.id})`);
    console.log(`   Rechtsform: ${firma.rechtsform || "N/A"}`);

    // Gesellschafter dieser Firma laden
    const firmGesellschafter = await db
      .select()
      .from(gesellschafter)
      .where(eq(gesellschafter.unternehmenId, firma.id));

    if (firmGesellschafter.length === 0) {
      console.log(`   ⚠️  KEINE Gesellschafter zugeordnet!`);
    } else {
      console.log(`   ✅ ${firmGesellschafter.length} Gesellschafter:`);
      firmGesellschafter.forEach((g) => {
        console.log(`      • ${g.name} (${g.funktion || "N/A"}) - Anteil: ${g.geschaeftsanteil || "N/A"}%`);
      });
    }
  }

  console.log("\n\n🔍 Prüfe auf Duplikate (gleiche Gesellschafter bei mehreren Firmen)...\n");

  // 2. Alle Gesellschafter laden
  const alleGesellschafter = await db.select().from(gesellschafter);
  console.log(`📊 Insgesamt: ${alleGesellschafter.length} Gesellschafter-Einträge\n`);

  // Gruppiere nach Name
  const gesellschafterByName = new Map<string, typeof alleGesellschafter>();
  for (const g of alleGesellschafter) {
    const existing = gesellschafterByName.get(g.name) || [];
    existing.push(g);
    gesellschafterByName.set(g.name, existing);
  }

  // Finde Duplikate
  let duplikate = 0;
  for (const [name, entries] of gesellschafterByName.entries()) {
    if (entries.length > 1) {
      duplikate++;
      console.log(`⚠️  DUPLIKAT: "${name}" ist bei ${entries.length} Firmen:`);
      for (const entry of entries) {
        const firmaInfo = firmen.find((f) => f.id === entry.unternehmenId);
        console.log(`   • Firma: ${firmaInfo?.name || "Unbekannt"} (ID: ${entry.unternehmenId})`);
      }
      console.log("");
    }
  }

  if (duplikate === 0) {
    console.log("✅ Keine Duplikate gefunden - alle Gesellschafter sind eindeutig zugeordnet!");
  } else {
    console.log(`\n❌ ${duplikate} Gesellschafter-Namen sind mehrfach vorhanden!`);
    console.log("\n💡 Empfehlung:");
    console.log("   1. Prüfe ob die Gesellschafter wirklich bei mehreren Firmen beteiligt sind");
    console.log("   2. Falls nicht: Lösche die falschen Einträge oder korrigiere die unternehmenId");
    console.log("   3. Falls Import-Fehler: Führe einen Cleanup-Import durch");
  }

  console.log("\n✅ Diagnose abgeschlossen");
}

// Script ausführen
checkGesellschafterZuordnung()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fehler:", error);
    process.exit(1);
  });
