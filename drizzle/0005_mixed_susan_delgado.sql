CREATE TABLE `finanzkonten` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`sachkontoId` int,
	`typ` enum('bank','kreditkarte','broker','kasse','paypal','stripe','sonstiges') NOT NULL,
	`name` varchar(255) NOT NULL,
	`kontonummer` varchar(50),
	`iban` varchar(34),
	`bic` varchar(11),
	`bankName` varchar(255),
	`kreditkartenNummer` varchar(20),
	`kreditlimit` decimal(15,2),
	`abrechnungstag` int,
	`depotNummer` varchar(50),
	`brokerName` varchar(255),
	`email` varchar(255),
	`waehrung` varchar(3) DEFAULT 'EUR',
	`aktiv` boolean DEFAULT true,
	`notizen` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finanzkonten_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `finanzkonten` ADD CONSTRAINT `finanzkonten_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finanzkonten` ADD CONSTRAINT `finanzkonten_sachkontoId_sachkonten_id_fk` FOREIGN KEY (`sachkontoId`) REFERENCES `sachkonten`(`id`) ON DELETE no action ON UPDATE no action;