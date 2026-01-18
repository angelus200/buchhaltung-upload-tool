import { eq, desc, and, or, gte, lte, like, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  artikel,
  lagerorte,
  lagerbestaende,
  bestandsbewegungen,
  inventuren,
  inventurpositionen,
  buchungen,
  InsertArtikel,
  InsertLagerort,
  InsertLagerbestand,
  InsertBestandsbewegung,
  InsertInventur,
  InsertInventurposition,
} from "../drizzle/schema";

// ============================================
// ARTIKEL ROUTER (Produktstammdaten)
// ============================================
export const artikelRouter = router({
  // Liste aller Artikel mit Filtern
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        kategorie: z.enum(["rohstoff", "halbfertig", "fertigware", "handelsware", "verbrauchsmaterial"]).optional(),
        lieferantId: z.number().optional(),
        aktiv: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(artikel.unternehmenId, input.unternehmenId)];

      if (input.kategorie) {
        conditions.push(eq(artikel.kategorie, input.kategorie));
      }

      if (input.lieferantId) {
        conditions.push(eq(artikel.lieferantId, input.lieferantId));
      }

      if (input.aktiv !== undefined) {
        conditions.push(eq(artikel.aktiv, input.aktiv));
      }

      const result = await db
        .select()
        .from(artikel)
        .where(and(...conditions))
        .orderBy(desc(artikel.createdAt));

      return result;
    }),

  // Einzelnen Artikel abrufen
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(artikel)
        .where(eq(artikel.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Neuen Artikel erstellen
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        artikelnummer: z.string().min(1),
        bezeichnung: z.string().min(1),
        beschreibung: z.string().optional(),
        kategorie: z.enum(["rohstoff", "halbfertig", "fertigware", "handelsware", "verbrauchsmaterial"]),
        einheit: z.enum(["stueck", "kg", "liter", "meter", "karton"]),
        einkaufspreis: z.string().optional(),
        verkaufspreis: z.string().optional(),
        mindestbestand: z.string().optional(),
        zielbestand: z.string().optional(),
        lieferantId: z.number().optional(),
        sachkontoId: z.number().optional(),
        aktiv: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [newArtikel] = await db.insert(artikel).values(input as InsertArtikel);

      return {
        success: true,
        id: newArtikel.insertId,
        message: "Artikel erfolgreich erstellt",
      };
    }),

  // Artikel aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        artikelnummer: z.string().min(1).optional(),
        bezeichnung: z.string().min(1).optional(),
        beschreibung: z.string().optional(),
        kategorie: z.enum(["rohstoff", "halbfertig", "fertigware", "handelsware", "verbrauchsmaterial"]).optional(),
        einheit: z.enum(["stueck", "kg", "liter", "meter", "karton"]).optional(),
        einkaufspreis: z.string().optional(),
        verkaufspreis: z.string().optional(),
        mindestbestand: z.string().optional(),
        zielbestand: z.string().optional(),
        lieferantId: z.number().optional(),
        sachkontoId: z.number().optional(),
        aktiv: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, ...updateData } = input;

      await db.update(artikel).set(updateData).where(eq(artikel.id, id));

      return {
        success: true,
        message: "Artikel erfolgreich aktualisiert",
      };
    }),

  // Artikel löschen (deaktivieren)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db.update(artikel).set({ aktiv: false }).where(eq(artikel.id, input.id));

      return {
        success: true,
        message: "Artikel erfolgreich deaktiviert",
      };
    }),

  // Artikel-Suche (für Autocomplete)
  search: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        query: z.string().min(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(artikel)
        .where(
          and(
            eq(artikel.unternehmenId, input.unternehmenId),
            eq(artikel.aktiv, true),
            or(
              like(artikel.artikelnummer, `%${input.query}%`),
              like(artikel.bezeichnung, `%${input.query}%`)
            )
          )
        )
        .limit(input.limit);

      return result;
    }),
});

// ============================================
// LAGER ROUTER (Bestandsverwaltung)
// ============================================
export const lagerRouter = router({
  // Lagerorte abrufen
  getLagerorte: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(lagerorte)
        .where(eq(lagerorte.unternehmenId, input.unternehmenId))
        .orderBy(desc(lagerorte.istHauptlager), lagerorte.name);

      return result;
    }),

  // Neuen Lagerort erstellen
  createLagerort: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        name: z.string().min(1),
        beschreibung: z.string().optional(),
        adresse: z.string().optional(),
        istHauptlager: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const [newLagerort] = await db.insert(lagerorte).values(input as InsertLagerort);

      return {
        success: true,
        id: newLagerort.insertId,
        message: "Lagerort erfolgreich erstellt",
      };
    }),

  // Lagerort aktualisieren
  updateLagerort: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        beschreibung: z.string().optional(),
        adresse: z.string().optional(),
        istHauptlager: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, ...updateData } = input;

      await db.update(lagerorte).set(updateData).where(eq(lagerorte.id, id));

      return {
        success: true,
        message: "Lagerort erfolgreich aktualisiert",
      };
    }),

  // Aktuelle Bestände abrufen
  getBestaende: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        lagerortId: z.number().optional(),
        kategorie: z.enum(["rohstoff", "halbfertig", "fertigware", "handelsware", "verbrauchsmaterial"]).optional(),
        nurNiedrig: z.boolean().optional(), // nur Artikel unter Mindestbestand
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Join mit Artikel-Tabelle für zusätzliche Informationen
      const query = db
        .select({
          bestand: lagerbestaende,
          artikel: artikel,
          lagerort: lagerorte,
        })
        .from(lagerbestaende)
        .innerJoin(artikel, eq(lagerbestaende.artikelId, artikel.id))
        .innerJoin(lagerorte, eq(lagerbestaende.lagerortId, lagerorte.id))
        .where(eq(artikel.unternehmenId, input.unternehmenId))
        .$dynamic();

      const conditions = [eq(artikel.unternehmenId, input.unternehmenId)];

      if (input.lagerortId) {
        conditions.push(eq(lagerbestaende.lagerortId, input.lagerortId));
      }

      if (input.kategorie) {
        conditions.push(eq(artikel.kategorie, input.kategorie));
      }

      const result = await db
        .select({
          bestand: lagerbestaende,
          artikel: artikel,
          lagerort: lagerorte,
        })
        .from(lagerbestaende)
        .innerJoin(artikel, eq(lagerbestaende.artikelId, artikel.id))
        .innerJoin(lagerorte, eq(lagerbestaende.lagerortId, lagerorte.id))
        .where(and(...conditions));

      // Nachfilterung für niedrige Bestände (kann nicht in SQL gemacht werden wegen Dezimal-Vergleich)
      if (input.nurNiedrig) {
        return result.filter((r) => {
          const menge = parseFloat(r.bestand.menge || "0");
          const mindest = parseFloat(r.artikel.mindestbestand || "0");
          return menge < mindest;
        });
      }

      return result;
    }),

  // Lagerbewegungen abrufen
  getBewegungen: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        artikelId: z.number().optional(),
        lagerortId: z.number().optional(),
        bewegungsart: z.enum(["eingang", "ausgang", "korrektur", "umbuchung", "inventur"]).optional(),
        vonDatum: z.string().optional(),
        bisDatum: z.string().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];

      if (input.artikelId) {
        conditions.push(eq(bestandsbewegungen.artikelId, input.artikelId));
      }

      if (input.lagerortId) {
        conditions.push(eq(bestandsbewegungen.lagerortId, input.lagerortId));
      }

      if (input.bewegungsart) {
        conditions.push(eq(bestandsbewegungen.bewegungsart, input.bewegungsart));
      }

      if (input.vonDatum) {
        conditions.push(gte(bestandsbewegungen.createdAt, new Date(input.vonDatum)));
      }

      if (input.bisDatum) {
        conditions.push(lte(bestandsbewegungen.createdAt, new Date(input.bisDatum)));
      }

      const result = await db
        .select({
          bewegung: bestandsbewegungen,
          artikel: artikel,
          lagerort: lagerorte,
        })
        .from(bestandsbewegungen)
        .innerJoin(artikel, eq(bestandsbewegungen.artikelId, artikel.id))
        .innerJoin(lagerorte, eq(bestandsbewegungen.lagerortId, lagerorte.id))
        .where(and(eq(artikel.unternehmenId, input.unternehmenId), ...conditions))
        .orderBy(desc(bestandsbewegungen.createdAt))
        .limit(input.limit);

      return result;
    }),

  // Wareneingang buchen
  eingang: protectedProcedure
    .input(
      z.object({
        artikelId: z.number(),
        lagerortId: z.number(),
        menge: z.string(),
        referenzTyp: z.string().optional(),
        referenzId: z.number().optional(),
        buchungId: z.number().optional(),
        notiz: z.string().optional(),
        erstelltVon: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Aktuellen Bestand abrufen oder erstellen
      const [bestand] = await db
        .select()
        .from(lagerbestaende)
        .where(
          and(
            eq(lagerbestaende.artikelId, input.artikelId),
            eq(lagerbestaende.lagerortId, input.lagerortId)
          )
        )
        .limit(1);

      const vorherMenge = bestand ? parseFloat(bestand.menge || "0") : 0;
      const mengeDelta = parseFloat(input.menge);
      const nachherMenge = vorherMenge + mengeDelta;

      // Bestand aktualisieren oder erstellen
      if (bestand) {
        await db
          .update(lagerbestaende)
          .set({
            menge: nachherMenge.toString(),
            letzteBewegung: new Date(),
          })
          .where(eq(lagerbestaende.id, bestand.id));
      } else {
        await db.insert(lagerbestaende).values({
          artikelId: input.artikelId,
          lagerortId: input.lagerortId,
          menge: nachherMenge.toString(),
          reservierteMenge: "0",
          letzteBewegung: new Date(),
        } as InsertLagerbestand);
      }

      // Bewegung protokollieren
      await db.insert(bestandsbewegungen).values({
        artikelId: input.artikelId,
        lagerortId: input.lagerortId,
        bewegungsart: "eingang",
        menge: input.menge,
        vorherMenge: vorherMenge.toString(),
        nachherMenge: nachherMenge.toString(),
        referenzTyp: input.referenzTyp || null,
        referenzId: input.referenzId || null,
        buchungId: input.buchungId || null,
        notiz: input.notiz || null,
        erstelltVon: input.erstelltVon,
      } as InsertBestandsbewegung);

      return {
        success: true,
        neuerBestand: nachherMenge,
        message: "Wareneingang erfolgreich gebucht",
      };
    }),

  // Warenausgang buchen
  ausgang: protectedProcedure
    .input(
      z.object({
        artikelId: z.number(),
        lagerortId: z.number(),
        menge: z.string(),
        referenzTyp: z.string().optional(),
        referenzId: z.number().optional(),
        buchungId: z.number().optional(),
        notiz: z.string().optional(),
        erstelltVon: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Aktuellen Bestand abrufen
      const [bestand] = await db
        .select()
        .from(lagerbestaende)
        .where(
          and(
            eq(lagerbestaende.artikelId, input.artikelId),
            eq(lagerbestaende.lagerortId, input.lagerortId)
          )
        )
        .limit(1);

      if (!bestand) {
        throw new Error("Kein Bestand für diesen Artikel am Lagerort vorhanden");
      }

      const vorherMenge = parseFloat(bestand.menge || "0");
      const mengeDelta = parseFloat(input.menge);
      const nachherMenge = vorherMenge - mengeDelta;

      if (nachherMenge < 0) {
        throw new Error("Nicht genügend Bestand für Ausgang vorhanden");
      }

      // Bestand aktualisieren
      await db
        .update(lagerbestaende)
        .set({
          menge: nachherMenge.toString(),
          letzteBewegung: new Date(),
        })
        .where(eq(lagerbestaende.id, bestand.id));

      // Bewegung protokollieren
      await db.insert(bestandsbewegungen).values({
        artikelId: input.artikelId,
        lagerortId: input.lagerortId,
        bewegungsart: "ausgang",
        menge: input.menge,
        vorherMenge: vorherMenge.toString(),
        nachherMenge: nachherMenge.toString(),
        referenzTyp: input.referenzTyp || null,
        referenzId: input.referenzId || null,
        buchungId: input.buchungId || null,
        notiz: input.notiz || null,
        erstelltVon: input.erstelltVon,
      } as InsertBestandsbewegung);

      return {
        success: true,
        neuerBestand: nachherMenge,
        message: "Warenausgang erfolgreich gebucht",
      };
    }),

  // Bestandskorrektur
  korrektur: protectedProcedure
    .input(
      z.object({
        artikelId: z.number(),
        lagerortId: z.number(),
        neueMenge: z.string(),
        notiz: z.string().optional(),
        erstelltVon: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Aktuellen Bestand abrufen
      const [bestand] = await db
        .select()
        .from(lagerbestaende)
        .where(
          and(
            eq(lagerbestaende.artikelId, input.artikelId),
            eq(lagerbestaende.lagerortId, input.lagerortId)
          )
        )
        .limit(1);

      const vorherMenge = bestand ? parseFloat(bestand.menge || "0") : 0;
      const nachherMenge = parseFloat(input.neueMenge);
      const mengeDelta = nachherMenge - vorherMenge;

      // Bestand aktualisieren oder erstellen
      if (bestand) {
        await db
          .update(lagerbestaende)
          .set({
            menge: nachherMenge.toString(),
            letzteBewegung: new Date(),
          })
          .where(eq(lagerbestaende.id, bestand.id));
      } else {
        await db.insert(lagerbestaende).values({
          artikelId: input.artikelId,
          lagerortId: input.lagerortId,
          menge: nachherMenge.toString(),
          reservierteMenge: "0",
          letzteBewegung: new Date(),
        } as InsertLagerbestand);
      }

      // Bewegung protokollieren
      await db.insert(bestandsbewegungen).values({
        artikelId: input.artikelId,
        lagerortId: input.lagerortId,
        bewegungsart: "korrektur",
        menge: Math.abs(mengeDelta).toString(),
        vorherMenge: vorherMenge.toString(),
        nachherMenge: nachherMenge.toString(),
        notiz: input.notiz || null,
        erstelltVon: input.erstelltVon,
      } as InsertBestandsbewegung);

      return {
        success: true,
        neuerBestand: nachherMenge,
        message: "Bestandskorrektur erfolgreich durchgeführt",
      };
    }),

  // Umbuchung zwischen Lagerorten
  umbuchung: protectedProcedure
    .input(
      z.object({
        artikelId: z.number(),
        vonLagerortId: z.number(),
        zuLagerortId: z.number(),
        menge: z.string(),
        notiz: z.string().optional(),
        erstelltVon: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      if (input.vonLagerortId === input.zuLagerortId) {
        throw new Error("Quell- und Ziel-Lagerort müssen unterschiedlich sein");
      }

      // Ausgang vom Quell-Lagerort
      await lagerRouter.createCaller({} as any).ausgang({
        artikelId: input.artikelId,
        lagerortId: input.vonLagerortId,
        menge: input.menge,
        referenzTyp: "umbuchung",
        notiz: input.notiz,
        erstelltVon: input.erstelltVon,
      });

      // Eingang am Ziel-Lagerort
      await lagerRouter.createCaller({} as any).eingang({
        artikelId: input.artikelId,
        lagerortId: input.zuLagerortId,
        menge: input.menge,
        referenzTyp: "umbuchung",
        notiz: input.notiz,
        erstelltVon: input.erstelltVon,
      });

      return {
        success: true,
        message: "Umbuchung erfolgreich durchgeführt",
      };
    }),
});

// ============================================
// INVENTUR ROUTER
// ============================================
export const inventurRouter = router({
  // Liste aller Inventuren
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        status: z.enum(["geplant", "in_arbeit", "abgeschlossen", "storniert"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(inventuren.unternehmenId, input.unternehmenId)];

      if (input.status) {
        conditions.push(eq(inventuren.status, input.status));
      }

      const result = await db
        .select()
        .from(inventuren)
        .where(and(...conditions))
        .orderBy(desc(inventuren.createdAt));

      return result;
    }),

  // Neue Inventur erstellen (mit automatischer Generierung der Positionen)
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        bezeichnung: z.string().min(1),
        stichtag: z.string(),
        lagerortId: z.number().optional(),
        erstelltVon: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Inventur erstellen
      const [newInventur] = await db.insert(inventuren).values({
        unternehmenId: input.unternehmenId,
        bezeichnung: input.bezeichnung,
        stichtag: new Date(input.stichtag),
        status: "geplant",
        lagerortId: input.lagerortId || null,
        erstelltVon: input.erstelltVon,
      } as InsertInventur);

      const inventurId = newInventur.insertId;

      // Aktuelle Bestände abrufen und als Inventurpositionen anlegen
      const bestandsConditions = [];

      if (input.lagerortId) {
        bestandsConditions.push(eq(lagerbestaende.lagerortId, input.lagerortId));
      }

      const bestaende = await db
        .select({
          bestand: lagerbestaende,
          artikel: artikel,
        })
        .from(lagerbestaende)
        .innerJoin(artikel, eq(lagerbestaende.artikelId, artikel.id))
        .where(
          and(
            eq(artikel.unternehmenId, input.unternehmenId),
            eq(artikel.aktiv, true),
            ...bestandsConditions
          )
        );

      // Inventurpositionen erstellen
      for (const bestand of bestaende) {
        await db.insert(inventurpositionen).values({
          inventurId: inventurId,
          artikelId: bestand.bestand.artikelId,
          lagerortId: bestand.bestand.lagerortId,
          sollMenge: bestand.bestand.menge,
          istMenge: null,
          differenz: null,
        } as InsertInventurposition);
      }

      return {
        success: true,
        id: inventurId,
        anzahlPositionen: bestaende.length,
        message: `Inventur erfolgreich erstellt mit ${bestaende.length} Positionen`,
      };
    }),

  // Inventurpositionen abrufen
  getPositionen: protectedProcedure
    .input(z.object({ inventurId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select({
          position: inventurpositionen,
          artikel: artikel,
          lagerort: lagerorte,
        })
        .from(inventurpositionen)
        .innerJoin(artikel, eq(inventurpositionen.artikelId, artikel.id))
        .innerJoin(lagerorte, eq(inventurpositionen.lagerortId, lagerorte.id))
        .where(eq(inventurpositionen.inventurId, input.inventurId))
        .orderBy(artikel.artikelnummer);

      return result;
    }),

  // Zählergebnis für Position eintragen
  zaehlen: protectedProcedure
    .input(
      z.object({
        positionId: z.number(),
        istMenge: z.string(),
        kommentar: z.string().optional(),
        gezaehltVon: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Position abrufen
      const [position] = await db
        .select()
        .from(inventurpositionen)
        .where(eq(inventurpositionen.id, input.positionId))
        .limit(1);

      if (!position) {
        throw new Error("Inventurposition nicht gefunden");
      }

      // Differenz berechnen
      const sollMenge = parseFloat(position.sollMenge);
      const istMenge = parseFloat(input.istMenge);
      const differenz = istMenge - sollMenge;

      // Position aktualisieren
      await db
        .update(inventurpositionen)
        .set({
          istMenge: input.istMenge,
          differenz: differenz.toString(),
          gezaehltVon: input.gezaehltVon,
          gezaehltAm: new Date(),
          kommentar: input.kommentar || null,
        })
        .where(eq(inventurpositionen.id, input.positionId));

      // Inventur-Status auf "in_arbeit" setzen
      await db
        .update(inventuren)
        .set({ status: "in_arbeit" })
        .where(eq(inventuren.id, position.inventurId));

      return {
        success: true,
        differenz: differenz,
        message: "Zählergebnis erfolgreich eingetragen",
      };
    }),

  // Inventur abschließen (Korrekturbewegungen erstellen)
  abschliessen: protectedProcedure
    .input(
      z.object({
        inventurId: z.number(),
        abgeschlossenVon: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      // Inventur abrufen
      const [inventur] = await db
        .select()
        .from(inventuren)
        .where(eq(inventuren.id, input.inventurId))
        .limit(1);

      if (!inventur) {
        throw new Error("Inventur nicht gefunden");
      }

      if (inventur.status === "abgeschlossen") {
        throw new Error("Inventur ist bereits abgeschlossen");
      }

      // Alle Positionen mit Differenz abrufen
      const positionen = await db
        .select()
        .from(inventurpositionen)
        .where(
          and(
            eq(inventurpositionen.inventurId, input.inventurId),
            sql`${inventurpositionen.differenz} IS NOT NULL`,
            sql`${inventurpositionen.differenz} != 0`
          )
        );

      // Für jede Position mit Differenz eine Korrekturbewegung erstellen
      for (const position of positionen) {
        if (!position.istMenge) continue;

        await lagerRouter.createCaller({} as any).korrektur({
          artikelId: position.artikelId,
          lagerortId: position.lagerortId,
          neueMenge: position.istMenge,
          notiz: `Inventurkorrektur - Inventur: ${inventur.bezeichnung}`,
          erstelltVon: input.abgeschlossenVon,
        });
      }

      // Inventur als abgeschlossen markieren
      await db
        .update(inventuren)
        .set({
          status: "abgeschlossen",
          abgeschlossenVon: input.abgeschlossenVon,
          abgeschlossenAm: new Date(),
        })
        .where(eq(inventuren.id, input.inventurId));

      return {
        success: true,
        anzahlKorrekturen: positionen.length,
        message: `Inventur erfolgreich abgeschlossen. ${positionen.length} Korrekturbewegungen erstellt.`,
      };
    }),

  // Inventur PDF-Export (Platzhalter)
  exportPdf: protectedProcedure
    .input(z.object({ inventurId: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: PDF-Export implementieren
      return {
        success: true,
        message: "PDF-Export noch nicht implementiert",
      };
    }),
});

// ============================================
// COMBINED INVENTUR ROUTER
// ============================================
export const inventurMainRouter = router({
  artikel: artikelRouter,
  lager: lagerRouter,
  inventur: inventurRouter,
});
