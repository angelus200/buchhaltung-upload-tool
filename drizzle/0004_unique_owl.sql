CREATE TABLE `einladungen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`unternehmenId` int NOT NULL,
	`rolle` enum('admin','buchhalter','viewer') NOT NULL DEFAULT 'buchhalter',
	`eingeladenVon` int NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`acceptedBy` int,
	`nachricht` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `einladungen_id` PRIMARY KEY(`id`),
	CONSTRAINT `einladungen_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `einladungen` ADD CONSTRAINT `einladungen_unternehmenId_unternehmen_id_fk` FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `einladungen` ADD CONSTRAINT `einladungen_eingeladenVon_users_id_fk` FOREIGN KEY (`eingeladenVon`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `einladungen` ADD CONSTRAINT `einladungen_acceptedBy_users_id_fk` FOREIGN KEY (`acceptedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;