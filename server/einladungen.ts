import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { einladungen, userUnternehmen, users, unternehmen } from "../drizzle/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

// Hilfsfunktion: Einladungscode generieren
function generateInviteCode(): string {
  return randomUUID().replace(/-/g, "");
}

// Hilfsfunktion: Ablaufdatum berechnen (7 Tage)
function getExpirationDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

export const einladungenRouter = router({
  // Einladung erstellen
  create: protectedProcedure
    .input(z.object({
      email: z.string().email("Ungültige E-Mail-Adresse"),
      unternehmenId: z.number().int().positive(),
      rolle: z.enum(["admin", "buchhalter", "viewer"]).default("buchhalter"),
      nachricht: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      // Prüfen ob Benutzer Admin für dieses Unternehmen ist
      const userRoles = await db
        .select()
        .from(userUnternehmen)
        .where(
          and(
            eq(userUnternehmen.userId, ctx.user.id),
            eq(userUnternehmen.unternehmenId, input.unternehmenId),
            eq(userUnternehmen.rolle, "admin")
          )
        );

      if (userRoles.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur Administratoren können Einladungen versenden",
        });
      }

      // Prüfen ob bereits eine aktive Einladung für diese E-Mail existiert
      const existingInvites = await db
        .select()
        .from(einladungen)
        .where(
          and(
            eq(einladungen.email, input.email),
            eq(einladungen.unternehmenId, input.unternehmenId),
            eq(einladungen.status, "pending")
          )
        );

      const activeInvite = existingInvites.find(inv => new Date() < inv.expiresAt);
      if (activeInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Es existiert bereits eine aktive Einladung für diese E-Mail-Adresse",
        });
      }

      // Prüfen ob Benutzer bereits Mitglied ist
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (existingUsers.length > 0) {
        const existingMemberships = await db
          .select()
          .from(userUnternehmen)
          .where(
            and(
              eq(userUnternehmen.userId, existingUsers[0].id),
              eq(userUnternehmen.unternehmenId, input.unternehmenId)
            )
          );

        if (existingMemberships.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Dieser Benutzer ist bereits Mitglied dieses Unternehmens",
          });
        }
      }

      // Einladung erstellen
      const code = generateInviteCode();
      const expiresAt = getExpirationDate();

      const [result] = await db.insert(einladungen).values({
        code,
        email: input.email,
        unternehmenId: input.unternehmenId,
        rolle: input.rolle,
        eingeladenVon: ctx.user.id,
        expiresAt,
        nachricht: input.nachricht,
      });

      // Unternehmensdaten für E-Mail abrufen
      const companies = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId));

      return {
        id: result.insertId,
        code,
        email: input.email,
        expiresAt,
        inviteUrl: `/einladung/${code}`,
        unternehmensname: companies[0]?.name || "Unbekannt",
      };
    }),

  // Einladungen für ein Unternehmen abrufen
  listByUnternehmen: protectedProcedure
    .input(z.object({
      unternehmenId: z.number().int().positive(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Prüfen ob Benutzer Zugriff auf dieses Unternehmen hat
      const userRoles = await db
        .select()
        .from(userUnternehmen)
        .where(
          and(
            eq(userUnternehmen.userId, ctx.user.id),
            eq(userUnternehmen.unternehmenId, input.unternehmenId)
          )
        );

      if (userRoles.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Kein Zugriff auf dieses Unternehmen",
        });
      }

      const invites = await db
        .select()
        .from(einladungen)
        .where(eq(einladungen.unternehmenId, input.unternehmenId))
        .orderBy(desc(einladungen.createdAt));

      // Einladende Benutzer abrufen
      const invitesWithUsers = await Promise.all(
        invites.map(async (invite) => {
          const inviters = await db
            .select()
            .from(users)
            .where(eq(users.id, invite.eingeladenVon));
          return {
            ...invite,
            eingeladenVonName: inviters[0]?.name || inviters[0]?.email || "Unbekannt",
          };
        })
      );

      return invitesWithUsers;
    }),

  // Einladung per Code abrufen (öffentlich)
  getByCode: publicProcedure
    .input(z.object({
      code: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      const invites = await db
        .select()
        .from(einladungen)
        .where(eq(einladungen.code, input.code));

      if (invites.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden",
        });
      }

      const invite = invites[0];

      // Unternehmensdaten abrufen
      const companies = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, invite.unternehmenId));

      // Einladenden Benutzer abrufen
      const inviters = await db
        .select()
        .from(users)
        .where(eq(users.id, invite.eingeladenVon));

      // Prüfen ob abgelaufen
      const isExpired = new Date() > invite.expiresAt;
      const effectiveStatus = isExpired && invite.status === "pending" ? "expired" : invite.status;

      return {
        id: invite.id,
        email: invite.email,
        rolle: invite.rolle,
        status: effectiveStatus,
        nachricht: invite.nachricht,
        expiresAt: invite.expiresAt,
        unternehmensname: companies[0]?.name || "Unbekannt",
        unternehmensfarbe: companies[0]?.farbe || "#0d9488",
        eingeladenVonName: inviters[0]?.name || inviters[0]?.email || "Unbekannt",
      };
    }),

  // Einladung annehmen
  accept: protectedProcedure
    .input(z.object({
      code: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      const invites = await db
        .select()
        .from(einladungen)
        .where(eq(einladungen.code, input.code));

      if (invites.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden",
        });
      }

      const invite = invites[0];

      // Prüfen ob abgelaufen
      if (new Date() > invite.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Diese Einladung ist abgelaufen",
        });
      }

      // Prüfen ob bereits verwendet
      if (invite.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Diese Einladung wurde bereits verwendet oder storniert",
        });
      }

      // Prüfen ob E-Mail übereinstimmt
      if (ctx.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Diese Einladung ist für eine andere E-Mail-Adresse bestimmt",
        });
      }

      // Prüfen ob bereits Mitglied
      const existingMemberships = await db
        .select()
        .from(userUnternehmen)
        .where(
          and(
            eq(userUnternehmen.userId, ctx.user.id),
            eq(userUnternehmen.unternehmenId, invite.unternehmenId)
          )
        );

      if (existingMemberships.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Sie sind bereits Mitglied dieses Unternehmens",
        });
      }

      // Benutzer zum Unternehmen hinzufügen
      await db.insert(userUnternehmen).values({
        userId: ctx.user.id,
        unternehmenId: invite.unternehmenId,
        rolle: invite.rolle,
      });

      // Einladung als angenommen markieren
      await db.update(einladungen)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
          acceptedBy: ctx.user.id,
        })
        .where(eq(einladungen.id, invite.id));

      // Unternehmensdaten abrufen
      const companies = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, invite.unternehmenId));

      return {
        success: true,
        unternehmensname: companies[0]?.name || "Unbekannt",
        rolle: invite.rolle,
      };
    }),

  // Einladung stornieren
  cancel: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      const invites = await db
        .select()
        .from(einladungen)
        .where(eq(einladungen.id, input.id));

      if (invites.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden",
        });
      }

      const invite = invites[0];

      // Prüfen ob Benutzer Admin für dieses Unternehmen ist
      const userRoles = await db
        .select()
        .from(userUnternehmen)
        .where(
          and(
            eq(userUnternehmen.userId, ctx.user.id),
            eq(userUnternehmen.unternehmenId, invite.unternehmenId),
            eq(userUnternehmen.rolle, "admin")
          )
        );

      if (userRoles.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur Administratoren können Einladungen stornieren",
        });
      }

      if (invite.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Diese Einladung kann nicht mehr storniert werden",
        });
      }

      await db.update(einladungen)
        .set({ status: "cancelled" })
        .where(eq(einladungen.id, input.id));

      return { success: true };
    }),

  // Einladung erneut senden
  resend: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      const invites = await db
        .select()
        .from(einladungen)
        .where(eq(einladungen.id, input.id));

      if (invites.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einladung nicht gefunden",
        });
      }

      const invite = invites[0];

      // Prüfen ob Benutzer Admin für dieses Unternehmen ist
      const userRoles = await db
        .select()
        .from(userUnternehmen)
        .where(
          and(
            eq(userUnternehmen.userId, ctx.user.id),
            eq(userUnternehmen.unternehmenId, invite.unternehmenId),
            eq(userUnternehmen.rolle, "admin")
          )
        );

      if (userRoles.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur Administratoren können Einladungen erneut senden",
        });
      }

      // Neuen Code und Ablaufdatum generieren
      const newCode = generateInviteCode();
      const newExpiresAt = getExpirationDate();

      await db.update(einladungen)
        .set({
          code: newCode,
          expiresAt: newExpiresAt,
          status: "pending",
        })
        .where(eq(einladungen.id, input.id));

      // Unternehmensdaten abrufen
      const companies = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, invite.unternehmenId));

      return {
        code: newCode,
        expiresAt: newExpiresAt,
        inviteUrl: `/einladung/${newCode}`,
        unternehmensname: companies[0]?.name || "Unbekannt",
      };
    }),
});
