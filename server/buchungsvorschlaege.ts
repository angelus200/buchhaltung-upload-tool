import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { buchungsvorschlaege, kreditoren, buchungen, auszugPositionen, auszuege, unternehmen, InsertBuchungsvorschlag, InsertBuchung } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM, type Message } from "./_core/llm";
import { getAufwandskontenByKontenrahmen, getBankKontoByKontenrahmen, getKontenrahmenName } from "../shared/kontenrahmen";

/**
 * SKR04-Aufwandskonten für AI-Vorschläge
 */
const SKR04_AUFWANDSKONTEN = {
  "6300": "Sonstige betriebliche Aufwendungen",
  "6310": "Miete",
  "6320": "Gas, Strom, Wasser",
  "6325": "Heizung",
  "6330": "Instandhaltung",
  "6400": "Versicherungen",
  "6500": "Kfz-Kosten",
  "6520": "Leasingaufwendungen",
  "6530": "Kfz-Betriebskosten",
  "6600": "Werbekosten",
  "6800": "Porto, Telefon",
  "6805": "Telefon, Internet",
  "6815": "Bürobedarf",
  "6820": "Zeitschriften, Bücher",
  "6825": "Fortbildungskosten",
  "6830": "Rechts- und Beratungskosten",
  "6835": "EDV-Kosten",
  "6850": "Abschluss- und Prüfungskosten",
  "7300": "Zinsaufwand",
};

/**
 * Analysiert einen Beleg mit AI und erstellt Buchungsvorschlag
 */
export async function analyzeBelegAndCreateVorschlag(
  imageBase64: string,
  mimeType: string,
  unternehmenId: number,
  belegUrl?: string
): Promise<InsertBuchungsvorschlag> {
  // Firma laden für Kontenrahmen
  const db = await getDb();
  if (!db) throw new Error("Datenbankverbindung nicht verfügbar");

  const [firma] = await db
    .select()
    .from(unternehmen)
    .where(eq(unternehmen.id, unternehmenId))
    .limit(1);

  const kontenrahmen = firma?.kontenrahmen || "SKR04";

  // Aufwandskonten je nach Kontenrahmen
  const aufwandskonten = getAufwandskontenByKontenrahmen(kontenrahmen);

  const systemPrompt = `Du bist ein Experte für ${getKontenrahmenName(kontenrahmen)}.

Analysiere diesen Beleg und extrahiere:

1. **Lieferant/Aussteller**: Name der Firma (aus Logo/Briefkopf)
2. **Rechnungsnummer**: Rechnungs-/Belegnummer
3. **Rechnungsdatum**: Datum (YYYY-MM-DD)
4. **Bruttobetrag**: Gesamtbetrag inkl. USt in EUR
5. **Nettobetrag**: Betrag ohne USt in EUR
6. **USt-Betrag**: Umsatzsteuerbetrag in EUR
7. **USt-Satz**: Steuersatz in Prozent (7, 19, etc.)
8. **Zahlungsziel**: Tage bis Zahlung (falls angegeben)
9. **IBAN**: Bankverbindung (falls angegeben)

**Buchungsvorschlag (${kontenrahmen}):**
Schlage das passende Aufwandskonto vor:

${Object.entries(aufwandskonten).map(([konto, bez]) => `- ${konto}: ${bez}`).join("\n")}

**Begründung**: Erkläre kurz, warum du dieses Konto vorgeschlagen hast.

**Confidence**: Wie sicher bist du? (0.00 - 1.00)
- 1.00 = sehr sicher (eindeutige Zuordnung)
- 0.80 = wahrscheinlich korrekt
- 0.50 = unsicher, Prüfung empfohlen

**WICHTIG - Buchungstext:**
- Buchungstext soll NUR den Lieferanten/Geschäftspartner enthalten
- NICHT die Kontobeschreibung verwenden!
- Beispiele:
  * Lieferant "Jimdo GmbH" → Buchungstext: "Jimdo GmbH"
  * Lieferant "Brevo (Sendinblue)" → Buchungstext: "Brevo"
  * Lieferant "Telekom Deutschland GmbH" → Buchungstext: "Telekom Deutschland GmbH"
- Falls kein Lieferant erkennbar: null setzen

Antworte NUR mit JSON:
{
  "lieferant": "string" | null,
  "rechnungsnummer": "string" | null,
  "belegdatum": "YYYY-MM-DD" | null,
  "betragBrutto": number | null,
  "betragNetto": number | null,
  "ustBetrag": number | null,
  "ustSatz": number | null,
  "zahlungsziel": number | null,
  "iban": "string" | null,
  "sollKonto": "string" (${kontenrahmen}-Konto),
  "buchungstext": "string" (NUR Lieferantenname, KEINE Kontobeschreibung!),
  "confidence": number (0.00 - 1.00),
  "aiNotizen": "string" (Begründung für Kontowahl)
}

Wichtig:
- Beträge als Dezimalzahlen mit Punkt (z.B. 100.00)
- Datum immer YYYY-MM-DD
- Confidence realistisch einschätzen
- Buchungstext = Lieferantenname, NICHT "Gas, Strom, Wasser" o.ä.`;

  try {
    const messages: Message[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analysiere diesen Beleg und erstelle einen Buchungsvorschlag:",
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
        ],
      },
    ];

    const response = await invokeLLM(messages, {
      temperature: 0,
      max_tokens: 2000,
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Keine JSON-Antwort erhalten");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Erstelle Buchungsvorschlag
    const vorschlag: InsertBuchungsvorschlag = {
      unternehmenId,
      belegUrl: belegUrl || null,
      lieferant: result.lieferant || null,
      kreditorId: null, // Wird später per Name-Matching gesetzt
      rechnungsnummer: result.rechnungsnummer || null,
      belegdatum: result.belegdatum ? new Date(result.belegdatum) : null,
      betragBrutto: result.betragBrutto ? result.betragBrutto.toString() : null,
      betragNetto: result.betragNetto ? result.betragNetto.toString() : null,
      ustBetrag: result.ustBetrag ? result.ustBetrag.toString() : null,
      ustSatz: result.ustSatz ? result.ustSatz.toString() : null,
      zahlungsziel: result.zahlungsziel || null,
      iban: result.iban || null,
      sollKonto: result.sollKonto || null,
      habenKonto: "0620", // Standard: Verbindlichkeiten aus Lieferungen und Leistungen
      buchungstext: result.buchungstext || null,
      geschaeftspartnerKonto: null, // Wird gesetzt wenn Kreditor gefunden
      confidence: result.confidence ? result.confidence.toString() : "0.50",
      aiNotizen: result.aiNotizen || null,
      status: "vorschlag",
      buchungId: null,
      bearbeitetVon: null,
      bearbeitetAm: null,
    };

    return vorschlag;
  } catch (error) {
    console.error("Beleganalyse Fehler:", error);
    throw new Error(`Beleganalyse fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
  }
}

/**
 * Sucht passenden Kreditor anhand des Namens
 */
export async function findKreditorByName(
  lieferantName: string,
  unternehmenId: number
): Promise<number | null> {
  const db = await getDb();
  if (!db || !lieferantName) return null;

  // Normalisiere Namen für Vergleich
  const normalizedName = lieferantName.toLowerCase().trim();

  const allKreditoren = await db
    .select()
    .from(kreditoren)
    .where(eq(kreditoren.unternehmenId, unternehmenId));

  // Exakte Übereinstimmung
  let match = allKreditoren.find(k => k.name.toLowerCase().trim() === normalizedName);
  if (match) return match.id;

  // Teilübereinstimmung (enthält)
  match = allKreditoren.find(k =>
    k.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(k.name.toLowerCase())
  );
  if (match) return match.id;

  return null;
}

/**
 * Analysiert eine Bank-Transaktion mit AI und erstellt Buchungsvorschlag
 */
export async function analyzeBankTransactionAndCreateVorschlag(
  buchungstext: string,
  betrag: number,
  datum: Date,
  unternehmenId: number,
  positionId: number
): Promise<InsertBuchungsvorschlag> {
  // Firma laden für Kontenrahmen
  const db = await getDb();
  if (!db) throw new Error("Datenbankverbindung nicht verfügbar");

  const [firma] = await db
    .select()
    .from(unternehmen)
    .where(eq(unternehmen.id, unternehmenId))
    .limit(1);

  const kontenrahmen = firma?.kontenrahmen || "SKR04";

  // Aufwandskonten und Bankkonto je nach Kontenrahmen
  const aufwandskonten = getAufwandskontenByKontenrahmen(kontenrahmen);
  const bankKonto = getBankKontoByKontenrahmen(kontenrahmen);

  const systemPrompt = `Du bist ein Experte für ${getKontenrahmenName(kontenrahmen)}.

Analysiere diese **Bank-Transaktion** (keine Rechnung, nur Buchungstext von der Bank):

**Buchungstext:** "${buchungstext}"
**Betrag:** ${betrag.toFixed(2)} EUR
**Datum:** ${datum.toISOString().split('T')[0]}

Extrahiere:
1. **Geschäftspartner**: Erkenne den Namen der Firma/Person aus dem Buchungstext
2. **Buchungsvorschlag (${kontenrahmen})**: Welches Aufwandskonto passt?

**Verfügbare ${kontenrahmen}-Konten:**
${Object.entries(aufwandskonten).map(([konto, bez]) => `- ${konto}: ${bez}`).join("\n")}

**Confidence-Bewertung:**
- 0.90-1.00 = Sehr eindeutig
- 0.70-0.89 = Wahrscheinlich korrekt
- 0.50-0.69 = Unsicher
- 0.00-0.49 = Sehr unsicher

**WICHTIG:**
- Buchungstext = NUR Geschäftspartner-Name (z.B. "Telekom Deutschland GmbH")
- NICHT die Kontobeschreibung verwenden!
- Bei Lastschrift/SEPA: Firma extrahieren, nicht "LASTSCHRIFT"
- Bei unklarem Text: Confidence niedrig setzen (0.50-0.60)

Antworte NUR mit JSON:
{
  "geschaeftspartner": "string" | null,
  "sollKonto": "string" (${kontenrahmen}-Konto),
  "buchungstext": "string" (NUR Geschäftspartner-Name!),
  "confidence": number (0.00 - 1.00),
  "aiNotizen": "string" (Begründung für Kontowahl und Confidence-Level)"
}`;

  try {
    const messages: Message[] = [
      { role: "user", content: systemPrompt },
    ];

    const response = await invokeLLM(messages, { temperature: 0.1 });

    // Parse JSON response
    let aiData: any;
    try {
      // Entferne potentielle Markdown-Code-Blöcke
      const cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      aiData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response:", response);
      throw new Error("AI-Antwort konnte nicht als JSON geparst werden");
    }

    // Validierung
    if (!aiData.sollKonto) {
      throw new Error("AI hat kein Sollkonto vorgeschlagen");
    }

    // Kreditor-Matching
    let kreditorId: number | null = null;
    if (aiData.geschaeftspartner) {
      kreditorId = await findKreditorByName(aiData.geschaeftspartner, unternehmenId);
    }

    // Erstelle Buchungsvorschlag
    const vorschlag: InsertBuchungsvorschlag = {
      unternehmenId,
      belegUrl: null, // Bank-Transaktion hat keinen Beleg
      lieferant: aiData.geschaeftspartner || null,
      kreditorId: kreditorId,
      rechnungsnummer: null, // Bank-Transaktionen haben keine Rechnungsnummer
      belegdatum: datum,
      betragBrutto: betrag.toFixed(2),
      betragNetto: betrag.toFixed(2), // Bei Transaktionen meist identisch
      ustBetrag: "0.00", // Wird später manuell angepasst
      ustSatz: null,
      zahlungsziel: null,
      iban: null,
      sollKonto: aiData.sollKonto,
      habenKonto: bankKonto, // Dynamisch je nach Kontenrahmen: SKR04=1200, OeKR=2800, KMU=1020
      buchungstext: aiData.buchungstext || aiData.geschaeftspartner || buchungstext.substring(0, 50),
      geschaeftspartnerKonto: null,
      confidence: aiData.confidence?.toString() || "0.50",
      aiNotizen: `Bank-Transaktion analysiert.\n${aiData.aiNotizen || ""}\n\nOriginal-Buchungstext: "${buchungstext}"`,
      status: "vorschlag",
      buchungId: null,
      bearbeitetVon: null,
      bearbeitetAm: null,
    };

    return vorschlag;
  } catch (error) {
    console.error("Bank-Transaktions-Analyse Fehler:", error);
    throw new Error(`Transaktions-Analyse fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
  }
}

/**
 * Buchungsvorschläge-Router
 */
export const buchungsvorschlaegeRouter = router({
  /**
   * Alle Buchungsvorschläge abrufen
   */
  list: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        status: z.enum(["vorschlag", "akzeptiert", "abgelehnt", "bearbeitet", "alle"]).default("vorschlag"),
        minConfidence: z.number().min(0).max(1).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(buchungsvorschlaege.unternehmenId, input.unternehmenId)];

      if (input.status !== "alle") {
        conditions.push(eq(buchungsvorschlaege.status, input.status));
      }

      const result = await db
        .select()
        .from(buchungsvorschlaege)
        .where(and(...conditions))
        .orderBy(desc(buchungsvorschlaege.createdAt));

      // Filter nach Confidence
      if (input.minConfidence !== undefined) {
        return result.filter(v => parseFloat(v.confidence?.toString() || "0") >= input.minConfidence!);
      }

      return result;
    }),

  /**
   * Einzelnen Vorschlag abrufen
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [vorschlag] = await db
        .select()
        .from(buchungsvorschlaege)
        .where(eq(buchungsvorschlaege.id, input.id))
        .limit(1);

      return vorschlag || null;
    }),

  /**
   * Beleg analysieren und Vorschlag erstellen
   */
  createFromBeleg: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        imageBase64: z.string(),
        mimeType: z.string(),
        belegUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // AI-Analyse
      const vorschlag = await analyzeBelegAndCreateVorschlag(
        input.imageBase64,
        input.mimeType,
        input.unternehmenId,
        input.belegUrl
      );

      // Suche passenden Kreditor
      if (vorschlag.lieferant) {
        const kreditorId = await findKreditorByName(vorschlag.lieferant, input.unternehmenId);
        if (kreditorId) {
          vorschlag.kreditorId = kreditorId;

          // Lade Kreditor-Daten
          const [kreditor] = await db
            .select()
            .from(kreditoren)
            .where(eq(kreditoren.id, kreditorId))
            .limit(1);

          if (kreditor) {
            // Verwende Kreditor-Personenkonto
            vorschlag.geschaeftspartnerKonto = kreditor.kontonummer || null;

            // Verwende Standard-Sachkonto wenn vorhanden
            if (kreditor.standardSachkonto) {
              vorschlag.sollKonto = kreditor.standardSachkonto;
              vorschlag.confidence = "0.95"; // Höhere Confidence bei bekanntem Kreditor
              vorschlag.aiNotizen = (vorschlag.aiNotizen || "") + ` | Kreditor erkannt: ${kreditor.name}, Standard-Sachkonto verwendet.`;
            }
          }
        }
      }

      // Speichere Vorschlag
      const [result] = await db.insert(buchungsvorschlaege).values(vorschlag);

      return {
        success: true,
        vorschlagId: result.insertId,
        confidence: parseFloat(vorschlag.confidence?.toString() || "0"),
      };
    }),

  /**
   * Vorschlag akzeptieren und Buchung erstellen
   */
  accept: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Lade Vorschlag
      const [vorschlag] = await db
        .select()
        .from(buchungsvorschlaege)
        .where(eq(buchungsvorschlaege.id, input.id))
        .limit(1);

      if (!vorschlag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vorschlag nicht gefunden" });
      }

      // Erstelle Buchung
      const buchungData: InsertBuchung = {
        unternehmenId: vorschlag.unternehmenId,
        buchungsart: "aufwand",
        belegdatum: vorschlag.belegdatum || new Date(),
        belegnummer: vorschlag.rechnungsnummer || "",
        geschaeftspartner: vorschlag.lieferant || "",
        geschaeftspartnerTyp: vorschlag.kreditorId ? "kreditor" : "sonstig",
        geschaeftspartnerKonto: vorschlag.geschaeftspartnerKonto || null,
        sachkonto: vorschlag.sollKonto || "6300",
        nettobetrag: vorschlag.betragNetto || "0",
        bruttobetrag: vorschlag.betragBrutto || "0",
        steuersatz: vorschlag.ustSatz || "19",
        buchungstext: vorschlag.buchungstext || `Rechnung ${vorschlag.rechnungsnummer || ""}`,
        belegUrl: vorschlag.belegUrl || null,
        zahlungsstatus: "offen",
        faelligkeitsdatum: vorschlag.belegdatum && vorschlag.zahlungsziel
          ? new Date(new Date(vorschlag.belegdatum).getTime() + vorschlag.zahlungsziel * 24 * 60 * 60 * 1000)
          : null,
        createdBy: ctx.user.id,
      };

      const [buchungResult] = await db.insert(buchungen).values(buchungData);

      // Update Vorschlag
      await db
        .update(buchungsvorschlaege)
        .set({
          status: "akzeptiert",
          buchungId: buchungResult.insertId,
          bearbeitetVon: ctx.user.id,
          bearbeitetAm: new Date(),
        })
        .where(eq(buchungsvorschlaege.id, input.id));

      return {
        success: true,
        buchungId: buchungResult.insertId,
      };
    }),

  /**
   * Vorschlag ablehnen
   */
  reject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(buchungsvorschlaege)
        .set({
          status: "abgelehnt",
          bearbeitetVon: ctx.user.id,
          bearbeitetAm: new Date(),
        })
        .where(eq(buchungsvorschlaege.id, input.id));

      return { success: true };
    }),

  /**
   * Vorschlag bearbeiten
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        sollKonto: z.string().optional(),
        habenKonto: z.string().optional(),
        buchungstext: z.string().optional(),
        betragNetto: z.string().optional(),
        betragBrutto: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const updateData: any = {
        bearbeitetVon: ctx.user.id,
        bearbeitetAm: new Date(),
      };

      if (input.sollKonto !== undefined) updateData.sollKonto = input.sollKonto;
      if (input.habenKonto !== undefined) updateData.habenKonto = input.habenKonto;
      if (input.buchungstext !== undefined) updateData.buchungstext = input.buchungstext;
      if (input.betragNetto !== undefined) updateData.betragNetto = input.betragNetto;
      if (input.betragBrutto !== undefined) updateData.betragBrutto = input.betragBrutto;

      await db
        .update(buchungsvorschlaege)
        .set(updateData)
        .where(eq(buchungsvorschlaege.id, input.id));

      return { success: true };
    }),

  /**
   * Erstellt Buchungsvorschlag aus einer Auszug-Position
   */
  createFromPosition: protectedProcedure
    .input(z.object({ positionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      // 1. Position laden
      const [position] = await db
        .select()
        .from(auszugPositionen)
        .where(eq(auszugPositionen.id, input.positionId))
        .limit(1);

      if (!position) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Position nicht gefunden",
        });
      }

      // 2. Auszug laden (für unternehmenId und Security-Check)
      const [auszug] = await db
        .select()
        .from(auszuege)
        .where(eq(auszuege.id, position.auszugId))
        .limit(1);

      if (!auszug) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auszug nicht gefunden",
        });
      }

      // 3. Prüfen ob bereits ein Vorschlag existiert
      const existingVorschlaege = await db
        .select()
        .from(buchungsvorschlaege)
        .where(
          and(
            eq(buchungsvorschlaege.unternehmenId, auszug.unternehmenId),
            sql`${buchungsvorschlaege.aiNotizen} LIKE ${`%Position-ID: ${position.id}%`}`
          )
        );

      if (existingVorschlaege.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Für diese Position existiert bereits ein Buchungsvorschlag",
        });
      }

      // 4. AI-Analyse durchführen
      const vorschlagData = await analyzeBankTransactionAndCreateVorschlag(
        position.buchungstext,
        parseFloat(position.betrag.toString()),
        position.datum,
        auszug.unternehmenId,
        position.id
      );

      // 5. Vorschlag speichern
      const [insertResult] = await db.insert(buchungsvorschlaege).values({
        ...vorschlagData,
        aiNotizen: `${vorschlagData.aiNotizen}\n\nPosition-ID: ${position.id}`, // Für Duplikat-Check
      });

      // 6. Position-Status aktualisieren (für spätere UI-Anzeige)
      // Hinweis: status "offen" bleibt, wird erst bei Buchung auf "zugeordnet" gesetzt

      return {
        success: true,
        vorschlagId: insertResult.insertId,
        confidence: parseFloat(vorschlagData.confidence?.toString() || "0"),
      };
    }),

  /**
   * Statistiken
   */
  stats: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { offen: 0, akzeptiert: 0, abgelehnt: 0, hocheQualitaet: 0 };

      const all = await db
        .select()
        .from(buchungsvorschlaege)
        .where(eq(buchungsvorschlaege.unternehmenId, input.unternehmenId));

      return {
        offen: all.filter(v => v.status === "vorschlag").length,
        akzeptiert: all.filter(v => v.status === "akzeptiert").length,
        abgelehnt: all.filter(v => v.status === "abgelehnt").length,
        hocheQualitaet: all.filter(v => parseFloat(v.confidence?.toString() || "0") >= 0.8).length,
      };
    }),
});
