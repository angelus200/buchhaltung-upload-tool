// scripts/test-tenant-creation.cjs
// Testet: Tenant-DB erstellen, Schema migrieren, verifizieren, aufräumen

const mysql = require('mysql2/promise');
require('dotenv').config();

const TEST_DB_NAME = 'tenant_test_cleanup_me';

async function test() {
  const masterUrl = process.env.DATABASE_URL;
  const conn = await mysql.createConnection(masterUrl);

  console.log('═══════════════════════════════════════');
  console.log('  TENANT-CREATION TEST');
  console.log('═══════════════════════════════════════');

  // 1. Test-DB erstellen
  console.log('\n1. Erstelle Test-Datenbank...');
  await conn.execute(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
  await conn.execute(`CREATE DATABASE \`${TEST_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`   ✅ ${TEST_DB_NAME} erstellt`);

  // 2. Schema migrieren
  console.log('\n2. Migriere Schema...');
  const tenantUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1) + TEST_DB_NAME;
  const tenantConn = await mysql.createConnection(tenantUrl);

  const migration = require('./migrate-tenant-schema.cjs');
  await migration.migrate(tenantConn);
  console.log('   ✅ Schema migriert');

  // 3. Tabellen zählen
  console.log('\n3. Verifiziere Tabellen...');
  const [tables] = await tenantConn.execute('SHOW TABLES');
  const tableCount = tables.length;
  console.log(`   Tabellen in Tenant-DB: ${tableCount}`);

  // 4. Testdaten einfügen
  console.log('\n4. Teste Insert...');
  await tenantConn.execute(
    'INSERT INTO unternehmen (name, land, waehrung, kontenrahmen) VALUES (?, ?, ?, ?)',
    ['Test GmbH', 'DE', 'EUR', 'SKR04']
  );
  const [firms] = await tenantConn.execute('SELECT * FROM unternehmen');
  console.log(`   ✅ Test-Firma angelegt: ${firms[0].name} (ID ${firms[0].id})`);

  // 5. Aufräumen
  console.log('\n5. Räume auf...');
  await tenantConn.end();
  await conn.execute(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
  console.log(`   ✅ ${TEST_DB_NAME} gelöscht`);

  await conn.end();

  console.log('\n═══════════════════════════════════════');
  console.log(`  ERGEBNIS: ✅ ALLE TESTS BESTANDEN`);
  console.log(`  ${tableCount} Tabellen erfolgreich erstellt`);
  console.log('═══════════════════════════════════════');
}

test().catch(async e => {
  console.error('🔴 TEST FEHLGESCHLAGEN:', e.message);
  console.error(e.stack);

  // Aufräumen bei Fehler
  try {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    await conn.execute(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
    await conn.end();
    console.log(`🧹 Test-DB ${TEST_DB_NAME} aufgeräumt`);
  } catch {}

  process.exit(1);
});
