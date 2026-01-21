CREATE TABLE `belege` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`buchungId` int,
	`datevBelegId` varchar(100),
	`externeReferenz` varchar(100),
	`dateiName` varchar(255) NOT NULL,
	`dateiPfad` varchar(500),
	`dateiUrl` varchar(500),
	`dateiGroesse` int,
	`dateiTyp` enum('pdf','png','jpg','jpeg','tiff','sonstig') DEFAULT 'pdf',
	`belegdatum` date,
	`beschreibung` text,
	`notizen` text,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belege_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `buchungen` ADD `sollKonto` varchar(20);--> statement-breakpoint
ALTER TABLE `buchungen` ADD `habenKonto` varchar(20);--> statement-breakpoint
ALTER TABLE `buchungen` ADD `datevBelegnummer` varchar(50);--> statement-breakpoint
ALTER TABLE `buchungen` ADD `datevBuchungszeile` int;--> statement-breakpoint
ALTER TABLE `buchungen` ADD `datevBelegId` varchar(100);--> statement-breakpoint
ALTER TABLE `buchungen` ADD `wirtschaftsjahr` int;--> statement-breakpoint
ALTER TABLE `buchungen` ADD `periode` int;--> statement-breakpoint
ALTER TABLE `buchungen` ADD `datevBuchungstext` text;--> statement-breakpoint
ALTER TABLE `buchungen` ADD `importQuelle` enum('manuell','datev_gdpdu','datev_csv','datev_ascii','api');--> statement-breakpoint
ALTER TABLE `buchungen` ADD `importDatum` timestamp;--> statement-breakpoint
ALTER TABLE `buchungen` ADD `importReferenz` varchar(255);--> statement-breakpoint
ALTER TABLE `debitoren` ADD `datevKontonummer` varchar(20);--> statement-breakpoint
ALTER TABLE `kreditoren` ADD `datevKontonummer` varchar(20);--> statement-breakpoint
ALTER TABLE `belege` ADD CONSTRAINT `belege_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `belege` ADD CONSTRAINT `belege_buchungId_buchungen_id_fk` FOREIGN KEY (`buchungId`) REFERENCES `buchungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `belege` ADD CONSTRAINT `belege_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;