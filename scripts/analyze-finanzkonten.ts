import * as dotenv from "dotenv";
dotenv.config();

import { getDb } from "../server/db";
import { finanzkonten, unternehmen } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Analysiert vorhandene Finanzkonten für ALP und ANG
 */
async function analyzeFinanzkonten() {
  console.log("🔍 Analyzing finanzkonten for ALP and ANG...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    // 1. Get all companies
    const companies = await db.select().from(unternehmen);

    // 2. Find ALP and ANG
    const alp = companies.find((c) => c.name.includes("Alpenland"));
    const ang = companies.find((c) => c.name.includes("Angelus"));

    if (!alp || !ang) {
      console.error("❌ ALP oder ANG nicht gefunden!");
      console.log("\n📊 Verfügbare Unternehmen:");
      companies.forEach((c) => {
        console.log(`  ${c.id}: ${c.name}`);
      });
      process.exit(1);
    }

    console.log("✅ Unternehmen gefunden:");
    console.log(`  ALP (ID: ${alp.id}): ${alp.name}`);
    console.log(`  ANG (ID: ${ang.id}): ${ang.name}\n`);

    // 3. Get all finanzkonten for ALP
    const alpKonten = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, alp.id));

    console.log(`💳 ALPENLAND (${alp.id}) - ${alpKonten.length} Finanzkonten:`);
    if (alpKonten.length > 0) {
      const grouped = alpKonten.reduce((acc, k) => {
        if (!acc[k.typ]) acc[k.typ] = [];
        acc[k.typ].push(k);
        return acc;
      }, {} as Record<string, typeof alpKonten>);

      Object.entries(grouped).forEach(([typ, konten]) => {
        console.log(`\n  ${typ.toUpperCase()} (${konten.length}):`);
        konten.forEach((k) => {
          console.log(`    ${k.id}: ${k.name} | Konto: ${k.kontonummer || "N/A"} | Aktiv: ${k.aktiv}`);
        });
      });
    } else {
      console.log("  → Keine Finanzkonten vorhanden\n");
    }

    // 4. Get all finanzkonten for ANG
    const angKonten = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, ang.id));

    console.log(`\n💳 ANGELUS (${ang.id}) - ${angKonten.length} Finanzkonten:`);
    if (angKonten.length > 0) {
      const grouped = angKonten.reduce((acc, k) => {
        if (!acc[k.typ]) acc[k.typ] = [];
        acc[k.typ].push(k);
        return acc;
      }, {} as Record<string, typeof angKonten>);

      Object.entries(grouped).forEach(([typ, konten]) => {
        console.log(`\n  ${typ.toUpperCase()} (${konten.length}):`);
        konten.forEach((k) => {
          console.log(`    ${k.id}: ${k.name} | Konto: ${k.kontonummer || "N/A"} | Aktiv: ${k.aktiv}`);
        });
      });
    } else {
      console.log("  → Keine Finanzkonten vorhanden\n");
    }

    // 5. Check used kontonummern
    const allKonten = [...alpKonten, ...angKonten];
    const usedNummern = allKonten
      .filter(k => k.kontonummer)
      .map(k => k.kontonummer)
      .sort();

    console.log(`\n📊 Verwendete Kontonummern (${usedNummern.length}):`);
    if (usedNummern.length > 0) {
      console.log(`  ${usedNummern.join(", ")}`);
    } else {
      console.log("  → Keine Kontonummern vergeben");
    }

    console.log("\n✅ Analyse abgeschlossen\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fehler bei der Analyse:", error);
    process.exit(1);
  }
}

analyzeFinanzkonten();
