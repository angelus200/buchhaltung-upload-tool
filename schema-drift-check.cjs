const mysql = require('mysql2/promise');
const fs = require('fs');

const TABLES_IN_DRIZZLE = [
  'users',
  'unternehmen',
  'user_unternehmen',
  'kreditoren',
  'debitoren',
  'anlagevermoegen',
  'beteiligungen',
  'gesellschafter',
  'bankkonten',
  'kostenstellen',
  'vertraege',
  'buchungen',
  'notizen',
  'aktivitaetsprotokoll',
  'berechtigungen',
  'einladungen',
  'sachkonten',
  'finanzamt_dokumente',
  'aufgaben',
  'fa_dok_versionen',
  'stb_uebergaben',
  'stb_ueb_pos',
  'stb_rechnungen',
  'stb_rech_pos',
  'buchungsvorlagen',
  'kontierungsregeln',
  'monatsabschluss',
  'monatsabschluss_items',
  'artikel',
  'lagerorte',
  'lagerbestaende',
  'bestandsbewegungen',
  'inventuren',
  'inventurpositionen',
  'eroeffnungsbilanz',
  'belege',
  'finanzkonten',
  'auszuege',
  'auszug_positionen',
  'subscriptions',
  'onboarding_orders'
];

async function main() {
  const conn = await mysql.createConnection({
    host: 'metro.proxy.rlwy.net',
    port: 55757,
    user: 'root',
    password: 'TAEHGznuWgeXvPzAavbveUaAobHQoQTG',
    database: 'railway'
  });

  console.log('=== SCHEMA-DRIFT VOLLSTÄNDIGE ANALYSE ===\n');
  console.log(`Prüfe ${TABLES_IN_DRIZZLE.length} Tabellen...\n`);

  const results = {
    total: TABLES_IN_DRIZZLE.length,
    exists: 0,
    missing: 0,
    missingTables: []
  };

  const output = [];

  for (const tableName of TABLES_IN_DRIZZLE) {
    try {
      const [rows] = await conn.execute(`DESCRIBE ${tableName}`);
      results.exists++;

      output.push(`\n=== ${tableName.toUpperCase()} ===`);
      output.push(`Spalten: ${rows.length}`);

      // Show all columns with types
      const columns = rows.map(r => `  - ${r.Field}: ${r.Type}${r.Null === 'NO' ? ' NOT NULL' : ''}${r.Default ? ` DEFAULT ${r.Default}` : ''}`);
      output.push(columns.join('\n'));

    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        results.missing++;
        results.missingTables.push(tableName);
        output.push(`\n=== ${tableName.toUpperCase()} ===`);
        output.push('🔴 TABELLE FEHLT IN MYSQL');
      } else {
        output.push(`\n=== ${tableName.toUpperCase()} ===`);
        output.push(`❌ FEHLER: ${err.message}`);
      }
    }
  }

  await conn.end();

  // Summary
  console.log('ZUSAMMENFASSUNG');
  console.log('===============');
  console.log(`Tabellen geprüft: ${results.total}`);
  console.log(`Tabellen existieren: ${results.exists}`);
  console.log(`Tabellen fehlen: ${results.missing}`);

  if (results.missing > 0) {
    console.log('\n🔴 FEHLENDE TABELLEN:');
    results.missingTables.forEach(t => console.log(`  - ${t}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nDETAILLIERTE AUSGABE:\n');
  console.log(output.join('\n'));

  // Write to file
  fs.writeFileSync('/Users/thomasgross/Desktop/buchhaltung-upload-tool/schema-drift-report.txt',
    `SCHEMA-DRIFT REPORT\nGeneriert: ${new Date().toISOString()}\n\n` +
    `Tabellen geprüft: ${results.total}\n` +
    `Tabellen existieren: ${results.exists}\n` +
    `Tabellen fehlen: ${results.missing}\n\n` +
    (results.missing > 0 ? `FEHLENDE TABELLEN:\n${results.missingTables.map(t => `- ${t}`).join('\n')}\n\n` : '') +
    '='.repeat(60) + '\n\n' +
    output.join('\n')
  );

  console.log('\n✅ Report gespeichert: schema-drift-report.txt');
}

main().catch(console.error);
