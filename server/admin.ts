// server/admin.ts
// SaaS Admin-Router: Tenant-CRUD (nur für Thomas / role=admin)

import { z } from 'zod';
import { createRequire } from 'module';
import { router, adminProcedure } from './_core/trpc';
import { getDb } from './db';
import { tenants } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// createRequire ermöglicht require() in ESM-kompiliertem Code (esbuild --format=esm)
const _require = createRequire(import.meta.url);

export const adminRouter = router({

  // ═══════════════════════════════════════════
  // Alle Tenants auflisten
  // ═══════════════════════════════════════════
  listTenants: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('DB nicht verfügbar');

    return db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }),

  // ═══════════════════════════════════════════
  // Einzelnen Tenant abrufen
  // ═══════════════════════════════════════════
  getTenant: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB nicht verfügbar');

      const results = await db.select().from(tenants).where(eq(tenants.id, input.id));
      if (results.length === 0) throw new Error('Tenant nicht gefunden');
      return results[0];
    }),

  // ═══════════════════════════════════════════
  // Neuen Tenant erstellen
  // CREATE DATABASE + Schema migrieren + Eintrag in tenants-Tabelle
  // ═══════════════════════════════════════════
  createTenant: adminProcedure
    .input(z.object({
      clerkOrgId: z.string().min(1, 'Clerk Organisation-ID erforderlich'),
      name: z.string().min(1, 'Firmenname erforderlich'),
      plan: z.enum(['starter', 'business', 'enterprise', 'unlimited']).default('starter'),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB nicht verfügbar');

      // 1. Prüfen ob clerkOrgId bereits existiert
      const existing = await db.select().from(tenants).where(eq(tenants.clerkOrgId, input.clerkOrgId));
      if (existing.length > 0) {
        throw new Error(`Tenant mit clerkOrgId ${input.clerkOrgId} existiert bereits`);
      }

      // 2. Eindeutigen DB-Namen generieren
      const timestamp = Date.now();
      const safeName = input.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 30);
      const databaseName = `tenant_${safeName}_${timestamp}`;

      // 3. Tenant-Datenbank erstellen (raw SQL — CREATE DATABASE geht nicht über Drizzle)
      const masterUrl = process.env.DATABASE_URL!;
      const rawConn = await mysql.createConnection(masterUrl);

      try {
        await rawConn.execute(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Tenant-DB erstellt: ${databaseName}`);

        // Schema migrieren: alle Business-Tabellen erstellen
        const tenantUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1) + databaseName;
        const tenantConn = await mysql.createConnection(tenantUrl);

        try {
          const migrationPath = path.join(process.cwd(), 'scripts', 'migrate-tenant-schema.cjs');

          if (!fs.existsSync(migrationPath)) {
            throw new Error(
              'scripts/migrate-tenant-schema.cjs nicht gefunden. ' +
              'Generieren mit: node scripts/generate-tenant-migration.cjs'
            );
          }

          const migration = _require(migrationPath);
          await migration.migrate(tenantConn);
          console.log(`✅ Schema migriert für: ${databaseName}`);

        } finally {
          await tenantConn.end();
        }

      } catch (dbError: any) {
        // Wenn etwas fehlschlägt, DB wieder entfernen
        try { await rawConn.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``); } catch {}
        throw new Error(`Tenant-DB Erstellung fehlgeschlagen: ${dbError.message}`);
      } finally {
        await rawConn.end();
      }

      // 4. maxFirmen basierend auf Plan
      const planLimits: Record<string, number> = {
        starter: 1,
        business: 5,
        enterprise: 20,
        unlimited: 999,
      };

      // 5. Eintrag in tenants-Tabelle
      const result = await db.insert(tenants).values({
        clerkOrgId: input.clerkOrgId,
        name: input.name,
        databaseName,
        plan: input.plan,
        planStatus: 'trial',
        maxFirmen: planLimits[input.plan] || 1,
      });

      console.log(`✅ Tenant erstellt: ${input.name} (${databaseName})`);

      return {
        id: Number((result as any).insertId),
        name: input.name,
        databaseName,
        plan: input.plan,
      };
    }),

  // ═══════════════════════════════════════════
  // Tenant deaktivieren (soft delete)
  // ═══════════════════════════════════════════
  deactivateTenant: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB nicht verfügbar');

      await db.update(tenants)
        .set({ active: false })
        .where(eq(tenants.id, input.id));

      return { success: true };
    }),

  // ═══════════════════════════════════════════
  // Tenant Plan ändern
  // ═══════════════════════════════════════════
  updateTenantPlan: adminProcedure
    .input(z.object({
      id: z.number(),
      plan: z.enum(['starter', 'business', 'enterprise', 'unlimited']),
      planStatus: z.enum(['trial', 'active', 'past_due', 'cancelled']).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB nicht verfügbar');

      const planLimits: Record<string, number> = {
        starter: 1, business: 5, enterprise: 20, unlimited: 999,
      };

      const updateData: Record<string, any> = {
        plan: input.plan,
        maxFirmen: planLimits[input.plan],
      };

      if (input.planStatus) {
        updateData.planStatus = input.planStatus;
      }

      await db.update(tenants)
        .set(updateData)
        .where(eq(tenants.id, input.id));

      return { success: true };
    }),
});
