CREATE TABLE `fa_dok_versionen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dokumentId` int NOT NULL,
	`version` int NOT NULL,
	`versionTyp` enum('original','einspruch','antwort','ergaenzung','korrektur','anlage') NOT NULL DEFAULT 'original',
	`betreff` varchar(500),
	`beschreibung` text,
	`datum` date NOT NULL,
	`dateiUrl` text,
	`dateiName` varchar(255),
	`erstelltVon` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fa_dok_versionen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `finanzamt_dokument_versionen`;--> statement-breakpoint
ALTER TABLE `fa_dok_versionen` ADD CONSTRAINT `fa_dok_versionen_dokumentId_finanzamt_dokumente_id_fk` FOREIGN KEY (`dokumentId`) REFERENCES `finanzamt_dokumente`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fa_dok_versionen` ADD CONSTRAINT `fa_dok_versionen_erstelltVon_users_id_fk` FOREIGN KEY (`erstelltVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;