CREATE TABLE `eroeffnungsbilanz` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`jahr` int NOT NULL,
	`sachkonto` varchar(20) NOT NULL,
	`kontobezeichnung` varchar(255),
	`sollbetrag` decimal(15,2) NOT NULL DEFAULT '0.00',
	`habenbetrag` decimal(15,2) NOT NULL DEFAULT '0.00',
	`importQuelle` enum('manuell','datev','api') DEFAULT 'manuell',
	`importDatum` timestamp,
	`notizen` text,
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eroeffnungsbilanz_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `anlagevermoegen` ADD `sachkonto` varchar(20);--> statement-breakpoint
ALTER TABLE `bankkonten` ADD `sachkonto` varchar(20);--> statement-breakpoint
ALTER TABLE `bankkonten` ADD `anfangsbestand` decimal(15,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `beteiligungen` ADD `sachkonto` varchar(20);--> statement-breakpoint
ALTER TABLE `gesellschafter` ADD `sachkonto` varchar(20);--> statement-breakpoint
ALTER TABLE `eroeffnungsbilanz` ADD CONSTRAINT `eroeffnungsbilanz_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eroeffnungsbilanz` ADD CONSTRAINT `eroeffnungsbilanz_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;