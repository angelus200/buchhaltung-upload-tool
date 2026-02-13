import * as dotenv from "dotenv";
dotenv.config();

import { getDb } from "../server/db";
import { finanzkonten, unternehmen } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Behebt Kontonummern-Duplikate durch Neuverteilung
 *
 * Neue Struktur:
 * - 1200-1209: ALP Banken
 * - 1210-1219: ANG Banken
 * - 1220-1240: ALP Soldo Karten
 * - 1241-1251: ANG Soldo Karten
 * - 1260-1269: ALP andere Kreditkarten + Zahlungsdienstleister
 * - 1270-1279: Zahlungsdienstleister (PayPal)
 * - 1280-1289: ANG andere Kreditkarten
 */

type KontoUpdate = {
  id: number;
  name: string;
  oldNummer: string;
  newNummer: string;
};

async function fixFinanzkontenNummern() {
  console.log("🔧 Korrigiere Kontonummern-Duplikate...\n");

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

    // 2. Lade alle Konten
    const alpKonten = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, alp.id));

    const angKonten = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, ang.id));

    // 3. Definiere Updates
    const updates: KontoUpdate[] = [];

    // ALP Soldo Karten: 1262-1282 → 1220-1240
    const alpSoldoHaupt = alpKonten.find(k => k.name === "Soldo Hauptkarte Alpenland");
    if (alpSoldoHaupt && alpSoldoHaupt.kontonummer === "1262") {
      updates.push({
        id: alpSoldoHaupt.id,
        name: alpSoldoHaupt.name,
        oldNummer: "1262",
        newNummer: "1220",
      });
    }

    for (let i = 1; i <= 20; i++) {
      const name = `Soldo Virtuell ALP-${String(i).padStart(2, "0")}`;
      const konto = alpKonten.find(k => k.name === name);
      if (konto) {
        const oldNum = String(1262 + i); // 1263-1282
        const newNum = String(1220 + i); // 1221-1240
        if (konto.kontonummer === oldNum) {
          updates.push({
            id: konto.id,
            name: konto.name,
            oldNummer: oldNum,
            newNummer: newNum,
          });
        }
      }
    }

    // ANG Soldo Karten: 1284-1294 → 1241-1251
    const angSoldoHaupt = angKonten.find(k => k.name === "Soldo Hauptkarte Angelus");
    if (angSoldoHaupt && angSoldoHaupt.kontonummer === "1284") {
      updates.push({
        id: angSoldoHaupt.id,
        name: angSoldoHaupt.name,
        oldNummer: "1284",
        newNummer: "1241",
      });
    }

    for (let i = 1; i <= 10; i++) {
      const name = `Soldo Virtuell ANG-${String(i).padStart(2, "0")}`;
      const konto = angKonten.find(k => k.name === name);
      if (konto) {
        const oldNum = String(1284 + i); // 1285-1294
        const newNum = String(1241 + i); // 1242-1251
        if (konto.kontonummer === oldNum) {
          updates.push({
            id: konto.id,
            name: konto.name,
            oldNummer: oldNum,
            newNummer: newNum,
          });
        }
      }
    }

    // ANG andere Kreditkarten: 1283, 1295-1297 → 1280-1283
    const angSparkasse = angKonten.find(k => k.name === "Sparkasse Rottal-Inn Kreditkarte");
    if (angSparkasse && angSparkasse.kontonummer === "1283") {
      updates.push({
        id: angSparkasse.id,
        name: angSparkasse.name,
        oldNummer: "1283",
        newNummer: "1280",
      });
    }

    const angSumup = angKonten.find(k => k.name === "Sumup Kreditkarte");
    if (angSumup && angSumup.kontonummer === "1295") {
      updates.push({
        id: angSumup.id,
        name: angSumup.name,
        oldNummer: "1295",
        newNummer: "1281",
      });
    }

    const angAmex1 = angKonten.find(k => k.name === "American Express Karte 1");
    if (angAmex1 && angAmex1.kontonummer === "1296") {
      updates.push({
        id: angAmex1.id,
        name: angAmex1.name,
        oldNummer: "1296",
        newNummer: "1282",
      });
    }

    const angAmex2 = angKonten.find(k => k.name === "American Express Karte 2");
    if (angAmex2 && angAmex2.kontonummer === "1297") {
      updates.push({
        id: angAmex2.id,
        name: angAmex2.name,
        oldNummer: "1297",
        newNummer: "1283",
      });
    }

    console.log(`🎯 Gefunden: ${updates.length} Konten zum Aktualisieren\n`);

    if (updates.length === 0) {
      console.log("✅ Keine Updates notwendig - alle Kontonummern sind korrekt");
      process.exit(0);
    }

    // 4. Zeige Preview
    console.log("📋 Preview der Änderungen:\n");
    updates.forEach(u => {
      console.log(`  ${u.oldNummer} → ${u.newNummer} | ${u.name}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("⚠️  Starte Update in 2 Sekunden...");
    console.log("=".repeat(80) + "\n");

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Führe Updates aus
    let success = 0;
    let failed = 0;

    for (const update of updates) {
      try {
        await db
          .update(finanzkonten)
          .set({ kontonummer: update.newNummer })
          .where(eq(finanzkonten.id, update.id));

        console.log(`  ✅ ${update.oldNummer} → ${update.newNummer} | ${update.name}`);
        success++;
      } catch (error: any) {
        console.error(`  ❌ Fehler bei ${update.name}:`, error.message);
        failed++;
      }
    }

    // 6. Zusammenfassung
    console.log("\n" + "=".repeat(80));
    console.log(`✅ Update abgeschlossen:`);
    console.log(`   - ${success} Konten erfolgreich aktualisiert`);
    if (failed > 0) {
      console.log(`   - ${failed} Konten fehlgeschlagen`);
    }
    console.log("=".repeat(80) + "\n");

    // 7. Prüfe auf verbleibende Duplikate
    const allKonten = await db.select().from(finanzkonten);
    const nummern = allKonten
      .filter(k => k.kontonummer)
      .map(k => k.kontonummer!);

    const duplikate = nummern.filter((n, i) => nummern.indexOf(n) !== i);
    const uniqueDuplikate = [...new Set(duplikate)];

    if (uniqueDuplikate.length > 0) {
      console.log(`⚠️  Noch ${uniqueDuplikate.length} Duplikat(e) gefunden:`);
      uniqueDuplikate.forEach(n => {
        const konten = allKonten.filter(k => k.kontonummer === n);
        console.log(`  ${n}: ${konten.map(k => k.name).join(", ")}`);
      });
    } else {
      console.log("✅ Keine Duplikate mehr vorhanden!\n");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fehler beim Update:", error);
    process.exit(1);
  }
}

fixFinanzkontenNummern();
