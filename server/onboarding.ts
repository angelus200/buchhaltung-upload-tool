// server/onboarding.ts
// SaaS Sprint 2: Onboarding nach Stripe Checkout

import { Router, Request, Response } from 'express';
import { getMasterDb } from './db';
import { tenants } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';

export const onboardingRouter = Router();

onboardingRouter.post('/complete', async (req: Request, res: Response) => {
  try {
    const { stripeCustId, clerkOrgId, firmenName, land, kontenrahmen } = req.body;

    if (!stripeCustId || !clerkOrgId) {
      return res.status(400).json({ error: 'stripeCustId und clerkOrgId sind erforderlich.' });
    }

    const masterDb = getMasterDb();
    if (!masterDb) return res.status(500).json({ error: 'DB nicht verfügbar' });

    const tenantResults = await masterDb.select().from(tenants)
      .where(eq(tenants.stripeCustId, stripeCustId));

    if (tenantResults.length === 0) {
      return res.status(404).json({ error: 'Kein Tenant für diesen Stripe-Customer gefunden.' });
    }

    const tenant = tenantResults[0];

    await masterDb.update(tenants)
      .set({ clerkOrgId, name: firmenName || tenant.name })
      .where(eq(tenants.id, tenant.id));

    if (firmenName && land) {
      const masterUrl = process.env.DATABASE_URL!;
      const tenantUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1) + tenant.databaseName;
      const tenantConn = await mysql.createConnection(tenantUrl);

      try {
        const kr = kontenrahmen || getDefaultKontenrahmen(land);
        await tenantConn.execute(
          `INSERT INTO unternehmen (name, land, waehrung, kontenrahmen) VALUES (?, ?, ?, ?)`,
          [firmenName, land, getWaehrung(land), kr],
        );
        const [firms]: any = await tenantConn.execute('SELECT id FROM unternehmen ORDER BY id DESC LIMIT 1');
        console.log(`[Onboarding] Firma angelegt: ${firmenName} (ID: ${firms[0]?.id})`);
      } finally {
        await tenantConn.end();
      }
    }

    return res.json({
      success: true,
      tenantId: tenant.id,
      databaseName: tenant.databaseName,
      plan: tenant.plan,
    });
  } catch (error: any) {
    console.error('[Onboarding] Fehler:', error.message);
    return res.status(500).json({ error: 'Onboarding fehlgeschlagen.' });
  }
});

function getDefaultKontenrahmen(land: string): string {
  if (land === 'AT') return 'OeKR';
  if (land === 'CH') return 'KMU';
  return 'SKR04';
}

function getWaehrung(land: string): string {
  return land === 'CH' ? 'CHF' : 'EUR';
}
