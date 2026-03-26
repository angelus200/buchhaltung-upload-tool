// scripts/migrate-saas-tenants.cjs
// SaaS Sprint 1: tenants-Tabelle in Master-DB anlegen

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('🟦 Verbunden mit Master-DB');

  // tenants-Tabelle erstellen (idempotent)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      clerkOrgId VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      databaseName VARCHAR(100) NOT NULL UNIQUE,
      stripeCustId VARCHAR(255) NULL,
      stripeSubId VARCHAR(255) NULL,
      plan ENUM('starter', 'business', 'enterprise', 'unlimited') NOT NULL DEFAULT 'starter',
      planStatus ENUM('trial', 'active', 'past_due', 'cancelled') NOT NULL DEFAULT 'trial',
      maxFirmen INT NOT NULL DEFAULT 1,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ tenants-Tabelle erstellt (oder existiert bereits)');

  // Verifikation
  const [cols] = await conn.execute('SHOW COLUMNS FROM tenants');
  console.log('Spalten:', cols.map(c => `${c.Field} (${c.Type})`).join(', '));

  const [count] = await conn.execute('SELECT COUNT(*) as cnt FROM tenants');
  console.log('Bestehende Tenants:', count[0].cnt);

  await conn.end();
  console.log('🟦 Migration abgeschlossen');
}

migrate().catch(e => {
  console.error('🔴 Migration fehlgeschlagen:', e.message);
  process.exit(1);
});
