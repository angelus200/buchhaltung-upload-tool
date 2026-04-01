// server/crm.ts
// CRM Sprint A: Lead-Management Router
// NEUE Datei — additiv, kein bestehender Code wird verändert
// Alle Queries nutzen getMasterDb() — leads ist eine globale Master-DB-Tabelle

import { z } from 'zod';
import { router, adminProcedure, publicProcedure } from './_core/trpc';
import { getMasterDb } from './db';
import { leads } from '../drizzle/schema';
import { eq, desc, sql, like, or, and } from 'drizzle-orm';

export const crmRouter = router({

  // ═══════════════════════════════════════════
  // ÖFFENTLICH: Lead erstellen (Landing Page Formular)
  // ═══════════════════════════════════════════
  createLead: publicProcedure
    .input(z.object({
      firmenName: z.string().min(1, 'Firmenname erforderlich'),
      ansprechpartner: z.string().optional(),
      email: z.string().email('Gültige E-Mail erforderlich'),
      telefon: z.string().optional(),
      land: z.enum(['DE', 'AT', 'CH']).default('DE'),
      interessiertAnPlan: z.enum(['starter', 'business', 'individuell']).optional(),
      quelle: z.enum(['landing_page', 'empfehlung', 'steuerberater', 'manuell', 'api', 'marketing']).default('landing_page'),
      notizen: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getMasterDb();
      if (!db) throw new Error('DB nicht verfügbar');

      // Duplikat-Check auf E-Mail
      const existing = await db.select().from(leads)
        .where(eq(leads.email, input.email));

      if (existing.length > 0) {
        // Lead existiert → Notizen anhängen + Plan aktualisieren statt Duplikat anlegen
        const updateData: Record<string, unknown> = {};
        if (input.interessiertAnPlan) updateData.interessiertAnPlan = input.interessiertAnPlan;
        if (input.notizen) {
          updateData.notizen = sql`CONCAT(COALESCE(${leads.notizen}, ''), '\n---\n', ${input.notizen})`;
        }

        if (Object.keys(updateData).length > 0) {
          await db.update(leads)
            .set(updateData)
            .where(eq(leads.email, input.email));
        }

        return { success: true, duplicate: true, id: existing[0].id };
      }

      const result = await db.insert(leads).values({
        firmenName: input.firmenName,
        ansprechpartner: input.ansprechpartner ?? null,
        email: input.email,
        telefon: input.telefon ?? null,
        land: input.land,
        interessiertAnPlan: input.interessiertAnPlan ?? null,
        quelle: input.quelle,
        notizen: input.notizen ?? null,
        status: 'neu',
      });

      console.log(`[CRM] Neuer Lead: ${input.firmenName} (${input.email})`);

      return { success: true, duplicate: false, id: Number(result[0].insertId) };
    }),

  // ═══════════════════════════════════════════
  // ADMIN: Alle Leads auflisten
  // ═══════════════════════════════════════════
  listLeads: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      land: z.string().optional(),
      suche: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getMasterDb();
      if (!db) throw new Error('DB nicht verfügbar');

      const conditions: ReturnType<typeof eq>[] = [];
      if (input?.status) conditions.push(eq(leads.status, input.status as Parameters<typeof eq>[1]));
      if (input?.land) conditions.push(eq(leads.land, input.land as Parameters<typeof eq>[1]));
      if (input?.suche) {
        conditions.push(
          or(
            like(leads.firmenName, `%${input.suche}%`),
            like(leads.email, `%${input.suche}%`),
            like(leads.ansprechpartner, `%${input.suche}%`),
          ) as ReturnType<typeof eq>,
        );
      }

      const baseQuery = db.select().from(leads);
      const filtered = conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery;

      return filtered.orderBy(desc(leads.createdAt));
    }),

  // ═══════════════════════════════════════════
  // ADMIN: Einzelnen Lead abrufen
  // ═══════════════════════════════════════════
  getLead: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getMasterDb();
      if (!db) throw new Error('DB nicht verfügbar');

      const results = await db.select().from(leads).where(eq(leads.id, input.id));
      if (results.length === 0) throw new Error('Lead nicht gefunden');
      return results[0];
    }),

  // ═══════════════════════════════════════════
  // ADMIN: Lead aktualisieren
  // ═══════════════════════════════════════════
  updateLead: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['neu', 'kontaktiert', 'demo_geplant', 'demo_durchgefuehrt', 'angebot_gesendet', 'gewonnen', 'verloren']).optional(),
      notizen: z.string().optional(),
      naechsteAktion: z.string().optional(),
      naechsteAktionDatum: z.string().optional(),
      ansprechpartner: z.string().optional(),
      telefon: z.string().optional(),
      interessiertAnPlan: z.enum(['starter', 'business', 'individuell']).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getMasterDb();
      if (!db) throw new Error('DB nicht verfügbar');

      const { id, ...fields } = input;
      const cleanData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          cleanData[key] = value === '' ? null : value;
        }
      }

      if (Object.keys(cleanData).length === 0) {
        throw new Error('Keine Änderungen angegeben');
      }

      await db.update(leads).set(cleanData).where(eq(leads.id, id));
      return { success: true };
    }),

  // ═══════════════════════════════════════════
  // ADMIN: Lead löschen
  // ═══════════════════════════════════════════
  deleteLead: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getMasterDb();
      if (!db) throw new Error('DB nicht verfügbar');

      await db.delete(leads).where(eq(leads.id, input.id));
      return { success: true };
    }),

  // ═══════════════════════════════════════════
  // ADMIN: Lead-Statistiken
  // ═══════════════════════════════════════════
  getStats: adminProcedure.query(async () => {
    const db = getMasterDb();
    if (!db) throw new Error('DB nicht verfügbar');

    const allLeads = await db.select().from(leads);

    return {
      gesamt: allLeads.length,
      neu: allLeads.filter(l => l.status === 'neu').length,
      kontaktiert: allLeads.filter(l => l.status === 'kontaktiert').length,
      demoGeplant: allLeads.filter(l => l.status === 'demo_geplant').length,
      demoDurchgefuehrt: allLeads.filter(l => l.status === 'demo_durchgefuehrt').length,
      angebotGesendet: allLeads.filter(l => l.status === 'angebot_gesendet').length,
      gewonnen: allLeads.filter(l => l.status === 'gewonnen').length,
      verloren: allLeads.filter(l => l.status === 'verloren').length,
    };
  }),
});
