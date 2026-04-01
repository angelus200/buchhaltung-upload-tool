// scripts/migrate-crm-leads.cjs
// CRM Sprint A: leads-Tabelle in Master-DB

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('🟦 Verbunden mit Master-DB');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      -- Kontaktdaten
      firmenName VARCHAR(255) NOT NULL,
      ansprechpartner VARCHAR(255) NULL,
      email VARCHAR(255) NOT NULL,
      telefon VARCHAR(50) NULL,
      webseite VARCHAR(255) NULL,
      -- Firmendaten
      land ENUM('DE', 'AT', 'CH') NOT NULL DEFAULT 'DE',
      branche VARCHAR(100) NULL,
      firmenGroesse ENUM('1-5', '6-20', '21-50', '51-200', '200+') NULL,
      -- CRM-Felder
      quelle ENUM('landing_page', 'empfehlung', 'steuerberater', 'manuell', 'api', 'marketing') NOT NULL DEFAULT 'landing_page',
      status ENUM('neu', 'kontaktiert', 'demo_geplant', 'demo_durchgefuehrt', 'angebot_gesendet', 'gewonnen', 'verloren') NOT NULL DEFAULT 'neu',
      interessiertAnPlan ENUM('starter', 'business', 'individuell') NULL,
      -- Notizen
      notizen TEXT NULL,
      naechsteAktion VARCHAR(255) NULL,
      naechsteAktionDatum DATE NULL,
      -- Konversion
      konvertiertAmDatum DATETIME NULL,
      konvertiertZuTenantId INT NULL,
      -- Meta
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      -- Indizes
      INDEX idx_leads_status (status),
      INDEX idx_leads_email (email),
      INDEX idx_leads_land (land),
      INDEX idx_leads_created (createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ leads-Tabelle erstellt (oder existiert bereits)');

  // Verifikation
  const [cols] = await conn.execute('SHOW COLUMNS FROM leads');
  console.log('Spalten:', cols.map(c => `${c.Field} (${c.Type})`).join(', '));

  const [count] = await conn.execute('SELECT COUNT(*) as cnt FROM leads');
  console.log('Bestehende Leads:', count[0].cnt);

  await conn.end();
  console.log('🟦 Migration abgeschlossen');
}

migrate().catch(e => {
  console.error('🔴 Migration fehlgeschlagen:', e.message);
  process.exit(1);
});
