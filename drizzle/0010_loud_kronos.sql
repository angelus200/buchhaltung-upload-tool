CREATE TABLE `dropbox_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unternehmenId` int NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`accountId` varchar(100),
	`accountEmail` varchar(255),
	`watchFolder` varchar(500) NOT NULL,
	`autoCreateVorschlaege` boolean DEFAULT true,
	`lastSync` timestamp,
	`lastCursor` text,
	`syncStatus` enum('aktiv','fehler','pausiert') NOT NULL DEFAULT 'aktiv',
	`syncFehler` text,
	`dateienGesamt` int DEFAULT 0,
	`dateienNeu` int DEFAULT 0,
	`letzterFehler` timestamp,
	`aktiv` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `dropbox_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dropbox_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionId` int NOT NULL,
	`dropboxPath` varchar(500) NOT NULL,
	`dropboxFileId` varchar(100),
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`belegUrl` varchar(512),
	`vorschlagId` int,
	`status` enum('sync','uploaded','analyzed','fehler') NOT NULL DEFAULT 'sync',
	`fehlerMeldung` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dropbox_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dropbox_connections` ADD CONSTRAINT `dropbox_connections_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dropbox_connections` ADD CONSTRAINT `dropbox_connections_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dropbox_sync_log` ADD CONSTRAINT `dropbox_sync_log_connectionId_dropbox_connections_id_fk` FOREIGN KEY (`connectionId`) REFERENCES `dropbox_connections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dropbox_sync_log` ADD CONSTRAINT `dropbox_sync_log_vorschlagId_buchungsvorschlaege_id_fk` FOREIGN KEY (`vorschlagId`) REFERENCES `buchungsvorschlaege`(`id`) ON DELETE no action ON UPDATE no action;