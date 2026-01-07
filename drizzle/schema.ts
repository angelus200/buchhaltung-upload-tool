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
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
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
  notizen: text("notizen"),
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
  status: mysqlEnum("status", ["entwurf", "geprueft", "exportiert"]).default("entwurf").notNull(),
  exportiertAm: timestamp("exportiertAm"),
  // Zahlungsstatus
  zahlungsstatus: mysqlEnum("zahlungsstatus", ["offen", "teilweise_bezahlt", "bezahlt", "ueberfaellig"]).default("offen").notNull(),
  faelligkeitsdatum: date("faelligkeitsdatum"),
  bezahltAm: date("bezahltAm"),
  bezahlterBetrag: decimal("bezahlterBetrag", { precision: 15, scale: 2 }),
  zahlungsreferenz: varchar("zahlungsreferenz", { length: 100 }),
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
