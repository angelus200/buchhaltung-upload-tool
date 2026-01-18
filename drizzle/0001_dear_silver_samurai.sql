CREATE TABLE `buchungsvorlagen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`beschreibung` text,
	`sollKonto` varchar(20) NOT NULL,
	`habenKonto` varchar(20) NOT NULL,
	`betrag` decimal(15,2),
	`buchungstext` varchar(500) NOT NULL,
	`ustSatz` decimal(5,2) NOT NULL DEFAULT '0.00',
	`kategorie` enum('miete','gehalt','versicherung','telefon','internet','energie','fahrzeug','büromaterial','abschreibung','sonstig') NOT NULL DEFAULT 'sonstig',
	`geschaeftspartner` varchar(255),
	`farbe` varchar(20),
	`sortierung` int DEFAULT 0,
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buchungsvorlagen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kontierungsregeln` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`suchbegriff` varchar(255) NOT NULL,
	`sollKonto` varchar(20) NOT NULL,
	`habenKonto` varchar(20) NOT NULL,
	`ustSatz` decimal(5,2) NOT NULL DEFAULT '0.00',
	`prioritaet` int NOT NULL DEFAULT 0,
	`beschreibung` text,
	`geschaeftspartner` varchar(255),
	`verwendungen` int NOT NULL DEFAULT 0,
	`erfolgsrate` decimal(5,2) DEFAULT '100.00',
	`aktiv` boolean NOT NULL DEFAULT true,
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kontierungsregeln_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monatsabschluss` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`jahr` int NOT NULL,
	`monat` int NOT NULL,
	`status` enum('offen','in_arbeit','geprueft','abgeschlossen','korrektur') NOT NULL DEFAULT 'offen',
	`abgeschlossenAm` timestamp,
	`abgeschlossenVon` int,
	`gesperrt` boolean NOT NULL DEFAULT false,
	`notizen` text,
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monatsabschluss_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monatsabschluss_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monatsabschlussId` int NOT NULL,
	`beschreibung` varchar(500) NOT NULL,
	`kategorie` enum('belege','abstimmung','steuer','personal','pruefung','bericht','sonstig') NOT NULL DEFAULT 'sonstig',
	`erledigt` boolean NOT NULL DEFAULT false,
	`erledigtAm` timestamp,
	`erledigtVon` int,
	`pflicht` boolean NOT NULL DEFAULT true,
	`sortierung` int DEFAULT 0,
	`notizen` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monatsabschluss_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `buchungsvorlagen` ADD CONSTRAINT `buchungsvorlagen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungsvorlagen` ADD CONSTRAINT `buchungsvorlagen_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kontierungsregeln` ADD CONSTRAINT `kontierungsregeln_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kontierungsregeln` ADD CONSTRAINT `kontierungsregeln_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monatsabschluss` ADD CONSTRAINT `monatsabschluss_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monatsabschluss` ADD CONSTRAINT `monatsabschluss_abgeschlossenVon_users_id_fk` FOREIGN KEY (`abgeschlossenVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monatsabschluss` ADD CONSTRAINT `monatsabschluss_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monatsabschluss_items` ADD CONSTRAINT `monatsabschluss_items_monatsabschlussId_monatsabschluss_id_fk` FOREIGN KEY (`monatsabschlussId`) REFERENCES `monatsabschluss`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monatsabschluss_items` ADD CONSTRAINT `monatsabschluss_items_erledigtVon_users_id_fk` FOREIGN KEY (`erledigtVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;