import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { bankkonten, unternehmen } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

async function fixBankkontenDuplikate() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('🔧 Starte Bereinigung von Bankkonten-Duplikaten...\n');

  // Hole alle Bankkonten
  const allBankkonten = await db.select().from(bankkonten);
  console.log(`📊 Insgesamt ${allBankkonten.length} Bankkonten gefunden\n`);

  // Gruppiere nach Firma + Bank
  const groups = new Map<string, typeof allBankkonten>();
  for (const konto of allBankkonten) {
    const key = `${konto.unternehmenId}-${konto.kontonummer || 'KEINE'}-${konto.bankname || 'KEINE'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(konto);
  }

  let geloescht = 0;

  // Finde und entferne Duplikate
  for (const [key, konten] of groups.entries()) {
    if (konten.length > 1) {
      const [firmaId, kontonr, bankname] = key.split('-');
      console.log(`\n⚠️  Duplikat gefunden: ${bankname} (${kontonr}) bei Firma ${firmaId}`);
      console.log(`   Anzahl Duplikate: ${konten.length}`);

      // Behalte das ERSTE (älteste), lösche die anderen
      const zuBehalten = konten[0];
      const zuLoeschen = konten.slice(1);

      console.log(`   ✅ Behalte: ID ${zuBehalten.id}`);
      for (const konto of zuLoeschen) {
        console.log(`   ❌ Lösche: ID ${konto.id}`);
        await db.delete(bankkonten).where(eq(bankkonten.id, konto.id));
        geloescht++;
      }
    }
  }

  console.log(`\n✅ Bereinigung abgeschlossen: ${geloescht} Duplikate gelöscht`);

  // Zeige finalen Status
  const finalCount = await db.select().from(bankkonten);
  console.log(`📊 Verbleibende Bankkonten: ${finalCount.length}`);

  await connection.end();
}

fixBankkontenDuplikate().catch(console.error);
