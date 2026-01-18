CREATE TABLE `artikel` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`artikelnummer` varchar(100) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`beschreibung` text,
	`kategorie` enum('rohstoff','halbfertig','fertigware','handelsware','verbrauchsmaterial') NOT NULL,
	`einheit` enum('stueck','kg','liter','meter','karton') NOT NULL,
	`einkaufspreis` decimal(15,2),
	`verkaufspreis` decimal(15,2),
	`mindestbestand` decimal(15,2),
	`zielbestand` decimal(15,2),
	`lieferantId` int,
	`sachkontoId` int,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artikel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bestandsbewegungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artikelId` int NOT NULL,
	`lagerortId` int NOT NULL,
	`bewegungsart` enum('eingang','ausgang','korrektur','umbuchung','inventur') NOT NULL,
	`menge` decimal(15,2) NOT NULL,
	`vorherMenge` decimal(15,2),
	`nachherMenge` decimal(15,2),
	`referenzTyp` varchar(50),
	`referenzId` int,
	`buchungId` int,
	`notiz` text,
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bestandsbewegungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventuren` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`stichtag` date NOT NULL,
	`status` enum('geplant','in_arbeit','abgeschlossen','storniert') NOT NULL DEFAULT 'geplant',
	`lagerortId` int,
	`erstelltVon` int,
	`abgeschlossenVon` int,
	`abgeschlossenAm` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventuren_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventurpositionen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventurId` int NOT NULL,
	`artikelId` int NOT NULL,
	`lagerortId` int NOT NULL,
	`sollMenge` decimal(15,2) NOT NULL,
	`istMenge` decimal(15,2),
	`differenz` decimal(15,2),
	`gezaehltVon` int,
	`gezaehltAm` timestamp,
	`kommentar` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventurpositionen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lagerbestaende` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artikelId` int NOT NULL,
	`lagerortId` int NOT NULL,
	`menge` decimal(15,2) NOT NULL DEFAULT '0.00',
	`reservierteMenge` decimal(15,2) DEFAULT '0.00',
	`letzteBewegung` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lagerbestaende_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lagerorte` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`beschreibung` text,
	`adresse` varchar(500),
	`istHauptlager` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lagerorte_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artikel` ADD CONSTRAINT `artikel_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `artikel` ADD CONSTRAINT `artikel_lieferantId_kreditoren_id_fk` FOREIGN KEY (`lieferantId`) REFERENCES `kreditoren`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `artikel` ADD CONSTRAINT `artikel_sachkontoId_sachkonten_id_fk` FOREIGN KEY (`sachkontoId`) REFERENCES `sachkonten`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bestandsbewegungen` ADD CONSTRAINT `bestandsbewegungen_artikelId_artikel_id_fk` FOREIGN KEY (`artikelId`) REFERENCES `artikel`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bestandsbewegungen` ADD CONSTRAINT `bestandsbewegungen_lagerortId_lagerorte_id_fk` FOREIGN KEY (`lagerortId`) REFERENCES `lagerorte`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bestandsbewegungen` ADD CONSTRAINT `bestandsbewegungen_buchungId_buchungen_id_fk` FOREIGN KEY (`buchungId`) REFERENCES `buchungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bestandsbewegungen` ADD CONSTRAINT `bestandsbewegungen_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventuren` ADD CONSTRAINT `inventuren_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventuren` ADD CONSTRAINT `inventuren_lagerortId_lagerorte_id_fk` FOREIGN KEY (`lagerortId`) REFERENCES `lagerorte`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventuren` ADD CONSTRAINT `inventuren_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventuren` ADD CONSTRAINT `inventuren_abgeschlossenVon_users_id_fk` FOREIGN KEY (`abgeschlossenVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventurpositionen` ADD CONSTRAINT `inventurpositionen_inventurId_inventuren_id_fk` FOREIGN KEY (`inventurId`) REFERENCES `inventuren`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventurpositionen` ADD CONSTRAINT `inventurpositionen_artikelId_artikel_id_fk` FOREIGN KEY (`artikelId`) REFERENCES `artikel`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventurpositionen` ADD CONSTRAINT `inventurpositionen_lagerortId_lagerorte_id_fk` FOREIGN KEY (`lagerortId`) REFERENCES `lagerorte`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventurpositionen` ADD CONSTRAINT `inventurpositionen_gezaehltVon_users_id_fk` FOREIGN KEY (`gezaehltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lagerbestaende` ADD CONSTRAINT `lagerbestaende_artikelId_artikel_id_fk` FOREIGN KEY (`artikelId`) REFERENCES `artikel`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lagerbestaende` ADD CONSTRAINT `lagerbestaende_lagerortId_lagerorte_id_fk` FOREIGN KEY (`lagerortId`) REFERENCES `lagerorte`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lagerorte` ADD CONSTRAINT `lagerorte_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;