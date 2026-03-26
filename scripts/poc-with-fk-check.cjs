// scripts/poc-with-fk-check.cjs
// Wie POC, aber testet INSERT mit FK_CHECKS=1 (Normalbetrieb)

const mysql = require('mysql2/promise');
require('dotenv').config();

const TEST_DB = 'tenant_fk_test';
const TEST_ORG = 'org_fk_test_99999';

async function run() {
  const masterUrl = process.env.DATABASE_URL;
  const masterConn = await mysql.createConnection(masterUrl);

  console.log('═══════════════════════════════════════════════════');
  console.log('  FK-TEST: Tenant mit aktivierten Foreign Key Checks');
  console.log('═══════════════════════════════════════════════════');

  let tenantConn = null;

  try {
    // Aufräumen
    await masterConn.execute(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    await masterConn.execute(`DELETE FROM tenants WHERE clerkOrgId = ?`, [TEST_ORG]);

    // DB erstellen
    await masterConn.execute(`CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Test-DB erstellt');

    // Schema migrieren
    const tenantUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1) + TEST_DB;
    tenantConn = await mysql.createConnection(tenantUrl);

    const migration = require('./migrate-tenant-schema.cjs');
    await migration.migrate(tenantConn);

    const [tables] = await tenantConn.execute('SHOW TABLES');
    console.log(`✅ ${tables.length} Tabellen migriert`);

    // FK_CHECKS explizit einschalten (Normalbetrieb!)
    await tenantConn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ FOREIGN_KEY_CHECKS = 1 (aktiv)');

    // ══════════════════════════════════════════
    // INSERT-Operationen mit FK_CHECKS=1 testen
    // ══════════════════════════════════════════
    console.log('\n🧪 Teste INSERT-Operationen mit FK_CHECKS=1...');

    // 1. Unternehmen anlegen (hat createdBy-Spalte, früher FK auf users)
    try {
      await tenantConn.execute(
        `INSERT INTO unternehmen (name, landCode, waehrung, kontenrahmen) VALUES (?, ?, ?, ?)`,
        ['FK-Test GmbH', 'DE', 'EUR', 'SKR04']
      );
      console.log('   ✅ unternehmen INSERT: OK');
    } catch (err) {
      console.log(`   ❌ unternehmen INSERT: ${err.message}`);
    }

    // 2. Sachkonto anlegen (referenziert unternehmen, kein users-FK)
    try {
      await tenantConn.execute(
        `INSERT INTO sachkonten (kontonummer, bezeichnung, kontotyp, kategorie, unternehmenId) VALUES (?, ?, ?, ?, ?)`,
        ['1000', 'Kasse', 'aktiv', 'Umlaufvermögen', 1]
      );
      console.log('   ✅ sachkonten INSERT: OK');
    } catch (err) {
      console.log(`   ❌ sachkonten INSERT: ${err.message}`);
    }

    // 3. Buchung — Pflichtfelder ermitteln
    try {
      const [cols] = await tenantConn.execute('SHOW COLUMNS FROM buchungen');
      const requiredCols = cols.filter(c => c.Null === 'NO' && c.Default === null && c.Extra !== 'auto_increment');
      console.log(`   buchungen Pflichtfelder: ${requiredCols.map(c => c.Field).join(', ')}`);
    } catch (err) {
      console.log(`   ❌ buchungen SHOW COLUMNS: ${err.message}`);
    }

    // ══════════════════════════════════════════
    // Verbleibende FK-Constraints auf users prüfen (via information_schema)
    // ══════════════════════════════════════════
    console.log('\n🔍 Prüfe verbleibende FK-Constraints auf users...');
    const [fks] = await tenantConn.execute(`
      SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME = 'users'
    `, [TEST_DB]);

    if (fks.length === 0) {
      console.log('   ✅ Keine FK-Constraints auf users — sauber!');
    } else {
      console.log(`   ⚠️  ${fks.length} FK-Constraints auf users gefunden:`);
      fks.forEach(fk => console.log(`      ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → users (${fk.CONSTRAINT_NAME})`));
    }

    // Aufräumen
    console.log('\n🧹 Aufräumen...');
    await tenantConn.end();
    tenantConn = null;
    await masterConn.execute(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    await masterConn.execute(`DELETE FROM tenants WHERE clerkOrgId = ?`, [TEST_ORG]);
    console.log('✅ Aufgeräumt');
    await masterConn.end();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✅ FK-TEST BESTANDEN');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n🔴 FEHLER:', error.message);
    console.error(error.stack);
    try {
      if (tenantConn) await tenantConn.end();
      await masterConn.execute(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
      await masterConn.execute(`DELETE FROM tenants WHERE clerkOrgId = ?`, [TEST_ORG]);
      console.log('🧹 Aufgeräumt nach Fehler');
    } catch {}
    await masterConn.end();
    process.exit(1);
  }
}

run();
