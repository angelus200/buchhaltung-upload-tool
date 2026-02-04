import { getDb } from "../server/db";
import { gesellschafter, unternehmen } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Fix-Script: Korrigiert falsche Gesellschafter-Zuordnungen
 *
 * Problem: ALP und ANG haben die gleichen Gesellschafter (wahrscheinlich durch falschen Import)
 * Lösung: Lösche alle Gesellschafter und erstelle firmenspezifische neue
 */

interface GesellschafterTemplate {
  name: string;
  funktion: string;
  geschaeftsanteil: number;
  eintrittsdatum: Date;
  geburtsdatum: Date;
  adresse: string;
}

// Standard-Gesellschafter pro Firma (ANPASSEN!)
const GESELLSCHAFTER_TEMPLATES: Record<string, GesellschafterTemplate[]> = {
  "Alpenland Handels-GmbH": [
    {
      name: "Max Mustermann",
      funktion: "Geschäftsführer",
      geschaeftsanteil: 51,
      eintrittsdatum: new Date("2020-01-01"),
      geburtsdatum: new Date("1975-03-15"),
      adresse: "Hauptstraße 1, 80331 München",
    },
    {
      name: "Erika Musterfrau",
      funktion: "Gesellschafter",
      geschaeftsanteil: 49,
      eintrittsdatum: new Date("2020-01-01"),
      geburtsdatum: new Date("1978-07-20"),
      adresse: "Nebenstraße 5, 80331 München",
    },
  ],
  "Angelus Steuerberater": [
    {
      name: "Thomas Angelus",
      funktion: "Geschäftsführer",
      geschaeftsanteil: 100,
      eintrittsdatum: new Date("2015-06-01"),
      geburtsdatum: new Date("1970-11-10"),
      adresse: "Steuerweg 10, 10115 Berlin",
    },
  ],
};

async function fixGesellschafterZuordnung() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Datenbank nicht verfügbar");
    return;
  }

  console.log("🔧 Starte Korrektur der Gesellschafter-Zuordnung...\n");

  // 1. Alle Firmen laden
  const firmen = await db.select().from(unternehmen);
  console.log(`📊 Gefunden: ${firmen.length} Firmen\n`);

  // 2. Für jede Firma: Alte Gesellschafter löschen und neue anlegen
  for (const firma of firmen) {
    console.log(`\n📂 Verarbeite Firma: ${firma.name} (ID: ${firma.id})`);

    // Alte Gesellschafter zählen
    const alteGesellschafter = await db
      .select()
      .from(gesellschafter)
      .where(eq(gesellschafter.unternehmenId, firma.id));

    console.log(`   🗑️  Lösche ${alteGesellschafter.length} alte Gesellschafter...`);

    // Lösche alle alten Gesellschafter dieser Firma
    await db.delete(gesellschafter).where(eq(gesellschafter.unternehmenId, firma.id));

    // Neue Gesellschafter aus Template
    const template = GESELLSCHAFTER_TEMPLATES[firma.name];

    if (template) {
      console.log(`   ✅ Lege ${template.length} neue Gesellschafter an:`);

      for (const g of template) {
        await db.insert(gesellschafter).values({
          unternehmenId: firma.id,
          name: g.name,
          funktion: g.funktion,
          geschaeftsanteil: g.geschaeftsanteil.toString(),
          eintrittsdatum: g.eintrittsdatum,
          geburtsdatum: g.geburtsdatum,
          adresse: g.adresse,
        });

        console.log(`      • ${g.name} (${g.funktion}) - ${g.geschaeftsanteil}%`);
      }
    } else {
      console.log(`   ⚠️  Kein Template für "${firma.name}" - keine Gesellschafter angelegt`);
      console.log(`      Bitte Template in fix-gesellschafter-zuordnung.ts hinzufügen!`);
    }
  }

  console.log("\n\n✅ Korrektur abgeschlossen!");
  console.log("\n💡 Nächste Schritte:");
  console.log("   1. Führe check-gesellschafter.ts aus, um zu prüfen");
  console.log("   2. Passe GESELLSCHAFTER_TEMPLATES an, wenn neue Firmen hinzukommen");
}

// Script ausführen
fixGesellschafterZuordnung()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fehler:", error);
    process.exit(1);
  });
