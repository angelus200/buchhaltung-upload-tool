CREATE TABLE `aktivitaetsprotokoll` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int,
	`userId` int NOT NULL,
	`aktion` enum('buchung_erstellt','buchung_bearbeitet','buchung_geloescht','buchung_exportiert','stammdaten_erstellt','stammdaten_bearbeitet','stammdaten_geloescht','unternehmen_erstellt','unternehmen_bearbeitet','benutzer_hinzugefuegt','benutzer_entfernt','rolle_geaendert','login','logout') NOT NULL,
	`entitaetTyp` varchar(50),
	`entitaetId` int,
	`entitaetName` varchar(255),
	`details` text,
	`ipAdresse` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aktivitaetsprotokoll_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `berechtigungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rollenName` enum('admin','buchhalter','viewer') NOT NULL,
	`bereich` varchar(50) NOT NULL,
	`lesen` boolean NOT NULL DEFAULT true,
	`erstellen` boolean NOT NULL DEFAULT false,
	`bearbeiten` boolean NOT NULL DEFAULT false,
	`loeschen` boolean NOT NULL DEFAULT false,
	`exportieren` boolean NOT NULL DEFAULT false,
	CONSTRAINT `berechtigungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aktivitaetsprotokoll` ADD CONSTRAINT `aktivitaetsprotokoll_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aktivitaetsprotokoll` ADD CONSTRAINT `aktivitaetsprotokoll_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;