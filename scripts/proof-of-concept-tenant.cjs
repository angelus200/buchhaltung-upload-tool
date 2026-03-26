// scripts/proof-of-concept-tenant.cjs
// End-to-End Proof of Concept: Tenant erstellen → Daten einfügen → Isolation prüfen → aufräumen
// KEIN git commit nötig — nur zum Testen

const mysql = require('mysql2/promise');
require('dotenv').config();

const TEST_TENANT_DB = 'tenant_poc_test';
const TEST_CLERK_ORG = 'org_poc_test_12345';

async function run() {
  const masterUrl = process.env.DATABASE_URL;
  if (!masterUrl) throw new Error('DATABASE_URL nicht gesetzt');

  const masterConn = await mysql.createConnection(masterUrl);

  console.log('═══════════════════════════════════════════════════');
  console.log('  PROOF OF CONCEPT: SaaS Tenant-Isolation');
  console.log('═══════════════════════════════════════════════════');

  let tenantConn = null;

  try {
    // ══════════════════════════════════════════
    // PHASE 1: Tenant-Datenbank erstellen
    // ══════════════════════════════════════════
    console.log('\n🟦 PHASE 1: Tenant-Datenbank erstellen');

    // Aufräumen falls von vorherigem Test übrig
    await masterConn.execute(`DROP DATABASE IF EXISTS \`${TEST_TENANT_DB}\``);
    await masterConn.execute(`DELETE FROM tenants WHERE clerkOrgId = ?`, [TEST_CLERK_ORG]);

    // Neue DB erstellen
    await masterConn.execute(
      `CREATE DATABASE \`${TEST_TENANT_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`   ✅ Datenbank ${TEST_TENANT_DB} erstellt`);

    // ══════════════════════════════════════════
    // PHASE 2: Schema migrieren (51 Tabellen)
    // ══════════════════════════════════════════
    console.log('\n🟦 PHASE 2: Schema migrieren');

    const tenantUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1) + TEST_TENANT_DB;
    tenantConn = await mysql.createConnection(tenantUrl);

    const migration = require('./migrate-tenant-schema.cjs');
    await migration.migrate(tenantConn);

    const [tables] = await tenantConn.execute('SHOW TABLES');
    console.log(`   ✅ ${tables.length} Tabellen migriert`);

    // ══════════════════════════════════════════
    // PHASE 3: Tenant in Master-DB registrieren
    // ══════════════════════════════════════════
    console.log('\n🟦 PHASE 3: Tenant in Master-DB registrieren');

    await masterConn.execute(
      `INSERT INTO tenants (clerkOrgId, name, databaseName, plan, planStatus, maxFirmen, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [TEST_CLERK_ORG, 'POC Test Firma', TEST_TENANT_DB, 'business', 'trial', 5, true]
    );

    const [tenantRows] = await masterConn.execute(
      'SELECT * FROM tenants WHERE clerkOrgId = ?',
      [TEST_CLERK_ORG]
    );
    const tenant = tenantRows[0];
    console.log(`   ✅ Tenant registriert: ID ${tenant.id}, Plan: ${tenant.plan}, Status: ${tenant.planStatus}`);

    // ══════════════════════════════════════════
    // PHASE 4: Testdaten in Tenant-DB einfügen
    // ══════════════════════════════════════════
    console.log('\n🟦 PHASE 4: Testdaten in Tenant-DB einfügen');

    // landCode (ENUM: DE/AT/CH/UK/CY) statt land (varchar)
    await tenantConn.execute(
      `INSERT INTO unternehmen (name, landCode, waehrung, kontenrahmen) VALUES (?, ?, ?, ?)`,
      ['POC Steuerberater Schmidt GmbH', 'DE', 'EUR', 'SKR04']
    );

    const [tenantFirmen] = await tenantConn.execute('SELECT id, name FROM unternehmen');
    console.log(`   ✅ Firma in Tenant-DB: "${tenantFirmen[0].name}" (ID ${tenantFirmen[0].id})`);

    // ══════════════════════════════════════════
    // PHASE 5: ISOLATION PRÜFEN (kritisch!)
    // ══════════════════════════════════════════
    console.log('\n🟦 PHASE 5: Datenisolation prüfen');

    // Master-DB: Firmen
    let masterFirmen = [];
    try {
      const [rows] = await masterConn.execute('SELECT id, name FROM unternehmen');
      masterFirmen = rows;
    } catch {
      console.log('   ℹ️  Master-DB hat keine unternehmen-Tabelle (erwartet für reine Master-DBs)');
    }

    console.log(`   Master-DB: ${masterFirmen.length} Firma(en)`);
    masterFirmen.forEach(f => console.log(`     - ID ${f.id}: ${f.name}`));

    // Tenant-DB: Firmen
    const [tenantFirmenCheck] = await tenantConn.execute('SELECT id, name FROM unternehmen');
    console.log(`   Tenant-DB: ${tenantFirmenCheck.length} Firma(en)`);
    tenantFirmenCheck.forEach(f => console.log(`     - ID ${f.id}: ${f.name}`));

    // Isolations-Check: POC-Daten dürfen nicht in Master-DB auftauchen
    const masterHasPOC = masterFirmen.some(f => f.name.includes('POC'));
    const tenantHasMasterData = tenantFirmenCheck.some(f => !f.name.includes('POC'));

    if (!masterHasPOC && !tenantHasMasterData) {
      console.log('   ✅ ISOLATION BESTÄTIGT: Keine Daten-Überschneidung!');
    } else {
      console.log('   ❌ ISOLATION VERLETZT!');
      if (masterHasPOC) console.log('      Master-DB enthält POC-Daten!');
      if (tenantHasMasterData) console.log('      Tenant-DB enthält Master-Daten!');
      throw new Error('Datenisolation verletzt — Test fehlgeschlagen');
    }

    // ══════════════════════════════════════════
    // PHASE 6: Schema-Vollständigkeit prüfen
    // ══════════════════════════════════════════
    console.log('\n🟦 PHASE 6: Schema-Vollständigkeit prüfen');

    // users ist Master-DB-Tabelle (Clerk-Auth ist global) — nicht in Tenant-DB
    const criticalTables = [
      'unternehmen',
      'buchungen',
      'sachkonten',
      'kreditoren',
      'debitoren',
      'belege',
      'finanzkonten',
      'bankkonten',
      'aufgaben',
    ];

    let allOk = true;
    for (const table of criticalTables) {
      try {
        const [result] = await tenantConn.execute(
          `SELECT COUNT(*) as cnt FROM \`${table}\``
        );
        console.log(`   ✅ ${table}: OK (${result[0].cnt} Einträge)`);
      } catch (err) {
        console.log(`   ❌ ${table}: FEHLER — ${err.message}`);
        allOk = false;
      }
    }

    if (!allOk) {
      throw new Error('Mindestens eine kritische Tabelle fehlt oder ist kaputt');
    }

    // ══════════════════════════════════════════
    // PHASE 7: Aufräumen
    // ══════════════════════════════════════════
    console.log('\n🟦 PHASE 7: Aufräumen');

    await tenantConn.end();
    tenantConn = null;

    await masterConn.execute(`DROP DATABASE IF EXISTS \`${TEST_TENANT_DB}\``);
    await masterConn.execute(`DELETE FROM tenants WHERE clerkOrgId = ?`, [TEST_CLERK_ORG]);
    console.log(`   ✅ ${TEST_TENANT_DB} gelöscht`);
    console.log('   ✅ Tenant-Eintrag aus Master-DB entfernt');

    await masterConn.end();

    // ══════════════════════════════════════════
    // ERGEBNIS
    // ══════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✅ PROOF OF CONCEPT ERFOLGREICH');
    console.log('  • Tenant-DB erstellt und Schema migriert');
    console.log('  • Tenant in Master-DB registriert');
    console.log('  • Testdaten eingefügt');
    console.log('  • Datenisolation bestätigt');
    console.log('  • Aufgeräumt');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n🔴 FEHLER:', error.message);
    console.error(error.stack);

    // Aufräumen bei Fehler
    try {
      if (tenantConn) await tenantConn.end();
      await masterConn.execute(`DROP DATABASE IF EXISTS \`${TEST_TENANT_DB}\``);
      await masterConn.execute(`DELETE FROM tenants WHERE clerkOrgId = ?`, [TEST_CLERK_ORG]);
      console.log('🧹 Aufgeräumt nach Fehler');
    } catch (cleanupErr) {
      console.error('🧹 Aufräumen fehlgeschlagen:', cleanupErr.message);
    }

    await masterConn.end();
    process.exit(1);
  }
}

run();
