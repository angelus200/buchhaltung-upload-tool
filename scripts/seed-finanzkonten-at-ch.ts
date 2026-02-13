import * as dotenv from "dotenv";
dotenv.config();

import { getDb } from "../server/db";
import { finanzkonten, unternehmen } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Seed-Script für Finanzkonten der AT/CH Firmen
 *
 * Kontonummern-Schema nach jeweiligem Kontenrahmen:
 *
 * ÖSTERREICH:
 * - OeKR (commercehelden): Bankkonten 2700-2799, Kreditkarten 2800-2899
 * - RLG (Emo Retail): Bankkonten 2700-2799, Kreditkarten 2800-2899
 *
 * SCHWEIZ:
 * - KMU (Trademark24-7): Flüssige Mittel 1000-1099, Bank 1020-1029
 * - OR (Marketplace24-7): Flüssige Mittel 1000-1099, Bank 1020-1029
 */

type FinanzkontoInput = {
  name: string;
  typ: "bank" | "kreditkarte" | "paypal" | "stripe" | "sonstiges";
  kontonummer: string;
  unternehmenId: number;
  waehrung?: string;
  sachkontoId?: number;
};

async function seedFinanzkontenAtCh() {
  console.log("🌱 Seeding Finanzkonten für AT/CH Firmen...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    // 1. Get companies
    const companies = await db.select().from(unternehmen);
    const commercehelden = companies.find((c) => c.name.includes("commercehelden"));
    const emoRetail = companies.find((c) => c.name.includes("Emo Retail"));
    const trademark = companies.find((c) => c.name.includes("Trademark24-7"));
    const marketplace = companies.find((c) => c.name.includes("Marketplace24-7"));

    if (!commercehelden || !emoRetail || !trademark || !marketplace) {
      console.error("❌ Nicht alle AT/CH Firmen gefunden!");
      console.log("Gefunden:");
      if (commercehelden) console.log(`  ✅ commercehelden (ID: ${commercehelden.id})`);
      if (emoRetail) console.log(`  ✅ Emo Retail (ID: ${emoRetail.id})`);
      if (trademark) console.log(`  ✅ Trademark24-7 (ID: ${trademark.id})`);
      if (marketplace) console.log(`  ✅ Marketplace24-7 (ID: ${marketplace.id})`);
      process.exit(1);
    }

    console.log("✅ Unternehmen gefunden:");
    console.log(`  AT: commercehelden GmbH (ID: ${commercehelden.id}) - Kontenrahmen: ${commercehelden.kontenrahmen}`);
    console.log(`  AT: Emo Retail OG (ID: ${emoRetail.id}) - Kontenrahmen: ${emoRetail.kontenrahmen}`);
    console.log(`  CH: Trademark24-7 AG (ID: ${trademark.id}) - Kontenrahmen: ${trademark.kontenrahmen}`);
    console.log(`  CH: Marketplace24-7 GmbH (ID: ${marketplace.id}) - Kontenrahmen: ${marketplace.kontenrahmen}\n`);

    // 2. Prüfe existierende Konten
    const existingCommercehelden = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, commercehelden.id));

    const existingEmoRetail = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, emoRetail.id));

    const existingTrademark = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, trademark.id));

    const existingMarketplace = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, marketplace.id));

    console.log("📊 Existierende Konten:");
    console.log(`  commercehelden: ${existingCommercehelden.length}`);
    console.log(`  Emo Retail: ${existingEmoRetail.length}`);
    console.log(`  Trademark24-7: ${existingTrademark.length}`);
    console.log(`  Marketplace24-7: ${existingMarketplace.length}\n`);

    // 3. Definiere Konten nach Kontenrahmen

    // ÖSTERREICH - OeKR (commercehelden)
    // Kontonummern: 2700-2799 (Bank), 2800-2899 (Kreditkarten), 2900-2999 (Zahlungsdienstleister)
    const commerceheldenKonten: FinanzkontoInput[] = [
      // Bank
      { name: "Qonto Geschäftskonto", typ: "bank", kontonummer: "2700", unternehmenId: commercehelden.id, waehrung: "EUR" },

      // Kreditkarten
      { name: "Qonto Kreditkarte 1", typ: "kreditkarte", kontonummer: "2800", unternehmenId: commercehelden.id },
      { name: "Qonto Kreditkarte 2", typ: "kreditkarte", kontonummer: "2801", unternehmenId: commercehelden.id },
      { name: "Qonto Kreditkarte 3", typ: "kreditkarte", kontonummer: "2802", unternehmenId: commercehelden.id },

      // Zahlungsdienstleister
      { name: "Shopify Pay", typ: "sonstiges", kontonummer: "2900", unternehmenId: commercehelden.id },
      { name: "PayPal commercehelden", typ: "paypal", kontonummer: "2901", unternehmenId: commercehelden.id },
    ];

    // ÖSTERREICH - RLG (Emo Retail)
    // Kontonummern: 2700-2799 (Bank), 2800-2899 (Kreditkarten), 2900-2999 (Zahlungsdienstleister)
    const emoRetailKonten: FinanzkontoInput[] = [
      // Bank
      { name: "Qonto Geschäftskonto", typ: "bank", kontonummer: "2700", unternehmenId: emoRetail.id, waehrung: "EUR" },

      // Kreditkarten
      { name: "Qonto Kreditkarte 1", typ: "kreditkarte", kontonummer: "2800", unternehmenId: emoRetail.id },
      { name: "Qonto Kreditkarte 2", typ: "kreditkarte", kontonummer: "2801", unternehmenId: emoRetail.id },
      { name: "Qonto Kreditkarte 3", typ: "kreditkarte", kontonummer: "2802", unternehmenId: emoRetail.id },

      // Zahlungsdienstleister
      { name: "Shopify Pay", typ: "sonstiges", kontonummer: "2900", unternehmenId: emoRetail.id },
      { name: "PayPal Emo Retail", typ: "paypal", kontonummer: "2901", unternehmenId: emoRetail.id },
    ];

    // SCHWEIZ - KMU (Trademark24-7)
    // Kontonummern: 1020-1029 (Bank), 1030-1039 (Zahlungsdienstleister)
    const trademarkKonten: FinanzkontoInput[] = [
      // Bank
      { name: "Relio Geschäftskonto", typ: "bank", kontonummer: "1020", unternehmenId: trademark.id, waehrung: "CHF" },

      // Zahlungsdienstleister
      { name: "Stripe", typ: "stripe", kontonummer: "1030", unternehmenId: trademark.id },
      { name: "PayPal Trademark", typ: "paypal", kontonummer: "1031", unternehmenId: trademark.id },
      { name: "Shopify Pay", typ: "sonstiges", kontonummer: "1032", unternehmenId: trademark.id },
    ];

    // SCHWEIZ - OR (Marketplace24-7)
    // Kontonummern: 1020-1029 (Bank), 1030-1039 (Zahlungsdienstleister)
    const marketplaceKonten: FinanzkontoInput[] = [
      // Bank
      { name: "Relio Geschäftskonto", typ: "bank", kontonummer: "1020", unternehmenId: marketplace.id, waehrung: "CHF" },

      // Zahlungsdienstleister
      { name: "Stripe", typ: "stripe", kontonummer: "1030", unternehmenId: marketplace.id },
      { name: "PayPal Marketplace", typ: "paypal", kontonummer: "1031", unternehmenId: marketplace.id },
      { name: "Shopify Pay", typ: "sonstiges", kontonummer: "1032", unternehmenId: marketplace.id },
    ];

    const alleKonten = [
      ...commerceheldenKonten,
      ...emoRetailKonten,
      ...trademarkKonten,
      ...marketplaceKonten,
    ];

    console.log(`🎯 Erstelle ${alleKonten.length} neue Finanzkonten:\n`);
    console.log("📋 Kontenplan:");
    console.log("\n🇦🇹 ÖSTERREICH (OeKR/RLG):");
    console.log("  commercehelden GmbH: 6 Konten (1 Bank, 3 Kreditkarten, 2 ZDL)");
    console.log("    2700: Qonto Geschäftskonto");
    console.log("    2800-2802: Qonto Kreditkarten 1-3");
    console.log("    2900: Shopify Pay");
    console.log("    2901: PayPal commercehelden");
    console.log("\n  Emo Retail OG: 6 Konten (1 Bank, 3 Kreditkarten, 2 ZDL)");
    console.log("    2700: Qonto Geschäftskonto");
    console.log("    2800-2802: Qonto Kreditkarten 1-3");
    console.log("    2900: Shopify Pay");
    console.log("    2901: PayPal Emo Retail");
    console.log("\n🇨🇭 SCHWEIZ (KMU/OR):");
    console.log("  Trademark24-7 AG: 4 Konten (1 Bank, 3 ZDL)");
    console.log("    1020: Relio Geschäftskonto");
    console.log("    1030: Stripe");
    console.log("    1031: PayPal Trademark");
    console.log("    1032: Shopify Pay");
    console.log("\n  Marketplace24-7 GmbH: 4 Konten (1 Bank, 3 ZDL)");
    console.log("    1020: Relio Geschäftskonto");
    console.log("    1030: Stripe");
    console.log("    1031: PayPal Marketplace");
    console.log("    1032: Shopify Pay");
    console.log("\n");

    // 4. Prüfe auf Kontonummern-Konflikte (nur innerhalb der gleichen Firma)
    const existingByFirma = {
      commercehelden: new Set(existingCommercehelden.filter(k => k.kontonummer).map(k => k.kontonummer)),
      emoRetail: new Set(existingEmoRetail.filter(k => k.kontonummer).map(k => k.kontonummer)),
      trademark: new Set(existingTrademark.filter(k => k.kontonummer).map(k => k.kontonummer)),
      marketplace: new Set(existingMarketplace.filter(k => k.kontonummer).map(k => k.kontonummer)),
    };

    const konflikte: FinanzkontoInput[] = [];
    for (const konto of alleKonten) {
      if (konto.unternehmenId === commercehelden.id && existingByFirma.commercehelden.has(konto.kontonummer)) {
        konflikte.push(konto);
      } else if (konto.unternehmenId === emoRetail.id && existingByFirma.emoRetail.has(konto.kontonummer)) {
        konflikte.push(konto);
      } else if (konto.unternehmenId === trademark.id && existingByFirma.trademark.has(konto.kontonummer)) {
        konflikte.push(konto);
      } else if (konto.unternehmenId === marketplace.id && existingByFirma.marketplace.has(konto.kontonummer)) {
        konflikte.push(konto);
      }
    }

    if (konflikte.length > 0) {
      console.error(`\n❌ FEHLER: ${konflikte.length} Kontonummer(n) bereits vergeben:`);
      konflikte.forEach(k => {
        console.error(`  - ${k.kontonummer}: ${k.name} (Unternehmen ID: ${k.unternehmenId})`);
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
          typ: konto.typ,
          name: konto.name,
          kontonummer: konto.kontonummer,
          waehrung: konto.waehrung || null,
          aktiv: true,
        });

        const company =
          konto.unternehmenId === commercehelden.id ? "commercehelden" :
          konto.unternehmenId === emoRetail.id ? "Emo Retail" :
          konto.unternehmenId === trademark.id ? "Trademark24-7" :
          "Marketplace24-7";

        console.log(`  ✅ ${company}: ${konto.kontonummer} - ${konto.name}`);
        created++;
      } catch (error) {
        console.error(`  ❌ Fehler bei ${konto.name}:`, error);
        failed++;
      }
    }

    // 6. Zusammenfassung
    console.log("\n" + "=".repeat(60));
    console.log("📊 ZUSAMMENFASSUNG");
    console.log("=".repeat(60));

    const finalCommercehelden = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, commercehelden.id));

    const finalEmoRetail = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, emoRetail.id));

    const finalTrademark = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, trademark.id));

    const finalMarketplace = await db
      .select()
      .from(finanzkonten)
      .where(eq(finanzkonten.unternehmenId, marketplace.id));

    console.log(`\n✅ Erfolgreich erstellt: ${created}`);
    console.log(`❌ Fehler: ${failed}`);
    console.log(`\n📈 Finanzkonten pro Firma (nach Seeding):`);
    console.log(`  🇦🇹 commercehelden GmbH (OeKR): ${finalCommercehelden.length} Konten`);
    console.log(`  🇦🇹 Emo Retail OG (RLG): ${finalEmoRetail.length} Konten`);
    console.log(`  🇨🇭 Trademark24-7 AG (KMU): ${finalTrademark.length} Konten`);
    console.log(`  🇨🇭 Marketplace24-7 GmbH (OR): ${finalMarketplace.length} Konten`);

    console.log("\n✅ Seeding abgeschlossen!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fehler beim Seeding:", error);
    process.exit(1);
  }
}

seedFinanzkontenAtCh();
