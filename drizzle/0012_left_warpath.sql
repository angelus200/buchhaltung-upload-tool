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
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_zugewiesenAn_users_id_fk` FOREIGN KEY (`zugewiesenAn`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_finanzamtDokumentId_finanzamt_dokumente_id_fk` FOREIGN KEY (`finanzamtDokumentId`) REFERENCES `finanzamt_dokumente`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aufgaben` ADD CONSTRAINT `aufgaben_erledigtVon_users_id_fk` FOREIGN KEY (`erledigtVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finanzamt_dokumente` ADD CONSTRAINT `finanzamt_dokumente_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finanzamt_dokumente` ADD CONSTRAINT `finanzamt_dokumente_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;