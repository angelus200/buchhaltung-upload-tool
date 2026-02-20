-- Migration: Kontoinhaber-Feld zu finanzkonten Tabelle hinzufügen
-- Datum: 19.02.2026
-- Bug: #4 - Bankkonto Kontoinhaber nicht speicherbar

-- Spalte hinzufügen (nach bankName)
ALTER TABLE finanzkonten
ADD COLUMN kontoinhaber VARCHAR(255) NULL
AFTER bankName;

-- Verifizierung
DESCRIBE finanzkonten;

-- Beispiel-Check: Zeige alle Bank-Konten mit neuer Spalte
SELECT id, name, bankName, kontoinhaber, iban
FROM finanzkonten
WHERE typ = 'bank'
LIMIT 5;
