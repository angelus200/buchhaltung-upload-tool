// Migration: api_keys Tabelle erstellen + ersten Key für ALP generieren
// Manus Agent Infrastruktur — Auth über X-API-Key Header

const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        keyHash VARCHAR(64) NOT NULL,
        keyPrefix VARCHAR(8) NOT NULL,
        unternehmenId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        lastUsedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        UNIQUE KEY idx_keyHash (keyHash),
        KEY idx_unternehmenId (unternehmenId)
      )
    `);
    console.log('✅ api_keys Tabelle erstellt');
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('– Tabelle existiert bereits');
    } else throw err;
  }

  // Ersten API-Key für ALP (unternehmenId=6) generieren (Isabel/Manus)
  const rawKey = 'bk_' + crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 8);

  try {
    await conn.query(
      'INSERT INTO api_keys (keyHash, keyPrefix, unternehmenId, name) VALUES (?, ?, ?, ?)',
      [keyHash, keyPrefix, 6, 'Manus Agent - ALP']
    );
    console.log('✅ API-Key erstellt für ALP (unternehmenId=6):');
    console.log('');
    console.log('   ╔══════════════════════════════════════════════════════════╗');
    console.log('   ║  API-KEY (NUR JETZT SICHTBAR — SICHER AUFBEWAHREN!!)   ║');
    console.log('   ╠══════════════════════════════════════════════════════════╣');
    console.log(`   ║  ${rawKey}`);
    console.log('   ╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('   Prefix:', keyPrefix);
    console.log('   Hash (in DB):', keyHash);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('– Key existiert bereits');
    } else throw err;
  }

  await conn.end();
}

migrate().catch(err => { console.error('❌', err); process.exit(1); });
