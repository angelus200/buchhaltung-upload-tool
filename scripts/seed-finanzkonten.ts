import * as dotenv from "dotenv";
dotenv.config();

import { getDb } from "../server/db";
import { finanzkonten, unternehmen } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Seed-Script für Finanzkonten von ALP und ANG
 *
 * Kontonummern-Schema (SKR04):
 * - 1200-1259: Bankkonten (typ: "bank")
 * - 1260-1269: Kreditkarten (typ: "kreditkarte")
 * - 1270-1279: Zahlungsdienstleister (typ: "paypal")
 */

type FinanzkontoInput = {
  name: string;
  typ: "bank" | "kreditkarte" | "paypal";
  kontonummer: string;
  unternehmenId: number;
};

async function seedFinanzkonten() {
  console.log("🌱 Seeding Finanzkonten für ALP und ANG...\n");

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
    console.log(`  ALP (ID: ${alp.id}): ${alp.name}`);
    console.log(`  ANG (ID: ${ang.id}): ${ang.name}\n`);

    // 2. Prüfe existierende Konten
    const existingAlp = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, alp.id));

    const existingAng = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, ang.id));

    console.log(`📊 Existierende Finanzkonten:`);
    console.log(`  ALP: ${existingAlp.length} Konten`);
    console.log(`  ANG: ${existingAng.length} Konten\n`);

    if (existingAlp.length > 0 || existingAng.length > 0) {
      console.log("⚠️  WARNUNG: Es existieren bereits Finanzkonten!");
      console.log("   Das Script wird diese NICHT löschen.");
      console.log("   Neue Konten werden hinzugefügt.\n");
    }

    // 3. Definiere neue Finanzkonten

    // ALPENLAND - Kontonummern: 1200-1269
    const alpKonten: FinanzkontoInput[] = [
      // Banken (1200-1201)
      { name: "Sparkasse Rottal-Inn (Hauptkonto)", typ: "bank", kontonummer: "1200", unternehmenId: alp.id },
      { name: "VR Bank Rottal-Inn", typ: "bank", kontonummer: "1201", unternehmenId: alp.id },

      // Zahlungsdienstleister (1270)
      { name: "PayPal Alpenland", typ: "paypal", kontonummer: "1270", unternehmenId: alp.id },

      // Kreditkarten (1260-1285)
      { name: "Sparkasse Rottal-Inn Kreditkarte", typ: "kreditkarte", kontonummer: "1260", unternehmenId: alp.id },
      { name: "VR Bank Rottal-Inn Kreditkarte", typ: "kreditkarte", kontonummer: "1261", unternehmenId: alp.id },
      { name: "Soldo Hauptkarte Alpenland", typ: "kreditkarte", kontonummer: "1262", unternehmenId: alp.id },

      // Soldo Virtuelle Karten ALP-01 bis ALP-20 (1263-1282)
      ...Array.from({ length: 20 }, (_, i) => ({
        name: `Soldo Virtuell ALP-${String(i + 1).padStart(2, "0")}`,
        typ: "kreditkarte" as const,
        kontonummer: String(1263 + i),
        unternehmenId: alp.id,
      })),
    ];

    // ANGELUS - Kontonummern: 1210-1289
    const angKonten: FinanzkontoInput[] = [
      // Banken (1210-1213)
      { name: "Sparkasse Rottal-Inn", typ: "bank", kontonummer: "1210", unternehmenId: ang.id },
      { name: "Sumup Geschäftskonto", typ: "bank", kontonummer: "1211", unternehmenId: ang.id },
      { name: "The Kingdom Bank", typ: "bank", kontonummer: "1212", unternehmenId: ang.id },
      { name: "Bilderlings", typ: "bank", kontonummer: "1213", unternehmenId: ang.id },

      // Zahlungsdienstleister (1271)
      { name: "PayPal Angelus", typ: "paypal", kontonummer: "1271", unternehmenId: ang.id },

      // Kreditkarten (1283-1301)
      { name: "Sparkasse Rottal-Inn Kreditkarte", typ: "kreditkarte", kontonummer: "1283", unternehmenId: ang.id },
      { name: "Soldo Hauptkarte Angelus", typ: "kreditkarte", kontonummer: "1284", unternehmenId: ang.id },

      // Soldo Virtuelle Karten ANG-01 bis ANG-10 (1285-1294)
      ...Array.from({ length: 10 }, (_, i) => ({
        name: `Soldo Virtuell ANG-${String(i + 1).padStart(2, "0")}`,
        typ: "kreditkarte" as const,
        kontonummer: String(1285 + i),
        unternehmenId: ang.id,
      })),

      { name: "Sumup Kreditkarte", typ: "kreditkarte", kontonummer: "1295", unternehmenId: ang.id },
      { name: "American Express Karte 1", typ: "kreditkarte", kontonummer: "1296", unternehmenId: ang.id },
      { name: "American Express Karte 2", typ: "kreditkarte", kontonummer: "1297", unternehmenId: ang.id },
    ];

    const alleKonten = [...alpKonten, ...angKonten];

    console.log(`🎯 Erstelle ${alleKonten.length} neue Finanzkonten:\n`);

    // 4. Prüfe auf Kontonummern-Konflikte
    const existingNummern = new Set([
      ...existingAlp.filter(k => k.kontonummer).map(k => k.kontonummer),
      ...existingAng.filter(k => k.kontonummer).map(k => k.kontonummer),
    ]);

    const konflikte = alleKonten.filter(k => existingNummern.has(k.kontonummer));
    if (konflikte.length > 0) {
      console.error(`\n❌ FEHLER: ${konflikte.length} Kontonummer(n) bereits vergeben:`);
      konflikte.forEach(k => {
        console.error(`  - ${k.kontonummer}: ${k.name}`);
      });
      console.error("\nBitte bereinigen Sie die Datenbank oder passen Sie die Kontonummern an.");
      process.exit(1);
    }

    // 5. Erstelle die Konten
    let created = 0;
    let failed = 0;

    for (const konto of alleKonten) {
      try {
        await db.insert(finanzkonten).values({
          unternehmenId: konto.unternehmenId,
          name: konto.name,
          typ: konto.typ,
          kontonummer: konto.kontonummer,
          aktiv: true,
        });

        const company = konto.unternehmenId === alp.id ? "ALP" : "ANG";
        console.log(`  ✅ ${company} | ${konto.typ.padEnd(12)} | ${konto.kontonummer} | ${konto.name}`);
        created++;
      } catch (error: any) {
        console.error(`  ❌ Fehler bei ${konto.name}:`, error.message);
        failed++;
      }
    }

    // 6. Zusammenfassung
    console.log("\n" + "=".repeat(80));
    console.log(`✅ Seed abgeschlossen:`);
    console.log(`   - ${created} Konten erfolgreich erstellt`);
    if (failed > 0) {
      console.log(`   - ${failed} Konten fehlgeschlagen`);
    }

    // 7. Zeige finale Statistik
    const finalAlp = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, alp.id));

    const finalAng = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, ang.id));

    console.log(`\n📊 Finale Anzahl Finanzkonten:`);
    console.log(`   - ALP: ${finalAlp.length} Konten`);
    console.log(`   - ANG: ${finalAng.length} Konten`);
    console.log("=".repeat(80) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fehler beim Seeding:", error);
    process.exit(1);
  }
}

seedFinanzkonten();
