// Öffentliche REST API v1 für externe Agenten (Manus)
// Auth über X-API-Key Header (validateApiKey Middleware)

import { Router, Request, Response } from 'express';
import { validateApiKey } from './api-keys';
import { getDb } from './db';
import { sachkonten, debitoren, unternehmen } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Alle Routen hinter API-Key Auth
router.use(validateApiKey);

// ═══════════════════════════════════════════
// GET /api/v1/health — API Status prüfen
// ═══════════════════════════════════════════
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    unternehmenId: req.apiUnternehmenId,
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════
// GET /api/v1/sachkonten — Sachkonten abrufen
// ═══════════════════════════════════════════
router.get('/sachkonten', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const results = await db.select({
      id: sachkonten.id,
      kontonummer: sachkonten.kontonummer,
      bezeichnung: sachkonten.bezeichnung,
      kategorie: sachkonten.kategorie,
      kontotyp: sachkonten.kontotyp,
      standardSteuersatz: sachkonten.standardSteuersatz,
    })
    .from(sachkonten)
    .where(eq(sachkonten.unternehmenId, req.apiUnternehmenId!));

    res.json({ count: results.length, sachkonten: results });
  } catch (err) {
    console.error('🔴 API sachkonten:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Sachkonten.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/v1/unternehmen — Firmendaten abrufen
// ═══════════════════════════════════════════
router.get('/unternehmen', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const results = await db.select({
      id: unternehmen.id,
      name: unternehmen.name,
      rechtsform: unternehmen.rechtsform,
      landCode: unternehmen.landCode,
      kontenrahmen: unternehmen.kontenrahmen,
      waehrung: unternehmen.waehrung,
      steuernummer: unternehmen.steuernummer,
      ustIdNr: unternehmen.ustIdNr,
    })
    .from(unternehmen)
    .where(eq(unternehmen.id, req.apiUnternehmenId!));

    if (results.length === 0) {
      return res.status(404).json({ error: 'Unternehmen nicht gefunden.' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('🔴 API unternehmen:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Firmendaten.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/v1/debitoren/search — Debitor suchen
// ═══════════════════════════════════════════
router.get('/debitoren/search', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Suchbegriff (q) erforderlich.' });
    }

    const allDebitoren = await db.select({
      id: debitoren.id,
      kontonummer: debitoren.kontonummer,
      name: debitoren.name,
      email: debitoren.email,
    })
    .from(debitoren)
    .where(eq(debitoren.unternehmenId, req.apiUnternehmenId!));

    // Clientseitig filtern (case-insensitive)
    const search = q.toLowerCase();
    const filtered = allDebitoren.filter(d =>
      d.name?.toLowerCase().includes(search) ||
      d.email?.toLowerCase().includes(search) ||
      d.kontonummer?.toLowerCase().includes(search)
    );

    res.json({ count: filtered.length, debitoren: filtered });
  } catch (err) {
    console.error('🔴 API debitoren/search:', err);
    res.status(500).json({ error: 'Fehler bei der Debitorensuche.' });
  }
});

export default router;
