import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { bankkonten, unternehmen } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function checkBankkonten() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('🔍 Prüfe Bankkonten-Zuordnung...\n');

  // Hole alle Bankkonten
  const allBankkonten = await db.select().from(bankkonten);
  console.log(`📊 Insgesamt ${allBankkonten.length} Bankkonten gefunden\n`);

  // Gruppiere nach Firma
  const byFirma = new Map<number, typeof allBankkonten>();
  for (const konto of allBankkonten) {
    if (!byFirma.has(konto.unternehmenId)) {
      byFirma.set(konto.unternehmenId, []);
    }
    byFirma.get(konto.unternehmenId)!.push(konto);
  }

  // Zeige Bankkonten pro Firma
  for (const [firmaId, konten] of byFirma.entries()) {
    const [firma] = await db.select().from(unternehmen).where(eq(unternehmen.id, firmaId));

    console.log(`📂 ${firma?.name || 'Unbekannte Firma'} (ID: ${firmaId})`);
    console.log(`   Anzahl Bankkonten: ${konten.length}`);

    for (const konto of konten) {
      console.log(`   - ${konto.kontonummer} | ${konto.bezeichnung} | ${konto.bankname || 'keine Bank'}`);
    }
    console.log();
  }

  // Prüfe auf Duplikate (gleiche Kontonummer bei verschiedenen Firmen)
  const kontonummern = new Map<string, number[]>();
  for (const konto of allBankkonten) {
    const key = `${konto.kontonummer}-${konto.bankname || ''}`;
    if (!kontonummern.has(key)) {
      kontonummern.set(key, []);
    }
    kontonummern.get(key)!.push(konto.unternehmenId);
  }

  console.log('🔍 Prüfe auf Duplikate (gleiche Kontonummer bei mehreren Firmen)...\n');
  let duplikateGefunden = false;

  for (const [key, firmen] of kontonummern.entries()) {
    if (firmen.length > 1) {
      duplikateGefunden = true;
      console.log(`⚠️  Duplikat gefunden: ${key}`);
      console.log(`   Bei Firmen: ${firmen.join(', ')}`);
    }
  }

  if (!duplikateGefunden) {
    console.log('✅ Keine Duplikate gefunden - alle Bankkonten sind eindeutig zugeordnet!');
  }

  await connection.end();
}

checkBankkonten().catch(console.error);
