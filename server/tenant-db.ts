// server/tenant-db.ts
// SaaS Multi-Tenant: AsyncLocalStorage + Connection Pool Manager
// Ermöglicht tenant-spezifische DB-Connections ohne Router-Änderungen

import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle } from 'drizzle-orm/mysql2';

// AsyncLocalStorage speichert den Tenant-DB-Namen pro Request
interface TenantContext {
  databaseName: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

// Connection Pool: Map<databaseName, DrizzleInstance>
// Connections werden lazy erstellt und wiederverwendet
const tenantConnections = new Map<string, ReturnType<typeof drizzle>>();

/**
 * Gibt eine Drizzle-Connection für eine Tenant-Datenbank zurück.
 * Connections werden gecacht und wiederverwendet.
 */
export function getTenantDb(databaseName: string): ReturnType<typeof drizzle> | null {
  // Bereits im Cache?
  if (tenantConnections.has(databaseName)) {
    return tenantConnections.get(databaseName)!;
  }

  // Neue Connection erstellen — DB-Namen am Ende der URL ersetzen
  const masterUrl = process.env.DATABASE_URL;
  if (!masterUrl) return null;

  try {
    const lastSlash = masterUrl.lastIndexOf('/');
    const tenantUrl = masterUrl.substring(0, lastSlash + 1) + databaseName;

    const connection = drizzle(tenantUrl);
    tenantConnections.set(databaseName, connection);
    console.log(`🟦 Tenant-DB Connection erstellt: ${databaseName}`);
    return connection;
  } catch (error) {
    console.error(`🔴 Tenant-DB Connection fehlgeschlagen: ${databaseName}`, error);
    return null;
  }
}

/**
 * Gibt den aktuellen Tenant-DB-Namen aus AsyncLocalStorage zurück.
 * Null = kein Tenant = Master-DB verwenden.
 */
export function getCurrentTenantDb(): string | null {
  const store = tenantStorage.getStore();
  return store?.databaseName ?? null;
}
