ALTER TABLE `buchungen` ADD `zahlungsstatus` enum('offen','teilweise_bezahlt','bezahlt','ueberfaellig') DEFAULT 'offen' NOT NULL;--> statement-breakpoint
ALTER TABLE `buchungen` ADD `faelligkeitsdatum` date;--> statement-breakpoint
ALTER TABLE `buchungen` ADD `bezahltAm` date;--> statement-breakpoint
ALTER TABLE `buchungen` ADD `bezahlterBetrag` decimal(15,2);--> statement-breakpoint
ALTER TABLE `buchungen` ADD `zahlungsreferenz` varchar(100);