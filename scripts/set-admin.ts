#!/usr/bin/env tsx
/**
 * Script zum Setzen der Admin-Rolle für einen Benutzer
 *
 * Verwendung:
 *   pnpm tsx scripts/set-admin.ts <email>
 *
 * Beispiel:
 *   pnpm tsx scripts/set-admin.ts office@angelus.group
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const email = process.argv[2];

if (!email) {
  console.error("❌ Fehler: Keine Email angegeben.");
  console.log("\nVerwendung:");
  console.log("  pnpm tsx scripts/set-admin.ts <email>");
  console.log("\nBeispiel:");
  console.log("  pnpm tsx scripts/set-admin.ts office@angelus.group");
  process.exit(1);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL!);

console.log(`🔍 Suche User mit Email: ${email}\n`);

const [users] = await connection.query(`
  SELECT id, clerkId, name, email, role
  FROM users
  WHERE email = ?
`, [email]);

const userList = users as any[];

if (userList.length === 0) {
  console.log(`❌ Kein Benutzer mit Email "${email}" gefunden.`);
  console.log("\n💡 Hinweis: Der User muss sich zuerst über Clerk anmelden.");
  console.log("   Nachdem sich der User angemeldet hat, führe dieses Script erneut aus.");
  await connection.end();
  process.exit(1);
}

const user = userList[0];

console.log(`✅ User gefunden:`);
console.log(`   ID:         ${user.id}`);
console.log(`   Name:       ${user.name || "(nicht gesetzt)"}`);
console.log(`   Email:      ${user.email}`);
console.log(`   Clerk ID:   ${user.clerkId}`);
console.log(`   Aktuelle Rolle: ${user.role}`);

if (user.role === "admin") {
  console.log(`\n✅ User hat bereits die Rolle "admin".`);
  await connection.end();
  process.exit(0);
}

console.log(`\n🔄 Setze Rolle auf "admin"...`);

await connection.query(`
  UPDATE users
  SET role = 'admin'
  WHERE id = ?
`, [user.id]);

console.log(`\n✅ Rolle erfolgreich auf "admin" gesetzt!`);
console.log(`\n🎉 ${user.name || user.email} kann jetzt auf /admin zugreifen!`);

await connection.end();
