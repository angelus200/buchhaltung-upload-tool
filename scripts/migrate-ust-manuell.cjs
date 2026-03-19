// Migration: ustBetragManuell zur vertraege-Tabelle hinzufügen
// Für Mietverträge mit gemischten USt-Sätzen (19%/7%/0%)

const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await conn.query("ALTER TABLE vertraege ADD COLUMN ustBetragManuell VARCHAR(20) NULL");
    console.log('✅ ustBetragManuell hinzugefügt');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('– Spalte existiert bereits, kein Handlungsbedarf');
    } else {
      throw err;
    }
  }
  await conn.end();
}

migrate().catch((err) => {
  console.error('❌ Migration fehlgeschlagen:', err);
  process.exit(1);
});
