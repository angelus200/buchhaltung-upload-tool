ALTER TABLE `unternehmen` MODIFY COLUMN `kontenrahmen` enum('SKR03','SKR04','OeKR','RLG','KMU','OR','UK_GAAP','IFRS','CY_GAAP') NOT NULL DEFAULT 'SKR03';--> statement-breakpoint
ALTER TABLE `unternehmen` ADD `landCode` enum('DE','AT','CH','UK','CY') DEFAULT 'DE' NOT NULL;--> statement-breakpoint
ALTER TABLE `unternehmen` ADD `waehrung` enum('EUR','CHF','GBP') DEFAULT 'EUR' NOT NULL;