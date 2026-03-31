// server/stripe-rest.ts
// SaaS Sprint 2: Stripe Checkout + Webhook Handler (Express REST Router)

import Stripe from 'stripe';
import { Request, Response, Router } from 'express';
import { getMasterDb } from './db';
import { tenants } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

const PLAN_CONFIG: Record<string, { maxFirmen: number; priceEnv: string }> = {
  starter:    { maxFirmen: 1,   priceEnv: 'STRIPE_PRICE_STARTER' },
  business:   { maxFirmen: 5,   priceEnv: 'STRIPE_PRICE_BUSINESS' },
  enterprise: { maxFirmen: 20,  priceEnv: 'STRIPE_PRICE_ENTERPRISE' },
  unlimited:  { maxFirmen: 999, priceEnv: 'STRIPE_PRICE_UNLIMITED' },
};

export const stripeRestRouter = Router();

// POST /api/stripe/create-checkout-session
stripeRestRouter.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLAN_CONFIG[plan]) {
      return res.status(400).json({ error: 'Ungültiger Plan.' });
    }

    const config = PLAN_CONFIG[plan];
    const priceId = process.env[config.priceEnv];

    if (!priceId) {
      console.error(`Stripe Price ID nicht konfiguriert: ${config.priceEnv}`);
      return res.status(500).json({ error: 'Preiskonfiguration fehlt.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.VITE_APP_URL || 'https://www.buchhaltung-ki.app'}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || 'https://www.buchhaltung-ki.app'}/#preise`,
      metadata: { plan },
      subscription_data: { metadata: { plan } },
      allow_promotion_codes: true,
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Fehler:', error.message);
    return res.status(500).json({ error: 'Checkout-Session konnte nicht erstellt werden.' });
  }
});

// POST /api/stripe/webhook — handled in index.ts with raw body middleware, see stripeWebhookHandler
// This route intentionally left out here to avoid double-registration.

// POST /api/stripe/create-portal-session
stripeRestRouter.post('/create-portal-session', async (req: Request, res: Response) => {
  try {
    const { stripeCustId } = req.body;
    if (!stripeCustId) return res.status(400).json({ error: 'stripeCustId erforderlich' });

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustId,
      return_url: `${process.env.VITE_APP_URL || 'https://www.buchhaltung-ki.app'}/einstellungen`,
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ error: 'Portal-Session konnte nicht erstellt werden.' });
  }
});

// GET /api/stripe/checkout-session/:sessionId
stripeRestRouter.get('/checkout-session/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    return res.json({
      customerId: session.customer,
      customerEmail: session.customer_details?.email,
      plan: session.metadata?.plan,
      status: session.payment_status,
    });
  } catch (error: any) {
    return res.status(404).json({ error: 'Checkout-Session nicht gefunden.' });
  }
});

// Webhook handler for tenant provisioning (called from index.ts via stripeWebhookHandler)
// This helper can be used to extend the existing webhook with tenant logic.
export async function handleTenantCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const plan = session.metadata?.plan || 'starter';
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const customerEmail = session.customer_details?.email || '';

  const masterDb = getMasterDb();
  if (!masterDb) {
    console.error('[Tenant Provisioning] Master-DB nicht verfügbar');
    return;
  }

  const existing = await masterDb.select().from(tenants)
    .where(eq(tenants.stripeCustId, customerId));

  if (existing.length > 0) {
    await masterDb.update(tenants)
      .set({
        plan: plan as any,
        planStatus: 'active',
        stripeSubId: subscriptionId,
        maxFirmen: PLAN_CONFIG[plan]?.maxFirmen || 1,
      })
      .where(eq(tenants.stripeCustId, customerId));
    console.log(`[Tenant Provisioning] Bestehender Tenant aktualisiert: ${customerId}`);
    return;
  }

  const timestamp = Date.now();
  const safeName = (customerEmail || 'kunde').split('@')[0]
    .toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').substring(0, 20);
  const databaseName = `tenant_${safeName}_${timestamp}`;

  const masterUrl = process.env.DATABASE_URL!;
  const rawConn = await mysql.createConnection(masterUrl);

  try {
    await rawConn.execute(
      `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );

    const tenantUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1) + databaseName;
    const tenantConn = await mysql.createConnection(tenantUrl);
    try {
      const migrationPath = path.join(process.cwd(), 'scripts', 'migrate-tenant-schema.cjs');
      if (fs.existsSync(migrationPath)) {
        const migration = await import(migrationPath);
        if (migration.migrate) await migration.migrate(tenantConn);
      }
    } finally {
      await tenantConn.end();
    }
  } catch (dbError: any) {
    try { await rawConn.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``); } catch {}
    console.error('[Tenant Provisioning] DB-Fehler:', dbError.message);
    throw dbError;
  } finally {
    await rawConn.end();
  }

  await masterDb.insert(tenants).values({
    clerkOrgId: `pending_${customerId}`,
    name: customerEmail || 'Neuer Kunde',
    databaseName,
    stripeCustId: customerId,
    stripeSubId: subscriptionId,
    plan: plan as any,
    planStatus: 'active',
    maxFirmen: PLAN_CONFIG[plan]?.maxFirmen || 1,
    active: true,
  });

  console.log(`[Tenant Provisioning] Neuer Tenant registriert: ${databaseName}`);
}
