// Öffentliche REST API v1 für externe Agenten (Manus)
// Auth über X-API-Key Header (validateApiKey Middleware)

import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { validateApiKey } from './api-keys';
import { getDb } from './db';
import { sachkonten, debitoren, kreditoren, unternehmen, buchungen, belege } from '../drizzle/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
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

// ═══════════════════════════════════════════
// GET /api/v1/buchungen — Buchungen auflisten
// ═══════════════════════════════════════════
router.get('/buchungen', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;

    const conditions = [eq(buchungen.unternehmenId, req.apiUnternehmenId!)];
    if (req.query.wirtschaftsjahr) conditions.push(eq(buchungen.wirtschaftsjahr, parseInt(req.query.wirtschaftsjahr as string)));
    if (req.query.periode) conditions.push(eq(buchungen.periode, parseInt(req.query.periode as string)));
    if (req.query.buchungsart) conditions.push(eq(buchungen.buchungsart, req.query.buchungsart as any));
    if (req.query.zahlungsstatus) conditions.push(eq(buchungen.zahlungsstatus, req.query.zahlungsstatus as any));

    const results = await db.select({
      id: buchungen.id,
      buchungsart: buchungen.buchungsart,
      belegdatum: buchungen.belegdatum,
      belegnummer: buchungen.belegnummer,
      geschaeftspartnerTyp: buchungen.geschaeftspartnerTyp,
      geschaeftspartner: buchungen.geschaeftspartner,
      geschaeftspartnerKonto: buchungen.geschaeftspartnerKonto,
      sachkonto: buchungen.sachkonto,
      nettobetrag: buchungen.nettobetrag,
      steuersatz: buchungen.steuersatz,
      bruttobetrag: buchungen.bruttobetrag,
      buchungstext: buchungen.buchungstext,
      zahlungsstatus: buchungen.zahlungsstatus,
      wirtschaftsjahr: buchungen.wirtschaftsjahr,
      periode: buchungen.periode,
      status: buchungen.status,
      importQuelle: buchungen.importQuelle,
      belegUrl: buchungen.belegUrl,
      createdAt: buchungen.createdAt,
    })
    .from(buchungen)
    .where(and(...conditions))
    .orderBy(desc(buchungen.belegdatum))
    .limit(limit)
    .offset(offset);

    res.json({ count: results.length, buchungen: results });
  } catch (err) {
    console.error('🔴 API GET buchungen:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Buchungen.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/v1/buchungen/:id — Einzelne Buchung
// ═══════════════════════════════════════════
router.get('/buchungen/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ungültige ID.' });

    const results = await db.select()
      .from(buchungen)
      .where(and(eq(buchungen.id, id), eq(buchungen.unternehmenId, req.apiUnternehmenId!)));

    if (results.length === 0) return res.status(404).json({ error: 'Buchung nicht gefunden.' });

    res.json(results[0]);
  } catch (err) {
    console.error('🔴 API GET buchungen/:id:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Buchung.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/v1/debitoren — Alle Debitoren
// ═══════════════════════════════════════════
router.get('/debitoren', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const results = await db.select({
      id: debitoren.id,
      kontonummer: debitoren.kontonummer,
      name: debitoren.name,
      kurzbezeichnung: debitoren.kurzbezeichnung,
      strasse: debitoren.strasse,
      plz: debitoren.plz,
      ort: debitoren.ort,
      land: debitoren.land,
      telefon: debitoren.telefon,
      email: debitoren.email,
      ustIdNr: debitoren.ustIdNr,
      zahlungsziel: debitoren.zahlungsziel,
      notizen: debitoren.notizen,
      aktiv: debitoren.aktiv,
      createdAt: debitoren.createdAt,
    })
    .from(debitoren)
    .where(eq(debitoren.unternehmenId, req.apiUnternehmenId!))
    .orderBy(asc(debitoren.kontonummer));

    res.json({ count: results.length, debitoren: results });
  } catch (err) {
    console.error('🔴 API GET debitoren:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Debitoren.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/v1/kreditoren — Alle Kreditoren
// ═══════════════════════════════════════════
router.get('/kreditoren', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const results = await db.select({
      id: kreditoren.id,
      kontonummer: kreditoren.kontonummer,
      name: kreditoren.name,
      kurzbezeichnung: kreditoren.kurzbezeichnung,
      strasse: kreditoren.strasse,
      plz: kreditoren.plz,
      ort: kreditoren.ort,
      land: kreditoren.land,
      telefon: kreditoren.telefon,
      email: kreditoren.email,
      ustIdNr: kreditoren.ustIdNr,
      iban: kreditoren.iban,
      zahlungsziel: kreditoren.zahlungsziel,
      notizen: kreditoren.notizen,
      aktiv: kreditoren.aktiv,
      createdAt: kreditoren.createdAt,
    })
    .from(kreditoren)
    .where(eq(kreditoren.unternehmenId, req.apiUnternehmenId!))
    .orderBy(asc(kreditoren.kontonummer));

    res.json({ count: results.length, kreditoren: results });
  } catch (err) {
    console.error('🔴 API GET kreditoren:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kreditoren.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/v1/kreditoren/search — Kreditor suchen
// ═══════════════════════════════════════════
router.get('/kreditoren/search', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Suchbegriff (q) erforderlich.' });
    }

    const all = await db.select({
      id: kreditoren.id,
      kontonummer: kreditoren.kontonummer,
      name: kreditoren.name,
      email: kreditoren.email,
      iban: kreditoren.iban,
    })
    .from(kreditoren)
    .where(eq(kreditoren.unternehmenId, req.apiUnternehmenId!));

    const search = q.toLowerCase();
    const filtered = all.filter(k =>
      k.name?.toLowerCase().includes(search) ||
      k.email?.toLowerCase().includes(search) ||
      k.kontonummer?.toLowerCase().includes(search) ||
      k.iban?.toLowerCase().includes(search)
    );

    res.json({ count: filtered.length, kreditoren: filtered });
  } catch (err) {
    console.error('🔴 API GET kreditoren/search:', err);
    res.status(500).json({ error: 'Fehler bei der Kreditorensuche.' });
  }
});

// ═══════════════════════════════════════════
// GET /api/v1/belege — Belege auflisten
// ═══════════════════════════════════════════
router.get('/belege', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;

    const conditions = [eq(belege.unternehmenId, req.apiUnternehmenId!)];
    if (req.query.buchungId) conditions.push(eq(belege.buchungId, parseInt(req.query.buchungId as string)));

    const results = await db.select({
      id: belege.id,
      buchungId: belege.buchungId,
      dateiName: belege.dateiName,
      dateiUrl: belege.dateiUrl,
      dateiTyp: belege.dateiTyp,
      dateiGroesse: belege.dateiGroesse,
      belegdatum: belege.belegdatum,
      beschreibung: belege.beschreibung,
      createdAt: belege.createdAt,
    })
    .from(belege)
    .where(and(...conditions))
    .orderBy(desc(belege.createdAt))
    .limit(limit)
    .offset(offset);

    res.json({ count: results.length, belege: results });
  } catch (err) {
    console.error('🔴 API GET belege:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Belege.' });
  }
});

// ═══════════════════════════════════════════
// POST /api/v1/kreditoren — Kreditor anlegen
// ═══════════════════════════════════════════
router.post('/kreditoren', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const { kontonummer, name, kurzbezeichnung, strasse, plz, ort, land,
            telefon, email, ustIdNr, steuernummer, iban, bic,
            zahlungsziel, skonto, skontofrist, standardSachkonto, notizen } = req.body;

    if (!kontonummer || !name) {
      return res.status(400).json({ error: 'kontonummer und name sind Pflichtfelder.' });
    }

    // Duplikat-Check: kontonummer + unternehmenId
    const existing = await db.select({ id: kreditoren.id })
      .from(kreditoren)
      .where(and(
        eq(kreditoren.unternehmenId, req.apiUnternehmenId!),
        eq(kreditoren.kontonummer, kontonummer)
      ));

    if (existing.length > 0) {
      return res.status(409).json({ error: `Kreditor mit Kontonummer ${kontonummer} existiert bereits.` });
    }

    const result = await db.insert(kreditoren).values({
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
      steuernummer: steuernummer || null,
      iban: iban || null,
      bic: bic || null,
      zahlungsziel: zahlungsziel ?? 30,
      skonto: skonto || null,
      skontofrist: skontofrist || null,
      standardSachkonto: standardSachkonto || null,
      notizen: notizen || null,
      aktiv: true,
    });

    res.status(201).json({ id: result[0].insertId, kontonummer, name });
  } catch (err) {
    console.error('🔴 API POST kreditoren:', err);
    res.status(500).json({ error: 'Fehler beim Anlegen des Kreditors.' });
  }
});

// ═══════════════════════════════════════════
// PUT /api/v1/debitoren/:id — Debitor bearbeiten
// ═══════════════════════════════════════════
router.put('/debitoren/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ungültige ID.' });

    // Existenz + Zugehörigkeit prüfen
    const existing = await db.select({ id: debitoren.id })
      .from(debitoren)
      .where(and(eq(debitoren.id, id), eq(debitoren.unternehmenId, req.apiUnternehmenId!)));

    if (existing.length === 0) return res.status(404).json({ error: 'Debitor nicht gefunden.' });

    // Nur übergebene Felder aktualisieren
    const allowed = ['name', 'kurzbezeichnung', 'strasse', 'plz', 'ort', 'land',
                     'telefon', 'email', 'ustIdNr', 'zahlungsziel', 'notizen', 'aktiv'];
    const updateData: Record<string, any> = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Keine Felder zum Aktualisieren angegeben.' });
    }

    await db.update(debitoren)
      .set(updateData)
      .where(and(eq(debitoren.id, id), eq(debitoren.unternehmenId, req.apiUnternehmenId!)));

    res.json({ success: true, id });
  } catch (err) {
    console.error('🔴 API PUT debitoren/:id:', err);
    res.status(500).json({ error: 'Fehler beim Bearbeiten des Debitors.' });
  }
});

// ═══════════════════════════════════════════
// PUT /api/v1/kreditoren/:id — Kreditor bearbeiten
// ═══════════════════════════════════════════
router.put('/kreditoren/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ungültige ID.' });

    // Existenz + Zugehörigkeit prüfen
    const existing = await db.select({ id: kreditoren.id })
      .from(kreditoren)
      .where(and(eq(kreditoren.id, id), eq(kreditoren.unternehmenId, req.apiUnternehmenId!)));

    if (existing.length === 0) return res.status(404).json({ error: 'Kreditor nicht gefunden.' });

    // Nur übergebene Felder aktualisieren
    const allowed = ['name', 'kurzbezeichnung', 'strasse', 'plz', 'ort', 'land',
                     'telefon', 'email', 'ustIdNr', 'steuernummer', 'iban', 'bic',
                     'zahlungsziel', 'skonto', 'skontofrist', 'standardSachkonto', 'notizen', 'aktiv'];
    const updateData: Record<string, any> = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Keine Felder zum Aktualisieren angegeben.' });
    }

    await db.update(kreditoren)
      .set(updateData)
      .where(and(eq(kreditoren.id, id), eq(kreditoren.unternehmenId, req.apiUnternehmenId!)));

    res.json({ success: true, id });
  } catch (err) {
    console.error('🔴 API PUT kreditoren/:id:', err);
    res.status(500).json({ error: 'Fehler beim Bearbeiten des Kreditors.' });
  }
});

// ═══════════════════════════════════════════
// PUT /api/v1/buchungen/:id — Buchung bearbeiten
// ═══════════════════════════════════════════
router.put('/buchungen/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ungültige ID.' });

    // Existenz + Zugehörigkeit prüfen
    const existing = await db.select({ id: buchungen.id })
      .from(buchungen)
      .where(and(eq(buchungen.id, id), eq(buchungen.unternehmenId, req.apiUnternehmenId!)));

    if (existing.length === 0) return res.status(404).json({ error: 'Buchung nicht gefunden.' });

    const body = req.body;
    const allowed = ['buchungsart', 'belegnummer', 'geschaeftspartnerTyp', 'geschaeftspartner',
                     'geschaeftspartnerKonto', 'sachkonto', 'nettobetrag', 'steuersatz',
                     'bruttobetrag', 'buchungstext', 'zahlungsstatus', 'belegUrl',
                     'kostenstelleId', 'status'];
    const updateData: Record<string, any> = {};
    for (const field of allowed) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    // belegdatum → wirtschaftsjahr + periode neu berechnen
    if (body.belegdatum) {
      const d = new Date(body.belegdatum);
      updateData.belegdatum = d;
      updateData.wirtschaftsjahr = d.getFullYear();
      updateData.periode = d.getMonth() + 1;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Keine Felder zum Aktualisieren angegeben.' });
    }

    await db.update(buchungen)
      .set(updateData)
      .where(and(eq(buchungen.id, id), eq(buchungen.unternehmenId, req.apiUnternehmenId!)));

    res.json({ success: true, id });
  } catch (err) {
    console.error('🔴 API PUT buchungen/:id:', err);
    res.status(500).json({ error: 'Fehler beim Bearbeiten der Buchung.' });
  }
});

// ═══════════════════════════════════════════
// DELETE /api/v1/buchungen/:id — Buchung löschen
// ═══════════════════════════════════════════
router.delete('/buchungen/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ungültige ID.' });

    // Existenz + Zugehörigkeit prüfen
    const existing = await db.select({ id: buchungen.id })
      .from(buchungen)
      .where(and(eq(buchungen.id, id), eq(buchungen.unternehmenId, req.apiUnternehmenId!)));

    if (existing.length === 0) return res.status(404).json({ error: 'Buchung nicht gefunden.' });

    await db.delete(buchungen)
      .where(and(eq(buchungen.id, id), eq(buchungen.unternehmenId, req.apiUnternehmenId!)));

    res.json({ success: true, id });
  } catch (err) {
    console.error('🔴 API DELETE buchungen/:id:', err);
    res.status(500).json({ error: 'Fehler beim Löschen der Buchung.' });
  }
});

export default router;
