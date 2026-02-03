-- Migration für Auszüge-System
-- Erstellt die Tabellen 'auszuege' und 'auszug_positionen'
-- Datum: 2026-02-03

CREATE TABLE IF NOT EXISTS `auszuege` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `unternehmenId` INT NOT NULL,
  `typ` ENUM('bankkonto', 'kreditkarte', 'zahlungsdienstleister') NOT NULL,
  `kontoId` INT,
  `kontoBezeichnung` VARCHAR(255),
  `dateiUrl` TEXT NOT NULL,
  `dateiname` VARCHAR(255) NOT NULL,
  `zeitraumVon` DATE NOT NULL,
  `zeitraumBis` DATE NOT NULL,
  `saldoAnfang` DECIMAL(15,2),
  `saldoEnde` DECIMAL(15,2),
  `waehrung` VARCHAR(3) DEFAULT 'EUR',
  `status` ENUM('neu', 'in_bearbeitung', 'abgeschlossen') DEFAULT 'neu',
  `erstelltVon` VARCHAR(255) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`unternehmenId`) REFERENCES `unternehmen`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auszug_positionen` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `auszugId` INT NOT NULL,
  `datum` DATE NOT NULL,
  `buchungstext` TEXT NOT NULL,
  `betrag` DECIMAL(15,2) NOT NULL,
  `saldo` DECIMAL(15,2),
  `referenz` VARCHAR(255),
  `kategorie` VARCHAR(255),
  `zugeordneteBuchungId` INT,
  `status` ENUM('offen', 'zugeordnet', 'ignoriert') DEFAULT 'offen',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`auszugId`) REFERENCES `auszuege`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`zugeordneteBuchungId`) REFERENCES `buchungen`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indizes für bessere Performance
CREATE INDEX `idx_auszuege_unternehmen` ON `auszuege`(`unternehmenId`);
CREATE INDEX `idx_auszuege_status` ON `auszuege`(`status`);
CREATE INDEX `idx_auszuege_zeitraum` ON `auszuege`(`zeitraumVon`, `zeitraumBis`);
CREATE INDEX `idx_positionen_auszug` ON `auszug_positionen`(`auszugId`);
CREATE INDEX `idx_positionen_status` ON `auszug_positionen`(`status`);
CREATE INDEX `idx_positionen_buchung` ON `auszug_positionen`(`zugeordneteBuchungId`);
CREATE INDEX `idx_positionen_datum` ON `auszug_positionen`(`datum`);
