CREATE TABLE `sachkonten` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int,
	`kontenrahmen` enum('SKR03','SKR04','OeKR','RLG','KMU','OR','UK_GAAP','IFRS','CY_GAAP') NOT NULL DEFAULT 'SKR04',
	`kontonummer` varchar(20) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`kategorie` varchar(100),
	`kontotyp` enum('aktiv','passiv','aufwand','ertrag','neutral') DEFAULT 'aufwand',
	`standardSteuersatz` decimal(5,2),
	`aktiv` boolean NOT NULL DEFAULT true,
	`notizen` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sachkonten_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sachkonten` ADD CONSTRAINT `sachkonten_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;