import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Clerk user identifier. Unique per user. */
  clerkId: varchar("clerkId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Unternehmen/Mandanten - Zentrale Verwaltung für Unternehmensgruppen
 */
// Unterstützte Länder
export const LAENDER = ["DE", "AT", "CH", "UK", "CY"] as const;
export type Land = typeof LAENDER[number];

// Länder-Konfiguration
export const LAENDER_CONFIG: Record<Land, {
  name: string;
  waehrung: string;
  waehrungSymbol: string;
  kontenrahmen: string[];
  defaultKontenrahmen: string;
  ustSaetze: number[];
  steuernummerFormat: string;
  ustIdFormat: string;
}> = {
  DE: {
    name: "Deutschland",
    waehrung: "EUR",
    waehrungSymbol: "€",
    kontenrahmen: ["SKR03", "SKR04"],
    defaultKontenrahmen: "SKR03",
    ustSaetze: [0, 7, 19],
    steuernummerFormat: "XXX/XXX/XXXXX",
    ustIdFormat: "DE XXXXXXXXX",
  },
  AT: {
    name: "Österreich",
    waehrung: "EUR",
    waehrungSymbol: "€",
    kontenrahmen: ["OeKR", "RLG"],
    defaultKontenrahmen: "OeKR",
    ustSaetze: [0, 10, 13, 20],
    steuernummerFormat: "XX-XXX/XXXX",
    ustIdFormat: "ATU XXXXXXXX",
  },
  CH: {
    name: "Schweiz",
    waehrung: "CHF",
    waehrungSymbol: "CHF",
    kontenrahmen: ["KMU", "OR"],
    defaultKontenrahmen: "KMU",
    ustSaetze: [0, 2.6, 3.8, 8.1],
    steuernummerFormat: "CHE-XXX.XXX.XXX",
    ustIdFormat: "CHE-XXX.XXX.XXX MWST",
  },
  UK: {
    name: "United Kingdom",
    waehrung: "GBP",
    waehrungSymbol: "£",
    kontenrahmen: ["UK_GAAP", "IFRS"],
    defaultKontenrahmen: "UK_GAAP",
    ustSaetze: [0, 5, 20],
    steuernummerFormat: "UTR: XXXXXXXXXX",
    ustIdFormat: "GB XXX XXXX XX",
  },
  CY: {
    name: "Zypern",
    waehrung: "EUR",
    waehrungSymbol: "€",
    kontenrahmen: ["CY_GAAP", "IFRS"],
    defaultKontenrahmen: "CY_GAAP",
    ustSaetze: [0, 5, 9, 19],
    steuernummerFormat: "XXXXXXXX X",
    ustIdFormat: "CY XXXXXXXX X",
  },
};

export const unternehmen = mysqlTable("unternehmen", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  rechtsform: varchar("rechtsform", { length: 100 }),
  steuernummer: varchar("steuernummer", { length: 50 }),
  ustIdNr: varchar("ustIdNr", { length: 50 }),
  handelsregister: varchar("handelsregister", { length: 100 }),
  strasse: varchar("strasse", { length: 255 }),
  plz: varchar("plz", { length: 10 }),
  ort: varchar("ort", { length: 100 }),
  // Internationalisierung
  landCode: mysqlEnum("landCode", ["DE", "AT", "CH", "UK", "CY"]).default("DE").notNull(),
  land: varchar("land", { length: 100 }).default("Deutschland"),
  waehrung: mysqlEnum("waehrung", ["EUR", "CHF", "GBP"]).default("EUR").notNull(),
  telefon: varchar("telefon", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  // Erweiterte Kontenrahmen für alle Länder
  kontenrahmen: mysqlEnum("kontenrahmen", [
    "SKR03", "SKR04",           // Deutschland
    "OeKR", "RLG",              // Österreich
    "KMU", "OR",                // Schweiz
    "UK_GAAP", "IFRS",          // UK & International
    "CY_GAAP"                   // Zypern
  ]).default("SKR03").notNull(),
  wirtschaftsjahrBeginn: int("wirtschaftsjahrBeginn").default(1).notNull(),
  beraternummer: varchar("beraternummer", { length: 20 }),
  mandantennummer: varchar("mandantennummer", { length: 20 }),
  // Visuelle Unterscheidungsmerkmale
  farbe: varchar("farbe", { length: 20 }).default("#0d9488"), // Teal als Standard
  logoUrl: text("logoUrl"),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Unternehmen = typeof unternehmen.$inferSelect;
export type InsertUnternehmen = typeof unternehmen.$inferInsert;

/**
 * Benutzer-Unternehmen Zuordnung (Mandantenzugriff)
 */
export const userUnternehmen = mysqlTable("user_unternehmen", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  rolle: mysqlEnum("rolle", ["admin", "buchhalter", "viewer"]).default("buchhalter").notNull(),
  // Detaillierte Berechtigungen
  buchungenLesen: boolean("buchungenLesen").default(true).notNull(),
  buchungenSchreiben: boolean("buchungenSchreiben").default(false).notNull(),
  stammdatenLesen: boolean("stammdatenLesen").default(true).notNull(),
  stammdatenSchreiben: boolean("stammdatenSchreiben").default(false).notNull(),
  berichteLesen: boolean("berichteLesen").default(true).notNull(),
  berichteExportieren: boolean("berichteExportieren").default(false).notNull(),
  einladungenVerwalten: boolean("einladungenVerwalten").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserUnternehmen = typeof userUnternehmen.$inferSelect;
export type InsertUserUnternehmen = typeof userUnternehmen.$inferInsert;

/**
 * Kreditoren (Lieferanten)
 */
export const kreditoren = mysqlTable("kreditoren", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  kontonummer: varchar("kontonummer", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  kurzbezeichnung: varchar("kurzbezeichnung", { length: 50 }),
  strasse: varchar("strasse", { length: 255 }),
  plz: varchar("plz", { length: 10 }),
  ort: varchar("ort", { length: 100 }),
  land: varchar("land", { length: 100 }),
  telefon: varchar("telefon", { length: 50 }),
  email: varchar("email", { length: 320 }),
  ustIdNr: varchar("ustIdNr", { length: 50 }),
  steuernummer: varchar("steuernummer", { length: 50 }),
  iban: varchar("iban", { length: 34 }),
  bic: varchar("bic", { length: 11 }),
  zahlungsziel: int("zahlungsziel").default(30),
  skonto: decimal("skonto", { precision: 5, scale: 2 }),
  skontofrist: int("skontofrist"),
  standardSachkonto: varchar("standardSachkonto", { length: 20 }),
  notizen: text("notizen"),
  // DATEV-Import: Original-Kontonummer aus DATEV für Rückverfolgung
  datevKontonummer: varchar("datevKontonummer", { length: 20 }),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Kreditor = typeof kreditoren.$inferSelect;
export type InsertKreditor = typeof kreditoren.$inferInsert;

/**
 * Debitoren (Kunden)
 */
export const debitoren = mysqlTable("debitoren", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  kontonummer: varchar("kontonummer", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  kurzbezeichnung: varchar("kurzbezeichnung", { length: 50 }),
  strasse: varchar("strasse", { length: 255 }),
  plz: varchar("plz", { length: 10 }),
  ort: varchar("ort", { length: 100 }),
  land: varchar("land", { length: 100 }),
  telefon: varchar("telefon", { length: 50 }),
  email: varchar("email", { length: 320 }),
  ustIdNr: varchar("ustIdNr", { length: 50 }),
  kreditlimit: decimal("kreditlimit", { precision: 15, scale: 2 }),
  zahlungsziel: int("zahlungsziel").default(14),
  notizen: text("notizen"),
  // DATEV-Import: Original-Kontonummer aus DATEV für Rückverfolgung
  datevKontonummer: varchar("datevKontonummer", { length: 20 }),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Debitor = typeof debitoren.$inferSelect;
export type InsertDebitor = typeof debitoren.$inferInsert;

/**
 * Anlagevermögen
 */
export const anlagevermoegen = mysqlTable("anlagevermoegen", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  kontonummer: varchar("kontonummer", { length: 20 }).notNull(),
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  kategorie: varchar("kategorie", { length: 100 }),
  anschaffungsdatum: date("anschaffungsdatum"),
  anschaffungskosten: decimal("anschaffungskosten", { precision: 15, scale: 2 }),
  nutzungsdauer: int("nutzungsdauer"),
  abschreibungsmethode: mysqlEnum("abschreibungsmethode", ["linear", "degressiv", "keine"]).default("linear"),
  restwert: decimal("restwert", { precision: 15, scale: 2 }),
  sachkonto: varchar("sachkonto", { length: 20 }), // Verknüpfung mit Buchungen
  standort: varchar("standort", { length: 255 }),
  inventarnummer: varchar("inventarnummer", { length: 50 }),
  seriennummer: varchar("seriennummer", { length: 100 }),
  notizen: text("notizen"),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Anlagevermoegen = typeof anlagevermoegen.$inferSelect;
export type InsertAnlagevermoegen = typeof anlagevermoegen.$inferInsert;

/**
 * Beteiligungen
 */
export const beteiligungen = mysqlTable("beteiligungen", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  kontonummer: varchar("kontonummer", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  rechtsform: varchar("rechtsform", { length: 100 }),
  anteil: decimal("anteil", { precision: 5, scale: 2 }),
  buchwert: decimal("buchwert", { precision: 15, scale: 2 }),
  erwerbsdatum: date("erwerbsdatum"),
  sachkonto: varchar("sachkonto", { length: 20 }), // Verknüpfung mit Buchungen
  sitz: varchar("sitz", { length: 255 }),
  handelsregister: varchar("handelsregister", { length: 100 }),
  notizen: text("notizen"),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Beteiligung = typeof beteiligungen.$inferSelect;
export type InsertBeteiligung = typeof beteiligungen.$inferInsert;

/**
 * Gesellschafter
 */
export const gesellschafter = mysqlTable("gesellschafter", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  kontonummer: varchar("kontonummer", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  typ: mysqlEnum("typ", ["natuerlich", "juristisch"]).default("natuerlich"),
  anteil: decimal("anteil", { precision: 5, scale: 2 }),
  einlage: decimal("einlage", { precision: 15, scale: 2 }),
  eintrittsdatum: date("eintrittsdatum"),
  sachkonto: varchar("sachkonto", { length: 20 }), // Kapitalkonto für Buchungen
  strasse: varchar("strasse", { length: 255 }),
  plz: varchar("plz", { length: 10 }),
  ort: varchar("ort", { length: 100 }),
  steuerId: varchar("steuerId", { length: 50 }),
  notizen: text("notizen"),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gesellschafter = typeof gesellschafter.$inferSelect;
export type InsertGesellschafter = typeof gesellschafter.$inferInsert;

/**
 * Bankkonten
 */
export const bankkonten = mysqlTable("bankkonten", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  kontonummer: varchar("kontonummer", { length: 20 }).notNull(),
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  bankname: varchar("bankname", { length: 255 }),
  iban: varchar("iban", { length: 34 }),
  bic: varchar("bic", { length: 11 }),
  sachkonto: varchar("sachkonto", { length: 20 }), // Verknüpfung mit Buchungen
  anfangsbestand: decimal("anfangsbestand", { precision: 15, scale: 2 }).default("0.00"), // Anfangsbestand für Saldo-Berechnung
  kontotyp: mysqlEnum("kontotyp", ["girokonto", "sparkonto", "festgeld", "kreditkarte", "sonstig"]).default("girokonto"),
  waehrung: varchar("waehrung", { length: 3 }).default("EUR"),
  notizen: text("notizen"),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bankkonto = typeof bankkonten.$inferSelect;
export type InsertBankkonto = typeof bankkonten.$inferInsert;

/**
 * Kostenstellen
 */
export const kostenstellen = mysqlTable("kostenstellen", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  nummer: varchar("nummer", { length: 20 }).notNull(),
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  verantwortlicher: varchar("verantwortlicher", { length: 255 }),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  notizen: text("notizen"),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Kostenstelle = typeof kostenstellen.$inferSelect;
export type InsertKostenstelle = typeof kostenstellen.$inferInsert;

/**
 * Verträge
 */
export const vertraege = mysqlTable("vertraege", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  vertragsart: mysqlEnum("vertragsart", ["miete", "leasing", "wartung", "versicherung", "abo", "sonstig"]).default("sonstig"),
  vertragspartner: varchar("vertragspartner", { length: 255 }),
  vertragsnummer: varchar("vertragsnummer", { length: 100 }),
  beginn: date("beginn"),
  ende: date("ende"),
  kuendigungsfrist: varchar("kuendigungsfrist", { length: 100 }),
  monatlicheBetrag: decimal("monatlicheBetrag", { precision: 15, scale: 2 }),
  zahlungsrhythmus: mysqlEnum("zahlungsrhythmus", ["monatlich", "quartalsweise", "halbjaehrlich", "jaehrlich"]).default("monatlich"),
  buchungskonto: varchar("buchungskonto", { length: 20 }),
  kostenstelleId: int("kostenstelleId").references(() => kostenstellen.id),
  notizen: text("notizen"),
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vertrag = typeof vertraege.$inferSelect;
export type InsertVertrag = typeof vertraege.$inferInsert;

/**
 * Buchungen
 */
export const buchungen = mysqlTable("buchungen", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  buchungsart: mysqlEnum("buchungsart", ["aufwand", "ertrag", "anlage", "sonstig"]).notNull(),
  belegdatum: date("belegdatum").notNull(),
  belegnummer: varchar("belegnummer", { length: 50 }).notNull(),
  geschaeftspartnerTyp: mysqlEnum("geschaeftspartnerTyp", ["kreditor", "debitor", "gesellschafter", "sonstig"]).notNull(),
  geschaeftspartner: varchar("geschaeftspartner", { length: 255 }).notNull(),
  geschaeftspartnerKonto: varchar("geschaeftspartnerKonto", { length: 20 }).notNull(),
  sachkonto: varchar("sachkonto", { length: 20 }).notNull(),
  kostenstelleId: int("kostenstelleId").references(() => kostenstellen.id),
  nettobetrag: decimal("nettobetrag", { precision: 15, scale: 2 }).notNull(),
  steuersatz: decimal("steuersatz", { precision: 5, scale: 2 }).notNull(),
  bruttobetrag: decimal("bruttobetrag", { precision: 15, scale: 2 }).notNull(),
  buchungstext: text("buchungstext"),
  belegUrl: varchar("belegUrl", { length: 500 }),

  // Fremdwährungsbuchungen
  belegWaehrung: varchar("belegWaehrung", { length: 3 }), // "EUR", "USD", "CHF", null = Firmenwährung
  belegBetragNetto: decimal("belegBetragNetto", { precision: 15, scale: 2 }), // Original Netto in Belegwährung
  belegBetragBrutto: decimal("belegBetragBrutto", { precision: 15, scale: 2 }), // Original Brutto in Belegwährung
  wechselkurs: decimal("wechselkurs", { precision: 10, scale: 6 }), // Wechselkurs (z.B. 0.950000 für EUR->CHF)
  status: mysqlEnum("status", ["entwurf", "geprueft", "exportiert"]).default("entwurf").notNull(),
  exportiertAm: timestamp("exportiertAm"),
  // Zahlungsstatus
  zahlungsstatus: mysqlEnum("zahlungsstatus", ["offen", "teilweise_bezahlt", "bezahlt", "ueberfaellig"]).default("offen").notNull(),
  faelligkeitsdatum: date("faelligkeitsdatum"),
  bezahltAm: date("bezahltAm"),
  bezahlterBetrag: decimal("bezahlterBetrag", { precision: 15, scale: 2 }),
  zahlungsreferenz: varchar("zahlungsreferenz", { length: 100 }),

  // === DATEV-Import Erweiterungen ===

  // Soll/Haben-Konten separat (für doppelte Buchführung)
  sollKonto: varchar("sollKonto", { length: 20 }),
  habenKonto: varchar("habenKonto", { length: 20 }),

  // DATEV-spezifische Identifikatoren
  datevBelegnummer: varchar("datevBelegnummer", { length: 50 }), // Original DATEV-Belegnummer
  datevBuchungszeile: int("datevBuchungszeile"), // Zeilen-ID innerhalb eines Buchungssatzes
  datevBelegId: varchar("datevBelegId", { length: 100 }), // BEDI-ID für Belegzuordnung

  // Periode/Wirtschaftsjahr
  wirtschaftsjahr: int("wirtschaftsjahr"), // z.B. 2025
  periode: int("periode"), // Monat 1-12

  // Buchungstext aus DATEV (kann länger sein als normaler buchungstext)
  datevBuchungstext: text("datevBuchungstext"),

  // Import-Tracking
  importQuelle: mysqlEnum("importQuelle", ["manuell", "datev_gdpdu", "datev_csv", "datev_ascii", "api"]),
  importDatum: timestamp("importDatum"),
  importReferenz: varchar("importReferenz", { length: 255 }), // z.B. "DATEV_2025_Q1"

  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Buchung = typeof buchungen.$inferSelect;
export type InsertBuchung = typeof buchungen.$inferInsert;

/**
 * Notizen
 */
export const notizen = mysqlTable("notizen", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  titel: varchar("titel", { length: 255 }).notNull(),
  kategorie: mysqlEnum("kategorie", ["vertrag", "kreditor", "debitor", "buchung", "allgemein"]).default("allgemein"),
  bezug: varchar("bezug", { length: 255 }),
  inhalt: text("inhalt"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notiz = typeof notizen.$inferSelect;
export type InsertNotiz = typeof notizen.$inferInsert;

/**
 * Aktivitätsprotokoll - Wer hat wann was gemacht
 */
export const aktivitaetsprotokoll = mysqlTable("aktivitaetsprotokoll", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id),
  userId: int("userId").references(() => users.id).notNull(),
  aktion: mysqlEnum("aktion", [
    "buchung_erstellt",
    "buchung_bearbeitet", 
    "buchung_geloescht",
    "buchung_exportiert",
    "stammdaten_erstellt",
    "stammdaten_bearbeitet",
    "stammdaten_geloescht",
    "unternehmen_erstellt",
    "unternehmen_bearbeitet",
    "benutzer_hinzugefuegt",
    "benutzer_entfernt",
    "rolle_geaendert",
    "berechtigungen_geaendert",
    "login",
    "logout"
  ]).notNull(),
  entitaetTyp: varchar("entitaetTyp", { length: 50 }),
  entitaetId: int("entitaetId"),
  entitaetName: varchar("entitaetName", { length: 255 }),
  details: text("details"),
  ipAdresse: varchar("ipAdresse", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Aktivitaetsprotokoll = typeof aktivitaetsprotokoll.$inferSelect;
export type InsertAktivitaetsprotokoll = typeof aktivitaetsprotokoll.$inferInsert;

/**
 * Erweiterte Benutzerrollen mit detaillierten Berechtigungen
 */
export const berechtigungen = mysqlTable("berechtigungen", {
  id: int("id").autoincrement().primaryKey(),
  rollenName: mysqlEnum("rollenName", ["admin", "buchhalter", "viewer"]).notNull(),
  bereich: varchar("bereich", { length: 50 }).notNull(),
  lesen: boolean("lesen").default(true).notNull(),
  erstellen: boolean("erstellen").default(false).notNull(),
  bearbeiten: boolean("bearbeiten").default(false).notNull(),
  loeschen: boolean("loeschen").default(false).notNull(),
  exportieren: boolean("exportieren").default(false).notNull(),
});

export type Berechtigung = typeof berechtigungen.$inferSelect;
export type InsertBerechtigung = typeof berechtigungen.$inferInsert;

/**
 * Einladungen - E-Mail-Einladungen für neue Mitarbeiter
 */
export const einladungen = mysqlTable("einladungen", {
  id: int("id").autoincrement().primaryKey(),
  /** Einladungscode (UUID) für den Einladungslink */
  code: varchar("code", { length: 64 }).notNull().unique(),
  /** E-Mail-Adresse des eingeladenen Mitarbeiters */
  email: varchar("email", { length: 320 }).notNull(),
  /** Unternehmen, zu dem der Mitarbeiter eingeladen wird */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Vorgesehene Rolle für den neuen Mitarbeiter */
  rolle: mysqlEnum("rolle", ["admin", "buchhalter", "viewer"]).default("buchhalter").notNull(),
  /** Benutzer, der die Einladung erstellt hat */
  eingeladenVon: int("eingeladenVon").references(() => users.id).notNull(),
  /** Status der Einladung */
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  /** Ablaufdatum der Einladung (Standard: 7 Tage) */
  expiresAt: timestamp("expiresAt").notNull(),
  /** Zeitpunkt der Annahme */
  acceptedAt: timestamp("acceptedAt"),
  /** Benutzer-ID nach Annahme */
  acceptedBy: int("acceptedBy").references(() => users.id),
  /** Optionale Nachricht an den Eingeladenen */
  nachricht: text("nachricht"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Einladung = typeof einladungen.$inferSelect;
export type InsertEinladung = typeof einladungen.$inferInsert;

/**
 * Sachkonten - Kontenrahmen (SKR03, SKR04, etc.)
 */
export const sachkonten = mysqlTable("sachkonten", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen, zu dem das Konto gehört (null = Standard-Kontenrahmen) */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id),
  /** Kontenrahmen (SKR03, SKR04, etc.) */
  kontenrahmen: mysqlEnum("kontenrahmen", [
    "SKR03", "SKR04",           // Deutschland
    "OeKR", "RLG",              // Österreich
    "KMU", "OR",                // Schweiz
    "UK_GAAP", "IFRS",          // UK & International
    "CY_GAAP"                   // Zypern
  ]).default("SKR04").notNull(),
  /** Kontonummer (z.B. "4400", "6800") */
  kontonummer: varchar("kontonummer", { length: 20 }).notNull(),
  /** Bezeichnung des Kontos */
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  /** Kategorie für Gruppierung (z.B. "Erlöse", "Personal", "Betriebskosten") */
  kategorie: varchar("kategorie", { length: 100 }),
  /** Kontotyp für Bilanz/GuV-Zuordnung */
  kontotyp: mysqlEnum("kontotyp", [
    "aktiv",      // Aktivkonten (Vermögen)
    "passiv",     // Passivkonten (Schulden/Eigenkapital)
    "aufwand",    // Aufwandskonten (GuV)
    "ertrag",     // Ertragskonten (GuV)
    "neutral"     // Neutrale Konten
  ]).default("aufwand"),
  /** Standard-Steuersatz für dieses Konto */
  standardSteuersatz: decimal("standardSteuersatz", { precision: 5, scale: 2 }),
  /** Ist das Konto aktiv/verwendbar? */
  aktiv: boolean("aktiv").default(true).notNull(),
  /** Notizen zum Konto */
  notizen: text("notizen"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sachkonto = typeof sachkonten.$inferSelect;
export type InsertSachkonto = typeof sachkonten.$inferInsert;


/**
 * Finanzamt-Dokumente (Schriftverkehr, Bescheide, Einsprüche)
 */
export const finanzamtDokumente = mysqlTable("finanzamt_dokumente", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Dokumenttyp */
  dokumentTyp: mysqlEnum("dokumentTyp", [
    "schriftverkehr",   // Allgemeiner Schriftverkehr
    "bescheid",         // Steuerbescheid
    "einspruch",        // Einspruch gegen Bescheid
    "mahnung",          // Mahnung vom Finanzamt
    "anfrage",          // Anfrage/Auskunftsersuchen
    "pruefung",         // Betriebsprüfung
    "sonstiges"         // Sonstiges
  ]).default("schriftverkehr").notNull(),
  /** Steuerart */
  steuerart: mysqlEnum("steuerart", [
    "USt",              // Umsatzsteuer
    "ESt",              // Einkommensteuer
    "KSt",              // Körperschaftsteuer
    "GewSt",            // Gewerbesteuer
    "LSt",              // Lohnsteuer
    "KapESt",           // Kapitalertragsteuer
    "sonstige"          // Sonstige
  ]),
  /** Betroffener Zeitraum */
  zeitraumVon: date("zeitraumVon"),
  zeitraumBis: date("zeitraumBis"),
  /** Jahr für Bescheide */
  steuerjahr: int("steuerjahr"),
  /** Aktenzeichen/Steuernummer */
  aktenzeichen: varchar("aktenzeichen", { length: 50 }),
  /** Betreff/Titel */
  betreff: varchar("betreff", { length: 500 }).notNull(),
  /** Beschreibung/Inhalt */
  beschreibung: text("beschreibung"),
  /** Eingangsdatum */
  eingangsdatum: date("eingangsdatum").notNull(),
  /** Frist (z.B. für Einspruch) */
  frist: date("frist"),
  /** Betrag (bei Bescheiden) */
  betrag: decimal("betrag", { precision: 15, scale: 2 }),
  /** Zahlungsfrist */
  zahlungsfrist: date("zahlungsfrist"),
  /** Status */
  status: mysqlEnum("status", [
    "neu",              // Neu eingegangen
    "in_bearbeitung",   // In Bearbeitung
    "einspruch",        // Einspruch eingelegt
    "erledigt",         // Erledigt/Abgeschlossen
    "archiviert"        // Archiviert
  ]).default("neu").notNull(),
  /** Bezug auf anderen Bescheid (für Einsprüche) */
  bezugDokumentId: int("bezugDokumentId"),
  /** Datei-URL */
  dateiUrl: text("dateiUrl"),
  dateiName: varchar("dateiName", { length: 255 }),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinanzamtDokument = typeof finanzamtDokumente.$inferSelect;
export type InsertFinanzamtDokument = typeof finanzamtDokumente.$inferInsert;

/**
 * Aufgaben/To-Dos
 */
export const aufgaben = mysqlTable("aufgaben", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Titel der Aufgabe */
  titel: varchar("titel", { length: 500 }).notNull(),
  /** Beschreibung */
  beschreibung: text("beschreibung"),
  /** Kategorie */
  kategorie: mysqlEnum("kategorie", [
    "finanzamt",        // Finanzamt-bezogen
    "buchhaltung",      // Buchhaltung
    "steuern",          // Steuern allgemein
    "personal",         // Personal/HR
    "allgemein",        // Allgemeine Aufgaben
    "frist",            // Fristgebundene Aufgaben
    "zahlung",          // Zahlungsaufgaben
    "pruefung"          // Prüfungen
  ]).default("allgemein").notNull(),
  /** Priorität */
  prioritaet: mysqlEnum("prioritaet", [
    "niedrig",
    "normal",
    "hoch",
    "dringend"
  ]).default("normal").notNull(),
  /** Status */
  status: mysqlEnum("status", [
    "offen",
    "in_bearbeitung",
    "wartend",
    "erledigt",
    "storniert"
  ]).default("offen").notNull(),
  /** Fälligkeitsdatum */
  faelligkeitsdatum: date("faelligkeitsdatum"),
  /** Erinnerungsdatum */
  erinnerungsdatum: date("erinnerungsdatum"),
  /** Zugewiesen an */
  zugewiesenAn: int("zugewiesenAn").references(() => users.id),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  /** Bezug zu Finanzamt-Dokument */
  finanzamtDokumentId: int("finanzamtDokumentId").references(() => finanzamtDokumente.id),
  /** Erledigungsdatum */
  erledigtAm: date("erledigtAm"),
  /** Erledigt von */
  erledigtVon: int("erledigtVon").references(() => users.id),
  /** Notizen */
  notizen: text("notizen"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aufgabe = typeof aufgaben.$inferSelect;
export type InsertAufgabe = typeof aufgaben.$inferInsert;


/**
 * Finanzamt-Dokument-Versionen (für Versionierung und Dokumentenkette)
 */
export const finanzamtDokumentVersionen = mysqlTable("fa_dok_versionen", {
  id: int("id").autoincrement().primaryKey(),
  dokumentId: int("dokumentId").references(() => finanzamtDokumente.id).notNull(),
  /** Versionsnummer (1, 2, 3, ...) */
  version: int("version").notNull(),
  /** Typ der Version */
  versionTyp: mysqlEnum("versionTyp", [
    "original",           // Originaldokument
    "einspruch",          // Einspruch zu diesem Dokument
    "antwort",            // Antwort vom Finanzamt
    "ergaenzung",         // Ergänzung/Nachtrag
    "korrektur",          // Korrigierte Version
    "anlage"              // Anlage/Anhang
  ]).default("original").notNull(),
  /** Betreff dieser Version */
  betreff: varchar("betreff", { length: 500 }),
  /** Beschreibung/Notizen */
  beschreibung: text("beschreibung"),
  /** Datum dieser Version */
  datum: date("datum").notNull(),
  /** Datei-URL */
  dateiUrl: text("dateiUrl"),
  dateiName: varchar("dateiName", { length: 255 }),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinanzamtDokumentVersion = typeof finanzamtDokumentVersionen.$inferSelect;
export type InsertFinanzamtDokumentVersion = typeof finanzamtDokumentVersionen.$inferInsert;


/**
 * Steuerberater-Übergaben - Tracking welche Daten an den Steuerberater übergeben wurden
 */
export const steuerberaterUebergaben = mysqlTable("stb_uebergaben", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Bezeichnung der Übergabe (z.B. "Monatsabschluss Januar 2025") */
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  /** Beschreibung/Notizen */
  beschreibung: text("beschreibung"),
  /** Übergabeart */
  uebergabeart: mysqlEnum("uebergabeart", [
    "datev_export",       // DATEV-Export
    "email",              // Per E-Mail
    "portal",             // Steuerberater-Portal
    "persoenlich",        // Persönliche Übergabe
    "post",               // Per Post
    "cloud",              // Cloud-Speicher
    "sonstig"             // Sonstige
  ]).default("datev_export").notNull(),
  /** Zeitraum von */
  zeitraumVon: date("zeitraumVon"),
  /** Zeitraum bis */
  zeitraumBis: date("zeitraumBis"),
  /** Übergabedatum */
  uebergabedatum: date("uebergabedatum").notNull(),
  /** Anzahl Buchungen */
  anzahlBuchungen: int("anzahlBuchungen").default(0),
  /** Anzahl Belege */
  anzahlBelege: int("anzahlBelege").default(0),
  /** Gesamtbetrag (Summe der Buchungen) */
  gesamtbetrag: decimal("gesamtbetrag", { precision: 15, scale: 2 }),
  /** Status der Übergabe */
  status: mysqlEnum("status", [
    "vorbereitet",        // Vorbereitet, noch nicht übergeben
    "uebergeben",         // Übergeben
    "bestaetigt",         // Vom Steuerberater bestätigt
    "rueckfrage",         // Rückfrage vom Steuerberater
    "abgeschlossen"       // Abgeschlossen
  ]).default("vorbereitet").notNull(),
  /** Bestätigungsdatum vom Steuerberater */
  bestaetigtAm: timestamp("bestaetigtAm"),
  /** Rückfragen/Anmerkungen vom Steuerberater */
  rueckfragen: text("rueckfragen"),
  /** Datei-URL (z.B. DATEV-Export-Datei) */
  dateiUrl: text("dateiUrl"),
  dateiName: varchar("dateiName", { length: 255 }),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SteuerberaterUebergabe = typeof steuerberaterUebergaben.$inferSelect;
export type InsertSteuerberaterUebergabe = typeof steuerberaterUebergaben.$inferInsert;

/**
 * Steuerberater-Übergabe-Positionen - Einzelne Buchungen/Belege in einer Übergabe
 */
export const steuerberaterUebergabePositionen = mysqlTable("stb_ueb_pos", {
  id: int("id").autoincrement().primaryKey(),
  /** Übergabe */
  uebergabeId: int("uebergabeId").references(() => steuerberaterUebergaben.id).notNull(),
  /** Buchung (optional) */
  buchungId: int("buchungId").references(() => buchungen.id),
  /** Finanzamt-Dokument (optional) */
  finanzamtDokumentId: int("finanzamtDokumentId").references(() => finanzamtDokumente.id),
  /** Positionstyp */
  positionstyp: mysqlEnum("positionstyp", [
    "buchung",            // Einzelne Buchung
    "beleg",              // Beleg ohne Buchung
    "dokument",           // Sonstiges Dokument
    "finanzamt"           // Finanzamt-Dokument
  ]).default("buchung").notNull(),
  /** Beschreibung (falls keine Buchung verknüpft) */
  beschreibung: varchar("beschreibung", { length: 500 }),
  /** Betrag */
  betrag: decimal("betrag", { precision: 15, scale: 2 }),
  /** Datei-URL */
  dateiUrl: text("dateiUrl"),
  dateiName: varchar("dateiName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SteuerberaterUebergabePosition = typeof steuerberaterUebergabePositionen.$inferSelect;
export type InsertSteuerberaterUebergabePosition = typeof steuerberaterUebergabePositionen.$inferInsert;


/**
 * Steuerberater-Rechnungen - Erfassung der Steuerberater-Abrechnungen
 */
export const steuerberaterRechnungen = mysqlTable("stb_rechnungen", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Rechnungsnummer */
  rechnungsnummer: varchar("rechnungsnummer", { length: 100 }).notNull(),
  /** Rechnungsdatum */
  rechnungsdatum: date("rechnungsdatum").notNull(),
  /** Leistungszeitraum von */
  zeitraumVon: date("zeitraumVon"),
  /** Leistungszeitraum bis */
  zeitraumBis: date("zeitraumBis"),
  /** Nettobetrag */
  nettobetrag: decimal("nettobetrag", { precision: 15, scale: 2 }).notNull(),
  /** Steuersatz */
  steuersatz: decimal("steuersatz", { precision: 5, scale: 2 }).default("19.00"),
  /** Bruttobetrag */
  bruttobetrag: decimal("bruttobetrag", { precision: 15, scale: 2 }).notNull(),
  /** Status */
  status: mysqlEnum("status", [
    "offen",              // Noch nicht bezahlt
    "bezahlt",            // Bezahlt
    "storniert"           // Storniert
  ]).default("offen").notNull(),
  /** Zahlungsdatum */
  zahlungsdatum: date("zahlungsdatum"),
  /** Beschreibung/Notizen */
  beschreibung: text("beschreibung"),
  /** Datei-URL (Rechnung als PDF) */
  dateiUrl: text("dateiUrl"),
  dateiName: varchar("dateiName", { length: 255 }),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SteuerberaterRechnung = typeof steuerberaterRechnungen.$inferSelect;
export type InsertSteuerberaterRechnung = typeof steuerberaterRechnungen.$inferInsert;

/**
 * Steuerberater-Rechnungspositionen - Einzelne Leistungen auf einer Rechnung
 */
export const steuerberaterRechnungPositionen = mysqlTable("stb_rech_pos", {
  id: int("id").autoincrement().primaryKey(),
  /** Rechnung */
  rechnungId: int("rechnungId").references(() => steuerberaterRechnungen.id).notNull(),
  /** Positionsnummer */
  positionsnummer: int("positionsnummer").default(1),
  /** Leistungsbeschreibung */
  beschreibung: varchar("beschreibung", { length: 500 }).notNull(),
  /** Leistungskategorie */
  kategorie: mysqlEnum("kategorie", [
    "jahresabschluss",        // Jahresabschluss
    "steuererklaerung",       // Steuererklärung
    "buchhaltung",            // Laufende Buchhaltung
    "lohnabrechnung",         // Lohnabrechnung
    "beratung",               // Steuerberatung
    "finanzamt",              // Finanzamt-Kommunikation
    "pruefung",               // Betriebsprüfung
    "sonstig"                 // Sonstige Leistungen
  ]).default("sonstig").notNull(),
  /** Bewertung: Notwendig oder Vermeidbar */
  bewertung: mysqlEnum("bewertung", [
    "notwendig",              // Notwendige Standardleistung
    "vermeidbar_nachfrage",   // Vermeidbar: Nachfrage wegen fehlender Unterlagen
    "vermeidbar_korrektur",   // Vermeidbar: Korrektur wegen Fehler
    "vermeidbar_beleg",       // Vermeidbar: Fehlender Beleg nachgefordert
    "vermeidbar_info",        // Vermeidbar: Fehlende Information nachgefordert
    "unklar"                  // Noch nicht bewertet
  ]).default("unklar").notNull(),
  /** Ursache für vermeidbare Kosten */
  vermeidbarUrsache: text("vermeidbarUrsache"),
  /** Menge/Anzahl */
  menge: decimal("menge", { precision: 10, scale: 2 }).default("1.00"),
  /** Einzelpreis */
  einzelpreis: decimal("einzelpreis", { precision: 15, scale: 2 }).notNull(),
  /** Gesamtpreis (Menge x Einzelpreis) */
  gesamtpreis: decimal("gesamtpreis", { precision: 15, scale: 2 }).notNull(),
  /** Verknüpfte Übergabe (optional) */
  uebergabeId: int("uebergabeId").references(() => steuerberaterUebergaben.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SteuerberaterRechnungPosition = typeof steuerberaterRechnungPositionen.$inferSelect;
export type InsertSteuerberaterRechnungPosition = typeof steuerberaterRechnungPositionen.$inferInsert;

/**
 * Buchungsvorlagen - Templates für häufig wiederkehrende Buchungen
 */
export const buchungsvorlagen = mysqlTable("buchungsvorlagen", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Vorlagenname */
  name: varchar("name", { length: 255 }).notNull(),
  /** Beschreibung */
  beschreibung: text("beschreibung"),
  /** Soll-Konto */
  sollKonto: varchar("sollKonto", { length: 20 }).notNull(),
  /** Haben-Konto */
  habenKonto: varchar("habenKonto", { length: 20 }).notNull(),
  /** Betrag (optional, kann bei Verwendung überschrieben werden) */
  betrag: decimal("betrag", { precision: 15, scale: 2 }),
  /** Buchungstext */
  buchungstext: varchar("buchungstext", { length: 500 }).notNull(),
  /** USt-Satz */
  ustSatz: decimal("ustSatz", { precision: 5, scale: 2 }).default("0.00").notNull(),
  /** Kategorie für Gruppierung */
  kategorie: mysqlEnum("kategorie", [
    "miete",
    "gehalt",
    "versicherung",
    "telefon",
    "internet",
    "energie",
    "fahrzeug",
    "büromaterial",
    "abschreibung",
    "sonstig"
  ]).default("sonstig").notNull(),
  /** Geschäftspartner (optional) */
  geschaeftspartner: varchar("geschaeftspartner", { length: 255 }),
  /** Farbe für UI (optional) */
  farbe: varchar("farbe", { length: 20 }),
  /** Sortierung */
  sortierung: int("sortierung").default(0),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Buchungsvorlage = typeof buchungsvorlagen.$inferSelect;
export type InsertBuchungsvorlage = typeof buchungsvorlagen.$inferInsert;

/**
 * Kontierungsregeln - Automatische Vorschläge für Konten basierend auf Buchungstext
 */
export const kontierungsregeln = mysqlTable("kontierungsregeln", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Suchbegriff im Buchungstext (case-insensitive) */
  suchbegriff: varchar("suchbegriff", { length: 255 }).notNull(),
  /** Soll-Konto */
  sollKonto: varchar("sollKonto", { length: 20 }).notNull(),
  /** Haben-Konto */
  habenKonto: varchar("habenKonto", { length: 20 }).notNull(),
  /** USt-Satz */
  ustSatz: decimal("ustSatz", { precision: 5, scale: 2 }).default("0.00").notNull(),
  /** Priorität (höhere Zahl = höhere Priorität bei mehreren Matches) */
  prioritaet: int("prioritaet").default(0).notNull(),
  /** Beschreibung der Regel */
  beschreibung: text("beschreibung"),
  /** Geschäftspartner (optional) */
  geschaeftspartner: varchar("geschaeftspartner", { length: 255 }),
  /** Anzahl der Verwendungen (für Lern-Funktion) */
  verwendungen: int("verwendungen").default(0).notNull(),
  /** Erfolgsrate (für Lern-Funktion) */
  erfolgsrate: decimal("erfolgsrate", { precision: 5, scale: 2 }).default("100.00"),
  /** Aktiv/Inaktiv */
  aktiv: boolean("aktiv").default(true).notNull(),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Kontierungsregel = typeof kontierungsregeln.$inferSelect;
export type InsertKontierungsregel = typeof kontierungsregeln.$inferInsert;

/**
 * Monatsabschluss - Tracking des Monatsabschlussprozesses
 */
export const monatsabschluss = mysqlTable("monatsabschluss", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Jahr */
  jahr: int("jahr").notNull(),
  /** Monat (1-12) */
  monat: int("monat").notNull(),
  /** Status */
  status: mysqlEnum("status", [
    "offen",           // Monat noch nicht abgeschlossen
    "in_arbeit",       // Abschluss läuft
    "geprueft",        // Geprüft, aber noch nicht abgeschlossen
    "abgeschlossen",   // Abgeschlossen und gesperrt
    "korrektur"        // Nachträgliche Korrektur erforderlich
  ]).default("offen").notNull(),
  /** Abgeschlossen am */
  abgeschlossenAm: timestamp("abgeschlossenAm"),
  /** Abgeschlossen von */
  abgeschlossenVon: int("abgeschlossenVon").references(() => users.id),
  /** Gesperrt für Änderungen */
  gesperrt: boolean("gesperrt").default(false).notNull(),
  /** Notizen zum Abschluss */
  notizen: text("notizen"),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Monatsabschluss = typeof monatsabschluss.$inferSelect;
export type InsertMonatsabschluss = typeof monatsabschluss.$inferInsert;

/**
 * Monatsabschluss-Checkliste - Einzelne Aufgaben für den Monatsabschluss
 */
export const monatsabschlussItems = mysqlTable("monatsabschluss_items", {
  id: int("id").autoincrement().primaryKey(),
  /** Monatsabschluss */
  monatsabschlussId: int("monatsabschlussId").references(() => monatsabschluss.id).notNull(),
  /** Aufgabenbeschreibung */
  beschreibung: varchar("beschreibung", { length: 500 }).notNull(),
  /** Kategorie */
  kategorie: mysqlEnum("kategorie", [
    "belege",          // Belege erfassen
    "abstimmung",      // Konten abstimmen
    "steuer",          // Steuer-Aufgaben
    "personal",        // Personal/Gehälter
    "pruefung",        // Prüfungen
    "bericht",         // Berichte erstellen
    "sonstig"          // Sonstige Aufgaben
  ]).default("sonstig").notNull(),
  /** Erledigt */
  erledigt: boolean("erledigt").default(false).notNull(),
  /** Erledigt am */
  erledigtAm: timestamp("erledigtAm"),
  /** Erledigt von */
  erledigtVon: int("erledigtVon").references(() => users.id),
  /** Pflichtfeld */
  pflicht: boolean("pflicht").default(true).notNull(),
  /** Sortierung */
  sortierung: int("sortierung").default(0),
  /** Notizen */
  notizen: text("notizen"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonatsabschlussItem = typeof monatsabschlussItems.$inferSelect;
export type InsertMonatsabschlussItem = typeof monatsabschlussItems.$inferInsert;

/**
 * Artikel - Produktstammdaten für Lagerverwaltung
 */
export const artikel = mysqlTable("artikel", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Artikelnummer */
  artikelnummer: varchar("artikelnummer", { length: 100 }).notNull(),
  /** Bezeichnung */
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  /** Beschreibung */
  beschreibung: text("beschreibung"),
  /** Kategorie */
  kategorie: mysqlEnum("kategorie", [
    "rohstoff",            // Rohmaterial
    "halbfertig",          // Halbfertige Erzeugnisse
    "fertigware",          // Fertige Erzeugnisse
    "handelsware",         // Handelswaren
    "verbrauchsmaterial"   // Verbrauchsmaterial
  ]).notNull(),
  /** Einheit */
  einheit: mysqlEnum("einheit", [
    "stueck",   // Stück
    "kg",       // Kilogramm
    "liter",    // Liter
    "meter",    // Meter
    "karton"    // Karton
  ]).notNull(),
  /** Einkaufspreis */
  einkaufspreis: decimal("einkaufspreis", { precision: 15, scale: 2 }),
  /** Verkaufspreis */
  verkaufspreis: decimal("verkaufspreis", { precision: 15, scale: 2 }),
  /** Mindestbestand */
  mindestbestand: decimal("mindestbestand", { precision: 15, scale: 2 }),
  /** Zielbestand */
  zielbestand: decimal("zielbestand", { precision: 15, scale: 2 }),
  /** Lieferant */
  lieferantId: int("lieferantId").references(() => kreditoren.id),
  /** Sachkonto für Buchungen */
  sachkontoId: int("sachkontoId").references(() => sachkonten.id),
  /** Aktiv/Inaktiv */
  aktiv: boolean("aktiv").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artikel = typeof artikel.$inferSelect;
export type InsertArtikel = typeof artikel.$inferInsert;

/**
 * Lagerorte - Lagerstätten/Warehouse Locations
 */
export const lagerorte = mysqlTable("lagerorte", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Name des Lagerortes */
  name: varchar("name", { length: 255 }).notNull(),
  /** Beschreibung */
  beschreibung: text("beschreibung"),
  /** Adresse */
  adresse: varchar("adresse", { length: 500 }),
  /** Ist Hauptlager */
  istHauptlager: boolean("istHauptlager").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lagerort = typeof lagerorte.$inferSelect;
export type InsertLagerort = typeof lagerorte.$inferInsert;

/**
 * Lagerbestände - Aktuelle Bestände pro Artikel und Lagerort
 */
export const lagerbestaende = mysqlTable("lagerbestaende", {
  id: int("id").autoincrement().primaryKey(),
  /** Artikel */
  artikelId: int("artikelId").references(() => artikel.id).notNull(),
  /** Lagerort */
  lagerortId: int("lagerortId").references(() => lagerorte.id).notNull(),
  /** Aktuelle Menge */
  menge: decimal("menge", { precision: 15, scale: 2 }).notNull().default("0.00"),
  /** Reservierte Menge (für Bestellungen) */
  reservierteMenge: decimal("reservierteMenge", { precision: 15, scale: 2 }).default("0.00"),
  /** Letzte Bewegung */
  letzteBewegung: timestamp("letzteBewegung"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lagerbestand = typeof lagerbestaende.$inferSelect;
export type InsertLagerbestand = typeof lagerbestaende.$inferInsert;

/**
 * Bestandsbewegungen - Lagerbewegungen (Ein-/Ausgang, Korrekturen)
 */
export const bestandsbewegungen = mysqlTable("bestandsbewegungen", {
  id: int("id").autoincrement().primaryKey(),
  /** Artikel */
  artikelId: int("artikelId").references(() => artikel.id).notNull(),
  /** Lagerort */
  lagerortId: int("lagerortId").references(() => lagerorte.id).notNull(),
  /** Bewegungsart */
  bewegungsart: mysqlEnum("bewegungsart", [
    "eingang",     // Wareneingang
    "ausgang",     // Warenausgang
    "korrektur",   // Bestandskorrektur
    "umbuchung",   // Umbuchung zwischen Lagerorten
    "inventur"     // Inventuranpassung
  ]).notNull(),
  /** Bewegte Menge */
  menge: decimal("menge", { precision: 15, scale: 2 }).notNull(),
  /** Bestand vorher */
  vorherMenge: decimal("vorherMenge", { precision: 15, scale: 2 }),
  /** Bestand nachher */
  nachherMenge: decimal("nachherMenge", { precision: 15, scale: 2 }),
  /** Referenztyp (z.B. "bestellung", "rechnung", "inventur") */
  referenzTyp: varchar("referenzTyp", { length: 50 }),
  /** Referenz-ID */
  referenzId: int("referenzId"),
  /** Verknüpfung zur Buchung (für Bestandsbewertung) */
  buchungId: int("buchungId").references(() => buchungen.id),
  /** Notiz zur Bewegung */
  notiz: text("notiz"),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bestandsbewegung = typeof bestandsbewegungen.$inferSelect;
export type InsertBestandsbewegung = typeof bestandsbewegungen.$inferInsert;

/**
 * Inventuren - Inventurzählungen
 */
export const inventuren = mysqlTable("inventuren", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Bezeichnung der Inventur */
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  /** Stichtag der Inventur */
  stichtag: date("stichtag").notNull(),
  /** Status */
  status: mysqlEnum("status", [
    "geplant",        // Geplant, noch nicht gestartet
    "in_arbeit",      // Zählung läuft
    "abgeschlossen",  // Abgeschlossen und ausgewertet
    "storniert"       // Storniert
  ]).default("geplant").notNull(),
  /** Lagerort (optional, null = alle Lagerorte) */
  lagerortId: int("lagerortId").references(() => lagerorte.id),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  /** Abgeschlossen von */
  abgeschlossenVon: int("abgeschlossenVon").references(() => users.id),
  /** Abgeschlossen am */
  abgeschlossenAm: timestamp("abgeschlossenAm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inventur = typeof inventuren.$inferSelect;
export type InsertInventur = typeof inventuren.$inferInsert;

/**
 * Inventurpositionen - Einzelne Zählpositionen in einer Inventur
 */
export const inventurpositionen = mysqlTable("inventurpositionen", {
  id: int("id").autoincrement().primaryKey(),
  /** Inventur */
  inventurId: int("inventurId").references(() => inventuren.id).notNull(),
  /** Artikel */
  artikelId: int("artikelId").references(() => artikel.id).notNull(),
  /** Lagerort */
  lagerortId: int("lagerortId").references(() => lagerorte.id).notNull(),
  /** Soll-Menge (aus System) */
  sollMenge: decimal("sollMenge", { precision: 15, scale: 2 }).notNull(),
  /** Ist-Menge (gezählt) */
  istMenge: decimal("istMenge", { precision: 15, scale: 2 }),
  /** Differenz (Ist - Soll) */
  differenz: decimal("differenz", { precision: 15, scale: 2 }),
  /** Gezählt von */
  gezaehltVon: int("gezaehltVon").references(() => users.id),
  /** Gezählt am */
  gezaehltAm: timestamp("gezaehltAm"),
  /** Kommentar zur Position */
  kommentar: text("kommentar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inventurposition = typeof inventurpositionen.$inferSelect;
export type InsertInventurposition = typeof inventurpositionen.$inferInsert;

/**
 * Eröffnungsbilanz - Anfangsbestände für ein Wirtschaftsjahr
 */
export const eroeffnungsbilanz = mysqlTable("eroeffnungsbilanz", {
  id: int("id").autoincrement().primaryKey(),
  /** Unternehmen */
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  /** Wirtschaftsjahr */
  jahr: int("jahr").notNull(),
  /** Sachkonto */
  sachkonto: varchar("sachkonto", { length: 20 }).notNull(),
  /** Kontenbezeichnung */
  kontobezeichnung: varchar("kontobezeichnung", { length: 255 }),
  /** Soll-Betrag (Aktiva, Aufwand) */
  sollbetrag: decimal("sollbetrag", { precision: 15, scale: 2 }).default("0.00").notNull(),
  /** Haben-Betrag (Passiva, Ertrag) */
  habenbetrag: decimal("habenbetrag", { precision: 15, scale: 2 }).default("0.00").notNull(),
  /** Import-Quelle */
  importQuelle: mysqlEnum("importQuelle", ["manuell", "datev", "api"]).default("manuell"),
  /** Import-Datum */
  importDatum: timestamp("importDatum"),
  /** Notizen */
  notizen: text("notizen"),
  /** Erstellt von */
  erstelltVon: int("erstelltVon").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Eroeffnungsbilanz = typeof eroeffnungsbilanz.$inferSelect;
export type InsertEroeffnungsbilanz = typeof eroeffnungsbilanz.$inferInsert;

/**
 * Belege - Digitale Belegdateien (PDFs, Bilder)
 * Für DATEV-Import und manuelle Uploads
 */
export const belege = mysqlTable("belege", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),

  // Verknüpfung zur Buchung (optional, da Belege ohne Buchung existieren können)
  buchungId: int("buchungId").references(() => buchungen.id),

  // DATEV-spezifische Felder
  datevBelegId: varchar("datevBelegId", { length: 100 }), // BEDI-ID aus DATEV
  externeReferenz: varchar("externeReferenz", { length: 100 }), // Externe Belegnummer (z.B. Rechnungsnummer)

  // Datei-Informationen
  dateiName: varchar("dateiName", { length: 255 }).notNull(),
  dateiPfad: varchar("dateiPfad", { length: 500 }), // Lokaler Pfad oder S3-Key
  dateiUrl: varchar("dateiUrl", { length: 500 }), // URL für direkten Zugriff
  dateiGroesse: int("dateiGroesse"), // Bytes
  dateiTyp: mysqlEnum("dateiTyp", ["pdf", "png", "jpg", "jpeg", "tiff", "sonstig"]).default("pdf"),

  // Metadaten
  belegdatum: date("belegdatum"),
  beschreibung: text("beschreibung"),
  notizen: text("notizen"),

  // Upload-Tracking
  uploadedBy: int("uploadedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Beleg = typeof belege.$inferSelect;
export type InsertBeleg = typeof belege.$inferInsert;

/**
 * Finanzkonten - Erweiterte Kontenverwaltung für Bank, Kreditkarten, Broker, etc.
 * Ersetzt/erweitert bankkonten mit mehr Flexibilität
 */
export const finanzkonten = mysqlTable("finanzkonten", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),
  sachkontoId: int("sachkontoId").references(() => sachkonten.id),

  // Typ des Kontos
  typ: mysqlEnum("typ", ["bank", "kreditkarte", "broker", "kasse", "paypal", "stripe", "sonstiges"]).notNull(),

  // Allgemeine Felder
  name: varchar("name", { length: 255 }).notNull(),
  kontonummer: varchar("kontonummer", { length: 50 }),

  // Bank-spezifisch
  iban: varchar("iban", { length: 34 }),
  bic: varchar("bic", { length: 11 }),
  bankName: varchar("bankName", { length: 255 }),

  // Kreditkarte-spezifisch
  kreditkartenNummer: varchar("kreditkartenNummer", { length: 20 }), // Nur letzte 4 Ziffern
  kreditlimit: decimal("kreditlimit", { precision: 15, scale: 2 }),
  abrechnungstag: int("abrechnungstag"), // Tag im Monat

  // Broker-spezifisch
  depotNummer: varchar("depotNummer", { length: 50 }),
  brokerName: varchar("brokerName", { length: 255 }),

  // PayPal/Stripe
  email: varchar("email", { length: 255 }),

  // Allgemein
  waehrung: varchar("waehrung", { length: 3 }).default("EUR"),
  aktiv: boolean("aktiv").default(true),
  notizen: text("notizen"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Finanzkonto = typeof finanzkonten.$inferSelect;
export type InsertFinanzkonto = typeof finanzkonten.$inferInsert;

/**
 * Kontoauszüge, Kreditkartenauszüge, Zahlungsdienstleister-Auszüge
 */
export const auszuege = mysqlTable("auszuege", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),

  // Typ des Auszugs
  typ: mysqlEnum("typ", ["bankkonto", "kreditkarte", "zahlungsdienstleister"]).notNull(),

  // Optionale Zuordnung zu bestehendem Konto
  kontoId: int("kontoId"), // Foreign key zu finanzkonten
  kontoBezeichnung: varchar("kontoBezeichnung", { length: 255 }), // Fallback wenn kein Konto zugeordnet

  // Datei-Info
  dateiUrl: varchar("dateiUrl", { length: 512 }).notNull(),
  dateiname: varchar("dateiname", { length: 255 }).notNull(),

  // Zeitraum
  zeitraumVon: date("zeitraumVon").notNull(),
  zeitraumBis: date("zeitraumBis").notNull(),

  // Saldo-Info
  saldoAnfang: decimal("saldoAnfang", { precision: 15, scale: 2 }),
  saldoEnde: decimal("saldoEnde", { precision: 15, scale: 2 }),
  waehrung: varchar("waehrung", { length: 3 }).default("EUR"),

  // Status
  status: mysqlEnum("status", ["neu", "in_bearbeitung", "abgeschlossen"]).default("neu").notNull(),

  // Notizen
  notizen: text("notizen"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  erstelltVon: int("erstelltVon").references(() => users.id),
});

export type Auszug = typeof auszuege.$inferSelect;
export type InsertAuszug = typeof auszuege.$inferInsert;

/**
 * Positionen eines Auszugs (einzelne Transaktionen)
 */
export const auszugPositionen = mysqlTable("auszug_positionen", {
  id: int("id").autoincrement().primaryKey(),
  auszugId: int("auszugId").references(() => auszuege.id).notNull(),

  // Positions-Details
  datum: date("datum").notNull(),
  buchungstext: text("buchungstext").notNull(),
  betrag: decimal("betrag", { precision: 15, scale: 2 }).notNull(),
  saldo: decimal("saldo", { precision: 15, scale: 2 }), // Optional: Saldo nach dieser Transaktion

  // Referenz-Informationen (von Bank/Kreditkarte)
  referenz: varchar("referenz", { length: 255 }), // z.B. Transaktions-ID
  kategorie: varchar("kategorie", { length: 100 }), // Optional: von Bank/Kreditkarte

  // Zuordnung zu Buchung
  zugeordneteBuchungId: int("zugeordneteBuchungId").references(() => buchungen.id),
  status: mysqlEnum("status", ["offen", "zugeordnet", "ignoriert"]).default("offen").notNull(),

  // Notizen
  notizen: text("notizen"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuszugPosition = typeof auszugPositionen.$inferSelect;
export type InsertAuszugPosition = typeof auszugPositionen.$inferInsert;

/**
 * Kredit- und Leasingverträge
 */
export const finanzierungen = mysqlTable("finanzierungen", {
  id: int("id").autoincrement().primaryKey(),
  unternehmenId: int("unternehmenId").references(() => unternehmen.id).notNull(),

  // Vertragstyp
  typ: mysqlEnum("typ", ["kredit", "leasing", "mietkauf", "factoring"]).notNull(),

  // Vertragsdaten
  vertragsnummer: varchar("vertragsnummer", { length: 100 }),
  bezeichnung: varchar("bezeichnung", { length: 255 }).notNull(),
  beschreibung: text("beschreibung"),

  // Vertragspartner
  kreditgeber: varchar("kreditgeber", { length: 255 }).notNull(),
  kreditgeberKontonummer: varchar("kreditgeberKontonummer", { length: 20 }),

  // Finanzierungsobjekt (bei Leasing/Mietkauf)
  objektBezeichnung: varchar("objektBezeichnung", { length: 255 }),
  objektWert: decimal("objektWert", { precision: 15, scale: 2 }),

  // Konditionen
  gesamtbetrag: decimal("gesamtbetrag", { precision: 15, scale: 2 }).notNull(),
  restschuld: decimal("restschuld", { precision: 15, scale: 2 }),
  zinssatz: decimal("zinssatz", { precision: 5, scale: 3 }),

  // Laufzeit
  vertragsBeginn: date("vertragsBeginn").notNull(),
  vertragsEnde: date("vertragsEnde").notNull(),

  // Raten
  ratenBetrag: decimal("ratenBetrag", { precision: 15, scale: 2 }).notNull(),
  ratenTyp: mysqlEnum("ratenTyp", ["monatlich", "quartal", "halbjaehrlich", "jaehrlich"]).default("monatlich").notNull(),
  ratenTag: int("ratenTag").default(1),

  // Sonderzahlungen (Leasing)
  anzahlung: decimal("anzahlung", { precision: 15, scale: 2 }).default("0"),
  schlussrate: decimal("schlussrate", { precision: 15, scale: 2 }).default("0"),

  // Buchhaltung
  aufwandskonto: varchar("aufwandskonto", { length: 20 }),
  verbindlichkeitskonto: varchar("verbindlichkeitskonto", { length: 20 }),
  zinsaufwandskonto: varchar("zinsaufwandskonto", { length: 20 }),

  // Status
  status: mysqlEnum("status", ["aktiv", "abgeschlossen", "gekuendigt"]).default("aktiv").notNull(),

  // Dokumente
  vertragsDokumentUrl: text("vertragsDokumentUrl"),

  // Meta
  notizen: text("notizen"),
  createdBy: varchar("createdBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Finanzierung = typeof finanzierungen.$inferSelect;
export type InsertFinanzierung = typeof finanzierungen.$inferInsert;

/**
 * Zahlungen für Finanzierungen
 */
export const finanzierungZahlungen = mysqlTable("finanzierung_zahlungen", {
  id: int("id").autoincrement().primaryKey(),
  finanzierungId: int("finanzierungId").references(() => finanzierungen.id).notNull(),

  // Zahlung
  faelligkeit: date("faelligkeit").notNull(),
  betrag: decimal("betrag", { precision: 15, scale: 2 }).notNull(),
  zinsenAnteil: decimal("zinsenAnteil", { precision: 15, scale: 2 }),
  tilgungAnteil: decimal("tilgungAnteil", { precision: 15, scale: 2 }),

  // Status
  status: mysqlEnum("status", ["offen", "bezahlt", "ueberfaellig"]).default("offen").notNull(),
  bezahltAm: date("bezahltAm"),

  // Buchung
  buchungId: int("buchungId").references(() => buchungen.id),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinanzierungZahlung = typeof finanzierungZahlungen.$inferSelect;
export type InsertFinanzierungZahlung = typeof finanzierungZahlungen.$inferInsert;

/**
 * Dokumente zu Finanzierungen (Verträge, Anlagen, etc.)
 */
export const finanzierungDokumente = mysqlTable("finanzierung_dokumente", {
  id: int("id").autoincrement().primaryKey(),
  finanzierungId: int("finanzierungId").references(() => finanzierungen.id).notNull(),

  dateiUrl: varchar("dateiUrl", { length: 512 }).notNull(),
  dateiName: varchar("dateiName", { length: 255 }).notNull(),
  dateityp: varchar("dateityp", { length: 50 }), // pdf, jpg, png, etc.
  dateiGroesse: int("dateiGroesse"), // in bytes

  beschreibung: text("beschreibung"), // Optional: Was ist das Dokument?

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: varchar("createdBy", { length: 255 }),
});

export type FinanzierungDokument = typeof finanzierungDokumente.$inferSelect;
export type InsertFinanzierungDokument = typeof finanzierungDokumente.$inferInsert;
