import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { getCurrentTenantDb, getTenantDb } from './tenant-db';

let _db: ReturnType<typeof drizzle> | null = null;

// Master-DB immer direkt — kein AsyncLocalStorage-Check.
// Muss für User-Tabelle (global) genutzt werden, nie für Tenant-Daten.
function getMasterDb(): ReturnType<typeof drizzle> | null {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect to master DB:", error);
      _db = null;
    }
  }
  return _db;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
// Tenant-aware: Wenn AsyncLocalStorage einen Tenant-DB-Namen enthält,
// wird die Tenant-DB zurückgegeben. Sonst die Master-DB (wie bisher).
export async function getDb() {
  // Prüfe ob ein Tenant-Kontext aktiv ist (SaaS-Kunde)
  const tenantDbName = getCurrentTenantDb();

  if (tenantDbName) {
    // Tenant-Request → Tenant-DB zurückgeben
    const tenantDb = getTenantDb(tenantDbName);
    if (tenantDb) return tenantDb;
    // Fallback: Wenn Tenant-DB nicht erreichbar, NICHT auf Master-DB fallen!
    // Das wäre ein Sicherheitsrisiko (Tenant sieht Angelus-Daten)
    console.error(`🔴 Tenant-DB ${tenantDbName} nicht erreichbar — Request wird abgelehnt`);
    return null;
  }

  // Kein Tenant → Master-DB (interner Betrieb, wie bisher)
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.clerkId) {
    throw new Error("User clerkId is required for upsert");
  }

  // Immer Master-DB — users-Tabelle ist global, nicht tenant-spezifisch
  const db = getMasterDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: master database not available");
    return;
  }

  try {
    const values: InsertUser = {
      clerkId: user.clerkId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByClerkId(clerkId: string) {
  // Immer Master-DB — users-Tabelle ist global, nicht tenant-spezifisch
  const db = getMasterDb();
  if (!db) {
    console.warn("[Database] Cannot get user: master database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
