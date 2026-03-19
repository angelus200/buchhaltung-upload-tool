// API-Key Middleware für externe Agenten (Manus)
// Auth über X-API-Key Header — unabhängig von Clerk

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getDb } from './db';
import { apiKeys } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Express Request um API-Kontext erweitern
declare global {
  namespace Express {
    interface Request {
      apiUnternehmenId?: number;
      apiKeyId?: number;
    }
  }
}

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string;

  if (!key) {
    return res.status(401).json({ error: 'API-Key fehlt. Header X-API-Key erforderlich.' });
  }

  if (!key.startsWith('bk_')) {
    return res.status(401).json({ error: 'Ungültiges API-Key Format.' });
  }

  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Datenbank nicht verfügbar.' });
    }

    const results = await db.select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.active, true)));

    if (results.length === 0) {
      return res.status(401).json({ error: 'Ungültiger oder deaktivierter API-Key.' });
    }

    const apiKey = results[0];
    req.apiUnternehmenId = apiKey.unternehmenId;
    req.apiKeyId = apiKey.id;

    // lastUsedAt aktualisieren (async, nicht blockierend)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .catch(() => {}); // Fire and forget

    next();
  } catch (err) {
    console.error('🔴 API-Key Validierung fehlgeschlagen:', err);
    return res.status(500).json({ error: 'Interner Fehler bei der Authentifizierung.' });
  }
}
