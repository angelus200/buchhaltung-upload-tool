CREATE TABLE `onboarding_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`clerkUserId` varchar(255),
	`packageType` enum('basis','komplett','enterprise','schulung_einzel','schulung_team','schulung_intensiv') NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`status` enum('paid','pending','refunded') NOT NULL DEFAULT 'pending',
	`amount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onboarding_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clerkUserId` varchar(255),
	`stripeCustomerId` varchar(255) NOT NULL,
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`plan` enum('starter','business','enterprise') NOT NULL,
	`status` enum('active','canceled','past_due','trialing','incomplete') NOT NULL DEFAULT 'incomplete',
	`currentPeriodEnd` timestamp,
	`email` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `stb_rech_pos` MODIFY COLUMN `kategorie` enum('jahresabschluss','steuererklaerung','buchhaltung','lohnabrechnung','beratung','finanzamt','pruefung','kapitalertragsteuer','oss_eu','sonstig') NOT NULL DEFAULT 'sonstig';