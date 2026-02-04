CREATE TABLE `buchungsvorschlaege` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`belegUrl` varchar(512),
	`lieferant` varchar(255),
	`kreditorId` int,
	`rechnungsnummer` varchar(100),
	`belegdatum` date,
	`betragBrutto` decimal(15,2),
	`betragNetto` decimal(15,2),
	`ustBetrag` decimal(15,2),
	`ustSatz` decimal(5,2),
	`zahlungsziel` int,
	`iban` varchar(34),
	`sollKonto` varchar(20),
	`habenKonto` varchar(20),
	`buchungstext` varchar(255),
	`geschaeftspartnerKonto` varchar(20),
	`confidence` decimal(3,2),
	`aiNotizen` text,
	`status` enum('vorschlag','akzeptiert','abgelehnt','bearbeitet') NOT NULL DEFAULT 'vorschlag',
	`buchungId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`bearbeitetVon` int,
	`bearbeitetAm` timestamp,
	CONSTRAINT `buchungsvorschlaege_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `buchungsvorschlaege` ADD CONSTRAINT `buchungsvorschlaege_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungsvorschlaege` ADD CONSTRAINT `buchungsvorschlaege_kreditorId_kreditoren_id_fk` FOREIGN KEY (`kreditorId`) REFERENCES `kreditoren`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungsvorschlaege` ADD CONSTRAINT `buchungsvorschlaege_buchungId_buchungen_id_fk` FOREIGN KEY (`buchungId`) REFERENCES `buchungen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungsvorschlaege` ADD CONSTRAINT `buchungsvorschlaege_bearbeitetVon_users_id_fk` FOREIGN KEY (`bearbeitetVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;