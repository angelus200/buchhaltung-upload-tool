import { z } from "zod";
import { eq, and, sql, sum } from "drizzle-orm";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  anlagevermoegen,
  bankkonten,
  beteiligungen,
  gesellschafter,
  eroeffnungsbilanz,
  buchungen,
  InsertAnlagevermoegen,
  InsertBankkonto,
  InsertBeteiligung,
  InsertGesellschafter,
  InsertEroeffnungsbilanz,
} from "../drizzle/schema";

// ============================================
// JAHRESABSCHLUSS ROUTER
// ============================================
export const jahresabschlussRouter = router({
  // ============================================
  // ANLAGEVERMÖGEN
  // ============================================
  anlagevermoegen: router({
    // Liste aller Anlagegüter
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(anlagevermoegen)
          .where(eq(anlagevermoegen.unternehmenId, input.unternehmenId));
      }),

    // Einzelnes Anlagegut abrufen
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db
          .select()
          .from(anlagevermoegen)
          .where(eq(anlagevermoegen.id, input.id))
          .limit(1);
        return result[0] || null;
      }),

    // Anlagegut erstellen
    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          bezeichnung: z.string(),
          kategorie: z.string().optional(),
          anschaffungsdatum: z.string().optional(),
          anschaffungskosten: z.string().optional(),
          nutzungsdauer: z.number().optional(),
          abschreibungsmethode: z.enum(["linear", "degressiv", "keine"]).optional(),
          restwert: z.string().optional(),
          sachkonto: z.string().optional(),
          standort: z.string().optional(),
          inventarnummer: z.string().optional(),
          seriennummer: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { anschaffungsdatum, ...rest } = input;
        const values: InsertAnlagevermoegen = {
          ...rest,
          anschaffungsdatum: anschaffungsdatum ? new Date(anschaffungsdatum) : undefined,
        };
        const result = await db.insert(anlagevermoegen).values(values);
        return { id: result[0].insertId };
      }),

    // Anlagegut aktualisieren
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          kontonummer: z.string().optional(),
          bezeichnung: z.string().optional(),
          kategorie: z.string().optional(),
          anschaffungsdatum: z.string().optional(),
          anschaffungskosten: z.string().optional(),
          nutzungsdauer: z.number().optional(),
          abschreibungsmethode: z.enum(["linear", "degressiv", "keine"]).optional(),
          restwert: z.string().optional(),
          sachkonto: z.string().optional(),
          standort: z.string().optional(),
          inventarnummer: z.string().optional(),
          seriennummer: z.string().optional(),
          notizen: z.string().optional(),
          aktiv: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, anschaffungsdatum, ...rest } = input;
        const updateData: Record<string, unknown> = { ...rest };
        if (anschaffungsdatum) {
          updateData.anschaffungsdatum = new Date(anschaffungsdatum);
        }
        await db
          .update(anlagevermoegen)
          .set(updateData)
          .where(eq(anlagevermoegen.id, id));
        return { success: true };
      }),

    // Anlagegut löschen
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(anlagevermoegen).where(eq(anlagevermoegen.id, input.id));
        return { success: true };
      }),

    // AfA-Berechnung für ein Anlagegut
    berechneAfa: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          stichtag: z.string(), // ISO-Date String
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");

        const anlage = await db
          .select()
          .from(anlagevermoegen)
          .where(eq(anlagevermoegen.id, input.id))
          .limit(1);

        if (!anlage[0]) throw new Error("Anlagegut nicht gefunden");

        const a = anlage[0];

        // Prüfe ob AfA-Berechnung möglich
        if (!a.anschaffungsdatum || !a.anschaffungskosten || !a.nutzungsdauer) {
          return {
            error: "Anschaffungsdatum, -kosten oder Nutzungsdauer fehlen",
          };
        }

        if (a.abschreibungsmethode === "keine") {
          return {
            jahresAfa: 0,
            restwert: parseFloat(a.anschaffungskosten),
            abgeschrieben: 0,
          };
        }

        const anschaffungskosten = parseFloat(a.anschaffungskosten);
        const restwertBetrag = parseFloat(a.restwert || "0");
        const nutzungsdauer = a.nutzungsdauer;
        const anschaffungsdatum = new Date(a.anschaffungsdatum);
        const stichtag = new Date(input.stichtag);

        // Berechne Anzahl der Monate seit Anschaffung bis Stichtag
        const monateGesamt = Math.max(
          0,
          (stichtag.getFullYear() - anschaffungsdatum.getFullYear()) * 12 +
            (stichtag.getMonth() - anschaffungsdatum.getMonth())
        );

        // Lineare AfA
        if (a.abschreibungsmethode === "linear") {
          const jahresAfaBetrag = (anschaffungskosten - restwertBetrag) / nutzungsdauer;
          const gesamtAbschreibung = Math.min(
            (jahresAfaBetrag / 12) * monateGesamt,
            anschaffungskosten - restwertBetrag
          );
          const aktuellerRestwert = Math.max(
            restwertBetrag,
            anschaffungskosten - gesamtAbschreibung
          );

          return {
            methode: "linear",
            anschaffungskosten,
            nutzungsdauer,
            jahresAfa: jahresAfaBetrag,
            monatlicheAfa: jahresAfaBetrag / 12,
            monateAbgeschrieben: monateGesamt,
            abgeschrieben: gesamtAbschreibung,
            restwert: aktuellerRestwert,
            vollAbgeschrieben: aktuellerRestwert <= restwertBetrag,
          };
        }

        // Degressive AfA (vereinfacht: 20% vom Restwert pro Jahr)
        if (a.abschreibungsmethode === "degressiv") {
          const degressivSatz = 0.2; // 20% Degressivabschreibung
          let aktuellerWert = anschaffungskosten;
          let gesamtAbschreibung = 0;

          for (let monat = 0; monat < monateGesamt; monat++) {
            const monatsAfa = (aktuellerWert * degressivSatz) / 12;
            gesamtAbschreibung += monatsAfa;
            aktuellerWert -= monatsAfa;

            // Stoppe bei Restwert
            if (aktuellerWert <= restwertBetrag) {
              gesamtAbschreibung = anschaffungskosten - restwertBetrag;
              aktuellerWert = restwertBetrag;
              break;
            }
          }

          return {
            methode: "degressiv",
            anschaffungskosten,
            nutzungsdauer,
            satz: degressivSatz,
            monateAbgeschrieben: monateGesamt,
            abgeschrieben: gesamtAbschreibung,
            restwert: aktuellerWert,
            vollAbgeschrieben: aktuellerWert <= restwertBetrag,
          };
        }

        return { error: "Unbekannte Abschreibungsmethode" };
      }),

    // Anlagenspiegel - Übersicht aller Anlagegüter mit AfA
    anlagenspiegel: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          jahr: z.number(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const anlagen = await db
          .select()
          .from(anlagevermoegen)
          .where(eq(anlagevermoegen.unternehmenId, input.unternehmenId));

        const stichtag = `${input.jahr}-12-31`;

        // Berechne AfA für jedes Anlagegut
        const anlagenspiegel = await Promise.all(
          anlagen.map(async (anlage) => {
            // Berechne AfA bis Stichtag
            let afaInfo = {
              jahresAfa: 0,
              restwert: parseFloat(anlage.anschaffungskosten || "0"),
              abgeschrieben: 0,
            };

            if (
              anlage.anschaffungsdatum &&
              anlage.anschaffungskosten &&
              anlage.nutzungsdauer &&
              anlage.abschreibungsmethode !== "keine"
            ) {
              const anschaffungskosten = parseFloat(anlage.anschaffungskosten);
              const restwertBetrag = parseFloat(anlage.restwert || "0");
              const nutzungsdauer = anlage.nutzungsdauer;
              const anschaffungsdatum = new Date(anlage.anschaffungsdatum);
              const stichtagDate = new Date(stichtag);

              const monateGesamt = Math.max(
                0,
                (stichtagDate.getFullYear() - anschaffungsdatum.getFullYear()) * 12 +
                  (stichtagDate.getMonth() - anschaffungsdatum.getMonth())
              );

              if (anlage.abschreibungsmethode === "linear") {
                const jahresAfaBetrag = (anschaffungskosten - restwertBetrag) / nutzungsdauer;
                const gesamtAbschreibung = Math.min(
                  (jahresAfaBetrag / 12) * monateGesamt,
                  anschaffungskosten - restwertBetrag
                );
                const aktuellerRestwert = Math.max(
                  restwertBetrag,
                  anschaffungskosten - gesamtAbschreibung
                );

                afaInfo = {
                  jahresAfa: jahresAfaBetrag,
                  restwert: aktuellerRestwert,
                  abgeschrieben: gesamtAbschreibung,
                };
              }
            }

            return {
              id: anlage.id,
              kontonummer: anlage.kontonummer,
              bezeichnung: anlage.bezeichnung,
              kategorie: anlage.kategorie,
              anschaffungsdatum: anlage.anschaffungsdatum,
              anschaffungskosten: parseFloat(anlage.anschaffungskosten || "0"),
              nutzungsdauer: anlage.nutzungsdauer,
              abschreibungsmethode: anlage.abschreibungsmethode,
              sachkonto: anlage.sachkonto,
              ...afaInfo,
            };
          })
        );

        return anlagenspiegel;
      }),
  }),

  // ============================================
  // BANKKONTEN
  // ============================================
  bankkonten: router({
    // Liste aller Bankkonten mit Saldo
    list: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          stichtag: z.string().optional(), // ISO-Date String, default: heute
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const konten = await db
          .select()
          .from(bankkonten)
          .where(eq(bankkonten.unternehmenId, input.unternehmenId));

        const stichtag = input.stichtag || new Date().toISOString().split("T")[0];

        // Berechne Saldo für jedes Konto
        const kontenMitSaldo = await Promise.all(
          konten.map(async (konto) => {
            if (!konto.sachkonto) {
              return {
                ...konto,
                saldo: parseFloat(konto.anfangsbestand || "0"),
                buchungenAnzahl: 0,
              };
            }

            // Summiere alle Buchungen für dieses Sachkonto bis Stichtag
            const buchungenResult = await db
              .select({
                summe: sum(buchungen.bruttobetrag),
                anzahl: sql<number>`COUNT(*)`,
              })
              .from(buchungen)
              .where(
                and(
                  eq(buchungen.unternehmenId, input.unternehmenId),
                  eq(buchungen.sachkonto, konto.sachkonto),
                  sql`${buchungen.belegdatum} <= ${stichtag}`
                )
              );

            const buchungsSumme = parseFloat(buchungenResult[0]?.summe || "0");
            const anzahl = buchungenResult[0]?.anzahl || 0;
            const anfangsbestand = parseFloat(konto.anfangsbestand || "0");
            const saldo = anfangsbestand + buchungsSumme;

            return {
              ...konto,
              saldo,
              buchungenAnzahl: anzahl,
            };
          })
        );

        return kontenMitSaldo;
      }),

    // Einzelnes Bankkonto mit Saldo
    get: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          stichtag: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const konto = await db
          .select()
          .from(bankkonten)
          .where(eq(bankkonten.id, input.id))
          .limit(1);

        if (!konto[0]) return null;

        const k = konto[0];
        const stichtag = input.stichtag || new Date().toISOString().split("T")[0];

        if (!k.sachkonto) {
          return {
            ...k,
            saldo: parseFloat(k.anfangsbestand || "0"),
            buchungenAnzahl: 0,
          };
        }

        // Berechne Saldo
        const buchungenResult = await db
          .select({
            summe: sum(buchungen.bruttobetrag),
            anzahl: sql<number>`COUNT(*)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, k.unternehmenId),
              eq(buchungen.sachkonto, k.sachkonto),
              sql`${buchungen.belegdatum} <= ${stichtag}`
            )
          );

        const buchungsSumme = parseFloat(buchungenResult[0]?.summe || "0");
        const anzahl = buchungenResult[0]?.anzahl || 0;
        const anfangsbestand = parseFloat(k.anfangsbestand || "0");
        const saldo = anfangsbestand + buchungsSumme;

        return {
          ...k,
          saldo,
          buchungenAnzahl: anzahl,
        };
      }),

    // Bankkonto erstellen
    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          bezeichnung: z.string(),
          bankname: z.string().optional(),
          iban: z.string().optional(),
          bic: z.string().optional(),
          sachkonto: z.string().optional(),
          anfangsbestand: z.string().optional(),
          kontotyp: z.enum(["girokonto", "sparkonto", "festgeld", "kreditkarte", "sonstig"]).optional(),
          waehrung: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(bankkonten).values(input as InsertBankkonto);
        return { id: result[0].insertId };
      }),

    // Bankkonto aktualisieren
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          kontonummer: z.string().optional(),
          bezeichnung: z.string().optional(),
          bankname: z.string().optional(),
          iban: z.string().optional(),
          bic: z.string().optional(),
          sachkonto: z.string().optional(),
          anfangsbestand: z.string().optional(),
          kontotyp: z.enum(["girokonto", "sparkonto", "festgeld", "kreditkarte", "sonstig"]).optional(),
          waehrung: z.string().optional(),
          notizen: z.string().optional(),
          aktiv: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, ...data } = input;
        await db.update(bankkonten).set(data).where(eq(bankkonten.id, id));
        return { success: true };
      }),

    // Bankkonto löschen
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(bankkonten).where(eq(bankkonten.id, input.id));
        return { success: true };
      }),
  }),

  // ============================================
  // BETEILIGUNGEN
  // ============================================
  beteiligungen: router({
    // Liste aller Beteiligungen
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(beteiligungen)
          .where(eq(beteiligungen.unternehmenId, input.unternehmenId));
      }),

    // Beteiligung erstellen
    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          name: z.string(),
          rechtsform: z.string().optional(),
          anteil: z.string().optional(),
          buchwert: z.string().optional(),
          erwerbsdatum: z.string().optional(),
          sachkonto: z.string().optional(),
          sitz: z.string().optional(),
          handelsregister: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { erwerbsdatum, ...rest } = input;
        const values: InsertBeteiligung = {
          ...rest,
          erwerbsdatum: erwerbsdatum ? new Date(erwerbsdatum) : undefined,
        };
        const result = await db.insert(beteiligungen).values(values);
        return { id: result[0].insertId };
      }),

    // Beteiligung aktualisieren
    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, erwerbsdatum, ...rest } = input as any;
        const updateData: Record<string, unknown> = { ...rest };
        if (erwerbsdatum) {
          updateData.erwerbsdatum = new Date(erwerbsdatum);
        }
        await db.update(beteiligungen).set(updateData).where(eq(beteiligungen.id, id));
        return { success: true };
      }),

    // Beteiligung löschen
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(beteiligungen).where(eq(beteiligungen.id, input.id));
        return { success: true };
      }),
  }),

  // ============================================
  // GESELLSCHAFTER
  // ============================================
  gesellschafter: router({
    // Liste aller Gesellschafter
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(gesellschafter)
          .where(eq(gesellschafter.unternehmenId, input.unternehmenId));
      }),

    // Gesellschafter erstellen
    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          name: z.string(),
          typ: z.enum(["natuerlich", "juristisch"]).optional(),
          anteil: z.string().optional(),
          einlage: z.string().optional(),
          eintrittsdatum: z.string().optional(),
          sachkonto: z.string().optional(),
          strasse: z.string().optional(),
          plz: z.string().optional(),
          ort: z.string().optional(),
          steuerId: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { eintrittsdatum, ...rest } = input;
        const values: InsertGesellschafter = {
          ...rest,
          eintrittsdatum: eintrittsdatum ? new Date(eintrittsdatum) : undefined,
        };
        const result = await db.insert(gesellschafter).values(values);
        return { id: result[0].insertId };
      }),

    // Gesellschafter aktualisieren
    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, eintrittsdatum, ...rest } = input as any;
        const updateData: Record<string, unknown> = { ...rest };
        if (eintrittsdatum) {
          updateData.eintrittsdatum = new Date(eintrittsdatum);
        }
        await db.update(gesellschafter).set(updateData).where(eq(gesellschafter.id, id));
        return { success: true };
      }),

    // Gesellschafter löschen
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(gesellschafter).where(eq(gesellschafter.id, input.id));
        return { success: true };
      }),
  }),

  // ============================================
  // ERÖFFNUNGSBILANZ
  // ============================================
  eroeffnungsbilanz: router({
    // Liste aller Eröffnungsbilanz-Positionen
    list: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          jahr: z.number(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(eroeffnungsbilanz)
          .where(
            and(
              eq(eroeffnungsbilanz.unternehmenId, input.unternehmenId),
              eq(eroeffnungsbilanz.jahr, input.jahr)
            )
          );
      }),

    // Eröffnungsbilanz-Position erstellen
    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          jahr: z.number(),
          sachkonto: z.string(),
          kontobezeichnung: z.string().optional(),
          sollbetrag: z.string().optional(),
          habenbetrag: z.string().optional(),
          importQuelle: z.enum(["manuell", "datev", "api"]).optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const values: InsertEroeffnungsbilanz = {
          ...input,
          erstelltVon: ctx.user.id,
          importDatum: new Date(),
        };
        const result = await db.insert(eroeffnungsbilanz).values(values);
        return { id: result[0].insertId };
      }),

    // Eröffnungsbilanz-Position aktualisieren
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          sachkonto: z.string().optional(),
          kontobezeichnung: z.string().optional(),
          sollbetrag: z.string().optional(),
          habenbetrag: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, ...data } = input;
        await db.update(eroeffnungsbilanz).set(data).where(eq(eroeffnungsbilanz.id, id));
        return { success: true };
      }),

    // Eröffnungsbilanz-Position löschen
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(eroeffnungsbilanz).where(eq(eroeffnungsbilanz.id, input.id));
        return { success: true };
      }),

    // Bulk-Import von Eröffnungsbilanz-Positionen (z.B. aus DATEV)
    bulkImport: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          jahr: z.number(),
          positionen: z.array(
            z.object({
              sachkonto: z.string(),
              kontobezeichnung: z.string().optional(),
              sollbetrag: z.string(),
              habenbetrag: z.string(),
            })
          ),
          importQuelle: z.enum(["datev", "api"]).default("datev"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");

        // Lösche alte Positionen für dieses Jahr
        await db
          .delete(eroeffnungsbilanz)
          .where(
            and(
              eq(eroeffnungsbilanz.unternehmenId, input.unternehmenId),
              eq(eroeffnungsbilanz.jahr, input.jahr)
            )
          );

        // Füge neue Positionen ein
        const values: InsertEroeffnungsbilanz[] = input.positionen.map((p) => ({
          unternehmenId: input.unternehmenId,
          jahr: input.jahr,
          sachkonto: p.sachkonto,
          kontobezeichnung: p.kontobezeichnung,
          sollbetrag: p.sollbetrag,
          habenbetrag: p.habenbetrag,
          importQuelle: input.importQuelle,
          importDatum: new Date(),
          erstelltVon: ctx.user.id,
        }));

        if (values.length > 0) {
          await db.insert(eroeffnungsbilanz).values(values);
        }

        return { success: true, imported: values.length };
      }),

    // Bilanz-Summen für ein Jahr
    summen: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          jahr: z.number(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db)
          return {
            sollSumme: 0,
            habenSumme: 0,
            differenz: 0,
            ausgeglichen: false,
          };

        const result = await db
          .select({
            sollSumme: sum(eroeffnungsbilanz.sollbetrag),
            habenSumme: sum(eroeffnungsbilanz.habenbetrag),
          })
          .from(eroeffnungsbilanz)
          .where(
            and(
              eq(eroeffnungsbilanz.unternehmenId, input.unternehmenId),
              eq(eroeffnungsbilanz.jahr, input.jahr)
            )
          );

        const sollSumme = parseFloat(result[0]?.sollSumme || "0");
        const habenSumme = parseFloat(result[0]?.habenSumme || "0");
        const differenz = sollSumme - habenSumme;

        return {
          sollSumme,
          habenSumme,
          differenz,
          ausgeglichen: Math.abs(differenz) < 0.01, // Rundungstoleran z
        };
      }),
  }),
});
