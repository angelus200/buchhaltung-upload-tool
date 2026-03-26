// scripts/create-real-tenant.cjs
// Erstellt einen ECHTEN Tenant — wird NICHT aufgeräumt
// USAGE: Erst CLERK_ORG_ID unten eintragen, dann: node scripts/create-real-tenant.cjs

const mysql = require('mysql2/promise');
require('dotenv').config();

// ══════════════════════════════════════════
// HIER die Clerk org-ID von Thomas eintragen:
const CLERK_ORG_ID = 'org_3BUlooyvkpVxjQ7ZBhmdDh4Ez6W'; // officeangelus.group (Admin)
const TENANT_NAME = 'Test-Tenant Demo';
const TENANT_DB = 'tenant_demo';
const PLAN = 'business';
// ══════════════════════════════════════════

async function run() {
  if (CLERK_ORG_ID === 'PLACEHOLDER_ORG_ID') {
    console.error('🔴 CLERK_ORG_ID ist noch ein Platzhalter!');
    console.error('   Trage die echte Clerk org-ID in das Script ein (Format: org_xxxxx)');
    process.exit(1);
  }

  const masterUrl = process.env.DATABASE_URL;
  const masterConn = await mysql.createConnection(masterUrl);

  console.log('═══════════════════════════════════════════════════');
  console.log('  ECHTEN TENANT ERSTELLEN');
  console.log(`  Name: ${TENANT_NAME}`);
  console.log(`  DB:   ${TENANT_DB}`);
  console.log(`  Org:  ${CLERK_ORG_ID}`);
  console.log('═══════════════════════════════════════════════════');

  let tenantConn = null;

  try {
    // Prüfen ob bereits existiert
    const [existing] = await masterConn.execute(
      'SELECT * FROM tenants WHERE clerkOrgId = ? OR databaseName = ?',
      [CLERK_ORG_ID, TENANT_DB]
    );
    if (existing.length > 0) {
      console.log('⚠️  Tenant existiert bereits:');
      console.log(`   ID ${existing[0].id}: ${existing[0].name} (${existing[0].databaseName})`);
      console.log('   Abbruch. Zum Neuanlegen erst manuell löschen.');
      await masterConn.end();
      return;
    }

    // 1. Datenbank erstellen
    console.log('\n1. Erstelle Datenbank...');
    await masterConn.execute(
      `CREATE DATABASE \`${TENANT_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`   ✅ ${TENANT_DB} erstellt`);

    // 2. Schema migrieren
    console.log('\n2. Migriere Schema...');
    const tenantUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1) + TENANT_DB;
    tenantConn = await mysql.createConnection(tenantUrl);

    const migration = require('./migrate-tenant-schema.cjs');
    await migration.migrate(tenantConn);

    const [tables] = await tenantConn.execute('SHOW TABLES');
    console.log(`   ✅ ${tables.length} Tabellen migriert`);

    // FK-Checks einschalten für alle weiteren INSERTs
    await tenantConn.execute('SET FOREIGN_KEY_CHECKS = 1');

    // 3. Test-Unternehmen anlegen
    console.log('\n3. Lege Demo-Firma an...');
    await tenantConn.execute(
      `INSERT INTO unternehmen (name, landCode, waehrung, kontenrahmen) VALUES (?, ?, ?, ?)`,
      ['Demo Steuerberater Schmidt GmbH', 'DE', 'EUR', 'SKR04']
    );
    const [firma] = await tenantConn.execute('SELECT id, name FROM unternehmen LIMIT 1');
    console.log(`   ✅ "${firma[0].name}" (ID ${firma[0].id})`);

    // 4. Basis-Sachkonten (SKR04)
    console.log('\n4. Basis-Sachkonten (SKR04)...');
    const basisKonten = [
      ['1000', 'Kasse', 'aktiv', 'Umlaufvermögen'],
      ['1200', 'Bank', 'aktiv', 'Umlaufvermögen'],
      ['1400', 'Forderungen aus Lieferungen und Leistungen', 'aktiv', 'Umlaufvermögen'],
      ['3300', 'Verbindlichkeiten aus Lieferungen und Leistungen', 'passiv', 'Verbindlichkeiten'],
      ['4400', 'Erlöse 19% USt', 'ertrag', 'Erlöse'],
      ['6300', 'Sonstige betriebliche Aufwendungen', 'aufwand', 'Aufwendungen'],
    ];

    let sachkontenOk = 0;
    for (const [nr, bez, typ, kat] of basisKonten) {
      try {
        await tenantConn.execute(
          `INSERT INTO sachkonten (kontonummer, bezeichnung, kontotyp, kategorie, unternehmenId) VALUES (?, ?, ?, ?, ?)`,
          [nr, bez, typ, kat, firma[0].id]
        );
        sachkontenOk++;
      } catch (err) {
        console.log(`   ⚠️  Sachkonto ${nr} fehlgeschlagen: ${err.message}`);
      }
    }
    console.log(`   ✅ ${sachkontenOk}/${basisKonten.length} Sachkonten angelegt`);

    await tenantConn.end();
    tenantConn = null;

    // 5. In tenants-Tabelle registrieren
    console.log('\n5. Registriere in Master-DB (tenants-Tabelle)...');
    await masterConn.execute(
      `INSERT INTO tenants (clerkOrgId, name, databaseName, plan, planStatus, maxFirmen, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [CLERK_ORG_ID, TENANT_NAME, TENANT_DB, PLAN, 'trial', 5, true]
    );

    const [tenant] = await masterConn.execute('SELECT * FROM tenants WHERE clerkOrgId = ?', [CLERK_ORG_ID]);
    console.log(`   ✅ Tenant-ID: ${tenant[0].id}`);

    await masterConn.end();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✅ TENANT ERSTELLT UND BEREIT');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  DB:    ${TENANT_DB}`);
    console.log(`  Org:   ${CLERK_ORG_ID}`);
    console.log(`  Plan:  ${PLAN} (trial)`);
    console.log(`  Firma: Demo Steuerberater Schmidt GmbH`);
    console.log('');
    console.log('  NÄCHSTER SCHRITT:');
    console.log('  1. In Clerk: Deinen User der Organisation zuweisen (Admin)');
    console.log('  2. App öffnen: https://www.buchhaltung-ki.app');
    console.log('  3. In Clerk-Session zur Organisation wechseln');
    console.log('  4. Erwartung: NUR "Demo Steuerberater Schmidt GmbH" sichtbar');
    console.log('     (nicht die 8 Angelus-Firmen aus der Master-DB)');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n🔴 FEHLER:', error.message);
    console.error(error.stack);
    // NICHT aufräumen — Zustand sichtbar lassen für Debugging
    if (tenantConn) await tenantConn.end();
    await masterConn.end();
    process.exit(1);
  }
}

run();
