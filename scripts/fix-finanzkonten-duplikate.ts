import { getDb } from "../server/db";
import { finanzkonten, unternehmen } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Findet und bereinigt Duplikate in der finanzkonten-Tabelle
 *
 * Problem: ALP und ANG zeigen identische Kreditkarten/Zahlungsdienstleister
 * Ursache: Gleiche Namen in verschiedenen Unternehmen (sollten getrennt sein)
 */
async function fixFinanzkontenDuplikate() {
  console.log("🔍 Checking finanzkonten for duplicates...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    // 1. Get all companies
    const companies = await db.select().from(unternehmen);
    console.log("📊 Unternehmen:");
    companies.forEach((c) => {
      console.log(`  ${c.id}: ${c.name} (${c.land})`);
    });
    console.log();

    // 2. Get ALP and ANG
    const alp = companies.find((c) => c.name.includes("Alpenland"));
    const ang = companies.find((c) => c.name.includes("Angelus"));

    if (!alp || !ang) {
      console.error("❌ ALP oder ANG nicht gefunden!");
      process.exit(1);
    }

    console.log(`🎯 Fokus auf ALP (ID: ${alp.id}) und ANG (ID: ${ang.id})\n`);

    // 3. Get all finanzkonten
    const allFinanzkonten = await db
      .select({
        id: finanzkonten.id,
        name: finanzkonten.name,
        typ: finanzkonten.typ,
        unternehmenId: finanzkonten.unternehmenId,
        kontonummer: finanzkonten.kontonummer,
        aktiv: finanzkonten.aktiv,
        createdAt: finanzkonten.createdAt,
      })
      .from(finanzkonten);

    console.log(`💳 Total Finanzkonten: ${allFinanzkonten.length}\n`);

    // 4. Group by unternehmenId
    const alpKonten = allFinanzkonten.filter((k) => k.unternehmenId === alp.id);
    const angKonten = allFinanzkonten.filter((k) => k.unternehmenId === ang.id);

    console.log(`  ALP: ${alpKonten.length} Konten`);
    console.log(`  ANG: ${angKonten.length} Konten\n`);

    // 5. Find shared names (potential duplicates)
    const alpNames = new Map<string, typeof alpKonten>();
    alpKonten.forEach((k) => {
      if (!alpNames.has(k.name)) {
        alpNames.set(k.name, []);
      }
      alpNames.get(k.name)!.push(k);
    });

    const angNames = new Map<string, typeof angKonten>();
    angKonten.forEach((k) => {
      if (!angNames.has(k.name)) {
        angNames.set(k.name, []);
      }
      angNames.get(k.name)!.push(k);
    });

    const sharedNames = [...alpNames.keys()].filter((name) => angNames.has(name));

    if (sharedNames.length === 0) {
      console.log("✅ Keine geteilten Namen zwischen ALP und ANG gefunden!");
      console.log("   Das Problem könnte sein:");
      console.log("   - Daten wurden bereits bereinigt");
      console.log("   - Problem liegt woanders (Frontend-Filter?)");
      console.log("   - Oder es sind unterschiedliche Namen mit ähnlichem Inhalt");
      process.exit(0);
    }

    console.log(`⚠️  GEFUNDEN: ${sharedNames.length} geteilte Namen zwischen ALP und ANG:\n`);

    // 6. Show details and prepare fix
    let fixNeeded = false;
    const fixes: Array<{ id: number; newName: string; company: string }> = [];

    for (const name of sharedNames) {
      const alpEntries = alpNames.get(name)!;
      const angEntries = angNames.get(name)!;

      console.log(`\n📌 "${name}" (${alpEntries[0].typ}):`);
      console.log(`   ALP: ${alpEntries.length} Eintrag(e)`);
      alpEntries.forEach((e) => {
        console.log(`     - ID: ${e.id} | Kontonr: ${e.kontonummer || "N/A"} | Aktiv: ${e.aktiv}`);
      });
      console.log(`   ANG: ${angEntries.length} Eintrag(e)`);
      angEntries.forEach((e) => {
        console.log(`     - ID: ${e.id} | Kontonr: ${e.kontonummer || "N/A"} | Aktiv: ${e.aktiv}`);
      });

      // Decide which one to rename
      // Strategy: Rename the newer one (higher ID) to include company suffix
      const allEntries = [...alpEntries, ...angEntries].sort((a, b) => a.id - b.id);

      if (allEntries.length > 1) {
        fixNeeded = true;

        // Keep first (oldest), rename others
        for (let i = 1; i < allEntries.length; i++) {
          const entry = allEntries[i];
          const company = entry.unternehmenId === alp.id ? "ALP" : "ANG";
          const newName = `${name} (${company})`;

          fixes.push({
            id: entry.id,
            newName: newName,
            company: company,
          });

          console.log(`   🔧 FIX: ID ${entry.id} → "${newName}"`);
        }
      }
    }

    if (!fixNeeded) {
      console.log("\n✅ Keine Fixes notwendig!");
      process.exit(0);
    }

    // 7. Ask for confirmation
    console.log(`\n\n⚠️  ${fixes.length} Einträge müssen umbenannt werden.`);
    console.log("   Dies verhindert Verwechslungen zwischen ALP und ANG.");
    console.log("\n🔧 Fixes werden angewendet...\n");

    // 8. Apply fixes
    for (const fix of fixes) {
      await db
        .update(finanzkonten)
        .set({ name: fix.newName })
        .where(eq(finanzkonten.id, fix.id));

      console.log(`✅ ID ${fix.id}: "${fix.newName}"`);
    }

    console.log(`\n✅ ${fixes.length} Einträge erfolgreich umbenannt!`);
    console.log("\n📊 Zusammenfassung:");
    console.log(`   - Geteilte Namen gefunden: ${sharedNames.length}`);
    console.log(`   - Einträge umbenannt: ${fixes.length}`);
    console.log(`   - Jedes Konto hat jetzt einen eindeutigen Namen pro Firma`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixFinanzkontenDuplikate();
