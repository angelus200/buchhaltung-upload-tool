CREATE TABLE `stb_ueb_pos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uebergabeId` int NOT NULL,
	`buchungId` int,
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
DROP TABLE `stb_uebergabe_positionen`;--> statement-breakpoint
DROP TABLE `steuerberater_uebergaben`;--> statement-breakpoint
ALTER TABLE `stb_ueb_pos` ADD CONSTRAINT `stb_ueb_pos_uebergabeId_stb_uebergaben_id_fk` FOREIGN KEY (`uebergabeId`) REFERENCES `stb_uebergaben`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_ueb_pos` ADD CONSTRAINT `stb_ueb_pos_buchungId_buchungen_id_fk` FOREIGN KEY (`buchungId`) REFERENCES `buchungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_uebergaben` ADD CONSTRAINT `stb_uebergaben_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stb_uebergaben` ADD CONSTRAINT `stb_uebergaben_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;