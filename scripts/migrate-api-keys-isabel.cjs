// Migration: API-Keys für Isabels 4 Firmen generieren
// Manus Agent — alle Keys auf einmal, übersichtliche Ausgabe am Ende

const mysql = require('mysql2/promise');
const crypto = require('crypto');

const FIRMEN = [
  { unternehmenId: 2, name: 'Manus Agent - CH1 (commercehelden)' },
  { unternehmenId: 3, name: 'Manus Agent - CH2 (Emo Retail)' },
  { unternehmenId: 4, name: 'Manus Agent - TM (Trademark24-7)' },
  { unternehmenId: 5, name: 'Manus Agent - MP (Marketplace24-7)' },
];

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const ergebnisse = [];

  for (const firma of FIRMEN) {
    const rawKey = 'bk_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 8);

    try {
      await conn.query(
        'INSERT INTO api_keys (keyHash, keyPrefix, unternehmenId, name) VALUES (?, ?, ?, ?)',
        [keyHash, keyPrefix, firma.unternehmenId, firma.name]
      );
      ergebnisse.push({ ...firma, rawKey, keyPrefix, status: 'neu' });
      console.log(`✅ Key erstellt: ${firma.name}`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`– Key existiert bereits: ${firma.name}`);
        ergebnisse.push({ ...firma, rawKey: null, keyPrefix, status: 'existiert' });
      } else {
        throw err;
      }
    }
  }

  await conn.end();

  // Übersichtliche Ausgabe aller neuen Keys
  const neueKeys = ergebnisse.filter(e => e.status === 'neu');
  if (neueKeys.length === 0) {
    console.log('\n– Alle Keys existierten bereits, keine neuen Keys generiert.');
    return;
  }

  console.log('\n');
  console.log('   ╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('   ║         API-KEYS — NUR JETZT SICHTBAR — SICHER AUFBEWAHREN!!           ║');
  console.log('   ╠══════════════════════════════════════════════════════════════════════════╣');
  for (const e of neueKeys) {
    console.log(`   ║  ${e.name}`);
    console.log(`   ║  unternehmenId: ${e.unternehmenId}`);
    console.log(`   ║  Key: ${e.rawKey}`);
    console.log('   ╠══════════════════════════════════════════════════════════════════════════╣');
  }
  console.log('   ╚══════════════════════════════════════════════════════════════════════════╝');
  console.log('');
}

migrate().catch(err => { console.error('❌', err); process.exit(1); });
