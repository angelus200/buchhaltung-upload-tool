import * as dotenv from "dotenv";
dotenv.config();

import { getDb } from "../server/db";
import { finanzkonten, unternehmen } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Löscht Test-Finanzkonten (ohne Kontonummer)
 */
async function deleteTestFinanzkonten() {
  console.log("🗑️  Lösche Test-Finanzkonten...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    // 1. Get companies
    const companies = await db.select().from(unternehmen);
    const alp = companies.find((c) => c.name.includes("Alpenland"));
    const ang = companies.find((c) => c.name.includes("Angelus"));

    if (!alp || !ang) {
      console.error("❌ ALP oder ANG nicht gefunden!");
      process.exit(1);
    }

    console.log("✅ Unternehmen gefunden:");
    console.log(`  ALP (ID: ${alp.id})`);
    console.log(`  ANG (ID: ${ang.id})\n`);

    // 2. Finde Test-Konten (ohne Kontonummer oder mit Namen "TEST" / "Pay" / "payp")
    const allKonten = await db.select().from(finanzkonten);

    const testKonten = allKonten.filter(k =>
      (k.unternehmenId === alp.id || k.unternehmenId === ang.id) &&
      (!k.kontonummer || k.name.includes("TEST") || k.name.includes("Pay ALP") || k.name.includes("payp ANG"))
    );

    console.log(`🎯 Gefunden: ${testKonten.length} Test-Konten zum Löschen:\n`);

    if (testKonten.length === 0) {
      console.log("✅ Keine Test-Konten gefunden - Datenbank ist sauber");
      process.exit(0);
    }

    testKonten.forEach(k => {
      const company = k.unternehmenId === alp.id ? "ALP" : "ANG";
      console.log(`  ${company} | ID: ${k.id} | ${k.typ} | ${k.name} | Konto: ${k.kontonummer || "N/A"}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("⚠️  Starte Löschung in 2 Sekunden...");
    console.log("=".repeat(80) + "\n");

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Lösche die Konten
    let deleted = 0;
    let failed = 0;

    for (const konto of testKonten) {
      try {
        await db
          .delete(finanzkonten)
          .where(eq(finanzkonten.id, konto.id));

        const company = konto.unternehmenId === alp.id ? "ALP" : "ANG";
        console.log(`  ✅ Gelöscht: ${company} | ${konto.name}`);
        deleted++;
      } catch (error: any) {
        console.error(`  ❌ Fehler bei ${konto.name}:`, error.message);
        failed++;
      }
    }

    // 4. Zusammenfassung
    console.log("\n" + "=".repeat(80));
    console.log(`✅ Löschung abgeschlossen:`);
    console.log(`   - ${deleted} Konten erfolgreich gelöscht`);
    if (failed > 0) {
      console.log(`   - ${failed} Konten fehlgeschlagen`);
    }
    console.log("=".repeat(80) + "\n");

    // 5. Zeige finale Anzahl
    const finalAlp = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, alp.id));

    const finalAng = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, ang.id));

    console.log(`📊 Finale Anzahl Finanzkonten:`);
    console.log(`   - ALP: ${finalAlp.length} Konten`);
    console.log(`   - ANG: ${finalAng.length} Konten\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fehler beim Löschen:", error);
    process.exit(1);
  }
}

deleteTestFinanzkonten();
