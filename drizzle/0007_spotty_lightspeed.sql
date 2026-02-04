CREATE TABLE `auszuege` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`typ` enum('bankkonto','kreditkarte','zahlungsdienstleister') NOT NULL,
	`kontoId` int,
	`kontoBezeichnung` varchar(255),
	`dateiUrl` varchar(512) NOT NULL,
	`dateiname` varchar(255) NOT NULL,
	`zeitraumVon` date NOT NULL,
	`zeitraumBis` date NOT NULL,
	`saldoAnfang` decimal(15,2),
	`saldoEnde` decimal(15,2),
	`waehrung` varchar(3) DEFAULT 'EUR',
	`status` enum('neu','in_bearbeitung','abgeschlossen') NOT NULL DEFAULT 'neu',
	`notizen` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`erstelltVon` int,
	CONSTRAINT `auszuege_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auszug_positionen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auszugId` int NOT NULL,
	`datum` date NOT NULL,
	`buchungstext` text NOT NULL,
	`betrag` decimal(15,2) NOT NULL,
	`saldo` decimal(15,2),
	`referenz` varchar(255),
	`kategorie` varchar(100),
	`zugeordneteBuchungId` int,
	`status` enum('offen','zugeordnet','ignoriert') NOT NULL DEFAULT 'offen',
	`notizen` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auszug_positionen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finanzierung_zahlungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`finanzierungId` int NOT NULL,
	`faelligkeit` date NOT NULL,
	`betrag` decimal(15,2) NOT NULL,
	`zinsenAnteil` decimal(15,2),
	`tilgungAnteil` decimal(15,2),
	`status` enum('offen','bezahlt','ueberfaellig') NOT NULL DEFAULT 'offen',
	`bezahltAm` date,
	`buchungId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finanzierung_zahlungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finanzierungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`typ` enum('kredit','leasing','mietkauf','factoring') NOT NULL,
	`vertragsnummer` varchar(100),
	`bezeichnung` varchar(255) NOT NULL,
	`beschreibung` text,
	`kreditgeber` varchar(255) NOT NULL,
	`kreditgeberKontonummer` varchar(20),
	`objektBezeichnung` varchar(255),
	`objektWert` decimal(15,2),
	`gesamtbetrag` decimal(15,2) NOT NULL,
	`restschuld` decimal(15,2),
	`zinssatz` decimal(5,3),
	`vertragsBeginn` date NOT NULL,
	`vertragsEnde` date NOT NULL,
	`ratenBetrag` decimal(15,2) NOT NULL,
	`ratenTyp` enum('monatlich','quartal','halbjaehrlich','jaehrlich') NOT NULL DEFAULT 'monatlich',
	`ratenTag` int DEFAULT 1,
	`anzahlung` decimal(15,2) DEFAULT '0',
	`schlussrate` decimal(15,2) DEFAULT '0',
	`aufwandskonto` varchar(20),
	`verbindlichkeitskonto` varchar(20),
	`zinsaufwandskonto` varchar(20),
	`status` enum('aktiv','abgeschlossen','gekuendigt') NOT NULL DEFAULT 'aktiv',
	`vertragsDokumentUrl` text,
	`notizen` text,
	`createdBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finanzierungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auszuege` ADD CONSTRAINT `auszuege_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auszuege` ADD CONSTRAINT `auszuege_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auszug_positionen` ADD CONSTRAINT `auszug_positionen_auszugId_auszuege_id_fk` FOREIGN KEY (`auszugId`) REFERENCES `auszuege`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auszug_positionen` ADD CONSTRAINT `auszug_positionen_zugeordneteBuchungId_buchungen_id_fk` FOREIGN KEY (`zugeordneteBuchungId`) REFERENCES `buchungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finanzierung_zahlungen` ADD CONSTRAINT `finanzierung_zahlungen_finanzierungId_finanzierungen_id_fk` FOREIGN KEY (`finanzierungId`) REFERENCES `finanzierungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finanzierung_zahlungen` ADD CONSTRAINT `finanzierung_zahlungen_buchungId_buchungen_id_fk` FOREIGN KEY (`buchungId`) REFERENCES `buchungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finanzierungen` ADD CONSTRAINT `finanzierungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;