import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  unternehmen,
  userUnternehmen,
  kreditoren,
  debitoren,
  anlagevermoegen,
  beteiligungen,
  gesellschafter,
  bankkonten,
  kostenstellen,
  vertraege,
  buchungen,
  notizen,
  InsertUnternehmen,
  InsertKreditor,
  InsertDebitor,
  InsertAnlagevermoegen,
  InsertBeteiligung,
  InsertGesellschafter,
  InsertBankkonto,
  InsertKostenstelle,
  InsertVertrag,
  InsertBuchung,
  InsertNotiz,
} from "../drizzle/schema";

// ============================================
// UNTERNEHMEN ROUTER
// ============================================
export const unternehmenRouter = router({
  // Liste aller Unternehmen des Benutzers
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userCompanies = await db
      .select({
        unternehmen: unternehmen,
        rolle: userUnternehmen.rolle,
      })
      .from(userUnternehmen)
      .innerJoin(unternehmen, eq(userUnternehmen.unternehmenId, unternehmen.id))
      .where(eq(userUnternehmen.userId, ctx.user.id));

    return userCompanies;
  }),

  // Einzelnes Unternehmen abrufen
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Neues Unternehmen erstellen
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        rechtsform: z.string().optional(),
        steuernummer: z.string().optional(),
        ustIdNr: z.string().optional(),
        handelsregister: z.string().optional(),
        strasse: z.string().optional(),
        plz: z.string().optional(),
        ort: z.string().optional(),
        land: z.string().optional(),
        telefon: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        kontenrahmen: z.enum(["SKR03", "SKR04"]).default("SKR03"),
        wirtschaftsjahrBeginn: z.number().min(1).max(12).default(1),
        beraternummer: z.string().optional(),
        mandantennummer: z.string().optional(),
        farbe: z.string().optional(),
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const values: InsertUnternehmen = {
        ...input,
        createdBy: ctx.user.id,
      };

      const result = await db.insert(unternehmen).values(values);
      const insertId = result[0].insertId;

      // Benutzer als Admin dem Unternehmen zuordnen
      await db.insert(userUnternehmen).values({
        userId: ctx.user.id,
        unternehmenId: insertId,
        rolle: "admin",
      });

      return { id: insertId };
    }),

  // Unternehmen aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        rechtsform: z.string().optional(),
        steuernummer: z.string().optional(),
        ustIdNr: z.string().optional(),
        handelsregister: z.string().optional(),
        strasse: z.string().optional(),
        plz: z.string().optional(),
        ort: z.string().optional(),
        land: z.string().optional(),
        telefon: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        kontenrahmen: z.enum(["SKR03", "SKR04"]).optional(),
        wirtschaftsjahrBeginn: z.number().min(1).max(12).optional(),
        beraternummer: z.string().optional(),
        mandantennummer: z.string().optional(),
        aktiv: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, ...updateData } = input;
      await db.update(unternehmen).set(updateData).where(eq(unternehmen.id, id));

      return { success: true };
    }),
});

// ============================================
// BUCHUNGEN ROUTER
// ============================================
export const buchungenRouter = router({
  // Liste aller Buchungen eines Unternehmens
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        monat: z.number().min(1).max(12).optional(),
        jahr: z.number().optional(),
        status: z.enum(["entwurf", "geprueft", "exportiert"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select()
        .from(buchungen)
        .where(eq(buchungen.unternehmenId, input.unternehmenId))
        .orderBy(desc(buchungen.belegdatum));

      return await query;
    }),

  // Einzelne Buchung abrufen
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(buchungen)
        .where(eq(buchungen.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  // Neue Buchung erstellen
  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        buchungsart: z.enum(["aufwand", "ertrag", "anlage", "sonstig"]),
        belegdatum: z.string(),
        belegnummer: z.string(),
        geschaeftspartnerTyp: z.enum(["kreditor", "debitor", "gesellschafter", "sonstig"]),
        geschaeftspartner: z.string(),
        geschaeftspartnerKonto: z.string(),
        sachkonto: z.string(),
        kostenstelleId: z.number().optional(),
        nettobetrag: z.string(),
        steuersatz: z.string(),
        bruttobetrag: z.string(),
        buchungstext: z.string().optional(),
        belegUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const values: InsertBuchung = {
        ...input,
        belegdatum: new Date(input.belegdatum),
        nettobetrag: input.nettobetrag,
        steuersatz: input.steuersatz,
        bruttobetrag: input.bruttobetrag,
        createdBy: ctx.user.id,
      };

      const result = await db.insert(buchungen).values(values);
      return { id: result[0].insertId };
    }),

  // Buchung aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        buchungsart: z.enum(["aufwand", "ertrag", "anlage", "sonstig"]).optional(),
        belegdatum: z.string().optional(),
        belegnummer: z.string().optional(),
        geschaeftspartnerTyp: z.enum(["kreditor", "debitor", "gesellschafter", "sonstig"]).optional(),
        geschaeftspartner: z.string().optional(),
        geschaeftspartnerKonto: z.string().optional(),
        sachkonto: z.string().optional(),
        kostenstelleId: z.number().optional(),
        nettobetrag: z.string().optional(),
        steuersatz: z.string().optional(),
        bruttobetrag: z.string().optional(),
        buchungstext: z.string().optional(),
        belegUrl: z.string().optional(),
        status: z.enum(["entwurf", "geprueft", "exportiert"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      const { id, belegdatum, ...updateData } = input;
      const finalData: Record<string, unknown> = { ...updateData };
      if (belegdatum) {
        finalData.belegdatum = new Date(belegdatum);
      }

      await db.update(buchungen).set(finalData).where(eq(buchungen.id, id));
      return { success: true };
    }),

  // Buchung löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");

      await db.delete(buchungen).where(eq(buchungen.id, input.id));
      return { success: true };
    }),

  // DATEV-Export für einen Monat
  exportDatev: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        monat: z.number().min(1).max(12),
        jahr: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { csv: "", count: 0 };

      // Unternehmensdaten abrufen
      const company = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (!company[0]) throw new Error("Unternehmen nicht gefunden");

      // Buchungen des Monats abrufen
      const monthBuchungen = await db
        .select()
        .from(buchungen)
        .where(eq(buchungen.unternehmenId, input.unternehmenId));

      // Filtern nach Monat/Jahr
      const filteredBuchungen = monthBuchungen.filter((b) => {
        const date = new Date(b.belegdatum);
        return date.getMonth() + 1 === input.monat && date.getFullYear() === input.jahr;
      });

      // DATEV-CSV generieren
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 17) + "000";
      const startDate = `${input.jahr}${String(input.monat).padStart(2, "0")}01`;
      const endDate = `${input.jahr}${String(input.monat).padStart(2, "0")}${new Date(input.jahr, input.monat, 0).getDate()}`;
      const kontenrahmen = company[0].kontenrahmen === "SKR04" ? "04" : "03";

      const header = `"EXTF";700;21;"Buchungsstapel";13;${timestamp};;"${company[0].beraternummer || ""}";"";"";${company[0].mandantennummer || "1001"};10001;${input.jahr}0101;4;${startDate};${endDate};"Buchungsstapel";"MA";1;0;0;"EUR";;"";;;"${kontenrahmen}";;;"";""`;
      const columns = `Umsatz;Soll/Haben-Kz;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto (ohne BU-Schluessel);BU-Schluessel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext;Postensperre;Diverse Adressnummer;Geschaeftspartnerbank;Sachverhalt;Zinssperre;Beleglink;KOST1`;

      const rows = filteredBuchungen.map((b) => {
        const datum = new Date(b.belegdatum);
        const datumStr = `${String(datum.getDate()).padStart(2, "0")}${String(datum.getMonth() + 1).padStart(2, "0")}`;
        const sollHaben = b.buchungsart === "ertrag" ? "H" : "S";
        return `${b.bruttobetrag};"${sollHaben}";"EUR";;;;"${b.sachkonto}";"${b.geschaeftspartnerKonto}";"";"${datumStr}";"${b.belegnummer}";"";;${b.buchungstext || ""};0;;;;;"";"${b.kostenstelleId || ""}"`;
      });

      const csv = [header, columns, ...rows].join("\n");

      return { csv, count: filteredBuchungen.length };
    }),
});

// ============================================
// STAMMDATEN ROUTER (Kreditoren, Debitoren, etc.)
// ============================================
export const stammdatenRouter = router({
  // Kreditoren
  kreditoren: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(kreditoren).where(eq(kreditoren.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          name: z.string(),
          kurzbezeichnung: z.string().optional(),
          strasse: z.string().optional(),
          plz: z.string().optional(),
          ort: z.string().optional(),
          land: z.string().optional(),
          telefon: z.string().optional(),
          email: z.string().optional(),
          ustIdNr: z.string().optional(),
          steuernummer: z.string().optional(),
          iban: z.string().optional(),
          bic: z.string().optional(),
          zahlungsziel: z.number().optional(),
          skonto: z.string().optional(),
          skontofrist: z.number().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(kreditoren).values(input as InsertKreditor);
        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, ...data } = input;
        await db.update(kreditoren).set(data).where(eq(kreditoren.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(kreditoren).where(eq(kreditoren.id, input.id));
        return { success: true };
      }),
  }),

  // Debitoren
  debitoren: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(debitoren).where(eq(debitoren.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          name: z.string(),
          kurzbezeichnung: z.string().optional(),
          strasse: z.string().optional(),
          plz: z.string().optional(),
          ort: z.string().optional(),
          land: z.string().optional(),
          telefon: z.string().optional(),
          email: z.string().optional(),
          ustIdNr: z.string().optional(),
          kreditlimit: z.string().optional(),
          zahlungsziel: z.number().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(debitoren).values(input as InsertDebitor);
        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number() }).passthrough())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { id, ...data } = input;
        await db.update(debitoren).set(data).where(eq(debitoren.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(debitoren).where(eq(debitoren.id, input.id));
        return { success: true };
      }),
  }),

  // Anlagevermögen
  anlagevermoegen: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(anlagevermoegen).where(eq(anlagevermoegen.unternehmenId, input.unternehmenId));
      }),

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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(anlagevermoegen).where(eq(anlagevermoegen.id, input.id));
        return { success: true };
      }),
  }),

  // Beteiligungen
  beteiligungen: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(beteiligungen).where(eq(beteiligungen.unternehmenId, input.unternehmenId));
      }),

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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(beteiligungen).where(eq(beteiligungen.id, input.id));
        return { success: true };
      }),
  }),

  // Gesellschafter
  gesellschafter: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(gesellschafter).where(eq(gesellschafter.unternehmenId, input.unternehmenId));
      }),

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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(gesellschafter).where(eq(gesellschafter.id, input.id));
        return { success: true };
      }),
  }),

  // Bankkonten
  bankkonten: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(bankkonten).where(eq(bankkonten.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          kontonummer: z.string(),
          bezeichnung: z.string(),
          bankname: z.string().optional(),
          iban: z.string().optional(),
          bic: z.string().optional(),
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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(bankkonten).where(eq(bankkonten.id, input.id));
        return { success: true };
      }),
  }),

  // Kostenstellen
  kostenstellen: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(kostenstellen).where(eq(kostenstellen.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          nummer: z.string(),
          bezeichnung: z.string(),
          verantwortlicher: z.string().optional(),
          budget: z.string().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const result = await db.insert(kostenstellen).values(input as InsertKostenstelle);
        return { id: result[0].insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(kostenstellen).where(eq(kostenstellen.id, input.id));
        return { success: true };
      }),
  }),

  // Verträge
  vertraege: router({
    list: protectedProcedure
      .input(z.object({ unternehmenId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(vertraege).where(eq(vertraege.unternehmenId, input.unternehmenId));
      }),

    create: protectedProcedure
      .input(
        z.object({
          unternehmenId: z.number(),
          bezeichnung: z.string(),
          vertragsart: z.enum(["miete", "leasing", "wartung", "versicherung", "abo", "sonstig"]).optional(),
          vertragspartner: z.string().optional(),
          vertragsnummer: z.string().optional(),
          beginn: z.string().optional(),
          ende: z.string().optional(),
          kuendigungsfrist: z.string().optional(),
          monatlicheBetrag: z.string().optional(),
          zahlungsrhythmus: z.enum(["monatlich", "quartalsweise", "halbjaehrlich", "jaehrlich"]).optional(),
          buchungskonto: z.string().optional(),
          kostenstelleId: z.number().optional(),
          notizen: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        const { beginn, ende, ...rest } = input;
        const values: InsertVertrag = {
          ...rest,
          beginn: beginn ? new Date(beginn) : undefined,
          ende: ende ? new Date(ende) : undefined,
        };
        const result = await db.insert(vertraege).values(values);
        return { id: result[0].insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Datenbank nicht verfügbar");
        await db.delete(vertraege).where(eq(vertraege.id, input.id));
        return { success: true };
      }),
  }),
});

// ============================================
// NOTIZEN ROUTER
// ============================================
export const notizenRouter = router({
  list: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(notizen)
        .where(eq(notizen.unternehmenId, input.unternehmenId))
        .orderBy(desc(notizen.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        titel: z.string(),
        kategorie: z.enum(["vertrag", "kreditor", "debitor", "buchung", "allgemein"]).optional(),
        bezug: z.string().optional(),
        inhalt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      const values: InsertNotiz = {
        ...input,
        createdBy: ctx.user.id,
      };
      const result = await db.insert(notizen).values(values);
      return { id: result[0].insertId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        titel: z.string().optional(),
        kategorie: z.enum(["vertrag", "kreditor", "debitor", "buchung", "allgemein"]).optional(),
        bezug: z.string().optional(),
        inhalt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      const { id, ...data } = input;
      await db.update(notizen).set(data).where(eq(notizen.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      await db.delete(notizen).where(eq(notizen.id, input.id));
      return { success: true };
    }),
});
