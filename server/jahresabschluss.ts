import { z } from "zod";
import { eq, and, sql, sum, desc } from "drizzle-orm";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  anlagevermoegen,
  bankkonten,
  beteiligungen,
  gesellschafter,
  eroeffnungsbilanz,
  buchungen,
  sachkonten,
  InsertAnlagevermoegen,
  InsertBankkonto,
  InsertBeteiligung,
  InsertGesellschafter,
  InsertEroeffnungsbilanz,
} from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Bestimmt Anlagenkategorie basierend auf SKR04-Kontonummer
 */
function bestimmeKategorie(kontonummer: string): string {
  const konto = parseInt(kontonummer, 10);

  if (konto >= 0 && konto < 10) return "Immaterielle Vermögensgegenstände";
  if (konto >= 10 && konto < 100) return "Grundstücke und Gebäude";
  if (konto >= 100 && konto < 300) return "Technische Anlagen und Maschinen";
  if (konto >= 300 && konto < 500) return "Andere Anlagen, Betriebs- und Geschäftsausstattung";
  if (konto >= 500 && konto < 600) return "Anlagen im Bau";
  if (konto >= 600 && konto < 700) return "Finanzanlagen";

  return "Sonstiges Anlagevermögen";
}

/**
 * Bestimmt Nutzungsdauer basierend auf SKR04-Kontonummer (AfA-Tabelle)
 */
function bestimmeNutzungsdauer(kontonummer: string): number {
  const konto = parseInt(kontonummer, 10);

  // Immaterielle Vermögensgegenstände (Software, Lizenzen)
  if (konto >= 0 && konto < 10) return 3;

  // Gebäude
  if (konto >= 10 && konto < 100) return 50;

  // Technische Anlagen und Maschinen
  if (konto >= 100 && konto < 300) return 10;

  // Betriebs- und Geschäftsausstattung
  if (konto >= 300 && konto < 500) {
    // Büromöbel, Computer, etc.
    if (konto >= 300 && konto < 320) return 13; // Büromöbel
    if (konto >= 320 && konto < 340) return 3; // Computer
    if (konto >= 340 && konto < 360) return 8; // Büromaschinen
    return 10; // Sonstige
  }

  // Fahrzeuge
  if (konto >= 400 && konto < 500) return 6;

  // Finanzanlagen (keine AfA)
  if (konto >= 600 && konto < 700) return 0;

  return 5; // Default
}

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

    // Rekonstruktion von Anlagevermögen aus Buchungen
    rekonstruktion: router({
      // Analysiere Buchungen und identifiziere potenzielle Anlagegüter
      analysieren: protectedProcedure
        .input(
          z.object({
            unternehmenId: z.number(),
            jahr: z.number().optional(), // Optional: Nur Buchungen aus diesem Jahr
          })
        )
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Datenbankverbindung nicht verfügbar",
            });
          }

          // SKR04: Anlagevermögen = Konten 0000-0999
          // Suche nach Buchungen mit Sachkonten in diesem Bereich
          const filters = [
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.buchungsart, "anlage"),
            sql`CAST(${buchungen.sachkonto} AS UNSIGNED) BETWEEN 0 AND 999`,
          ];

          if (input.jahr) {
            const vonDatum = `${input.jahr}-01-01`;
            const bisDatum = `${input.jahr}-12-31`;
            filters.push(sql`${buchungen.belegdatum} >= ${vonDatum}`);
            filters.push(sql`${buchungen.belegdatum} <= ${bisDatum}`);
          }

          const anlagenBuchungen = await db
            .select()
            .from(buchungen)
            .where(and(...filters))
            .orderBy(desc(buchungen.belegdatum));

          // Gruppiere nach Sachkonto und Geschäftspartner
          const gruppiert = anlagenBuchungen.reduce((acc, buchung) => {
            const key = `${buchung.sachkonto}-${buchung.geschaeftspartner}`;
            if (!acc[key]) {
              acc[key] = {
                sachkonto: buchung.sachkonto,
                geschaeftspartner: buchung.geschaeftspartner,
                buchungen: [],
                gesamtbetrag: 0,
              };
            }
            acc[key].buchungen.push(buchung);
            acc[key].gesamtbetrag += parseFloat(buchung.bruttobetrag);
            return acc;
          }, {} as Record<string, any>);

          // Prüfe für jede Gruppe, ob bereits als Anlagegut erfasst
          const kandidaten = await Promise.all(
            Object.values(gruppiert).map(async (gruppe: any) => {
              // Suche nach existierendem Anlagegut mit diesem Sachkonto
              const existing = await db
                .select()
                .from(anlagevermoegen)
                .where(
                  and(
                    eq(anlagevermoegen.unternehmenId, input.unternehmenId),
                    eq(anlagevermoegen.sachkonto, gruppe.sachkonto)
                  )
                )
                .limit(1);

              const bereitsErfasst = existing.length > 0;

              // Erstelle Vorschlag
              const ersteBuchung = gruppe.buchungen[gruppe.buchungen.length - 1];
              const vorschlag = {
                bezeichnung:
                  ersteBuchung.buchungstext ||
                  `${gruppe.geschaeftspartner} - ${gruppe.sachkonto}`,
                sachkonto: gruppe.sachkonto,
                anschaffungsdatum: ersteBuchung.belegdatum,
                anschaffungskosten: gruppe.gesamtbetrag.toFixed(2),
                kategorie: bestimmeKategorie(gruppe.sachkonto),
                nutzungsdauer: bestimmeNutzungsdauer(gruppe.sachkonto),
                abschreibungsmethode: "linear" as const,
              };

              return {
                sachkonto: gruppe.sachkonto,
                geschaeftspartner: gruppe.geschaeftspartner,
                buchungen: gruppe.buchungen,
                gesamtbetrag: gruppe.gesamtbetrag,
                bereitsErfasst,
                vorschlag,
              };
            })
          );

          // Filtere: Nur nicht erfasste
          const zuRekonstruieren = kandidaten.filter((k) => !k.bereitsErfasst);

          return {
            gesamt: kandidaten.length,
            bereitsErfasst: kandidaten.filter((k) => k.bereitsErfasst).length,
            zuRekonstruieren: zuRekonstruieren.length,
            kandidaten: zuRekonstruieren,
          };
        }),

      // Importiere ausgewählte Rekonstruktionen als Anlagegüter
      importieren: protectedProcedure
        .input(
          z.object({
            unternehmenId: z.number(),
            anlagen: z.array(
              z.object({
                bezeichnung: z.string(),
                sachkonto: z.string(),
                anschaffungsdatum: z.string(),
                anschaffungskosten: z.string(),
                kategorie: z.string().optional(),
                nutzungsdauer: z.number().optional(),
                abschreibungsmethode: z.enum(["linear", "degressiv", "keine"]).optional(),
              })
            ),
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

          const erfolge: number[] = [];
          const fehler: Array<{ index: number; error: string }> = [];

          for (let i = 0; i < input.anlagen.length; i++) {
            const anlage = input.anlagen[i];

            try {
              const result = await db.insert(anlagevermoegen).values({
                unternehmenId: input.unternehmenId,
                kontonummer: anlage.sachkonto,
                bezeichnung: anlage.bezeichnung,
                sachkonto: anlage.sachkonto,
                anschaffungsdatum: new Date(anlage.anschaffungsdatum),
                anschaffungskosten: anlage.anschaffungskosten,
                kategorie: anlage.kategorie || null,
                nutzungsdauer: anlage.nutzungsdauer || null,
                abschreibungsmethode: anlage.abschreibungsmethode || "linear",
                aktiv: true,
              });

              erfolge.push(result[0].insertId);
            } catch (error) {
              console.error(`Fehler beim Importieren von Anlage ${i + 1}:`, error);
              fehler.push({
                index: i,
                error: error instanceof Error ? error.message : "Unbekannter Fehler",
              });
            }
          }

          return {
            success: true,
            importiert: erfolge.length,
            fehler: fehler.length,
            fehlerDetails: fehler,
            message: `${erfolge.length} von ${input.anlagen.length} Anlagegüter erfolgreich importiert`,
          };
        }),
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
          ausgeglichen: Math.abs(differenz) < 0.01, // Rundungstoleranz
        };
      }),
  }),

  // ============================================
  // VORJAHRESWERTE-ÜBERNAHME
  // ============================================
  vorjahreswerte: router({
    // Berechnet Salden aller Bestandskonten zum 31.12. des gewählten Jahres
    berechneVorjahr: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          jahr: z.number(), // z.B. 2025 → berechnet Salden zum 31.12.2025
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");

        const { unternehmenId, jahr } = input;
        const stichtag = `${jahr}-12-31`;

        // Nur Bestandskonten (SKR04: 0000-3999)
        // Aktiva: 0000-1999 (Soll), Passiva: 2000-3999 (Haben)
        // Saldo = Soll - Haben
        const saldenQuery = await db
          .select({
            sachkonto: buchungen.sachkonto,
            saldo: sql<number>`SUM(
              CASE
                WHEN ${buchungen.buchungsart} = 'ertrag' THEN -CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))
                ELSE CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))
              END
            )`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, unternehmenId),
              sql`${buchungen.belegdatum} <= ${stichtag}`,
              sql`CAST(${buchungen.sachkonto} AS UNSIGNED) BETWEEN 0 AND 3999`
            )
          )
          .groupBy(buchungen.sachkonto)
          .having(
            sql`ABS(SUM(
              CASE
                WHEN ${buchungen.buchungsart} = 'ertrag' THEN -CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))
                ELSE CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))
              END
            )) > 0.01`
          );

        // Kategorisieren
        const aktiva = saldenQuery
          .filter((s) => parseInt(s.sachkonto) < 2000)
          .map((s) => ({
            sachkonto: s.sachkonto,
            saldo: Number(s.saldo),
          }));

        const passiva = saldenQuery
          .filter((s) => parseInt(s.sachkonto) >= 2000)
          .map((s) => ({
            sachkonto: s.sachkonto,
            saldo: Number(s.saldo),
          }));

        const summeAktiva = aktiva.reduce((sum, s) => sum + s.saldo, 0);
        const summePassiva = passiva.reduce((sum, s) => sum + Math.abs(s.saldo), 0);

        return {
          jahr,
          stichtag,
          aktiva,
          passiva,
          summeAktiva,
          summePassiva,
          differenz: summeAktiva - summePassiva,
          ausgeglichen: Math.abs(summeAktiva - summePassiva) < 0.01,
        };
      }),

    // Übernimmt berechnete Vorjahreswerte als Anfangsbestände
    uebernehmen: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          quellJahr: z.number(), // Vorjahr (z.B. 2025)
          zielJahr: z.number(), // Neues Jahr (z.B. 2026)
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");

        const { unternehmenId, quellJahr, zielJahr } = input;

        // Vorjahressalden berechnen (nutze berechneVorjahr-Logik)
        const stichtag = `${quellJahr}-12-31`;

        const saldenQuery = await db
          .select({
            sachkonto: buchungen.sachkonto,
            kontobezeichnung: sql<string>`(SELECT bezeichnung FROM sachkonten WHERE kontonummer = ${buchungen.sachkonto} LIMIT 1)`,
            saldo: sql<number>`SUM(
              CASE
                WHEN ${buchungen.buchungsart} = 'ertrag' THEN -CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))
                ELSE CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))
              END
            )`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, unternehmenId),
              sql`${buchungen.belegdatum} <= ${stichtag}`,
              sql`CAST(${buchungen.sachkonto} AS UNSIGNED) BETWEEN 0 AND 3999`
            )
          )
          .groupBy(buchungen.sachkonto)
          .having(
            sql`ABS(SUM(
              CASE
                WHEN ${buchungen.buchungsart} = 'ertrag' THEN -CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))
                ELSE CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2))
              END
            )) > 0.01`
          );

        // Alle Positionen als Anfangsbestände vorbereiten
        const positionen: InsertEroeffnungsbilanz[] = saldenQuery.map((s) => {
          const saldo = Number(s.saldo);
          return {
            unternehmenId,
            jahr: zielJahr,
            sachkonto: s.sachkonto,
            kontobezeichnung: s.kontobezeichnung || s.sachkonto,
            sollbetrag: saldo >= 0 ? saldo.toFixed(2) : "0.00",
            habenbetrag: saldo < 0 ? Math.abs(saldo).toFixed(2) : "0.00",
            importQuelle: "manuell" as const,
            importDatum: new Date(),
            erstelltVon: ctx.user?.id,
          };
        });

        // Alte Einträge für dieses Jahr löschen
        await db
          .delete(eroeffnungsbilanz)
          .where(
            and(
              eq(eroeffnungsbilanz.unternehmenId, unternehmenId),
              eq(eroeffnungsbilanz.jahr, zielJahr)
            )
          );

        // Neue Einträge einfügen
        if (positionen.length > 0) {
          await db.insert(eroeffnungsbilanz).values(positionen);
        }

        const summeAktiva = positionen
          .filter((p) => parseInt(p.sachkonto) < 2000)
          .reduce((sum, p) => sum + parseFloat(p.sollbetrag || "0"), 0);

        const summePassiva = positionen
          .filter((p) => parseInt(p.sachkonto) >= 2000)
          .reduce((sum, p) => sum + parseFloat(p.habenbetrag || "0"), 0);

        return {
          erfolg: true,
          anzahl: positionen.length,
          summeAktiva,
          summePassiva,
        };
      }),
  }),

  // ============================================
  // AfA-AUTOMATISIERUNG
  // ============================================
  afaAutomatisierung: router({
    // Berechnet AfA-Buchungen für ein Jahr
    berechnen: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          jahr: z.number(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Datenbankverbindung nicht verfügbar",
          });
        }

        // Hole alle aktiven Anlagegüter
        const anlagen = await db
          .select()
          .from(anlagevermoegen)
          .where(
            and(
              eq(anlagevermoegen.unternehmenId, input.unternehmenId),
              eq(anlagevermoegen.aktiv, true)
            )
          );

        const afaBuchungen = [];
        const stichtag = `${input.jahr}-12-31`;

        for (const anlage of anlagen) {
          // Prüfe ob AfA-Berechnung möglich
          if (
            !anlage.anschaffungsdatum ||
            !anlage.anschaffungskosten ||
            !anlage.nutzungsdauer ||
            anlage.abschreibungsmethode === "keine"
          ) {
            continue;
          }

          const anschaffungskosten = parseFloat(anlage.anschaffungskosten);
          const restwertBetrag = parseFloat(anlage.restwert || "0");
          const nutzungsdauer = anlage.nutzungsdauer;
          const anschaffungsdatum = new Date(anlage.anschaffungsdatum);
          const stichtagDate = new Date(stichtag);

          // Prüfe ob Anschaffung vor oder im Jahr liegt
          if (anschaffungsdatum > stichtagDate) {
            continue;
          }

          // Berechne AfA für dieses Jahr
          let jahresAfa = 0;

          if (anlage.abschreibungsmethode === "linear") {
            const jahresAfaBetrag = (anschaffungskosten - restwertBetrag) / nutzungsdauer;

            // Prüfe ob im Anschaffungsjahr (anteilig)
            if (anschaffungsdatum.getFullYear() === input.jahr) {
              const monateImJahr = 12 - anschaffungsdatum.getMonth();
              jahresAfa = (jahresAfaBetrag / 12) * monateImJahr;
            } else {
              jahresAfa = jahresAfaBetrag;
            }

            // Prüfe ob bereits vollständig abgeschrieben
            const monateGesamt = Math.max(
              0,
              (stichtagDate.getFullYear() - anschaffungsdatum.getFullYear()) * 12 +
                (stichtagDate.getMonth() - anschaffungsdatum.getMonth())
            );

            const gesamtAbschreibung = (jahresAfaBetrag / 12) * monateGesamt;

            if (gesamtAbschreibung >= anschaffungskosten - restwertBetrag) {
              // Bereits vollständig abgeschrieben
              continue;
            }
          }

          if (jahresAfa > 0) {
            afaBuchungen.push({
              anlageId: anlage.id,
              anlageBezeichnung: anlage.bezeichnung,
              sachkonto: anlage.sachkonto || "0000",
              gegenkonto: "4830", // AfA-Aufwand (SKR04)
              betrag: jahresAfa.toFixed(2),
              buchungsdatum: stichtag,
              buchungstext: `AfA ${input.jahr} - ${anlage.bezeichnung}`,
            });
          }
        }

        return {
          jahr: input.jahr,
          anzahlAnlagen: anlagen.length,
          anzahlAfaBuchungen: afaBuchungen.length,
          afaBuchungen,
          gesamtAfaBetrag: afaBuchungen.reduce((sum, b) => sum + parseFloat(b.betrag), 0),
        };
      }),

    // Erstellt AfA-Buchungen automatisch
    erstellen: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          jahr: z.number(),
          buchungen: z.array(
            z.object({
              anlageId: z.number(),
              sachkonto: z.string(),
              gegenkonto: z.string(),
              betrag: z.string(),
              buchungsdatum: z.string(),
              buchungstext: z.string(),
            })
          ),
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

        const erfolge: number[] = [];
        const fehler: Array<{ index: number; error: string }> = [];

        for (let i = 0; i < input.buchungen.length; i++) {
          const afaBuchung = input.buchungen[i];

          try {
            // Erstelle Buchung
            const betrag = parseFloat(afaBuchung.betrag);
            const steuersatz = 0; // AfA ist steuerfrei
            const nettobetrag = betrag;
            const bruttobetrag = betrag;

            const result = await db.insert(buchungen).values({
              unternehmenId: input.unternehmenId,
              buchungsart: "aufwand",
              belegdatum: new Date(afaBuchung.buchungsdatum),
              belegnummer: `AfA-${input.jahr}-${afaBuchung.anlageId}`,
              geschaeftspartnerTyp: "sonstig",
              geschaeftspartner: "AfA Automatisch",
              geschaeftspartnerKonto: afaBuchung.gegenkonto,
              sachkonto: afaBuchung.gegenkonto,
              nettobetrag: nettobetrag.toString(),
              steuersatz: steuersatz.toString(),
              bruttobetrag: bruttobetrag.toString(),
              buchungstext: afaBuchung.buchungstext,
              status: "geprueft",
              createdBy: ctx.user.id,
            });

            erfolge.push(result[0].insertId);
          } catch (error) {
            console.error(`Fehler beim Erstellen von AfA-Buchung ${i + 1}:`, error);
            fehler.push({
              index: i,
              error: error instanceof Error ? error.message : "Unbekannter Fehler",
            });
          }
        }

        return {
          success: true,
          erstellt: erfolge.length,
          fehler: fehler.length,
          fehlerDetails: fehler,
          message: `${erfolge.length} von ${input.buchungen.length} AfA-Buchungen erfolgreich erstellt`,
        };
      }),
  }),

  // ============================================
  // GuV (GEWINN- UND VERLUSTRECHNUNG)
  // ============================================
  guv: router({
    // Aggregiert Buchungen für GuV-Export
    aggregieren: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          vonDatum: z.string().optional(), // ISO-Date String
          bisDatum: z.string().optional(), // ISO-Date String
          jahr: z.number().optional(), // Alternativ: Ganzes Jahr
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Datenbankverbindung nicht verfügbar",
          });
        }

        // Bestimme Zeitraum
        let vonDatum: string;
        let bisDatum: string;

        if (input.jahr) {
          vonDatum = `${input.jahr}-01-01`;
          bisDatum = `${input.jahr}-12-31`;
        } else {
          vonDatum = input.vonDatum || `${new Date().getFullYear()}-01-01`;
          bisDatum = input.bisDatum || `${new Date().getFullYear()}-12-31`;
        }

        // Erträge: SKR04 Konten 4000-4999
        const ertraegeQuery = await db
          .select({
            sachkonto: buchungen.sachkonto,
            summe: sql<number>`SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)))`,
            anzahl: sql<number>`COUNT(*)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, input.unternehmenId),
              eq(buchungen.buchungsart, "ertrag"),
              sql`${buchungen.belegdatum} >= ${vonDatum}`,
              sql`${buchungen.belegdatum} <= ${bisDatum}`,
              sql`CAST(${buchungen.sachkonto} AS UNSIGNED) BETWEEN 4000 AND 4999`
            )
          )
          .groupBy(buchungen.sachkonto);

        // Aufwendungen: SKR04 Konten 6000-7999
        const aufwendungenQuery = await db
          .select({
            sachkonto: buchungen.sachkonto,
            summe: sql<number>`SUM(CAST(${buchungen.bruttobetrag} AS DECIMAL(15,2)))`,
            anzahl: sql<number>`COUNT(*)`,
          })
          .from(buchungen)
          .where(
            and(
              eq(buchungen.unternehmenId, input.unternehmenId),
              eq(buchungen.buchungsart, "aufwand"),
              sql`${buchungen.belegdatum} >= ${vonDatum}`,
              sql`${buchungen.belegdatum} <= ${bisDatum}`,
              sql`CAST(${buchungen.sachkonto} AS UNSIGNED) BETWEEN 6000 AND 7999`
            )
          )
          .groupBy(buchungen.sachkonto);

        // Hole Kontobezeichnungen aus Sachkonten
        const ertraege = await Promise.all(
          ertraegeQuery.map(async (e) => {
            const sachkontoInfo = await db
              .select()
              .from(sachkonten)
              .where(
                and(
                  eq(sachkonten.unternehmenId, input.unternehmenId),
                  eq(sachkonten.kontonummer, e.sachkonto)
                )
              )
              .limit(1);

            return {
              sachkonto: e.sachkonto,
              kontobezeichnung: sachkontoInfo[0]?.bezeichnung || "",
              betrag: Number(e.summe),
              anzahlBuchungen: Number(e.anzahl),
            };
          })
        );

        const aufwendungen = await Promise.all(
          aufwendungenQuery.map(async (a) => {
            const sachkontoInfo = await db
              .select()
              .from(sachkonten)
              .where(
                and(
                  eq(sachkonten.unternehmenId, input.unternehmenId),
                  eq(sachkonten.kontonummer, a.sachkonto)
                )
              )
              .limit(1);

            return {
              sachkonto: a.sachkonto,
              kontobezeichnung: sachkontoInfo[0]?.bezeichnung || "",
              betrag: Number(a.summe),
              anzahlBuchungen: Number(a.anzahl),
            };
          })
        );

        const summeErtraege = ertraege.reduce((sum, e) => sum + e.betrag, 0);
        const summeAufwendungen = aufwendungen.reduce((sum, a) => sum + a.betrag, 0);
        const ergebnis = summeErtraege - summeAufwendungen;

        return {
          zeitraum: { vonDatum, bisDatum },
          ertraege,
          aufwendungen,
          summeErtraege,
          summeAufwendungen,
          ergebnis,
          ergebnisTyp: ergebnis > 0 ? "gewinn" : ergebnis < 0 ? "verlust" : "ausgeglichen",
        };
      }),
  }),
});
