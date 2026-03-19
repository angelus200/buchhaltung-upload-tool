// Öffentliche REST API v1 für externe Agenten (Manus)
// Auth über X-API-Key Header (validateApiKey Middleware)

import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { validateApiKey } from './api-keys';
import { getDb } from './db';
import { sachkonten, debitoren, unternehmen, buchungen, belege } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { ENV } from './_core/env';

const BELEGE_BASE_PATH = process.env.RAILWAY_ENVIRONMENT
  ? '/data/belege'
  : path.join(process.cwd(), 'uploads', 'belege');

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

// ═══════════════════════════════════════════
// POST /api/v1/debitoren — Debitor anlegen
// ═══════════════════════════════════════════
router.post('/debitoren', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const { kontonummer, name, kurzbezeichnung, strasse, plz, ort, land,
            telefon, email, ustIdNr, zahlungsziel, notizen } = req.body;

    if (!kontonummer || !name) {
      return res.status(400).json({ error: 'kontonummer und name sind Pflichtfelder.' });
    }

    // Duplikat-Check: kontonummer + unternehmenId
    const existing = await db.select({ id: debitoren.id })
      .from(debitoren)
      .where(and(
        eq(debitoren.unternehmenId, req.apiUnternehmenId!),
        eq(debitoren.kontonummer, kontonummer)
      ));

    if (existing.length > 0) {
      return res.status(409).json({ error: `Debitor mit Kontonummer ${kontonummer} existiert bereits.` });
    }

    const result = await db.insert(debitoren).values({
      unternehmenId: req.apiUnternehmenId!,
      kontonummer,
      name,
      kurzbezeichnung: kurzbezeichnung || null,
      strasse: strasse || null,
      plz: plz || null,
      ort: ort || null,
      land: land || null,
      telefon: telefon || null,
      email: email || null,
      ustIdNr: ustIdNr || null,
      zahlungsziel: zahlungsziel ?? 14,
      notizen: notizen || null,
      aktiv: true,
    });

    res.status(201).json({ id: result[0].insertId, kontonummer, name });
  } catch (err) {
    console.error('🔴 API POST debitoren:', err);
    res.status(500).json({ error: 'Fehler beim Anlegen des Debitors.' });
  }
});

// ═══════════════════════════════════════════
// POST /api/v1/buchungen — Buchung erstellen
// ═══════════════════════════════════════════
router.post('/buchungen', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const {
      buchungsart, belegdatum, belegnummer, geschaeftspartnerTyp,
      geschaeftspartner, geschaeftspartnerKonto, sachkonto,
      nettobetrag, steuersatz, bruttobetrag, buchungstext,
      zahlungsstatus, belegUrl, kostenstelleId,
    } = req.body;

    // Pflichtfelder prüfen
    const pflicht = { buchungsart, belegdatum, belegnummer, geschaeftspartnerTyp,
                      geschaeftspartner, geschaeftspartnerKonto, sachkonto,
                      nettobetrag, steuersatz, bruttobetrag };
    const fehlend = Object.entries(pflicht).filter(([, v]) => v === undefined || v === null || v === '').map(([k]) => k);
    if (fehlend.length > 0) {
      return res.status(400).json({ error: `Pflichtfelder fehlen: ${fehlend.join(', ')}` });
    }

    // wirtschaftsjahr + periode automatisch aus belegdatum berechnen
    const datum = new Date(belegdatum);
    const wirtschaftsjahr = datum.getFullYear();
    const periode = datum.getMonth() + 1;

    const result = await db.insert(buchungen).values({
      unternehmenId: req.apiUnternehmenId!,
      buchungsart,
      belegdatum: datum,
      belegnummer,
      geschaeftspartnerTyp,
      geschaeftspartner,
      geschaeftspartnerKonto,
      sachkonto,
      nettobetrag,
      steuersatz,
      bruttobetrag,
      buchungstext: buchungstext || null,
      zahlungsstatus: zahlungsstatus || 'offen',
      belegUrl: belegUrl || null,
      kostenstelleId: kostenstelleId ? parseInt(kostenstelleId) : null,
      wirtschaftsjahr,
      periode,
      importQuelle: 'api',
      status: 'entwurf',
    });

    res.status(201).json({ id: result[0].insertId, belegnummer, wirtschaftsjahr, periode });
  } catch (err) {
    console.error('🔴 API POST buchungen:', err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Buchung.' });
  }
});

// ═══════════════════════════════════════════
// POST /api/v1/belege/upload — PDF hochladen + OCR
// ═══════════════════════════════════════════
router.post('/belege/upload', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const { fileName, fileBase64, buchungId } = req.body;

    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: 'fileName und fileBase64 sind Pflichtfelder.' });
    }

    // DataURL-Prefix entfernen falls vorhanden
    const rawBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const fileBuffer = Buffer.from(rawBase64, 'base64');

    // Datei auf Disk speichern
    const dir = path.join(BELEGE_BASE_PATH, String(req.apiUnternehmenId));
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, fileBuffer);

    const dateiUrl = `/belege/${req.apiUnternehmenId}/${fileName}`;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const dateiTyp = (['pdf', 'png', 'jpg', 'jpeg', 'tiff'] as const).includes(ext as any)
      ? (ext as 'pdf' | 'png' | 'jpg' | 'jpeg' | 'tiff')
      : 'sonstig';

    // Beleg in DB speichern
    const belegResult = await db.insert(belege).values({
      unternehmenId: req.apiUnternehmenId!,
      buchungId: buchungId || null,
      dateiName: fileName,
      dateiPfad: filePath,
      dateiUrl,
      dateiGroesse: fileBuffer.length,
      dateiTyp,
    });

    const belegId = belegResult[0].insertId;

    // OCR via Claude API — Fehler blockiert nicht die Response
    let ocrData: Record<string, unknown> | null = null;
    let ocrFehler: string | null = null;

    try {
      if (!ENV.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY nicht konfiguriert');

      const anthropic = new Anthropic({ apiKey: ENV.anthropicApiKey });

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: rawBase64 },
              } as any,
              {
                type: 'text',
                text: `Analysiere dieses Dokument. Extrahiere folgende Felder als JSON:
{
  "belegdatum": "DD.MM.YYYY oder YYYY-MM-DD",
  "belegnummer": "Rechnungsnummer",
  "geschaeftspartner": "Name des Geschäftspartners",
  "nettobetrag": "Nettobetrag als Zahl",
  "steuersatz": "Steuersatz als Zahl (z.B. 19)",
  "bruttobetrag": "Bruttobetrag als Zahl",
  "buchungstext": "Kurze Beschreibung",
  "iban": "IBAN falls vorhanden"
}
Antworte NUR mit dem JSON-Objekt, kein anderer Text.`,
              },
            ],
          },
        ],
      });

      const textBlock = message.content.find(b => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          ocrData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (ocrErr: any) {
      console.error('🔴 OCR fehlgeschlagen (Beleg trotzdem gespeichert):', ocrErr?.message);
      ocrFehler = ocrErr?.message || 'OCR fehlgeschlagen';
    }

    res.status(201).json({
      beleg: { id: belegId, dateiName: fileName, dateiUrl },
      ocr: ocrData,
      ocrFehler,
    });
  } catch (err) {
    console.error('🔴 API POST belege/upload:', err);
    res.status(500).json({ error: 'Fehler beim Beleg-Upload.' });
  }
});

export default router;
