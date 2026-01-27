ALTER TABLE `buchungen` ADD `belegWaehrung` varchar(3);--> statement-breakpoint
ALTER TABLE `buchungen` ADD `belegBetragNetto` decimal(15,2);--> statement-breakpoint
ALTER TABLE `buchungen` ADD `belegBetragBrutto` decimal(15,2);--> statement-breakpoint
ALTER TABLE `buchungen` ADD `wechselkurs` decimal(10,6);