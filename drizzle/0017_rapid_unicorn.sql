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
ALTER TABLE `stb_rech_pos` ADD CONSTRAINT `stb_rech_pos_rechnungId_stb_rechnungen_id_fk` FOREIGN KEY (`rechnungId`) REFERENCES `stb_rechnungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_rech_pos` ADD CONSTRAINT `stb_rech_pos_uebergabeId_stb_uebergaben_id_fk` FOREIGN KEY (`uebergabeId`) REFERENCES `stb_uebergaben`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_rechnungen` ADD CONSTRAINT `stb_rechnungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_rechnungen` ADD CONSTRAINT `stb_rechnungen_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;