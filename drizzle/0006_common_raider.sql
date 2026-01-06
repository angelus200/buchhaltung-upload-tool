ALTER TABLE `user_unternehmen` ADD `buchungenLesen` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD `buchungenSchreiben` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD `stammdatenLesen` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD `stammdatenSchreiben` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD `berichteLesen` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD `berichteExportieren` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_unternehmen` ADD `einladungenVerwalten` boolean DEFAULT false NOT NULL;