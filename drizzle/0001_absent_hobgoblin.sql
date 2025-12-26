CREATE TABLE `anlagevermoegen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`kategorie` varchar(100),
	`anschaffungsdatum` date,
	`anschaffungskosten` decimal(15,2),
	`nutzungsdauer` int,
	`abschreibungsmethode` enum('linear','degressiv','keine') DEFAULT 'linear',
	`restwert` decimal(15,2),
	`standort` varchar(255),
	`inventarnummer` varchar(50),
	`seriennummer` varchar(100),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anlagevermoegen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bankkonten` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`bankname` varchar(255),
	`iban` varchar(34),
	`bic` varchar(11),
	`kontotyp` enum('girokonto','sparkonto','festgeld','kreditkarte','sonstig') DEFAULT 'girokonto',
	`waehrung` varchar(3) DEFAULT 'EUR',
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankkonten_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beteiligungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`rechtsform` varchar(100),
	`anteil` decimal(5,2),
	`buchwert` decimal(15,2),
	`erwerbsdatum` date,
	`sitz` varchar(255),
	`handelsregister` varchar(100),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `beteiligungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buchungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`buchungsart` enum('aufwand','ertrag','anlage','sonstig') NOT NULL,
	`belegdatum` date NOT NULL,
	`belegnummer` varchar(50) NOT NULL,
	`geschaeftspartnerTyp` enum('kreditor','debitor','gesellschafter','sonstig') NOT NULL,
	`geschaeftspartner` varchar(255) NOT NULL,
	`geschaeftspartnerKonto` varchar(20) NOT NULL,
	`sachkonto` varchar(20) NOT NULL,
	`kostenstelleId` int,
	`nettobetrag` decimal(15,2) NOT NULL,
	`steuersatz` decimal(5,2) NOT NULL,
	`bruttobetrag` decimal(15,2) NOT NULL,
	`buchungstext` text,
	`belegUrl` varchar(500),
	`status` enum('entwurf','geprueft','exportiert') NOT NULL DEFAULT 'entwurf',
	`exportiertAm` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buchungen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debitoren` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`kurzbezeichnung` varchar(50),
	`strasse` varchar(255),
	`plz` varchar(10),
	`ort` varchar(100),
	`land` varchar(100),
	`telefon` varchar(50),
	`email` varchar(320),
	`ustIdNr` varchar(50),
	`kreditlimit` decimal(15,2),
	`zahlungsziel` int DEFAULT 14,
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debitoren_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gesellschafter` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`typ` enum('natuerlich','juristisch') DEFAULT 'natuerlich',
	`anteil` decimal(5,2),
	`einlage` decimal(15,2),
	`eintrittsdatum` date,
	`strasse` varchar(255),
	`plz` varchar(10),
	`ort` varchar(100),
	`steuerId` varchar(50),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gesellschafter_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kostenstellen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`nummer` varchar(20) NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`verantwortlicher` varchar(255),
	`budget` decimal(15,2),
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kostenstellen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kreditoren` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`kontonummer` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`kurzbezeichnung` varchar(50),
	`strasse` varchar(255),
	`plz` varchar(10),
	`ort` varchar(100),
	`land` varchar(100),
	`telefon` varchar(50),
	`email` varchar(320),
	`ustIdNr` varchar(50),
	`steuernummer` varchar(50),
	`iban` varchar(34),
	`bic` varchar(11),
	`zahlungsziel` int DEFAULT 30,
	`skonto` decimal(5,2),
	`skontofrist` int,
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kreditoren_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notizen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`titel` varchar(255) NOT NULL,
	`kategorie` enum('vertrag','kreditor','debitor','buchung','allgemein') DEFAULT 'allgemein',
	`bezug` varchar(255),
	`inhalt` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notizen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unternehmen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`rechtsform` varchar(100),
	`steuernummer` varchar(50),
	`ustIdNr` varchar(50),
	`handelsregister` varchar(100),
	`strasse` varchar(255),
	`plz` varchar(10),
	`ort` varchar(100),
	`land` varchar(100) DEFAULT 'Deutschland',
	`telefon` varchar(50),
	`email` varchar(320),
	`website` varchar(255),
	`kontenrahmen` enum('SKR03','SKR04') NOT NULL DEFAULT 'SKR03',
	`wirtschaftsjahrBeginn` int NOT NULL DEFAULT 1,
	`beraternummer` varchar(20),
	`mandantennummer` varchar(20),
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unternehmen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_unternehmen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`unternehmenId` int NOT NULL,
	`rolle` enum('admin','buchhalter','viewer') NOT NULL DEFAULT 'buchhalter',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_unternehmen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vertraege` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`bezeichnung` varchar(255) NOT NULL,
	`vertragsart` enum('miete','leasing','wartung','versicherung','abo','sonstig') DEFAULT 'sonstig',
	`vertragspartner` varchar(255),
	`vertragsnummer` varchar(100),
	`beginn` date,
	`ende` date,
	`kuendigungsfrist` varchar(100),
	`monatlicheBetrag` decimal(15,2),
	`zahlungsrhythmus` enum('monatlich','quartalsweise','halbjaehrlich','jaehrlich') DEFAULT 'monatlich',
	`buchungskonto` varchar(20),
	`kostenstelleId` int,
	`notizen` text,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vertraege_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `anlagevermoegen` ADD CONSTRAINT `anlagevermoegen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bankkonten` ADD CONSTRAINT `bankkonten_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beteiligungen` ADD CONSTRAINT `beteiligungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungen` ADD CONSTRAINT `buchungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungen` ADD CONSTRAINT `buchungen_kostenstelleId_kostenstellen_id_fk` FOREIGN KEY (`kostenstelleId`) REFERENCES `kostenstellen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buchungen` ADD CONSTRAINT `buchungen_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debitoren` ADD CONSTRAINT `debitoren_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gesellschafter` ADD CONSTRAINT `gesellschafter_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kostenstellen` ADD CONSTRAINT `kostenstellen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kreditoren` ADD CONSTRAINT `kreditoren_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notizen` ADD CONSTRAINT `notizen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notizen` ADD CONSTRAINT `notizen_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unternehmen` ADD CONSTRAINT `unternehmen_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD CONSTRAINT `user_unternehmen_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD CONSTRAINT `user_unternehmen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vertraege` ADD CONSTRAINT `vertraege_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vertraege` ADD CONSTRAINT `vertraege_kostenstelleId_kostenstellen_id_fk` FOREIGN KEY (`kostenstelleId`) REFERENCES `kostenstellen`(`id`) ON DELETE no action ON UPDATE no action;