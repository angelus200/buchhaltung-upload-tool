// scripts/migrate-tenant-schema.cjs
// AUTO-GENERIERT am 2026-03-26T19:04:08.410Z
// Erstellt alle Business-Tabellen in einer Tenant-Datenbank
// NICHT MANUELL BEARBEITEN — neu generieren mit: node scripts/generate-tenant-migration.cjs

async function migrate(conn) {
  console.log('🟦 Starte Schema-Migration für Tenant-DB...');

  // FK-Checks deaktivieren damit Reihenfolge egal ist
  await conn.execute('SET FOREIGN_KEY_CHECKS=0');

  // Tabelle 1/51: __drizzle_migrations
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`hash\` text NOT NULL,
  \`created_at\` bigint DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`id\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 2/51: aktivitaetsprotokoll
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`aktivitaetsprotokoll\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int DEFAULT NULL,
  \`userId\` int NOT NULL,
  \`aktion\` enum('buchung_erstellt','buchung_bearbeitet','buchung_geloescht','buchung_exportiert','stammdaten_erstellt','stammdaten_bearbeitet','stammdaten_geloescht','unternehmen_erstellt','unternehmen_bearbeitet','benutzer_hinzugefuegt','benutzer_entfernt','rolle_geaendert','berechtigungen_geaendert','login','logout') NOT NULL,
  \`entitaetTyp\` varchar(50) DEFAULT NULL,
  \`entitaetId\` int DEFAULT NULL,
  \`entitaetName\` varchar(255) DEFAULT NULL,
  \`details\` text,
  \`ipAdresse\` varchar(45) DEFAULT NULL,
  \`userAgent\` varchar(500) DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (\`id\`),
  KEY \`aktivitaetsprotokoll_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`aktivitaetsprotokoll_userId_users_id_fk\` (\`userId\`),
  CONSTRAINT \`aktivitaetsprotokoll_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 3/51: anlagevermoegen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`anlagevermoegen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`kontonummer\` varchar(20) NOT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`kategorie\` varchar(100) DEFAULT NULL,
  \`anschaffungsdatum\` date DEFAULT NULL,
  \`anschaffungskosten\` decimal(15,2) DEFAULT NULL,
  \`nutzungsdauer\` int DEFAULT NULL,
  \`abschreibungsmethode\` enum('linear','degressiv','keine') DEFAULT 'linear',
  \`restwert\` decimal(15,2) DEFAULT NULL,
  \`standort\` varchar(255) DEFAULT NULL,
  \`inventarnummer\` varchar(50) DEFAULT NULL,
  \`seriennummer\` varchar(100) DEFAULT NULL,
  \`notizen\` text,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  \`sachkonto\` varchar(20) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`anlagevermoegen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`anlagevermoegen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 4/51: artikel
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`artikel\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`artikelnummer\` varchar(100) NOT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`beschreibung\` text,
  \`kategorie\` enum('rohstoff','halbfertig','fertigware','handelsware','verbrauchsmaterial') NOT NULL,
  \`einheit\` enum('stueck','kg','liter','meter','karton') NOT NULL,
  \`einkaufspreis\` decimal(15,2) DEFAULT NULL,
  \`verkaufspreis\` decimal(15,2) DEFAULT NULL,
  \`mindestbestand\` decimal(15,2) DEFAULT NULL,
  \`zielbestand\` decimal(15,2) DEFAULT NULL,
  \`lieferantId\` int DEFAULT NULL,
  \`sachkontoId\` int DEFAULT NULL,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`artikel_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`artikel_lieferantId_kreditoren_id_fk\` (\`lieferantId\`),
  KEY \`artikel_sachkontoId_sachkonten_id_fk\` (\`sachkontoId\`),
  CONSTRAINT \`artikel_lieferantId_kreditoren_id_fk\` FOREIGN KEY (\`lieferantId\`) REFERENCES \`kreditoren\` (\`id\`),
  CONSTRAINT \`artikel_sachkontoId_sachkonten_id_fk\` FOREIGN KEY (\`sachkontoId\`) REFERENCES \`sachkonten\` (\`id\`),
  CONSTRAINT \`artikel_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 5/51: aufgaben
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`aufgaben\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`titel\` varchar(500) NOT NULL,
  \`beschreibung\` text,
  \`kategorie\` enum('finanzamt','buchhaltung','steuern','personal','allgemein','frist','zahlung','pruefung') NOT NULL DEFAULT 'allgemein',
  \`prioritaet\` enum('niedrig','normal','hoch','dringend') NOT NULL DEFAULT 'normal',
  \`status\` enum('offen','in_bearbeitung','wartend','erledigt','storniert') NOT NULL DEFAULT 'offen',
  \`faelligkeitsdatum\` date DEFAULT NULL,
  \`erinnerungsdatum\` date DEFAULT NULL,
  \`zugewiesenAn\` int DEFAULT NULL,
  \`erstelltVon\` int DEFAULT NULL,
  \`finanzamtDokumentId\` int DEFAULT NULL,
  \`erledigtAm\` date DEFAULT NULL,
  \`erledigtVon\` int DEFAULT NULL,
  \`notizen\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`aufgaben_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`aufgaben_zugewiesenAn_users_id_fk\` (\`zugewiesenAn\`),
  KEY \`aufgaben_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  KEY \`aufgaben_finanzamtDokumentId_finanzamt_dokumente_id_fk\` (\`finanzamtDokumentId\`),
  KEY \`aufgaben_erledigtVon_users_id_fk\` (\`erledigtVon\`),
  CONSTRAINT \`aufgaben_finanzamtDokumentId_finanzamt_dokumente_id_fk\` FOREIGN KEY (\`finanzamtDokumentId\`) REFERENCES \`finanzamt_dokumente\` (\`id\`),
  CONSTRAINT \`aufgaben_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 6/51: auszuege
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`auszuege\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`typ\` enum('bankkonto','kreditkarte','zahlungsdienstleister') COLLATE utf8mb4_unicode_ci NOT NULL,
  \`kontoId\` int DEFAULT NULL,
  \`kontoBezeichnung\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`dateiUrl\` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`dateiname\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`zeitraumVon\` date NOT NULL,
  \`zeitraumBis\` date NOT NULL,
  \`saldoAnfang\` decimal(15,2) DEFAULT NULL,
  \`saldoEnde\` decimal(15,2) DEFAULT NULL,
  \`waehrung\` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'EUR',
  \`status\` enum('neu','in_bearbeitung','abgeschlossen') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'neu',
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`notizen\` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (\`id\`),
  KEY \`idx_auszuege_unternehmen\` (\`unternehmenId\`),
  KEY \`idx_auszuege_status\` (\`status\`),
  KEY \`idx_auszuege_zeitraum\` (\`zeitraumVon\`,\`zeitraumBis\`),
  KEY \`fk_auszuege_erstelltVon\` (\`erstelltVon\`),
  CONSTRAINT \`auszuege_ibfk_1\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Tabelle 7/51: auszug_positionen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`auszug_positionen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`auszugId\` int NOT NULL,
  \`datum\` date NOT NULL,
  \`buchungstext\` text COLLATE utf8mb4_unicode_ci NOT NULL,
  \`betrag\` decimal(15,2) NOT NULL,
  \`saldo\` decimal(15,2) DEFAULT NULL,
  \`referenz\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`kategorie\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`zugeordneteBuchungId\` int DEFAULT NULL,
  \`status\` enum('offen','zugeordnet','ignoriert') COLLATE utf8mb4_unicode_ci DEFAULT 'offen',
  \`createdAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_positionen_auszug\` (\`auszugId\`),
  KEY \`idx_positionen_status\` (\`status\`),
  KEY \`idx_positionen_buchung\` (\`zugeordneteBuchungId\`),
  CONSTRAINT \`auszug_positionen_ibfk_1\` FOREIGN KEY (\`auszugId\`) REFERENCES \`auszuege\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`auszug_positionen_ibfk_2\` FOREIGN KEY (\`zugeordneteBuchungId\`) REFERENCES \`buchungen\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Tabelle 8/51: bankkonten
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`bankkonten\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`kontonummer\` varchar(20) NOT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`bankname\` varchar(255) DEFAULT NULL,
  \`iban\` varchar(34) DEFAULT NULL,
  \`bic\` varchar(11) DEFAULT NULL,
  \`kontotyp\` enum('girokonto','sparkonto','festgeld','kreditkarte','sonstig') DEFAULT 'girokonto',
  \`waehrung\` varchar(3) DEFAULT 'EUR',
  \`notizen\` text,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  \`sachkonto\` varchar(20) DEFAULT NULL,
  \`anfangsbestand\` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  KEY \`bankkonten_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`bankkonten_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 9/51: belege
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`belege\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`buchungId\` int DEFAULT NULL,
  \`datevBelegId\` varchar(100) DEFAULT NULL,
  \`externeReferenz\` varchar(100) DEFAULT NULL,
  \`dateiName\` varchar(255) NOT NULL,
  \`dateiPfad\` varchar(500) DEFAULT NULL,
  \`dateiUrl\` varchar(500) DEFAULT NULL,
  \`dateiGroesse\` int DEFAULT NULL,
  \`dateiTyp\` enum('pdf','png','jpg','jpeg','tiff','sonstig') DEFAULT 'pdf',
  \`belegdatum\` date DEFAULT NULL,
  \`beschreibung\` text,
  \`notizen\` text,
  \`uploadedBy\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`belege_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`belege_buchungId_buchungen_id_fk\` (\`buchungId\`),
  KEY \`belege_uploadedBy_users_id_fk\` (\`uploadedBy\`),
  CONSTRAINT \`belege_buchungId_buchungen_id_fk\` FOREIGN KEY (\`buchungId\`) REFERENCES \`buchungen\` (\`id\`),
  CONSTRAINT \`belege_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 10/51: berechtigungen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`berechtigungen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`rollenName\` enum('admin','buchhalter','viewer') NOT NULL,
  \`bereich\` varchar(50) NOT NULL,
  \`lesen\` tinyint(1) NOT NULL DEFAULT '1',
  \`erstellen\` tinyint(1) NOT NULL DEFAULT '0',
  \`bearbeiten\` tinyint(1) NOT NULL DEFAULT '0',
  \`loeschen\` tinyint(1) NOT NULL DEFAULT '0',
  \`exportieren\` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 11/51: bestandsbewegungen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`bestandsbewegungen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`artikelId\` int NOT NULL,
  \`lagerortId\` int NOT NULL,
  \`bewegungsart\` enum('eingang','ausgang','korrektur','umbuchung','inventur') NOT NULL,
  \`menge\` decimal(15,2) NOT NULL,
  \`vorherMenge\` decimal(15,2) DEFAULT NULL,
  \`nachherMenge\` decimal(15,2) DEFAULT NULL,
  \`referenzTyp\` varchar(50) DEFAULT NULL,
  \`referenzId\` int DEFAULT NULL,
  \`buchungId\` int DEFAULT NULL,
  \`notiz\` text,
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (\`id\`),
  KEY \`bestandsbewegungen_artikelId_artikel_id_fk\` (\`artikelId\`),
  KEY \`bestandsbewegungen_lagerortId_lagerorte_id_fk\` (\`lagerortId\`),
  KEY \`bestandsbewegungen_buchungId_buchungen_id_fk\` (\`buchungId\`),
  KEY \`bestandsbewegungen_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`bestandsbewegungen_artikelId_artikel_id_fk\` FOREIGN KEY (\`artikelId\`) REFERENCES \`artikel\` (\`id\`),
  CONSTRAINT \`bestandsbewegungen_buchungId_buchungen_id_fk\` FOREIGN KEY (\`buchungId\`) REFERENCES \`buchungen\` (\`id\`),
  CONSTRAINT \`bestandsbewegungen_lagerortId_lagerorte_id_fk\` FOREIGN KEY (\`lagerortId\`) REFERENCES \`lagerorte\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 12/51: beteiligungen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`beteiligungen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`kontonummer\` varchar(20) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`rechtsform\` varchar(100) DEFAULT NULL,
  \`anteil\` decimal(5,2) DEFAULT NULL,
  \`buchwert\` decimal(15,2) DEFAULT NULL,
  \`erwerbsdatum\` date DEFAULT NULL,
  \`sitz\` varchar(255) DEFAULT NULL,
  \`handelsregister\` varchar(100) DEFAULT NULL,
  \`notizen\` text,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  \`sachkonto\` varchar(20) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`beteiligungen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`beteiligungen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 13/51: broker_accounts
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`broker_accounts\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`broker\` varchar(100) NOT NULL,
  \`depotNumber\` varchar(100) DEFAULT NULL,
  \`clearingAccount\` varchar(100) DEFAULT NULL,
  \`currency\` varchar(3) DEFAULT 'EUR',
  \`notes\` text,
  \`active\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`broker_accounts_unternehmenId_fk\` (\`unternehmenId\`),
  CONSTRAINT \`broker_accounts_unternehmenId_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 14/51: buchungen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`buchungen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`buchungsart\` enum('aufwand','ertrag','anlage','sonstig') NOT NULL,
  \`belegdatum\` date NOT NULL,
  \`belegnummer\` varchar(50) NOT NULL,
  \`geschaeftspartnerTyp\` enum('kreditor','debitor','gesellschafter','sonstig') NOT NULL,
  \`geschaeftspartner\` varchar(255) NOT NULL,
  \`geschaeftspartnerKonto\` varchar(20) NOT NULL,
  \`sachkonto\` varchar(20) NOT NULL,
  \`kostenstelleId\` int DEFAULT NULL,
  \`nettobetrag\` decimal(15,2) NOT NULL,
  \`steuersatz\` decimal(5,2) NOT NULL,
  \`bruttobetrag\` decimal(15,2) NOT NULL,
  \`buchungstext\` text,
  \`belegUrl\` varchar(500) DEFAULT NULL,
  \`status\` enum('entwurf','geprueft','exportiert') NOT NULL DEFAULT 'entwurf',
  \`exportiertAm\` timestamp NULL DEFAULT NULL,
  \`zahlungsstatus\` enum('offen','teilweise_bezahlt','bezahlt','ueberfaellig') NOT NULL DEFAULT 'offen',
  \`faelligkeitsdatum\` date DEFAULT NULL,
  \`bezahltAm\` date DEFAULT NULL,
  \`bezahlterBetrag\` decimal(15,2) DEFAULT NULL,
  \`zahlungsreferenz\` varchar(100) DEFAULT NULL,
  \`createdBy\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  \`sollKonto\` varchar(20) DEFAULT NULL,
  \`habenKonto\` varchar(20) DEFAULT NULL,
  \`datevBelegnummer\` varchar(50) DEFAULT NULL,
  \`datevBuchungszeile\` int DEFAULT NULL,
  \`datevBelegId\` varchar(100) DEFAULT NULL,
  \`wirtschaftsjahr\` int DEFAULT NULL,
  \`periode\` int DEFAULT NULL,
  \`datevBuchungstext\` text,
  \`importQuelle\` enum('manuell','datev_gdpdu','datev_csv','datev_ascii','api') DEFAULT NULL,
  \`importDatum\` timestamp NULL DEFAULT NULL,
  \`importReferenz\` varchar(255) DEFAULT NULL,
  \`belegWaehrung\` varchar(3) DEFAULT NULL,
  \`belegBetragNetto\` decimal(15,2) DEFAULT NULL,
  \`belegBetragBrutto\` decimal(15,2) DEFAULT NULL,
  \`wechselkurs\` decimal(10,6) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`buchungen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`buchungen_kostenstelleId_kostenstellen_id_fk\` (\`kostenstelleId\`),
  KEY \`buchungen_createdBy_users_id_fk\` (\`createdBy\`),
  CONSTRAINT \`buchungen_kostenstelleId_kostenstellen_id_fk\` FOREIGN KEY (\`kostenstelleId\`) REFERENCES \`kostenstellen\` (\`id\`),
  CONSTRAINT \`buchungen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 15/51: buchungsvorlagen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`buchungsvorlagen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`beschreibung\` text,
  \`sollKonto\` varchar(20) NOT NULL,
  \`habenKonto\` varchar(20) NOT NULL,
  \`betrag\` decimal(15,2) DEFAULT NULL,
  \`buchungstext\` varchar(500) NOT NULL,
  \`ustSatz\` decimal(5,2) NOT NULL DEFAULT '0.00',
  \`kategorie\` enum('miete','gehalt','versicherung','telefon','internet','energie','fahrzeug','büromaterial','abschreibung','sonstig') NOT NULL DEFAULT 'sonstig',
  \`geschaeftspartner\` varchar(255) DEFAULT NULL,
  \`farbe\` varchar(20) DEFAULT NULL,
  \`sortierung\` int DEFAULT '0',
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`buchungsvorlagen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`buchungsvorlagen_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`buchungsvorlagen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 16/51: buchungsvorschlaege
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`buchungsvorschlaege\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`belegUrl\` varchar(512) DEFAULT NULL,
  \`lieferant\` varchar(255) DEFAULT NULL,
  \`kreditorId\` int DEFAULT NULL,
  \`rechnungsnummer\` varchar(100) DEFAULT NULL,
  \`belegdatum\` date DEFAULT NULL,
  \`betragBrutto\` decimal(15,2) DEFAULT NULL,
  \`betragNetto\` decimal(15,2) DEFAULT NULL,
  \`ustBetrag\` decimal(15,2) DEFAULT NULL,
  \`ustSatz\` decimal(5,2) DEFAULT NULL,
  \`zahlungsziel\` int DEFAULT NULL,
  \`iban\` varchar(34) DEFAULT NULL,
  \`sollKonto\` varchar(20) DEFAULT NULL,
  \`habenKonto\` varchar(20) DEFAULT NULL,
  \`buchungstext\` varchar(255) DEFAULT NULL,
  \`geschaeftspartnerKonto\` varchar(20) DEFAULT NULL,
  \`confidence\` decimal(3,2) DEFAULT NULL,
  \`aiNotizen\` text,
  \`status\` enum('vorschlag','akzeptiert','abgelehnt','bearbeitet') NOT NULL DEFAULT 'vorschlag',
  \`buchungId\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`bearbeitetVon\` int DEFAULT NULL,
  \`bearbeitetAm\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`unternehmenId\` (\`unternehmenId\`),
  KEY \`kreditorId\` (\`kreditorId\`),
  KEY \`buchungId\` (\`buchungId\`),
  KEY \`bearbeitetVon\` (\`bearbeitetVon\`),
  CONSTRAINT \`buchungsvorschlaege_ibfk_1\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`),
  CONSTRAINT \`buchungsvorschlaege_ibfk_2\` FOREIGN KEY (\`kreditorId\`) REFERENCES \`kreditoren\` (\`id\`),
  CONSTRAINT \`buchungsvorschlaege_ibfk_3\` FOREIGN KEY (\`buchungId\`) REFERENCES \`buchungen\` (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 17/51: checked_duplicates
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`checked_duplicates\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`buchung1Id\` int NOT NULL,
  \`buchung2Id\` int NOT NULL,
  \`checkedBy\` int NOT NULL,
  \`checkedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`unique_pair\` (\`buchung1Id\`,\`buchung2Id\`),
  KEY \`checked_duplicates_unternehmenId_fk\` (\`unternehmenId\`),
  KEY \`checked_duplicates_buchung1Id_fk\` (\`buchung1Id\`),
  KEY \`checked_duplicates_buchung2Id_fk\` (\`buchung2Id\`),
  KEY \`checked_duplicates_checkedBy_fk\` (\`checkedBy\`),
  CONSTRAINT \`checked_duplicates_buchung1Id_fk\` FOREIGN KEY (\`buchung1Id\`) REFERENCES \`buchungen\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`checked_duplicates_buchung2Id_fk\` FOREIGN KEY (\`buchung2Id\`) REFERENCES \`buchungen\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`checked_duplicates_unternehmenId_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 18/51: credit_cards
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`credit_cards\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`provider\` varchar(100) NOT NULL,
  \`lastFour\` varchar(4) DEFAULT NULL,
  \`creditLimit\` decimal(15,2) DEFAULT NULL,
  \`billingDay\` int DEFAULT NULL,
  \`currency\` varchar(3) DEFAULT 'EUR',
  \`notes\` text,
  \`active\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`credit_cards_unternehmenId_fk\` (\`unternehmenId\`),
  CONSTRAINT \`credit_cards_unternehmenId_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 19/51: debitoren
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`debitoren\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`kontonummer\` varchar(20) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`kurzbezeichnung\` varchar(50) DEFAULT NULL,
  \`strasse\` varchar(255) DEFAULT NULL,
  \`plz\` varchar(10) DEFAULT NULL,
  \`ort\` varchar(100) DEFAULT NULL,
  \`land\` varchar(100) DEFAULT NULL,
  \`telefon\` varchar(50) DEFAULT NULL,
  \`email\` varchar(320) DEFAULT NULL,
  \`ustIdNr\` varchar(50) DEFAULT NULL,
  \`kreditlimit\` decimal(15,2) DEFAULT NULL,
  \`zahlungsziel\` int DEFAULT '14',
  \`notizen\` text,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  \`datevKontonummer\` varchar(20) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`debitoren_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`debitoren_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 20/51: dropbox_connections
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`dropbox_connections\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`accessToken\` text NOT NULL,
  \`refreshToken\` text,
  \`expiresAt\` timestamp NULL DEFAULT NULL,
  \`accountId\` varchar(100) DEFAULT NULL,
  \`accountEmail\` varchar(255) DEFAULT NULL,
  \`watchFolder\` varchar(500) NOT NULL,
  \`autoCreateVorschlaege\` tinyint(1) NOT NULL DEFAULT '1',
  \`lastSync\` timestamp NULL DEFAULT NULL,
  \`lastCursor\` text,
  \`syncStatus\` enum('aktiv','fehler','pausiert') NOT NULL DEFAULT 'aktiv',
  \`syncFehler\` text,
  \`dateienGesamt\` int DEFAULT '0',
  \`dateienNeu\` int DEFAULT '0',
  \`letzterFehler\` timestamp NULL DEFAULT NULL,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`createdBy\` int DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`unternehmenId\` (\`unternehmenId\`),
  KEY \`createdBy\` (\`createdBy\`),
  CONSTRAINT \`dropbox_connections_ibfk_1\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 21/51: dropbox_sync_log
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`dropbox_sync_log\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`connectionId\` int NOT NULL,
  \`dropboxPath\` varchar(500) NOT NULL,
  \`dropboxFileId\` varchar(100) DEFAULT NULL,
  \`fileName\` varchar(255) NOT NULL,
  \`fileSize\` int DEFAULT NULL,
  \`belegUrl\` varchar(512) DEFAULT NULL,
  \`vorschlagId\` int DEFAULT NULL,
  \`status\` enum('sync','uploaded','analyzed','fehler') NOT NULL DEFAULT 'sync',
  \`fehlerMeldung\` text,
  \`syncedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`connectionId\` (\`connectionId\`),
  KEY \`vorschlagId\` (\`vorschlagId\`),
  CONSTRAINT \`dropbox_sync_log_ibfk_1\` FOREIGN KEY (\`connectionId\`) REFERENCES \`dropbox_connections\` (\`id\`),
  CONSTRAINT \`dropbox_sync_log_ibfk_2\` FOREIGN KEY (\`vorschlagId\`) REFERENCES \`buchungsvorschlaege\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 22/51: einladungen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`einladungen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`code\` varchar(64) NOT NULL,
  \`email\` varchar(320) NOT NULL,
  \`unternehmenId\` int NOT NULL,
  \`rolle\` enum('admin','buchhalter','viewer') NOT NULL DEFAULT 'buchhalter',
  \`eingeladenVon\` int NOT NULL,
  \`status\` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
  \`expiresAt\` timestamp NOT NULL,
  \`acceptedAt\` timestamp NULL DEFAULT NULL,
  \`acceptedBy\` int DEFAULT NULL,
  \`nachricht\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`einladungen_code_unique\` (\`code\`),
  KEY \`einladungen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`einladungen_eingeladenVon_users_id_fk\` (\`eingeladenVon\`),
  KEY \`einladungen_acceptedBy_users_id_fk\` (\`acceptedBy\`),
  CONSTRAINT \`einladungen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 23/51: eroeffnungsbilanz
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`eroeffnungsbilanz\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`jahr\` int NOT NULL,
  \`sachkonto\` varchar(20) NOT NULL,
  \`kontobezeichnung\` varchar(255) DEFAULT NULL,
  \`sollbetrag\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`habenbetrag\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`importQuelle\` enum('manuell','datev','api') DEFAULT 'manuell',
  \`importDatum\` timestamp NULL DEFAULT NULL,
  \`notizen\` text,
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`eroeffnungsbilanz_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`eroeffnungsbilanz_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`eroeffnungsbilanz_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 24/51: fa_dok_versionen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`fa_dok_versionen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`dokumentId\` int NOT NULL,
  \`version\` int NOT NULL,
  \`versionTyp\` enum('original','einspruch','antwort','ergaenzung','korrektur','anlage') NOT NULL DEFAULT 'original',
  \`betreff\` varchar(500) DEFAULT NULL,
  \`beschreibung\` text,
  \`datum\` date NOT NULL,
  \`dateiUrl\` text,
  \`dateiName\` varchar(255) DEFAULT NULL,
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (\`id\`),
  KEY \`fa_dok_versionen_dokumentId_finanzamt_dokumente_id_fk\` (\`dokumentId\`),
  KEY \`fa_dok_versionen_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`fa_dok_versionen_dokumentId_finanzamt_dokumente_id_fk\` FOREIGN KEY (\`dokumentId\`) REFERENCES \`finanzamt_dokumente\` (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 25/51: finanzamt_dokumente
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`finanzamt_dokumente\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`dokumentTyp\` enum('schriftverkehr','bescheid','einspruch','mahnung','anfrage','pruefung','sonstiges') NOT NULL DEFAULT 'schriftverkehr',
  \`steuerart\` enum('USt','ESt','KSt','GewSt','LSt','KapESt','sonstige') DEFAULT NULL,
  \`zeitraumVon\` date DEFAULT NULL,
  \`zeitraumBis\` date DEFAULT NULL,
  \`steuerjahr\` int DEFAULT NULL,
  \`aktenzeichen\` varchar(50) DEFAULT NULL,
  \`betreff\` varchar(500) NOT NULL,
  \`beschreibung\` text,
  \`eingangsdatum\` date NOT NULL,
  \`frist\` date DEFAULT NULL,
  \`betrag\` decimal(15,2) DEFAULT NULL,
  \`zahlungsfrist\` date DEFAULT NULL,
  \`status\` enum('neu','in_bearbeitung','einspruch','erledigt','archiviert') NOT NULL DEFAULT 'neu',
  \`bezugDokumentId\` int DEFAULT NULL,
  \`dateiUrl\` text,
  \`dateiName\` varchar(255) DEFAULT NULL,
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`finanzamt_dokumente_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`finanzamt_dokumente_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`finanzamt_dokumente_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 26/51: finanzierung_dokumente
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`finanzierung_dokumente\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`finanzierungId\` int NOT NULL,
  \`dateiUrl\` varchar(512) NOT NULL,
  \`dateiName\` varchar(255) NOT NULL,
  \`dateityp\` varchar(50) DEFAULT NULL,
  \`dateiGroesse\` int DEFAULT NULL,
  \`beschreibung\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`createdBy\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`finanzierungId\` (\`finanzierungId\`),
  CONSTRAINT \`finanzierung_dokumente_ibfk_1\` FOREIGN KEY (\`finanzierungId\`) REFERENCES \`finanzierungen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 27/51: finanzierung_zahlungen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`finanzierung_zahlungen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`finanzierungId\` int NOT NULL,
  \`faelligkeit\` date NOT NULL,
  \`betrag\` decimal(15,2) NOT NULL,
  \`zinsenAnteil\` decimal(15,2) DEFAULT NULL,
  \`tilgungAnteil\` decimal(15,2) DEFAULT NULL,
  \`status\` enum('offen','bezahlt','ueberfaellig') NOT NULL DEFAULT 'offen',
  \`bezahltAm\` date DEFAULT NULL,
  \`buchungId\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`finanzierungId\` (\`finanzierungId\`),
  KEY \`buchungId\` (\`buchungId\`),
  CONSTRAINT \`finanzierung_zahlungen_ibfk_1\` FOREIGN KEY (\`finanzierungId\`) REFERENCES \`finanzierungen\` (\`id\`),
  CONSTRAINT \`finanzierung_zahlungen_ibfk_2\` FOREIGN KEY (\`buchungId\`) REFERENCES \`buchungen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 28/51: finanzierungen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`finanzierungen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`typ\` enum('kredit','leasing','mietkauf','factoring') NOT NULL,
  \`vertragsnummer\` varchar(100) DEFAULT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`beschreibung\` text,
  \`kreditgeber\` varchar(255) NOT NULL,
  \`kreditgeberKontonummer\` varchar(20) DEFAULT NULL,
  \`objektBezeichnung\` varchar(255) DEFAULT NULL,
  \`objektWert\` decimal(15,2) DEFAULT NULL,
  \`gesamtbetrag\` decimal(15,2) NOT NULL,
  \`restschuld\` decimal(15,2) DEFAULT NULL,
  \`zinssatz\` decimal(5,3) DEFAULT NULL,
  \`vertragsBeginn\` date NOT NULL,
  \`vertragsEnde\` date NOT NULL,
  \`ratenBetrag\` decimal(15,2) NOT NULL,
  \`ratenTyp\` enum('monatlich','quartal','halbjaehrlich','jaehrlich') NOT NULL DEFAULT 'monatlich',
  \`ratenTag\` int DEFAULT '1',
  \`anzahlung\` decimal(15,2) DEFAULT '0.00',
  \`schlussrate\` decimal(15,2) DEFAULT '0.00',
  \`aufwandskonto\` varchar(20) DEFAULT NULL,
  \`verbindlichkeitskonto\` varchar(20) DEFAULT NULL,
  \`zinsaufwandskonto\` varchar(20) DEFAULT NULL,
  \`status\` enum('aktiv','abgeschlossen','gekuendigt') NOT NULL DEFAULT 'aktiv',
  \`vertragsDokumentUrl\` text,
  \`notizen\` text,
  \`createdBy\` varchar(255) DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`unternehmenId\` (\`unternehmenId\`),
  CONSTRAINT \`finanzierungen_ibfk_1\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 29/51: finanzkonten
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`finanzkonten\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`sachkontoId\` int DEFAULT NULL,
  \`typ\` enum('bank','kreditkarte','broker','kasse','paypal','stripe','sonstiges') NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`kontonummer\` varchar(50) DEFAULT NULL,
  \`iban\` varchar(34) DEFAULT NULL,
  \`bic\` varchar(11) DEFAULT NULL,
  \`bankName\` varchar(255) DEFAULT NULL,
  \`kontoinhaber\` varchar(255) DEFAULT NULL,
  \`kreditkartenNummer\` varchar(20) DEFAULT NULL,
  \`kreditlimit\` decimal(15,2) DEFAULT NULL,
  \`abrechnungstag\` int DEFAULT NULL,
  \`depotNummer\` varchar(50) DEFAULT NULL,
  \`brokerName\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`waehrung\` varchar(3) DEFAULT 'EUR',
  \`aktiv\` tinyint(1) DEFAULT '1',
  \`notizen\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`finanzkonten_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`finanzkonten_sachkontoId_sachkonten_id_fk\` (\`sachkontoId\`),
  CONSTRAINT \`finanzkonten_sachkontoId_sachkonten_id_fk\` FOREIGN KEY (\`sachkontoId\`) REFERENCES \`sachkonten\` (\`id\`),
  CONSTRAINT \`finanzkonten_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 30/51: gesellschafter
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`gesellschafter\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`kontonummer\` varchar(20) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`typ\` enum('natuerlich','juristisch') DEFAULT 'natuerlich',
  \`anteil\` decimal(5,2) DEFAULT NULL,
  \`einlage\` decimal(15,2) DEFAULT NULL,
  \`eintrittsdatum\` date DEFAULT NULL,
  \`strasse\` varchar(255) DEFAULT NULL,
  \`plz\` varchar(10) DEFAULT NULL,
  \`ort\` varchar(100) DEFAULT NULL,
  \`steuerId\` varchar(50) DEFAULT NULL,
  \`notizen\` text,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  \`sachkonto\` varchar(20) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`gesellschafter_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`gesellschafter_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 31/51: inventuren
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`inventuren\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`stichtag\` date NOT NULL,
  \`status\` enum('geplant','in_arbeit','abgeschlossen','storniert') NOT NULL DEFAULT 'geplant',
  \`lagerortId\` int DEFAULT NULL,
  \`erstelltVon\` int DEFAULT NULL,
  \`abgeschlossenVon\` int DEFAULT NULL,
  \`abgeschlossenAm\` timestamp NULL DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`inventuren_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`inventuren_lagerortId_lagerorte_id_fk\` (\`lagerortId\`),
  KEY \`inventuren_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  KEY \`inventuren_abgeschlossenVon_users_id_fk\` (\`abgeschlossenVon\`),
  CONSTRAINT \`inventuren_lagerortId_lagerorte_id_fk\` FOREIGN KEY (\`lagerortId\`) REFERENCES \`lagerorte\` (\`id\`),
  CONSTRAINT \`inventuren_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 32/51: inventurpositionen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`inventurpositionen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`inventurId\` int NOT NULL,
  \`artikelId\` int NOT NULL,
  \`lagerortId\` int NOT NULL,
  \`sollMenge\` decimal(15,2) NOT NULL,
  \`istMenge\` decimal(15,2) DEFAULT NULL,
  \`differenz\` decimal(15,2) DEFAULT NULL,
  \`gezaehltVon\` int DEFAULT NULL,
  \`gezaehltAm\` timestamp NULL DEFAULT NULL,
  \`kommentar\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`inventurpositionen_inventurId_inventuren_id_fk\` (\`inventurId\`),
  KEY \`inventurpositionen_artikelId_artikel_id_fk\` (\`artikelId\`),
  KEY \`inventurpositionen_lagerortId_lagerorte_id_fk\` (\`lagerortId\`),
  KEY \`inventurpositionen_gezaehltVon_users_id_fk\` (\`gezaehltVon\`),
  CONSTRAINT \`inventurpositionen_artikelId_artikel_id_fk\` FOREIGN KEY (\`artikelId\`) REFERENCES \`artikel\` (\`id\`),
  CONSTRAINT \`inventurpositionen_inventurId_inventuren_id_fk\` FOREIGN KEY (\`inventurId\`) REFERENCES \`inventuren\` (\`id\`),
  CONSTRAINT \`inventurpositionen_lagerortId_lagerorte_id_fk\` FOREIGN KEY (\`lagerortId\`) REFERENCES \`lagerorte\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 33/51: kontierungsregeln
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`kontierungsregeln\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`suchbegriff\` varchar(255) NOT NULL,
  \`sollKonto\` varchar(20) NOT NULL,
  \`habenKonto\` varchar(20) NOT NULL,
  \`ustSatz\` decimal(5,2) NOT NULL DEFAULT '0.00',
  \`prioritaet\` int NOT NULL DEFAULT '0',
  \`beschreibung\` text,
  \`geschaeftspartner\` varchar(255) DEFAULT NULL,
  \`verwendungen\` int NOT NULL DEFAULT '0',
  \`erfolgsrate\` decimal(5,2) DEFAULT '100.00',
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`kontierungsregeln_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`kontierungsregeln_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`kontierungsregeln_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 34/51: kostenstellen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`kostenstellen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`nummer\` varchar(20) NOT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`verantwortlicher\` varchar(255) DEFAULT NULL,
  \`budget\` decimal(15,2) DEFAULT NULL,
  \`notizen\` text,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`kostenstellen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`kostenstellen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 35/51: kreditoren
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`kreditoren\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`kontonummer\` varchar(20) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`kurzbezeichnung\` varchar(50) DEFAULT NULL,
  \`strasse\` varchar(255) DEFAULT NULL,
  \`plz\` varchar(10) DEFAULT NULL,
  \`ort\` varchar(100) DEFAULT NULL,
  \`land\` varchar(100) DEFAULT NULL,
  \`telefon\` varchar(50) DEFAULT NULL,
  \`email\` varchar(320) DEFAULT NULL,
  \`ustIdNr\` varchar(50) DEFAULT NULL,
  \`steuernummer\` varchar(50) DEFAULT NULL,
  \`iban\` varchar(34) DEFAULT NULL,
  \`bic\` varchar(11) DEFAULT NULL,
  \`zahlungsziel\` int DEFAULT '30',
  \`skonto\` decimal(5,2) DEFAULT NULL,
  \`skontofrist\` int DEFAULT NULL,
  \`standardSachkonto\` varchar(20) DEFAULT NULL,
  \`notizen\` text,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  \`datevKontonummer\` varchar(20) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`kreditoren_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`kreditoren_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 36/51: lagerbestaende
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`lagerbestaende\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`artikelId\` int NOT NULL,
  \`lagerortId\` int NOT NULL,
  \`menge\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`reservierteMenge\` decimal(15,2) DEFAULT '0.00',
  \`letzteBewegung\` timestamp NULL DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`lagerbestaende_artikelId_artikel_id_fk\` (\`artikelId\`),
  KEY \`lagerbestaende_lagerortId_lagerorte_id_fk\` (\`lagerortId\`),
  CONSTRAINT \`lagerbestaende_artikelId_artikel_id_fk\` FOREIGN KEY (\`artikelId\`) REFERENCES \`artikel\` (\`id\`),
  CONSTRAINT \`lagerbestaende_lagerortId_lagerorte_id_fk\` FOREIGN KEY (\`lagerortId\`) REFERENCES \`lagerorte\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 37/51: lagerorte
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`lagerorte\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`beschreibung\` text,
  \`adresse\` varchar(500) DEFAULT NULL,
  \`istHauptlager\` tinyint(1) NOT NULL DEFAULT '0',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`lagerorte_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`lagerorte_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 38/51: monatsabschluss
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`monatsabschluss\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`jahr\` int NOT NULL,
  \`monat\` int NOT NULL,
  \`status\` enum('offen','in_arbeit','geprueft','abgeschlossen','korrektur') NOT NULL DEFAULT 'offen',
  \`abgeschlossenAm\` timestamp NULL DEFAULT NULL,
  \`abgeschlossenVon\` int DEFAULT NULL,
  \`gesperrt\` tinyint(1) NOT NULL DEFAULT '0',
  \`notizen\` text,
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`monatsabschluss_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`monatsabschluss_abgeschlossenVon_users_id_fk\` (\`abgeschlossenVon\`),
  KEY \`monatsabschluss_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`monatsabschluss_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 39/51: monatsabschluss_items
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`monatsabschluss_items\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`monatsabschlussId\` int NOT NULL,
  \`beschreibung\` varchar(500) NOT NULL,
  \`kategorie\` enum('belege','abstimmung','steuer','personal','pruefung','bericht','sonstig') NOT NULL DEFAULT 'sonstig',
  \`erledigt\` tinyint(1) NOT NULL DEFAULT '0',
  \`erledigtAm\` timestamp NULL DEFAULT NULL,
  \`erledigtVon\` int DEFAULT NULL,
  \`pflicht\` tinyint(1) NOT NULL DEFAULT '1',
  \`sortierung\` int DEFAULT '0',
  \`notizen\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`monatsabschluss_items_monatsabschlussId_monatsabschluss_id_fk\` (\`monatsabschlussId\`),
  KEY \`monatsabschluss_items_erledigtVon_users_id_fk\` (\`erledigtVon\`),
  CONSTRAINT \`monatsabschluss_items_monatsabschlussId_monatsabschluss_id_fk\` FOREIGN KEY (\`monatsabschlussId\`) REFERENCES \`monatsabschluss\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 40/51: notizen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`notizen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`titel\` varchar(255) NOT NULL,
  \`kategorie\` enum('vertrag','kreditor','debitor','buchung','allgemein') DEFAULT 'allgemein',
  \`bezug\` varchar(255) DEFAULT NULL,
  \`inhalt\` text,
  \`createdBy\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`notizen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`notizen_createdBy_users_id_fk\` (\`createdBy\`),
  CONSTRAINT \`notizen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 41/51: onboarding_orders
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`onboarding_orders\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`stripeCustomerId\` varchar(255) NOT NULL,
  \`clerkUserId\` varchar(255) DEFAULT NULL,
  \`packageType\` enum('basis','komplett','enterprise','schulung_einzel','schulung_team','schulung_intensiv') NOT NULL,
  \`stripePaymentIntentId\` varchar(255) DEFAULT NULL,
  \`status\` enum('paid','pending','refunded') NOT NULL DEFAULT 'pending',
  \`amount\` int NOT NULL,
  \`createdAt\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 42/51: payment_providers
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`payment_providers\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`provider\` varchar(100) NOT NULL,
  \`accountId\` varchar(255) DEFAULT NULL,
  \`feePercent\` decimal(5,2) DEFAULT NULL,
  \`currency\` varchar(3) DEFAULT 'EUR',
  \`notes\` text,
  \`active\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`payment_providers_unternehmenId_fk\` (\`unternehmenId\`),
  CONSTRAINT \`payment_providers_unternehmenId_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 43/51: sachkonten
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`sachkonten\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int DEFAULT NULL,
  \`kontenrahmen\` enum('SKR03','SKR04','OeKR','RLG','KMU','OR','UK_GAAP','IFRS','CY_GAAP') NOT NULL DEFAULT 'SKR04',
  \`kontonummer\` varchar(20) NOT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`kategorie\` varchar(100) DEFAULT NULL,
  \`kontotyp\` enum('aktiv','passiv','aufwand','ertrag','neutral') DEFAULT 'aufwand',
  \`standardSteuersatz\` decimal(5,2) DEFAULT NULL,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`notizen\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`sachkonten_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`sachkonten_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 44/51: stb_rech_pos
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`stb_rech_pos\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`rechnungId\` int NOT NULL,
  \`positionsnummer\` int DEFAULT '1',
  \`beschreibung\` varchar(500) NOT NULL,
  \`kategorie\` enum('jahresabschluss','steuererklaerung','buchhaltung','lohnabrechnung','beratung','finanzamt','pruefung','kapitalertragsteuer','oss_eu','sonstig') NOT NULL DEFAULT 'sonstig',
  \`bewertung\` enum('notwendig','vermeidbar_nachfrage','vermeidbar_korrektur','vermeidbar_beleg','vermeidbar_info','unklar') NOT NULL DEFAULT 'unklar',
  \`vermeidbarUrsache\` text,
  \`menge\` decimal(10,2) DEFAULT '1.00',
  \`einzelpreis\` decimal(15,2) NOT NULL,
  \`gesamtpreis\` decimal(15,2) NOT NULL,
  \`uebergabeId\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (\`id\`),
  KEY \`stb_rech_pos_rechnungId_stb_rechnungen_id_fk\` (\`rechnungId\`),
  KEY \`stb_rech_pos_uebergabeId_stb_uebergaben_id_fk\` (\`uebergabeId\`),
  CONSTRAINT \`stb_rech_pos_rechnungId_stb_rechnungen_id_fk\` FOREIGN KEY (\`rechnungId\`) REFERENCES \`stb_rechnungen\` (\`id\`),
  CONSTRAINT \`stb_rech_pos_uebergabeId_stb_uebergaben_id_fk\` FOREIGN KEY (\`uebergabeId\`) REFERENCES \`stb_uebergaben\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 45/51: stb_rechnungen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`stb_rechnungen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`rechnungsnummer\` varchar(100) NOT NULL,
  \`rechnungsdatum\` date NOT NULL,
  \`zeitraumVon\` date DEFAULT NULL,
  \`zeitraumBis\` date DEFAULT NULL,
  \`nettobetrag\` decimal(15,2) NOT NULL,
  \`steuersatz\` decimal(5,2) DEFAULT '19.00',
  \`bruttobetrag\` decimal(15,2) NOT NULL,
  \`status\` enum('offen','bezahlt','storniert') NOT NULL DEFAULT 'offen',
  \`zahlungsdatum\` date DEFAULT NULL,
  \`beschreibung\` text,
  \`dateiUrl\` text,
  \`dateiName\` varchar(255) DEFAULT NULL,
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`stb_rechnungen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`stb_rechnungen_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`stb_rechnungen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 46/51: stb_ueb_pos
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`stb_ueb_pos\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`uebergabeId\` int NOT NULL,
  \`buchungId\` int DEFAULT NULL,
  \`finanzamtDokumentId\` int DEFAULT NULL,
  \`positionstyp\` enum('buchung','beleg','dokument','finanzamt') NOT NULL DEFAULT 'buchung',
  \`beschreibung\` varchar(500) DEFAULT NULL,
  \`betrag\` decimal(15,2) DEFAULT NULL,
  \`dateiUrl\` text,
  \`dateiName\` varchar(255) DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (\`id\`),
  KEY \`stb_ueb_pos_uebergabeId_stb_uebergaben_id_fk\` (\`uebergabeId\`),
  KEY \`stb_ueb_pos_buchungId_buchungen_id_fk\` (\`buchungId\`),
  KEY \`stb_ueb_pos_finanzamtDokumentId_finanzamt_dokumente_id_fk\` (\`finanzamtDokumentId\`),
  CONSTRAINT \`stb_ueb_pos_buchungId_buchungen_id_fk\` FOREIGN KEY (\`buchungId\`) REFERENCES \`buchungen\` (\`id\`),
  CONSTRAINT \`stb_ueb_pos_finanzamtDokumentId_finanzamt_dokumente_id_fk\` FOREIGN KEY (\`finanzamtDokumentId\`) REFERENCES \`finanzamt_dokumente\` (\`id\`),
  CONSTRAINT \`stb_ueb_pos_uebergabeId_stb_uebergaben_id_fk\` FOREIGN KEY (\`uebergabeId\`) REFERENCES \`stb_uebergaben\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 47/51: stb_uebergaben
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`stb_uebergaben\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`beschreibung\` text,
  \`uebergabeart\` enum('datev_export','email','portal','persoenlich','post','cloud','sonstig') NOT NULL DEFAULT 'datev_export',
  \`zeitraumVon\` date DEFAULT NULL,
  \`zeitraumBis\` date DEFAULT NULL,
  \`uebergabedatum\` date NOT NULL,
  \`anzahlBuchungen\` int DEFAULT '0',
  \`anzahlBelege\` int DEFAULT '0',
  \`gesamtbetrag\` decimal(15,2) DEFAULT NULL,
  \`status\` enum('vorbereitet','uebergeben','bestaetigt','rueckfrage','abgeschlossen') NOT NULL DEFAULT 'vorbereitet',
  \`bestaetigtAm\` timestamp NULL DEFAULT NULL,
  \`rueckfragen\` text,
  \`dateiUrl\` text,
  \`dateiName\` varchar(255) DEFAULT NULL,
  \`erstelltVon\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`stb_uebergaben_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`stb_uebergaben_erstelltVon_users_id_fk\` (\`erstelltVon\`),
  CONSTRAINT \`stb_uebergaben_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 48/51: subscriptions
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`subscriptions\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`clerkUserId\` varchar(255) DEFAULT NULL,
  \`stripeCustomerId\` varchar(255) NOT NULL,
  \`stripeSubscriptionId\` varchar(255) DEFAULT NULL,
  \`stripePriceId\` varchar(255) DEFAULT NULL,
  \`plan\` enum('starter','business','enterprise') NOT NULL,
  \`status\` enum('active','canceled','past_due','trialing','incomplete') NOT NULL DEFAULT 'incomplete',
  \`currentPeriodEnd\` datetime DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`createdAt\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 49/51: unternehmen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`unternehmen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`rechtsform\` varchar(100) DEFAULT NULL,
  \`steuernummer\` varchar(50) DEFAULT NULL,
  \`finanzamtNummer\` varchar(20) DEFAULT NULL,
  \`ustIdNr\` varchar(50) DEFAULT NULL,
  \`handelsregister\` varchar(100) DEFAULT NULL,
  \`strasse\` varchar(255) DEFAULT NULL,
  \`plz\` varchar(10) DEFAULT NULL,
  \`ort\` varchar(100) DEFAULT NULL,
  \`landCode\` enum('DE','AT','CH','UK','CY') NOT NULL DEFAULT 'DE',
  \`land\` varchar(100) DEFAULT 'Deutschland',
  \`waehrung\` enum('EUR','CHF','GBP') NOT NULL DEFAULT 'EUR',
  \`telefon\` varchar(50) DEFAULT NULL,
  \`email\` varchar(320) DEFAULT NULL,
  \`website\` varchar(255) DEFAULT NULL,
  \`kontenrahmen\` enum('SKR03','SKR04','OeKR','RLG','KMU','OR','UK_GAAP','IFRS','CY_GAAP') NOT NULL DEFAULT 'SKR03',
  \`wirtschaftsjahrBeginn\` int NOT NULL DEFAULT '1',
  \`beraternummer\` varchar(20) DEFAULT NULL,
  \`mandantennummer\` varchar(20) DEFAULT NULL,
  \`farbe\` varchar(20) DEFAULT '#0d9488',
  \`logoUrl\` text,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdBy\` int DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`unternehmen_createdBy_users_id_fk\` (\`createdBy\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 50/51: user_unternehmen
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`user_unternehmen\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`userId\` int NOT NULL,
  \`unternehmenId\` int NOT NULL,
  \`rolle\` enum('admin','buchhalter','viewer') NOT NULL DEFAULT 'buchhalter',
  \`buchungenLesen\` tinyint(1) NOT NULL DEFAULT '1',
  \`buchungenSchreiben\` tinyint(1) NOT NULL DEFAULT '0',
  \`stammdatenLesen\` tinyint(1) NOT NULL DEFAULT '1',
  \`stammdatenSchreiben\` tinyint(1) NOT NULL DEFAULT '0',
  \`berichteLesen\` tinyint(1) NOT NULL DEFAULT '1',
  \`berichteExportieren\` tinyint(1) NOT NULL DEFAULT '0',
  \`einladungenVerwalten\` tinyint(1) NOT NULL DEFAULT '0',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (\`id\`),
  KEY \`user_unternehmen_userId_users_id_fk\` (\`userId\`),
  KEY \`user_unternehmen_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  CONSTRAINT \`user_unternehmen_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // Tabelle 51/51: vertraege
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`vertraege\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`unternehmenId\` int NOT NULL,
  \`bezeichnung\` varchar(255) NOT NULL,
  \`vertragsart\` enum('miete','leasing','wartung','versicherung','abo','darlehen','pacht','lizenz','dienstleistung','sonstig') DEFAULT 'sonstig',
  \`vertragspartner\` varchar(255) DEFAULT NULL,
  \`vertragsnummer\` varchar(100) DEFAULT NULL,
  \`beginn\` date DEFAULT NULL,
  \`ende\` date DEFAULT NULL,
  \`kuendigungsfrist\` varchar(100) DEFAULT NULL,
  \`monatlicheBetrag\` decimal(15,2) DEFAULT NULL,
  \`nettoBetrag\` decimal(15,2) DEFAULT NULL,
  \`ustSatz\` decimal(5,2) DEFAULT '0.00',
  \`ustBetrag\` decimal(15,2) DEFAULT NULL,
  \`zahlungsrhythmus\` enum('monatlich','quartalsweise','halbjaehrlich','jaehrlich') DEFAULT 'monatlich',
  \`buchungskonto\` varchar(20) DEFAULT NULL,
  \`gegenkontoNr\` varchar(20) DEFAULT NULL,
  \`kostenstelleId\` int DEFAULT NULL,
  \`notizen\` text,
  \`belegUrl\` varchar(500) DEFAULT NULL,
  \`aktiv\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  \`ustBetragManuell\` varchar(20) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`vertraege_unternehmenId_unternehmen_id_fk\` (\`unternehmenId\`),
  KEY \`vertraege_kostenstelleId_kostenstellen_id_fk\` (\`kostenstelleId\`),
  CONSTRAINT \`vertraege_kostenstelleId_kostenstellen_id_fk\` FOREIGN KEY (\`kostenstelleId\`) REFERENCES \`kostenstellen\` (\`id\`),
  CONSTRAINT \`vertraege_unternehmenId_unternehmen_id_fk\` FOREIGN KEY (\`unternehmenId\`) REFERENCES \`unternehmen\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // FK-Checks wieder aktivieren
  await conn.execute('SET FOREIGN_KEY_CHECKS=1');

  console.log('✅ Schema-Migration abgeschlossen: 51 Tabellen');
}

module.exports = { migrate };
