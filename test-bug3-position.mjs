import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('\n=== BUG 3 TEST: STB-Position Verifizierung ===');
console.log('ANLEITUNG:');
console.log('1. Öffne die App: https://www.buchhaltung-ki.app');
console.log('2. Gehe zu Steuerberater → Rechnungen');
console.log('3. Wähle eine Rechnung aus');
console.log('4. Füge eine NEUE Position hinzu:');
console.log('   - Beschreibung: TEST BUG 3 POSITION');
console.log('   - Kategorie: buchhaltung');
console.log('   - Einzelpreis: 99.99');
console.log('5. Speichere die Position');
console.log('6. PRÜFE: Wird die Position angezeigt?');
console.log('7. Führe DANACH dieses Script aus\n');
console.log('Drücke ENTER wenn du die Position hinzugefügt hast...');

// Warte auf ENTER (in Node.js)
await new Promise(resolve => {
  process.stdin.once('data', resolve);
});

console.log('\n=== PRÜFUNG: Neue Position in DB? ===');

const [positionen] = await connection.execute(
  `SELECT id, rechnungId, beschreibung, einzelpreis, gesamtpreis, createdAt
   FROM stb_rech_pos
   WHERE beschreibung LIKE '%TEST BUG 3%'
   ORDER BY id DESC
   LIMIT 5`
);

if (positionen.length > 0) {
  console.log(`✅ POSITION IN DB GEFUNDEN! (${positionen.length} Treffer)`);
  console.table(positionen.map(p => ({
    id: p.id,
    rechnungId: p.rechnungId,
    beschreibung: p.beschreibung.substring(0, 30),
    einzelpreis: p.einzelpreis,
    erstellt: new Date(p.createdAt).toISOString()
  })));

  console.log('\n🔍 ROOT CAUSE: Position ist in DB → FRONTEND-PROBLEM');
  console.log('Mögliche Ursachen:');
  console.log('- Cache wird nicht invalidiert');
  console.log('- Dialog schließt sich zu früh (Race Condition)');
  console.log('- Positionen werden von falschem Endpunkt geladen');
  console.log('- Render-Filter versteckt neue Positionen');

} else {
  console.log('❌ POSITION NICHT IN DB!');
  console.log('\n🔍 ROOT CAUSE: Position ist NICHT in DB → BACKEND-PROBLEM');
  console.log('Mögliche Ursachen:');
  console.log('- Mutation schlägt fehl (Error wird nicht angezeigt)');
  console.log('- Validation schlägt fehl');
  console.log('- Transaction wird nicht committed');
}

console.log('\n=== ALLE POSITIONEN DER LETZTEN STUNDE ===');
const [recent] = await connection.execute(
  `SELECT id, rechnungId, beschreibung, einzelpreis, createdAt
   FROM stb_rech_pos
   WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
   ORDER BY id DESC
   LIMIT 10`
);
console.log(`Gefunden: ${recent.length}`);
if (recent.length > 0) {
  console.table(recent);
}

await connection.end();
