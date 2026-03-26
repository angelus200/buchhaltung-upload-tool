// server/tenant-middleware.ts
// SaaS Multi-Tenant: Express Middleware für Tenant-DB-Routing
// Setzt AsyncLocalStorage wenn ein Clerk orgId vorhanden ist

import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { tenantStorage } from './tenant-db';
import { tenants } from '../drizzle/schema';

// Cache für orgId → databaseName Mapping (vermeidet DB-Lookup bei jedem Request)
const tenantCache = new Map<string, { databaseName: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten

/**
 * Express Middleware: Prüft ob der Request von einem SaaS-Tenant kommt.
 * Wenn ja: Setzt AsyncLocalStorage mit dem Tenant-DB-Namen.
 * Wenn nein: Macht nichts → getDb() gibt Master-DB zurück (interner Betrieb).
 *
 * WICHTIG: Muss NACH clerkMiddleware() registriert werden.
 */
export function tenantMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuth(req);

      // Kein orgId = interner Mitarbeiter = Master-DB = nichts tun
      if (!auth?.orgId) {
        return next();
      }

      const orgId = auth.orgId;

      // Cache prüfen
      const cached = tenantCache.get(orgId);
      if (cached && cached.expiresAt > Date.now()) {
        return tenantStorage.run({ databaseName: cached.databaseName }, () => next());
      }

      // DB-Lookup: orgId → databaseName (direkt in Master-DB, ohne AsyncLocalStorage)
      const db = getMasterDb();
      if (!db) {
        console.error('🔴 Tenant-Middleware: Master-DB nicht verfügbar');
        return res.status(503).json({ error: 'Service nicht verfügbar' });
      }

      const results = await db.select({
        databaseName: tenants.databaseName,
        active: tenants.active,
        planStatus: tenants.planStatus,
      })
        .from(tenants)
        .where(and(eq(tenants.clerkOrgId, orgId), eq(tenants.active, true)));

      if (results.length === 0) {
        // orgId existiert aber kein aktiver Tenant → Zugriff verweigern
        return res.status(403).json({
          error: 'Kein aktiver Tenant für diese Organisation gefunden.',
        });
      }

      const tenant = results[0];

      // Plan-Status prüfen
      if (tenant.planStatus === 'cancelled') {
        return res.status(403).json({
          error: 'Ihr Abonnement wurde gekündigt. Bitte erneuern Sie Ihr Abo.',
        });
      }

      // Cache aktualisieren
      tenantCache.set(orgId, {
        databaseName: tenant.databaseName,
        expiresAt: Date.now() + CACHE_TTL,
      });

      // AsyncLocalStorage setzen → alle nachfolgenden getDb()-Aufrufe
      // in diesem Request geben die Tenant-DB zurück
      tenantStorage.run({ databaseName: tenant.databaseName }, () => next());

    } catch (error) {
      // Bei Fehler in der Middleware: NICHT blockieren für interne User
      console.error('🔴 Tenant-Middleware Fehler:', error);
      next();
    }
  };
}

// Direkte Master-DB-Referenz (OHNE AsyncLocalStorage-Check)
// Nur für die Tenant-Middleware selbst, um die tenants-Tabelle abzufragen
let _masterDb: ReturnType<typeof drizzle> | null = null;

function getMasterDb(): ReturnType<typeof drizzle> | null {
  if (!_masterDb && process.env.DATABASE_URL) {
    _masterDb = drizzle(process.env.DATABASE_URL);
  }
  return _masterDb;
}
