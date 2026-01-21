#!/usr/bin/env tsx
/**
 * FIX BUCHUNGSARTEN
 * Korrigiert die buchungsart aller existierenden Buchungen basierend auf dem Sachkonto
 */
import "dotenv/config";
import * as mysql from "mysql2/promise";

const ANGELUS_UNTERNEHMEN_ID = 1;

function getBuchungsart(kontonr: string): string {
  if (!kontonr) return "sonstig";

  // SKR04 Kontenrahmen Logik (6-stellige Konten)
  // Erste Ziffer bestimmt die Kontenklasse
  const firstDigit = parseInt(kontonr.charAt(0));

  // 0-3: Bilanzkonten (Aktiva/Passiva)
  if (firstDigit >= 0 && firstDigit <= 3) return "anlage";

  // 4: Betriebliche Erträge
  if (firstDigit === 4) return "ertrag";

  // 5-8: Betriebliche Aufwendungen
  if (firstDigit >= 5 && firstDigit <= 8) return "aufwand";

  // 9: Vortragskonten
  return "sonstig";
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("\n╔════════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                    ║");
  console.log("║  BUCHUNGSARTEN KORREKTUR                                           ║");
  console.log("║                                                                    ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  // Lade alle Buchungen die korrigiert werden müssen
  const [buchungen] = await conn.execute(`
    SELECT id, sachkonto, buchungsart, wirtschaftsjahr
    FROM buchungen
    WHERE unternehmenId = ?
    ORDER BY wirtschaftsjahr, id
  `, [ANGELUS_UNTERNEHMEN_ID]);

  console.log(`📊 ${(buchungen as any[]).length} Buchungen gefunden\n`);

  let updated = 0;
  let unchanged = 0;
  const stats: Record<string, { alt: string; neu: string; anzahl: number }> = {};

  // Gruppiere Updates nach neuer Buchungsart
  const updatesByType: Record<string, number[]> = {
    anlage: [],
    ertrag: [],
    aufwand: [],
    sonstig: [],
  };

  for (const buchung of buchungen as any[]) {
    const neueBuchungsart = getBuchungsart(buchung.sachkonto);

    if (neueBuchungsart !== buchung.buchungsart) {
      updatesByType[neueBuchungsart].push(buchung.id);
      updated++;

      const key = `${buchung.buchungsart} → ${neueBuchungsart}`;
      if (!stats[key]) {
        stats[key] = { alt: buchung.buchungsart, neu: neueBuchungsart, anzahl: 0 };
      }
      stats[key].anzahl++;
    } else {
      unchanged++;
    }
  }

  // Batch Updates durchführen
  for (const [buchungsart, ids] of Object.entries(updatesByType)) {
    if (ids.length === 0) continue;

    console.log(`📝 Aktualisiere ${ids.length} Buchungen → ${buchungsart}...`);

    const BATCH_SIZE = 500;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => '?').join(',');

      await conn.execute(
        `UPDATE buchungen SET buchungsart = ? WHERE id IN (${placeholders})`,
        [buchungsart, ...batch]
      );

      if ((i + BATCH_SIZE) % 1000 === 0) {
        console.log(`   ${Math.min(i + BATCH_SIZE, ids.length)} / ${ids.length} aktualisiert...`);
      }
    }
  }

  console.log("✅ Korrektur abgeschlossen!\n");
  console.log(`   Aktualisiert: ${updated}`);
  console.log(`   Unverändert: ${unchanged}\n`);

  if (Object.keys(stats).length > 0) {
    console.log("📊 Änderungen nach Typ:");
    console.log("─".repeat(70));
    Object.entries(stats).forEach(([key, val]) => {
      console.log(`   ${key}: ${val.anzahl} Buchungen`);
    });
    console.log("");
  }

  // Validierung
  const [validation] = await conn.execute(`
    SELECT
      wirtschaftsjahr,
      buchungsart,
      COUNT(*) as anzahl,
      SUM(CAST(bruttobetrag AS DECIMAL(15,2))) as summe
    FROM buchungen
    WHERE unternehmenId = ?
    GROUP BY wirtschaftsjahr, buchungsart
    ORDER BY wirtschaftsjahr, buchungsart
  `, [ANGELUS_UNTERNEHMEN_ID]);

  console.log("📊 FINALE BUCHUNGSARTEN-VERTEILUNG:");
  console.log("─".repeat(70));
  console.table(validation);

  await conn.end();
}

main().catch(console.error);
