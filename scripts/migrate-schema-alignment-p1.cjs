const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  try {
    const content = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    console.log('\n=== Schema-Alignment P1: finanzamt_nummer → finanzamtNummer ===\n');
    const [cols] = await conn.execute("SHOW COLUMNS FROM unternehmen LIKE 'finanzamt%'");
    console.log('Aktuelle Spalten:', cols.map(c => c.Field));
    
    const hasSnake = cols.some(c => c.Field === 'finanzamt_nummer');
    const hasCamel = cols.some(c => c.Field === 'finanzamtNummer');
    
    if (hasCamel) {
      console.log('✅ finanzamtNummer existiert bereits — kein Fix nötig');
    } else if (hasSnake) {
      await conn.execute("ALTER TABLE unternehmen CHANGE finanzamt_nummer finanzamtNummer VARCHAR(20) NULL");
      console.log('✅ finanzamt_nummer → finanzamtNummer umbenannt');
    } else {
      console.log('⚠️  Keine finanzamt* Spalte gefunden');
    }
    
    console.log('\n✅ Migration abgeschlossen!\n');
  } finally {
    await conn.end();
  }
}
migrate().catch(err => { console.error('❌', err.message); process.exit(1); });
