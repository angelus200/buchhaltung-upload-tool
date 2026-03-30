#!/usr/bin/env node
// scripts/add-storno-fields.cjs
// Migration: Gutschrift-Workflow – Storno-Felder für buchungen + belege
// Stand: 30.03.2026
//
// Ausführung: node scripts/add-storno-fields.cjs
// Voraussetzung: DATABASE_URL in .env oder Umgebungsvariable gesetzt

'use strict';

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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
    console.log('\n=== Migration: add-storno-fields ===\n');

    // ── buchungen: Storno-Felder ─────────────────────────────────────────────

    const buchungenColumns = [
      {
        name: 'stornoVonId',
        sql: "ALTER TABLE buchungen ADD COLUMN stornoVonId INT NULL COMMENT 'FK auf original buchung.id bei Stornobuchungen'",
      },
      {
        name: 'istStorniert',
        sql: "ALTER TABLE buchungen ADD COLUMN istStorniert TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = diese Buchung wurde storniert'",
      },
      {
        name: 'stornoDatum',
        sql: "ALTER TABLE buchungen ADD COLUMN stornoDatum DATE NULL COMMENT 'Datum des Stornos'",
      },
      {
        name: 'stornoGrund',
        sql: "ALTER TABLE buchungen ADD COLUMN stornoGrund VARCHAR(500) NULL COMMENT 'Optionaler Stornogrund / Kommentar'",
      },
    ];

    for (const col of buchungenColumns) {
      try {
        await db.query(col.sql);
        console.log(`  ✅ buchungen.${col.name} hinzugefügt`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  – buchungen.${col.name} existiert bereits, übersprungen`);
        } else {
          throw err;
        }
      }
    }

    // ── belege: Gutschrift-Typ ───────────────────────────────────────────────

    const belegeColumns = [
      {
        name: 'belegTyp',
        sql: "ALTER TABLE belege ADD COLUMN belegTyp ENUM('rechnung','gutschrift','sonstiges') NOT NULL DEFAULT 'rechnung' COMMENT 'Typ des Belegs'",
      },
      {
        name: 'referenzBelegId',
        sql: "ALTER TABLE belege ADD COLUMN referenzBelegId INT NULL COMMENT 'FK auf original belege.id bei Gutschriften'",
      },
    ];

    for (const col of belegeColumns) {
      try {
        await db.query(col.sql);
        console.log(`  ✅ belege.${col.name} hinzugefügt`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  – belege.${col.name} existiert bereits, übersprungen`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Migration abgeschlossen\n');
  } catch (err) {
    console.error('\n❌ Migration fehlgeschlagen:', err);
    throw err;
  } finally {
    await db.end();
  }
}

migrate().catch(() => process.exit(1));
