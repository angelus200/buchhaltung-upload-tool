#!/usr/bin/env node
import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = "mysql://root:TAEHGznuWgeXvPzAavbveUaAobHQoQTG@metro.proxy.rlwy.net:55757/railway";

async function runMigration() {
  console.log('🚀 Starte Datenbank-Migration...\n');

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // SQL-Datei einlesen
    const sql = fs.readFileSync('migration-auszuege.sql', 'utf8');

    // Entferne Kommentare und teile bei CREATE/CREATE INDEX
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Teile bei CREATE TABLE und CREATE INDEX, aber behalte das Statement zusammen
    const statements = [];
    let currentStatement = '';
    let inStatement = false;

    for (const line of cleanSql.split('\n')) {
      if (line.trim().startsWith('CREATE TABLE') || line.trim().startsWith('CREATE INDEX')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = line + '\n';
        inStatement = true;
      } else if (inStatement) {
        currentStatement += line + '\n';
        if (line.includes(';')) {
          statements.push(currentStatement.trim().replace(/;$/, ''));
          currentStatement = '';
          inStatement = false;
        }
      }
    }

    console.log(`📝 Führe ${statements.length} SQL-Befehle aus...\n`);

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE.*?`(\w+)`/)?.[1];
        console.log(`   ✓ Erstelle Tabelle: ${tableName}`);
      } else if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/CREATE INDEX `(\w+)`/)?.[1];
        console.log(`   ✓ Erstelle Index: ${indexName}`);
      }

      try {
        await connection.execute(statement);
      } catch (err) {
        // Ignoriere "table already exists" Fehler
        if (!err.message.includes('already exists')) {
          throw err;
        }
        console.log(`   ℹ️  (bereits vorhanden)`);
      }
    }

    console.log('\n✅ Migration erfolgreich abgeschlossen!\n');
    console.log('Die folgenden Tabellen wurden erstellt:');
    console.log('   • auszuege');
    console.log('   • auszug_positionen');
    console.log('\nMit 7 Performance-Indizes.\n');

  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
