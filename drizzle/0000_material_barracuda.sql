CREATE TABLE `aktivitaetsprotokoll` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int,
	`userId` int NOT NULL,
	`aktion` enum('buchung_erstellt','buchung_bearbeitet','buchung_geloescht','buchung_exportiert','stammdaten_erstellt','stammdaten_bearbeitet','stammdaten_geloescht','unternehmen_erstellt','unternehmen_bearbeitet','benutzer_hinzugefuegt','benutzer_entfernt','rolle_geaendert','berechtigungen_geaendert','login','logout') NOT NULL,
	`entitaetTyp` varchar(50),
	`entitaetId` int,
	`entitaetName` varchar(255),
	`details` text,
	`ipAdresse` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aktivitaetsprotokoll_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anlagevermoegen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`kategorie` varchar(100),
	`anschaffungsdatum` date,
	`anschaffungskosten` decimal(15,2),
	`nutzungsdauer` int,
	`abschreibungsmethode` enum('linear','degressiv','keine') DEFAULT 'linear',
	`restwert` decimal(15,2),
	`standort` varchar(255),
	`inventarnummer` varchar(50),
	`seriennummer` varchar(100),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anlagevermoegen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aufgaben` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`titel` varchar(500) NOT NULL,
	`beschreibung` text,
	`kategorie` enum('finanzamt','buchhaltung','steuern','personal','allgemein','frist','zahlung','pruefung') NOT NULL DEFAULT 'allgemein',
	`prioritaet` enum('niedrig','normal','hoch','dringend') NOT NULL DEFAULT 'normal',
	`status` enum('offen','in_bearbeitung','wartend','erledigt','storniert') NOT NULL DEFAULT 'offen',
	`faelligkeitsdatum` date,
	`erinnerungsdatum` date,
	`zugewiesenAn` int,
	`erstelltVon` int,
	`finanzamtDokumentId` int,
	`erledigtAm` date,
	`erledigtVon` int,
	`notizen` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aufgaben_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bankkonten` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`bankname` varchar(255),
	`iban` varchar(34),
	`bic` varchar(11),
	`kontotyp` enum('girokonto','sparkonto','festgeld','kreditkarte','sonstig') DEFAULT 'girokonto',
	`waehrung` varchar(3) DEFAULT 'EUR',
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankkonten_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `berechtigungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rollenName` enum('admin','buchhalter','viewer') NOT NULL,
	`bereich` varchar(50) NOT NULL,
	`lesen` boolean NOT NULL DEFAULT true,
	`erstellen` boolean NOT NULL DEFAULT false,
	`bearbeiten` boolean NOT NULL DEFAULT false,
	`loeschen` boolean NOT NULL DEFAULT false,
	`exportieren` boolean NOT NULL DEFAULT false,
	CONSTRAINT `berechtigungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beteiligungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`rechtsform` varchar(100),
	`anteil` decimal(5,2),
	`buchwert` decimal(15,2),
	`erwerbsdatum` date,
	`sitz` varchar(255),
	`handelsregister` varchar(100),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `beteiligungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buchungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`buchungsart` enum('aufwand','ertrag','anlage','sonstig') NOT NULL,
	`belegdatum` date NOT NULL,
	`belegnummer` varchar(50) NOT NULL,
	`geschaeftspartnerTyp` enum('kreditor','debitor','gesellschafter','sonstig') NOT NULL,
	`geschaeftspartner` varchar(255) NOT NULL,
	`geschaeftspartnerKonto` varchar(20) NOT NULL,
	`sachkonto` varchar(20) NOT NULL,
	`kostenstelleId` int,
	`nettobetrag` decimal(15,2) NOT NULL,
	`steuersatz` decimal(5,2) NOT NULL,
	`bruttobetrag` decimal(15,2) NOT NULL,
	`buchungstext` text,
	`belegUrl` varchar(500),
	`status` enum('entwurf','geprueft','exportiert') NOT NULL DEFAULT 'entwurf',
	`exportiertAm` timestamp,
	`zahlungsstatus` enum('offen','teilweise_bezahlt','bezahlt','ueberfaellig') NOT NULL DEFAULT 'offen',
	`faelligkeitsdatum` date,
	`bezahltAm` date,
	`bezahlterBetrag` decimal(15,2),
	`zahlungsreferenz` varchar(100),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buchungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debitoren` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`kurzbezeichnung` varchar(50),
	`strasse` varchar(255),
	`plz` varchar(10),
	`ort` varchar(100),
	`land` varchar(100),
	`telefon` varchar(50),
	`email` varchar(320),
	`ustIdNr` varchar(50),
	`kreditlimit` decimal(15,2),
	`zahlungsziel` int DEFAULT 14,
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debitoren_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `einladungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`unternehmenId` int NOT NULL,
	`rolle` enum('admin','buchhalter','viewer') NOT NULL DEFAULT 'buchhalter',
	`eingeladenVon` int NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`acceptedBy` int,
	`nachricht` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `einladungen_id` PRIMARY KEY(`id`),
	CONSTRAINT `einladungen_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `fa_dok_versionen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dokumentId` int NOT NULL,
	`version` int NOT NULL,
	`versionTyp` enum('original','einspruch','antwort','ergaenzung','korrektur','anlage') NOT NULL DEFAULT 'original',
	`betreff` varchar(500),
	`beschreibung` text,
	`datum` date NOT NULL,
	`dateiUrl` text,
	`dateiName` varchar(255),
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fa_dok_versionen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finanzamt_dokumente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`dokumentTyp` enum('schriftverkehr','bescheid','einspruch','mahnung','anfrage','pruefung','sonstiges') NOT NULL DEFAULT 'schriftverkehr',
	`steuerart` enum('USt','ESt','KSt','GewSt','LSt','KapESt','sonstige'),
	`zeitraumVon` date,
	`zeitraumBis` date,
	`steuerjahr` int,
	`aktenzeichen` varchar(50),
	`betreff` varchar(500) NOT NULL,
	`beschreibung` text,
	`eingangsdatum` date NOT NULL,
	`frist` date,
	`betrag` decimal(15,2),
	`zahlungsfrist` date,
	`status` enum('neu','in_bearbeitung','einspruch','erledigt','archiviert') NOT NULL DEFAULT 'neu',
	`bezugDokumentId` int,
	`dateiUrl` text,
	`dateiName` varchar(255),
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finanzamt_dokumente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gesellschafter` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`typ` enum('natuerlich','juristisch') DEFAULT 'natuerlich',
	`anteil` decimal(5,2),
	`einlage` decimal(15,2),
	`eintrittsdatum` date,
	`strasse` varchar(255),
	`plz` varchar(10),
	`ort` varchar(100),
	`steuerId` varchar(50),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gesellschafter_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kostenstellen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`nummer` varchar(20) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`verantwortlicher` varchar(255),
	`budget` decimal(15,2),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kostenstellen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kreditoren` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`kurzbezeichnung` varchar(50),
	`strasse` varchar(255),
	`plz` varchar(10),
	`ort` varchar(100),
	`land` varchar(100),
	`telefon` varchar(50),
	`email` varchar(320),
	`ustIdNr` varchar(50),
	`steuernummer` varchar(50),
	`iban` varchar(34),
	`bic` varchar(11),
	`zahlungsziel` int DEFAULT 30,
	`skonto` decimal(5,2),
	`skontofrist` int,
	`standardSachkonto` varchar(20),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kreditoren_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notizen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`titel` varchar(255) NOT NULL,
	`kategorie` enum('vertrag','kreditor','debitor','buchung','allgemein') DEFAULT 'allgemein',
	`bezug` varchar(255),
	`inhalt` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notizen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sachkonten` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int,
	`kontenrahmen` enum('SKR03','SKR04','OeKR','RLG','KMU','OR','UK_GAAP','IFRS','CY_GAAP') NOT NULL DEFAULT 'SKR04',
	`kontonummer` varchar(20) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`kategorie` varchar(100),
	`kontotyp` enum('aktiv','passiv','aufwand','ertrag','neutral') DEFAULT 'aufwand',
	`standardSteuersatz` decimal(5,2),
	`aktiv` boolean NOT NULL DEFAULT true,
	`notizen` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sachkonten_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stb_rech_pos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rechnungId` int NOT NULL,
	`positionsnummer` int DEFAULT 1,
	`beschreibung` varchar(500) NOT NULL,
	`kategorie` enum('jahresabschluss','steuererklaerung','buchhaltung','lohnabrechnung','beratung','finanzamt','pruefung','sonstig') NOT NULL DEFAULT 'sonstig',
	`bewertung` enum('notwendig','vermeidbar_nachfrage','vermeidbar_korrektur','vermeidbar_beleg','vermeidbar_info','unklar') NOT NULL DEFAULT 'unklar',
	`vermeidbarUrsache` text,
	`menge` decimal(10,2) DEFAULT '1.00',
	`einzelpreis` decimal(15,2) NOT NULL,
	`gesamtpreis` decimal(15,2) NOT NULL,
	`uebergabeId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stb_rech_pos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stb_rechnungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`rechnungsnummer` varchar(100) NOT NULL,
	`rechnungsdatum` date NOT NULL,
	`zeitraumVon` date,
	`zeitraumBis` date,
	`nettobetrag` decimal(15,2) NOT NULL,
	`steuersatz` decimal(5,2) DEFAULT '19.00',
	`bruttobetrag` decimal(15,2) NOT NULL,
	`status` enum('offen','bezahlt','storniert') NOT NULL DEFAULT 'offen',
	`zahlungsdatum` date,
	`beschreibung` text,
	`dateiUrl` text,
	`dateiName` varchar(255),
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stb_rechnungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stb_ueb_pos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uebergabeId` int NOT NULL,
	`buchungId` int,
	`finanzamtDokumentId` int,
	`positionstyp` enum('buchung','beleg','dokument','finanzamt') NOT NULL DEFAULT 'buchung',
	`beschreibung` varchar(500),
	`betrag` decimal(15,2),
	`dateiUrl` text,
	`dateiName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stb_ueb_pos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stb_uebergaben` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`beschreibung` text,
	`uebergabeart` enum('datev_export','email','portal','persoenlich','post','cloud','sonstig') NOT NULL DEFAULT 'datev_export',
	`zeitraumVon` date,
	`zeitraumBis` date,
	`uebergabedatum` date NOT NULL,
	`anzahlBuchungen` int DEFAULT 0,
	`anzahlBelege` int DEFAULT 0,
	`gesamtbetrag` decimal(15,2),
	`status` enum('vorbereitet','uebergeben','bestaetigt','rueckfrage','abgeschlossen') NOT NULL DEFAULT 'vorbereitet',
	`bestaetigtAm` timestamp,
	`rueckfragen` text,
	`dateiUrl` text,
	`dateiName` varchar(255),
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stb_uebergaben_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unternehmen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`rechtsform` varchar(100),
	`steuernummer` varchar(50),
	`ustIdNr` varchar(50),
	`handelsregister` varchar(100),
	`strasse` varchar(255),
	`plz` varchar(10),
	`ort` varchar(100),
	`landCode` enum('DE','AT','CH','UK','CY') NOT NULL DEFAULT 'DE',
	`land` varchar(100) DEFAULT 'Deutschland',
	`waehrung` enum('EUR','CHF','GBP') NOT NULL DEFAULT 'EUR',
	`telefon` varchar(50),
	`email` varchar(320),
	`website` varchar(255),
	`kontenrahmen` enum('SKR03','SKR04','OeKR','RLG','KMU','OR','UK_GAAP','IFRS','CY_GAAP') NOT NULL DEFAULT 'SKR03',
	`wirtschaftsjahrBeginn` int NOT NULL DEFAULT 1,
	`beraternummer` varchar(20),
	`mandantennummer` varchar(20),
	`farbe` varchar(20) DEFAULT '#0d9488',
	`logoUrl` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unternehmen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_unternehmen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`unternehmenId` int NOT NULL,
	`rolle` enum('admin','buchhalter','viewer') NOT NULL DEFAULT 'buchhalter',
	`buchungenLesen` boolean NOT NULL DEFAULT true,
	`buchungenSchreiben` boolean NOT NULL DEFAULT false,
	`stammdatenLesen` boolean NOT NULL DEFAULT true,
	`stammdatenSchreiben` boolean NOT NULL DEFAULT false,
	`berichteLesen` boolean NOT NULL DEFAULT true,
	`berichteExportieren` boolean NOT NULL DEFAULT false,
	`einladungenVerwalten` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_unternehmen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clerkId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_clerkId_unique` UNIQUE(`clerkId`)
);
--> statement-breakpoint
CREATE TABLE `vertraege` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`vertragsart` enum('miete','leasing','wartung','versicherung','abo','sonstig') DEFAULT 'sonstig',
	`vertragspartner` varchar(255),
	`vertragsnummer` varchar(100),
	`beginn` date,
	`ende` date,
	`kuendigungsfrist` varchar(100),
	`monatlicheBetrag` decimal(15,2),
	`zahlungsrhythmus` enum('monatlich','quartalsweise','halbjaehrlich','jaehrlich') DEFAULT 'monatlich',
	`buchungskonto` varchar(20),
	`kostenstelleId` int,
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vertraege_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aktivitaetsprotokoll` ADD CONSTRAINT `aktivitaetsprotokoll_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aktivitaetsprotokoll` ADD CONSTRAINT `aktivitaetsprotokoll_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anlagevermoegen` ADD CONSTRAINT `anlagevermoegen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_zugewiesenAn_users_id_fk` FOREIGN KEY (`zugewiesenAn`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_finanzamtDokumentId_finanzamt_dokumente_id_fk` FOREIGN KEY (`finanzamtDokumentId`) REFERENCES `finanzamt_dokumente`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_erledigtVon_users_id_fk` FOREIGN KEY (`erledigtVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bankkonten` ADD CONSTRAINT `bankkonten_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beteiligungen` ADD CONSTRAINT `beteiligungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungen` ADD CONSTRAINT `buchungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungen` ADD CONSTRAINT `buchungen_kostenstelleId_kostenstellen_id_fk` FOREIGN KEY (`kostenstelleId`) REFERENCES `kostenstellen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungen` ADD CONSTRAINT `buchungen_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debitoren` ADD CONSTRAINT `debitoren_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `einladungen` ADD CONSTRAINT `einladungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `einladungen` ADD CONSTRAINT `einladungen_eingeladenVon_users_id_fk` FOREIGN KEY (`eingeladenVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `einladungen` ADD CONSTRAINT `einladungen_acceptedBy_users_id_fk` FOREIGN KEY (`acceptedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fa_dok_versionen` ADD CONSTRAINT `fa_dok_versionen_dokumentId_finanzamt_dokumente_id_fk` FOREIGN KEY (`dokumentId`) REFERENCES `finanzamt_dokumente`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fa_dok_versionen` ADD CONSTRAINT `fa_dok_versionen_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finanzamt_dokumente` ADD CONSTRAINT `finanzamt_dokumente_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finanzamt_dokumente` ADD CONSTRAINT `finanzamt_dokumente_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gesellschafter` ADD CONSTRAINT `gesellschafter_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kostenstellen` ADD CONSTRAINT `kostenstellen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kreditoren` ADD CONSTRAINT `kreditoren_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notizen` ADD CONSTRAINT `notizen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notizen` ADD CONSTRAINT `notizen_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sachkonten` ADD CONSTRAINT `sachkonten_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_rech_pos` ADD CONSTRAINT `stb_rech_pos_rechnungId_stb_rechnungen_id_fk` FOREIGN KEY (`rechnungId`) REFERENCES `stb_rechnungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_rech_pos` ADD CONSTRAINT `stb_rech_pos_uebergabeId_stb_uebergaben_id_fk` FOREIGN KEY (`uebergabeId`) REFERENCES `stb_uebergaben`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_rechnungen` ADD CONSTRAINT `stb_rechnungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_rechnungen` ADD CONSTRAINT `stb_rechnungen_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_ueb_pos` ADD CONSTRAINT `stb_ueb_pos_uebergabeId_stb_uebergaben_id_fk` FOREIGN KEY (`uebergabeId`) REFERENCES `stb_uebergaben`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_ueb_pos` ADD CONSTRAINT `stb_ueb_pos_buchungId_buchungen_id_fk` FOREIGN KEY (`buchungId`) REFERENCES `buchungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_ueb_pos` ADD CONSTRAINT `stb_ueb_pos_finanzamtDokumentId_finanzamt_dokumente_id_fk` FOREIGN KEY (`finanzamtDokumentId`) REFERENCES `finanzamt_dokumente`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_uebergaben` ADD CONSTRAINT `stb_uebergaben_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_uebergaben` ADD CONSTRAINT `stb_uebergaben_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unternehmen` ADD CONSTRAINT `unternehmen_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD CONSTRAINT `user_unternehmen_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD CONSTRAINT `user_unternehmen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vertraege` ADD CONSTRAINT `vertraege_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vertraege` ADD CONSTRAINT `vertraege_kostenstelleId_kostenstellen_id_fk` FOREIGN KEY (`kostenstelleId`) REFERENCES `kostenstellen`(`id`) ON DELETE no action ON UPDATE no action;