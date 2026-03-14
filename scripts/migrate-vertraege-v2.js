#!/usr/bin/env node
// scripts/migrate-vertraege-v2.js
// Migration: Verträge v2 – Netto/USt/Brutto Felder + erweiterte Vertragsarten
//
// Ausführung: node scripts/migrate-vertraege-v2.js
// Voraussetzung: DATABASE_URL in .env oder Umgebungsvariable gesetzt

'use strict';

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// .env manuell laden
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env nicht gefunden – DATABASE_URL muss bereits gesetzt sein */ }
}

loadEnv();

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Fehler: DATABASE_URL nicht gesetzt');
    process.exit(1);
  }

  console.log('Verbinde mit Datenbank...');
  const db = await mysql.createConnection(url);

  try {
    console.log('\n=== Migration: Verträge v2 ===\n');

    // ── 1. Neue Spalten hinzufügen ──────────────────────────────────────────
    const newColumns = [
      {
        name: 'nettoBetrag',
        sql: "ALTER TABLE vertraege ADD COLUMN nettoBetrag DECIMAL(15,2) NULL AFTER monatlicheBetrag",
      },
      {
        name: 'ustSatz',
        sql: "ALTER TABLE vertraege ADD COLUMN ustSatz DECIMAL(5,2) NULL DEFAULT 0 AFTER nettoBetrag",
      },
      {
        name: 'ustBetrag',
        sql: "ALTER TABLE vertraege ADD COLUMN ustBetrag DECIMAL(15,2) NULL AFTER ustSatz",
      },
      {
        name: 'belegUrl',
        sql: "ALTER TABLE vertraege ADD COLUMN belegUrl VARCHAR(500) NULL AFTER notizen",
      },
      {
        name: 'gegenkontoNr',
        sql: "ALTER TABLE vertraege ADD COLUMN gegenkontoNr VARCHAR(20) NULL AFTER buchungskonto",
      },
    ];

    for (const col of newColumns) {
      try {
        await db.query(col.sql);
        console.log(`  ✅ Spalte '${col.name}' hinzugefügt`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  – Spalte '${col.name}' existiert bereits, übersprungen`);
        } else {
          throw err;
        }
      }
    }

    // ── 2. vertragsart ENUM erweitern ───────────────────────────────────────
    // MySQL: MODIFY COLUMN benötigt die komplette neue ENUM-Definition
    try {
      await db.query(`
        ALTER TABLE vertraege
        MODIFY COLUMN vertragsart
          ENUM(
            'miete',
            'leasing',
            'wartung',
            'versicherung',
            'abo',
            'darlehen',
            'pacht',
            'lizenz',
            'dienstleistung',
            'sonstig'
          )
          DEFAULT 'sonstig'
      `);
      console.log('  ✅ vertragsart ENUM um darlehen/pacht/lizenz/dienstleistung erweitert');
    } catch (err) {
      console.warn('  ! vertragsart ENUM konnte nicht geändert werden:', err.message);
    }

    // ── 3. Hinweis zu Bestandsdaten ─────────────────────────────────────────
    console.log('  – Bestehende Verträge: nettoBetrag/ustBetrag bleiben NULL');
    console.log('    (monatlicheBetrag wird weiterhin als Bruttobetrag verwendet)');

    console.log('\n✅ Migration erfolgreich abgeschlossen!\n');
    console.log('Nächste Schritte:');
    console.log('  1. Server deployen (Railway)');
    console.log('  2. Bestehende Verträge in Stammdaten → Verträge mit Netto/USt ergänzen');
  } finally {
    await db.end();
  }
}

migrate().catch((err) => {
  console.error('\n❌ Migration fehlgeschlagen:', err.message);
  process.exit(1);
});
