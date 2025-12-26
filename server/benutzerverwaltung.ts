import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import {
  users,
  userUnternehmen,
  unternehmen,
  aktivitaetsprotokoll,
  berechtigungen,
  InsertAktivitaetsprotokoll,
} from "../drizzle/schema";

// ============================================
// ROLLEN UND BERECHTIGUNGEN
// ============================================

// Standard-Berechtigungen pro Rolle
const STANDARD_BERECHTIGUNGEN = {
  admin: {
    buchungen: { lesen: true, erstellen: true, bearbeiten: true, loeschen: true, exportieren: true },
    stammdaten: { lesen: true, erstellen: true, bearbeiten: true, loeschen: true, exportieren: true },
    unternehmen: { lesen: true, erstellen: true, bearbeiten: true, loeschen: true, exportieren: true },
    benutzer: { lesen: true, erstellen: true, bearbeiten: true, loeschen: true, exportieren: false },
    protokoll: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: true },
  },
  buchhalter: {
    buchungen: { lesen: true, erstellen: true, bearbeiten: true, loeschen: false, exportieren: true },
    stammdaten: { lesen: true, erstellen: true, bearbeiten: true, loeschen: false, exportieren: true },
    unternehmen: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    benutzer: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    protokoll: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
  },
  viewer: {
    buchungen: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    stammdaten: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    unternehmen: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    benutzer: { lesen: false, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    protokoll: { lesen: false, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
  },
};

// ============================================
// HILFSFUNKTIONEN
// ============================================

// Aktivität protokollieren
export async function logAktivitaet(
  userId: number,
  aktion: InsertAktivitaetsprotokoll["aktion"],
  options?: {
    unternehmenId?: number;
    entitaetTyp?: string;
    entitaetId?: number;
    entitaetName?: string;
    details?: string;
    ipAdresse?: string;
    userAgent?: string;
  }
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(aktivitaetsprotokoll).values({
      userId,
      aktion,
      unternehmenId: options?.unternehmenId,
      entitaetTyp: options?.entitaetTyp,
      entitaetId: options?.entitaetId,
      entitaetName: options?.entitaetName,
      details: options?.details,
      ipAdresse: options?.ipAdresse,
      userAgent: options?.userAgent,
    });
  } catch (error) {
    console.error("Fehler beim Protokollieren:", error);
  }
}

// Berechtigung prüfen
export async function hatBerechtigung(
  userId: number,
  unternehmenId: number,
  bereich: string,
  aktion: "lesen" | "erstellen" | "bearbeiten" | "loeschen" | "exportieren"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Benutzer-Unternehmen-Zuordnung abrufen
  const zuordnung = await db
    .select()
    .from(userUnternehmen)
    .where(
      and(
        eq(userUnternehmen.userId, userId),
        eq(userUnternehmen.unternehmenId, unternehmenId)
      )
    )
    .limit(1);

  if (!zuordnung[0]) return false;

  const rolle = zuordnung[0].rolle as keyof typeof STANDARD_BERECHTIGUNGEN;
  const berechtigungenRolle = STANDARD_BERECHTIGUNGEN[rolle];
  
  if (!berechtigungenRolle) return false;
  
  const bereichBerechtigungen = berechtigungenRolle[bereich as keyof typeof berechtigungenRolle];
  if (!bereichBerechtigungen) return false;

  return bereichBerechtigungen[aktion] === true;
}

// ============================================
// BENUTZER ROUTER
// ============================================
export const benutzerRouter = router({
  // Alle Benutzer eines Unternehmens abrufen
  listByUnternehmen: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const benutzerListe = await db
        .select({
          zuordnung: userUnternehmen,
          user: users,
        })
        .from(userUnternehmen)
        .innerJoin(users, eq(userUnternehmen.userId, users.id))
        .where(eq(userUnternehmen.unternehmenId, input.unternehmenId));

      return benutzerListe.map((b) => ({
        id: b.zuordnung.id,
        oderId: b.user.id,
        name: b.user.name,
        email: b.user.email,
        rolle: b.zuordnung.rolle,
        createdAt: b.zuordnung.createdAt,
        lastSignedIn: b.user.lastSignedIn,
      }));
    }),

  // Benutzer zu Unternehmen hinzufügen (per E-Mail)
  addToUnternehmen: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        email: z.string().email(),
        rolle: z.enum(["admin", "buchhalter", "viewer"]).default("buchhalter"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Prüfen ob der aktuelle Benutzer Admin ist
      const istAdmin = await hatBerechtigung(ctx.user.id, input.unternehmenId, "benutzer", "erstellen");
      if (!istAdmin) {
        throw new Error("Keine Berechtigung zum Hinzufügen von Benutzern");
      }

      // Benutzer per E-Mail finden
      const targetUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!targetUser[0]) {
        throw new Error("Benutzer mit dieser E-Mail nicht gefunden. Der Benutzer muss sich zuerst registrieren.");
      }

      // Prüfen ob bereits zugeordnet
      const existing = await db
        .select()
        .from(userUnternehmen)
        .where(
          and(
            eq(userUnternehmen.userId, targetUser[0].id),
            eq(userUnternehmen.unternehmenId, input.unternehmenId)
          )
        )
        .limit(1);

      if (existing[0]) {
        throw new Error("Benutzer ist bereits diesem Unternehmen zugeordnet");
      }

      // Zuordnung erstellen
      await db.insert(userUnternehmen).values({
        userId: targetUser[0].id,
        unternehmenId: input.unternehmenId,
        rolle: input.rolle,
      });

      // Aktivität protokollieren
      await logAktivitaet(ctx.user.id, "benutzer_hinzugefuegt", {
        unternehmenId: input.unternehmenId,
        entitaetTyp: "benutzer",
        entitaetId: targetUser[0].id,
        entitaetName: targetUser[0].name || targetUser[0].email || "Unbekannt",
        details: `Rolle: ${input.rolle}`,
      });

      return { success: true };
    }),

  // Benutzerrolle ändern
  updateRolle: protectedProcedure
    .input(
      z.object({
        zuordnungId: z.number(),
        unternehmenId: z.number(),
        rolle: z.enum(["admin", "buchhalter", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Prüfen ob der aktuelle Benutzer Admin ist
      const istAdmin = await hatBerechtigung(ctx.user.id, input.unternehmenId, "benutzer", "bearbeiten");
      if (!istAdmin) {
        throw new Error("Keine Berechtigung zum Ändern von Benutzerrollen");
      }

      // Zuordnung abrufen für Protokoll
      const zuordnung = await db
        .select()
        .from(userUnternehmen)
        .innerJoin(users, eq(userUnternehmen.userId, users.id))
        .where(eq(userUnternehmen.id, input.zuordnungId))
        .limit(1);

      await db
        .update(userUnternehmen)
        .set({ rolle: input.rolle })
        .where(eq(userUnternehmen.id, input.zuordnungId));

      // Aktivität protokollieren
      if (zuordnung[0]) {
        await logAktivitaet(ctx.user.id, "rolle_geaendert", {
          unternehmenId: input.unternehmenId,
          entitaetTyp: "benutzer",
          entitaetId: zuordnung[0].users.id,
          entitaetName: zuordnung[0].users.name || zuordnung[0].users.email || "Unbekannt",
          details: `Neue Rolle: ${input.rolle}`,
        });
      }

      return { success: true };
    }),

  // Benutzer aus Unternehmen entfernen
  removeFromUnternehmen: protectedProcedure
    .input(
      z.object({
        zuordnungId: z.number(),
        unternehmenId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Prüfen ob der aktuelle Benutzer Admin ist
      const istAdmin = await hatBerechtigung(ctx.user.id, input.unternehmenId, "benutzer", "loeschen");
      if (!istAdmin) {
        throw new Error("Keine Berechtigung zum Entfernen von Benutzern");
      }

      // Zuordnung abrufen für Protokoll
      const zuordnung = await db
        .select()
        .from(userUnternehmen)
        .innerJoin(users, eq(userUnternehmen.userId, users.id))
        .where(eq(userUnternehmen.id, input.zuordnungId))
        .limit(1);

      // Prüfen ob es der letzte Admin ist
      if (zuordnung[0]?.user_unternehmen.rolle === "admin") {
        const adminCount = await db
          .select()
          .from(userUnternehmen)
          .where(
            and(
              eq(userUnternehmen.unternehmenId, input.unternehmenId),
              eq(userUnternehmen.rolle, "admin")
            )
          );

        if (adminCount.length <= 1) {
          throw new Error("Das Unternehmen muss mindestens einen Administrator haben");
        }
      }

      await db.delete(userUnternehmen).where(eq(userUnternehmen.id, input.zuordnungId));

      // Aktivität protokollieren
      if (zuordnung[0]) {
        await logAktivitaet(ctx.user.id, "benutzer_entfernt", {
          unternehmenId: input.unternehmenId,
          entitaetTyp: "benutzer",
          entitaetId: zuordnung[0].users.id,
          entitaetName: zuordnung[0].users.name || zuordnung[0].users.email || "Unbekannt",
        });
      }

      return { success: true };
    }),

  // Eigene Berechtigungen für ein Unternehmen abrufen
  meineBerechtigungen: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const zuordnung = await db
        .select()
        .from(userUnternehmen)
        .where(
          and(
            eq(userUnternehmen.userId, ctx.user.id),
            eq(userUnternehmen.unternehmenId, input.unternehmenId)
          )
        )
        .limit(1);

      if (!zuordnung[0]) return null;

      const rolle = zuordnung[0].rolle as keyof typeof STANDARD_BERECHTIGUNGEN;
      return {
        rolle,
        berechtigungen: STANDARD_BERECHTIGUNGEN[rolle],
      };
    }),
});

// ============================================
// AKTIVITÄTSPROTOKOLL ROUTER
// ============================================
export const protokollRouter = router({
  // Aktivitäten eines Unternehmens abrufen
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
        aktion: z.string().optional(),
        userId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      // Prüfen ob Benutzer Protokoll lesen darf
      const darfLesen = await hatBerechtigung(ctx.user.id, input.unternehmenId, "protokoll", "lesen");
      if (!darfLesen) {
        throw new Error("Keine Berechtigung zum Anzeigen des Aktivitätsprotokolls");
      }

      const aktivitaeten = await db
        .select({
          protokoll: aktivitaetsprotokoll,
          user: users,
        })
        .from(aktivitaetsprotokoll)
        .leftJoin(users, eq(aktivitaetsprotokoll.userId, users.id))
        .where(eq(aktivitaetsprotokoll.unternehmenId, input.unternehmenId))
        .orderBy(desc(aktivitaetsprotokoll.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        items: aktivitaeten.map((a) => ({
          id: a.protokoll.id,
          aktion: a.protokoll.aktion,
          entitaetTyp: a.protokoll.entitaetTyp,
          entitaetId: a.protokoll.entitaetId,
          entitaetName: a.protokoll.entitaetName,
          details: a.protokoll.details,
          createdAt: a.protokoll.createdAt,
          user: {
            id: a.user?.id,
            name: a.user?.name,
            email: a.user?.email,
          },
        })),
        total: aktivitaeten.length,
      };
    }),

  // Globales Protokoll (alle Unternehmen des Benutzers)
  listGlobal: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      // Alle Unternehmen des Benutzers abrufen
      const meineUnternehmen = await db
        .select({ unternehmenId: userUnternehmen.unternehmenId })
        .from(userUnternehmen)
        .where(eq(userUnternehmen.userId, ctx.user.id));

      if (meineUnternehmen.length === 0) return [];

      const unternehmenIds = meineUnternehmen.map((u) => u.unternehmenId);

      // Aktivitäten aller Unternehmen abrufen
      const aktivitaeten = await db
        .select({
          protokoll: aktivitaetsprotokoll,
          user: users,
          unternehmen: unternehmen,
        })
        .from(aktivitaetsprotokoll)
        .leftJoin(users, eq(aktivitaetsprotokoll.userId, users.id))
        .leftJoin(unternehmen, eq(aktivitaetsprotokoll.unternehmenId, unternehmen.id))
        .orderBy(desc(aktivitaetsprotokoll.createdAt))
        .limit(input.limit);

      // Filtern nach Benutzer-Unternehmen
      return aktivitaeten
        .filter((a) => a.protokoll.unternehmenId && unternehmenIds.includes(a.protokoll.unternehmenId))
        .map((a) => ({
          id: a.protokoll.id,
          aktion: a.protokoll.aktion,
          entitaetTyp: a.protokoll.entitaetTyp,
          entitaetName: a.protokoll.entitaetName,
          details: a.protokoll.details,
          createdAt: a.protokoll.createdAt,
          user: {
            name: a.user?.name,
            email: a.user?.email,
          },
          unternehmen: {
            id: a.unternehmen?.id,
            name: a.unternehmen?.name,
          },
        }));
    }),
});

// ============================================
// BERECHTIGUNGEN ROUTER
// ============================================
export const berechtigungenRouter = router({
  // Standard-Berechtigungen abrufen
  getStandard: protectedProcedure.query(() => {
    return STANDARD_BERECHTIGUNGEN;
  }),

  // Rollen-Übersicht
  getRollen: protectedProcedure.query(() => {
    return [
      {
        id: "admin",
        name: "Administrator",
        beschreibung: "Voller Zugriff auf alle Funktionen, kann Benutzer verwalten",
      },
      {
        id: "buchhalter",
        name: "Buchhalter",
        beschreibung: "Kann Buchungen und Stammdaten erstellen und bearbeiten, aber nicht löschen",
      },
      {
        id: "viewer",
        name: "Nur Lesen",
        beschreibung: "Kann alle Daten einsehen, aber keine Änderungen vornehmen",
      },
    ];
  }),
});
