CREATE TABLE `finanzierung_dokumente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`finanzierungId` int NOT NULL,
	`dateiUrl` varchar(512) NOT NULL,
	`dateiName` varchar(255) NOT NULL,
	`dateityp` varchar(50),
	`dateiGroesse` int,
	`beschreibung` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` varchar(255),
	CONSTRAINT `finanzierung_dokumente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `finanzierung_dokumente` ADD CONSTRAINT `finanzierung_dokumente_finanzierungId_finanzierungen_id_fk` FOREIGN KEY (`finanzierungId`) REFERENCES `finanzierungen`(`id`) ON DELETE no action ON UPDATE no action;