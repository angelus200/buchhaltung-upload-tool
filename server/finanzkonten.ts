import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { finanzkonten, sachkonten, buchungen, unternehmen } from "../drizzle/schema";
import { eq, and, desc, sql, like, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ============================================
// FINANZKONTEN - Verwaltung von Bankkonten, Kreditkarten, Brokern, etc.
// ============================================

export const finanzkontenRouter = router({
  /**
   * Liste aller Finanzkonten eines Unternehmens
   */
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number().int().positive(),
        nurAktive: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      // Verify access
      const companies = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (companies.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Unternehmen nicht gefunden",
        });
      }

      // Build filters
      const filters = [eq(finanzkonten.unternehmenId, input.unternehmenId)];
      if (input.nurAktive) {
        filters.push(eq(finanzkonten.aktiv, true));
      }

      // Get finanzkonten with optional sachkonto join
      const result = await db
        .select({
          finanzkonto: finanzkonten,
          sachkonto: sachkonten,
        })
        .from(finanzkonten)
        .leftJoin(sachkonten, eq(finanzkonten.sachkontoId, sachkonten.id))
        .where(and(...filters))
        .orderBy(desc(finanzkonten.createdAt));

      return result;
    }),

  /**
   * Ein einzelnes Finanzkonto abrufen
   */
  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      const result = await db
        .select({
          finanzkonto: finanzkonten,
          sachkonto: sachkonten,
        })
        .from(finanzkonten)
        .leftJoin(sachkonten, eq(finanzkonten.sachkontoId, sachkonten.id))
        .where(eq(finanzkonten.id, input.id))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Finanzkonto nicht gefunden",
        });
      }

      return result[0];
    }),

  /**
   * Neues Finanzkonto erstellen
   */
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number().int().positive(),
        sachkontoId: z.number().int().positive().optional(),
        typ: z.enum(["bank", "kreditkarte", "broker", "kasse", "paypal", "stripe", "sonstiges"]),
        name: z.string().min(1, "Name ist erforderlich"),
        kontonummer: z.string().optional(),
        iban: z.string().optional(),
        bic: z.string().optional(),
        bankName: z.string().optional(),
        kreditkartenNummer: z.string().optional(),
        kreditlimit: z.string().optional(), // Decimal als String
        abrechnungstag: z.number().int().min(1).max(31).optional(),
        depotNummer: z.string().optional(),
        brokerName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        waehrung: z.string().length(3).default("EUR"),
        aktiv: z.boolean().default(true),
        notizen: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      // Verify access to company
      const companies = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (companies.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Unternehmen nicht gefunden",
        });
      }

      // Insert finanzkonto
      const [result] = await db.insert(finanzkonten).values({
        unternehmenId: input.unternehmenId,
        sachkontoId: input.sachkontoId || null,
        typ: input.typ,
        name: input.name,
        kontonummer: input.kontonummer || null,
        iban: input.iban || null,
        bic: input.bic || null,
        bankName: input.bankName || null,
        kreditkartenNummer: input.kreditkartenNummer || null,
        kreditlimit: input.kreditlimit || null,
        abrechnungstag: input.abrechnungstag || null,
        depotNummer: input.depotNummer || null,
        brokerName: input.brokerName || null,
        email: input.email || null,
        waehrung: input.waehrung,
        aktiv: input.aktiv,
        notizen: input.notizen || null,
      });

      return {
        success: true,
        id: result.insertId,
        message: "Finanzkonto erfolgreich erstellt",
      };
    }),

  /**
   * Finanzkonto aktualisieren
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        unternehmenId: z.number().int().positive(), // 🔒 ADDED for security check
        sachkontoId: z.number().int().positive().optional(),
        typ: z.enum(["bank", "kreditkarte", "broker", "kasse", "paypal", "stripe", "sonstiges"]),
        name: z.string().min(1, "Name ist erforderlich"),
        kontonummer: z.string().optional(),
        iban: z.string().optional(),
        bic: z.string().optional(),
        bankName: z.string().optional(),
        kreditkartenNummer: z.string().optional(),
        kreditlimit: z.string().optional(),
        abrechnungstag: z.number().int().min(1).max(31).optional(),
        depotNummer: z.string().optional(),
        brokerName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        waehrung: z.string().length(3),
        aktiv: z.boolean(),
        notizen: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      // Check if exists
      const existing = await db
        .select()
        .from(finanzkonten)
        .where(eq(finanzkonten.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Finanzkonto nicht gefunden",
        });
      }

      // 🔒 SECURITY: Verify unternehmenId match (prevent cross-company editing)
      if (existing[0].unternehmenId !== input.unternehmenId) {
        console.error("🚨 SECURITY: Attempt to edit Finanzkonto from different company!", {
          existingCompanyId: existing[0].unternehmenId,
          requestedCompanyId: input.unternehmenId,
          finanzkontoId: input.id,
        });
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sie haben keine Berechtigung, dieses Finanzkonto zu bearbeiten",
        });
      }

      console.log("✅ UPDATE Finanzkonto:", input.id, "| Company:", existing[0].unternehmenId);

      // Update
      await db
        .update(finanzkonten)
        .set({
          sachkontoId: input.sachkontoId || null,
          typ: input.typ,
          name: input.name,
          kontonummer: input.kontonummer || null,
          iban: input.iban || null,
          bic: input.bic || null,
          bankName: input.bankName || null,
          kreditkartenNummer: input.kreditkartenNummer || null,
          kreditlimit: input.kreditlimit || null,
          abrechnungstag: input.abrechnungstag || null,
          depotNummer: input.depotNummer || null,
          brokerName: input.brokerName || null,
          email: input.email || null,
          waehrung: input.waehrung,
          aktiv: input.aktiv,
          notizen: input.notizen || null,
        })
        .where(eq(finanzkonten.id, input.id));

      return {
        success: true,
        message: "Finanzkonto erfolgreich aktualisiert",
      };
    }),

  /**
   * Finanzkonto löschen (soft delete durch aktiv = false)
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        unternehmenId: z.number().int().positive(), // 🔒 ADDED for security check
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      // Check if exists
      const existing = await db
        .select()
        .from(finanzkonten)
        .where(eq(finanzkonten.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Finanzkonto nicht gefunden",
        });
      }

      // 🔒 SECURITY: Verify unternehmenId match (prevent cross-company deletion)
      if (existing[0].unternehmenId !== input.unternehmenId) {
        console.error("🚨 SECURITY: Attempt to delete Finanzkonto from different company!", {
          existingCompanyId: existing[0].unternehmenId,
          requestedCompanyId: input.unternehmenId,
          finanzkontoId: input.id,
        });
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sie haben keine Berechtigung, dieses Finanzkonto zu löschen",
        });
      }

      console.log("✅ DELETE Finanzkonto:", input.id, "| Company:", existing[0].unternehmenId);

      // Soft delete
      await db
        .update(finanzkonten)
        .set({ aktiv: false })
        .where(eq(finanzkonten.id, input.id));

      return {
        success: true,
        message: "Finanzkonto erfolgreich deaktiviert",
      };
    }),

  /**
   * Auto-Migration: Konvertiere Sachkonten 1200-1800 (Bankkonten) zu Finanzkonten
   */
  autoMigration: router({
    /**
     * Berechne mögliche Finanzkonten aus Sachkonten
     */
    berechnen: protectedProcedure
      .input(z.object({ unternehmenId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Datenbankverbindung nicht verfügbar",
          });
        }

        // Get Sachkonten in range 1200-1800 (Bank accounts in SKR04)
        const bankSachkonten = await db
          .select()
          .from(sachkonten)
          .where(
            and(
              eq(sachkonten.unternehmenId, input.unternehmenId),
              sql`CAST(${sachkonten.kontonummer} AS UNSIGNED) BETWEEN 1200 AND 1800`
            )
          )
          .orderBy(sachkonten.kontonummer);

        // Check if already migrated (exists in finanzkonten)
        const existingFinanzkonten = await db
          .select()
          .from(finanzkonten)
          .where(eq(finanzkonten.unternehmenId, input.unternehmenId));

        const existingSachkontoIds = new Set(
          existingFinanzkonten
            .map((fk) => fk.sachkontoId)
            .filter((id): id is number => id !== null)
        );

        // For each Sachkonto, check usage in buchungen
        const migrationCandidates = await Promise.all(
          bankSachkonten.map(async (sk) => {
            const isAlreadyMigrated = existingSachkontoIds.has(sk.id);

            // Count usage in buchungen
            const usage = await db
              .select({
                anzahl: sql<number>`COUNT(*)`,
                letzteBuchung: sql<Date>`MAX(${buchungen.belegdatum})`,
              })
              .from(buchungen)
              .where(
                and(
                  eq(buchungen.unternehmenId, input.unternehmenId),
                  eq(buchungen.sachkonto, sk.kontonummer)
                )
              );

            const anzahlBuchungen = Number(usage[0]?.anzahl || 0);
            const letzteBuchung = usage[0]?.letzteBuchung;

            // Determine typ based on kontonummer
            let typ: "bank" | "kasse" | "sonstiges" = "bank";
            const kontoNum = parseInt(sk.kontonummer, 10);

            if (kontoNum >= 1600 && kontoNum < 1700) {
              typ = "kasse"; // Kassenkonten
            } else if (kontoNum >= 1200 && kontoNum < 1600) {
              typ = "bank"; // Bankkonten
            }

            return {
              sachkonto: sk,
              vorschlag: {
                typ,
                name: sk.bezeichnung,
                waehrung: "EUR",
              },
              statistik: {
                anzahlBuchungen,
                letzteBuchung,
                isAlreadyMigrated,
              },
            };
          })
        );

        // Filter: Only unmigrated accounts
        const zuMigrieren = migrationCandidates.filter(
          (candidate) => !candidate.statistik.isAlreadyMigrated
        );

        return {
          gesamt: bankSachkonten.length,
          bereitsmigriert: migrationCandidates.filter((c) => c.statistik.isAlreadyMigrated)
            .length,
          zuMigrieren: zuMigrieren.length,
          kandidaten: zuMigrieren,
        };
      }),

    /**
     * Migration durchführen
     */
    migrieren: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number().int().positive(),
          sachkontoIds: z.array(z.number().int().positive()),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Datenbankverbindung nicht verfügbar",
          });
        }

        if (input.sachkontoIds.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Keine Sachkonten zum Migrieren ausgewählt",
          });
        }

        // Get selected Sachkonten
        const selectedSachkonten = await db
          .select()
          .from(sachkonten)
          .where(
            and(
              eq(sachkonten.unternehmenId, input.unternehmenId),
              inArray(sachkonten.id, input.sachkontoIds)
            )
          );

        const erfolge: number[] = [];
        const fehler: Array<{ sachkontoId: number; error: string }> = [];

        for (const sk of selectedSachkonten) {
          try {
            // Determine typ
            let typ: "bank" | "kasse" | "sonstiges" = "bank";
            const kontoNum = parseInt(sk.kontonummer, 10);

            if (kontoNum >= 1600 && kontoNum < 1700) {
              typ = "kasse";
            } else if (kontoNum >= 1200 && kontoNum < 1600) {
              typ = "bank";
            }

            // Insert Finanzkonto
            await db.insert(finanzkonten).values({
              unternehmenId: input.unternehmenId,
              sachkontoId: sk.id,
              typ,
              name: sk.bezeichnung,
              waehrung: "EUR",
              aktiv: true,
              notizen: `Automatisch migriert von Sachkonto ${sk.kontonummer}`,
            });

            erfolge.push(sk.id);
          } catch (error) {
            console.error(`Fehler beim Migrieren von Sachkonto ${sk.id}:`, error);
            fehler.push({
              sachkontoId: sk.id,
              error: error instanceof Error ? error.message : "Unbekannter Fehler",
            });
          }
        }

        return {
          success: true,
          migriert: erfolge.length,
          fehler: fehler.length,
          fehlerDetails: fehler,
          message: `${erfolge.length} von ${selectedSachkonten.length} Sachkonten erfolgreich migriert`,
        };
      }),
  }),

  // ============================================
  // KREDITKARTEN
  // ============================================
  creditCards: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const results: any = await db.execute(
          sql`SELECT * FROM credit_cards WHERE unternehmenId = ${input.unternehmenId} ORDER BY name`
        );
        return (results[0] || []) as any[];
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const results: any = await db.execute(
          sql`SELECT * FROM credit_cards WHERE id = ${input.id} LIMIT 1`
        );
        return ((results[0] || []) as any[])[0] || null;
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          name: z.string(),
          provider: z.string(),
          lastFour: z.string().optional(),
          creditLimit: z.number().optional(),
          billingDay: z.number().optional(),
          currency: z.string().default("EUR"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        await db.execute(
          sql`INSERT INTO credit_cards (unternehmenId, name, provider, lastFour, creditLimit, billingDay, currency, notes)
              VALUES (${input.unternehmenId}, ${input.name}, ${input.provider}, ${input.lastFour || null},
                      ${input.creditLimit || null}, ${input.billingDay || null}, ${input.currency}, ${input.notes || null})`
        );

        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          provider: z.string().optional(),
          lastFour: z.string().optional(),
          creditLimit: z.number().optional(),
          billingDay: z.number().optional(),
          currency: z.string().optional(),
          notes: z.string().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        const updates: string[] = [];
        const values: any[] = [];

        if (input.name !== undefined) { updates.push("name = ?"); values.push(input.name); }
        if (input.provider !== undefined) { updates.push("provider = ?"); values.push(input.provider); }
        if (input.lastFour !== undefined) { updates.push("lastFour = ?"); values.push(input.lastFour); }
        if (input.creditLimit !== undefined) { updates.push("creditLimit = ?"); values.push(input.creditLimit); }
        if (input.billingDay !== undefined) { updates.push("billingDay = ?"); values.push(input.billingDay); }
        if (input.currency !== undefined) { updates.push("currency = ?"); values.push(input.currency); }
        if (input.notes !== undefined) { updates.push("notes = ?"); values.push(input.notes); }
        if (input.active !== undefined) { updates.push("active = ?"); values.push(input.active ? 1 : 0); }

        if (updates.length > 0) {
          // Dynamisches UPDATE mit Parametern
          const setClauses = [];
          if (input.name !== undefined) setClauses.push(sql`name = ${input.name}`);
          if (input.provider !== undefined) setClauses.push(sql`provider = ${input.provider}`);
          if (input.lastFour !== undefined) setClauses.push(sql`lastFour = ${input.lastFour}`);
          if (input.creditLimit !== undefined) setClauses.push(sql`creditLimit = ${input.creditLimit}`);
          if (input.billingDay !== undefined) setClauses.push(sql`billingDay = ${input.billingDay}`);
          if (input.currency !== undefined) setClauses.push(sql`currency = ${input.currency}`);
          if (input.notes !== undefined) setClauses.push(sql`notes = ${input.notes}`);
          if (input.active !== undefined) setClauses.push(sql`active = ${input.active ? 1 : 0}`);

          if (setClauses.length > 0) {
            await db.execute(sql`UPDATE credit_cards SET ${sql.join(setClauses, sql`, `)} WHERE id = ${input.id}`);
          }
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        await db.execute(sql`DELETE FROM credit_cards WHERE id = ${input.id}`);
        return { success: true };
      }),
  }),

  // ============================================
  // ZAHLUNGSDIENSTLEISTER
  // ============================================
  paymentProviders: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const results: any = await db.execute(
          sql`SELECT * FROM payment_providers WHERE unternehmenId = ${input.unternehmenId} ORDER BY name`
        );
        return (results[0] || []) as any[];
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const results: any = await db.execute(
          sql`SELECT * FROM payment_providers WHERE id = ${input.id} LIMIT 1`
        );
        return ((results[0] || []) as any[])[0] || null;
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          name: z.string(),
          provider: z.string(),
          accountId: z.string().optional(),
          feePercent: z.number().optional(),
          currency: z.string().default("EUR"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        await db.execute(
          sql`INSERT INTO payment_providers (unternehmenId, name, provider, accountId, feePercent, currency, notes)
              VALUES (${input.unternehmenId}, ${input.name}, ${input.provider}, ${input.accountId || null},
                      ${input.feePercent || null}, ${input.currency}, ${input.notes || null})`
        );

        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          provider: z.string().optional(),
          accountId: z.string().optional(),
          feePercent: z.number().optional(),
          currency: z.string().optional(),
          notes: z.string().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        const setClauses = [];
        if (input.name !== undefined) setClauses.push(sql`name = ${input.name}`);
        if (input.provider !== undefined) setClauses.push(sql`provider = ${input.provider}`);
        if (input.accountId !== undefined) setClauses.push(sql`accountId = ${input.accountId}`);
        if (input.feePercent !== undefined) setClauses.push(sql`feePercent = ${input.feePercent}`);
        if (input.currency !== undefined) setClauses.push(sql`currency = ${input.currency}`);
        if (input.notes !== undefined) setClauses.push(sql`notes = ${input.notes}`);
        if (input.active !== undefined) setClauses.push(sql`active = ${input.active ? 1 : 0}`);

        if (setClauses.length > 0) {
          await db.execute(sql`UPDATE payment_providers SET ${sql.join(setClauses, sql`, `)} WHERE id = ${input.id}`);
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        await db.execute(sql`DELETE FROM payment_providers WHERE id = ${input.id}`);
        return { success: true };
      }),
  }),

  // ============================================
  // BROKERKONTEN
  // ============================================
  brokerAccounts: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const results: any = await db.execute(
          sql`SELECT * FROM broker_accounts WHERE unternehmenId = ${input.unternehmenId} ORDER BY name`
        );
        return (results[0] || []) as any[];
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const results: any = await db.execute(
          sql`SELECT * FROM broker_accounts WHERE id = ${input.id} LIMIT 1`
        );
        return ((results[0] || []) as any[])[0] || null;
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          name: z.string(),
          broker: z.string(),
          depotNumber: z.string().optional(),
          clearingAccount: z.string().optional(),
          currency: z.string().default("EUR"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        await db.execute(
          sql`INSERT INTO broker_accounts (unternehmenId, name, broker, depotNumber, clearingAccount, currency, notes)
              VALUES (${input.unternehmenId}, ${input.name}, ${input.broker}, ${input.depotNumber || null},
                      ${input.clearingAccount || null}, ${input.currency}, ${input.notes || null})`
        );

        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          broker: z.string().optional(),
          depotNumber: z.string().optional(),
          clearingAccount: z.string().optional(),
          currency: z.string().optional(),
          notes: z.string().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        const setClauses = [];
        if (input.name !== undefined) setClauses.push(sql`name = ${input.name}`);
        if (input.broker !== undefined) setClauses.push(sql`broker = ${input.broker}`);
        if (input.depotNumber !== undefined) setClauses.push(sql`depotNumber = ${input.depotNumber}`);
        if (input.clearingAccount !== undefined) setClauses.push(sql`clearingAccount = ${input.clearingAccount}`);
        if (input.currency !== undefined) setClauses.push(sql`currency = ${input.currency}`);
        if (input.notes !== undefined) setClauses.push(sql`notes = ${input.notes}`);
        if (input.active !== undefined) setClauses.push(sql`active = ${input.active ? 1 : 0}`);

        if (setClauses.length > 0) {
          await db.execute(sql`UPDATE broker_accounts SET ${sql.join(setClauses, sql`, `)} WHERE id = ${input.id}`);
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

        await db.execute(sql`DELETE FROM broker_accounts WHERE id = ${input.id}`);
        return { success: true };
      }),
  }),
});

export type FinanzkontenRouter = typeof finanzkontenRouter;
