// scripts/generate-tenant-migration.cjs
// Generiert migrate-tenant-schema.cjs aus der aktuellen Prod-DB
// Exportiert alle CREATE TABLE Statements für Tenant-DBs

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function generate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const [tables] = await conn.execute('SHOW TABLES');
  const dbName = process.env.DATABASE_URL.split('/').pop().split('?')[0];
  const tableKey = `Tables_in_${dbName}`;

  // Tabellen die NUR in der Master-DB existieren — NICHT in Tenant-DBs
  const skipTables = ['tenants', 'api_keys', 'users'];

  const createStatements = [];

  for (const row of tables) {
    const tableName = row[tableKey];
    if (skipTables.includes(tableName)) {
      console.log(`⏭️  Skip: ${tableName} (Master-DB only)`);
      continue;
    }

    const [createResult] = await conn.execute(`SHOW CREATE TABLE \`${tableName}\``);
    let createSQL = createResult[0]['Create Table'];

    // AUTO_INCREMENT Wert entfernen (soll bei 1 starten in neuer DB)
    createSQL = createSQL.replace(/AUTO_INCREMENT=\d+\s*/g, '');

    // IF NOT EXISTS ergänzen für Idempotenz
    createSQL = createSQL.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS');

    createStatements.push({ name: tableName, sql: createSQL });
    console.log(`✅ ${tableName}`);
  }

  // Migration-Datei schreiben
  const migrationCode = `// scripts/migrate-tenant-schema.cjs
// AUTO-GENERIERT am ${new Date().toISOString()}
// Erstellt alle Business-Tabellen in einer Tenant-Datenbank
// NICHT MANUELL BEARBEITEN — neu generieren mit: node scripts/generate-tenant-migration.cjs

async function migrate(conn) {
  console.log('🟦 Starte Schema-Migration für Tenant-DB...');

  // FK-Checks deaktivieren damit Reihenfolge egal ist
  await conn.execute('SET FOREIGN_KEY_CHECKS=0');

${createStatements.map((t, i) => `  // Tabelle ${i + 1}/${createStatements.length}: ${t.name}
  await conn.execute(\`${t.sql.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`);`).join('\n\n')}

  // FK-Checks wieder aktivieren
  await conn.execute('SET FOREIGN_KEY_CHECKS=1');

  console.log('✅ Schema-Migration abgeschlossen: ${createStatements.length} Tabellen');
}

module.exports = { migrate };
`;

  const outputPath = path.join(__dirname, 'migrate-tenant-schema.cjs');
  fs.writeFileSync(outputPath, migrationCode);
  console.log(`\n✅ Migration-Script geschrieben: ${outputPath}`);
  console.log(`   ${createStatements.length} Tabellen (${skipTables.length} übersprungen)`);

  await conn.end();
}

generate().catch(e => {
  console.error('🔴 Fehler:', e.message);
  process.exit(1);
});
