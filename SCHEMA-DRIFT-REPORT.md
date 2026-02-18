# SCHEMA-DRIFT REPORT
## Buchhaltung-KI.App — Drizzle vs. MySQL
### Generiert: 18.02.2026

---

## EXECUTIVE SUMMARY

| Metrik | Wert |
|--------|------|
| **Tabellen in Drizzle** | 42 |
| **Tabellen in MySQL** | 46 (inkl. 4 undokumentierte) |
| **Tabellen synchron** | 35 |
| **Tabellen mit Schema-Drift** | 1 (auszuege) |
| **Tabellen fehlen komplett** | 6 |
| **Zusätzliche MySQL-Tabellen** | 4 |

**Gesamtstatus:** 🔴 **KRITISCH** — 6 Features sind unbenutzbar durch fehlende Tabellen

---

## 🔴 KRITISCH: FEHLENDE TABELLEN IN MYSQL

Diese Tabellen sind in Drizzle definiert, existieren aber **NICHT** in der Produktions-Datenbank:

### 1. finanzierungen (Zeile 1466-1520)
**Impact:** Finanzierungs-Modul komplett unbenutzbar
**Feature-Status:** ❌ KAPUTT
**Backend-Code:** Vermutlich bereits implementiert, crasht bei DB-Zugriff

**Spalten:** 32
- id, unternehmenId, typ, vertragsnummer, bezeichnung, beschreibung
- kreditgeber, kreditgeberKontonummer
- objektBezeichnung, objektWert
- gesamtbetrag, restschuld, zinssatz
- vertragsBeginn, vertragsEnde
- ratenBetrag, ratenTyp, ratenTag
- anzahlung, schlussrate
- aufwandskonto, verbindlichkeitskonto, zinsaufwandskonto
- status, vertragsDokumentUrl, notizen
- createdBy, createdAt, updatedAt

### 2. finanzierung_zahlungen (Zeile 1528-1546)
**Impact:** Zahlungsplan für Finanzierungen nicht speicherbar
**Feature-Status:** ❌ KAPUTT

**Spalten:** 9
- id, finanzierungId, faelligkeit, betrag
- zinsenAnteil, tilgungAnteil
- status, bezahltAm, buchungId, createdAt

### 3. finanzierung_dokumente (Zeile 1554-1567)
**Impact:** Finanzierungsverträge können nicht hochgeladen werden
**Feature-Status:** ❌ KAPUTT

**Spalten:** 8
- id, finanzierungId, dateiUrl, dateiName
- dateityp, dateiGroesse, beschreibung
- createdAt, createdBy

### 4. buchungsvorschlaege (Zeile 1575-1609)
**Impact:** KI-Buchungsvorschläge können nicht gespeichert werden
**Feature-Status:** ❌ KAPUTT — **Kernfeature der App!**

**Spalten:** 19
- id, unternehmenId, belegUrl
- lieferant, kreditorId, rechnungsnummer
- belegdatum, betragBrutto, betragNetto
- ustBetrag, ustSatz, zahlungsziel, iban
- sollKonto, habenKonto, buchungstext, geschaeftspartnerKonto
- confidence, aiNotizen, status, buchungId
- createdAt, bearbeitetVon, bearbeitetAm

### 5. dropbox_connections (Zeile 1617-1649)
**Impact:** Dropbox-Integration nicht nutzbar
**Feature-Status:** ❌ KAPUTT

**Spalten:** 18
- id, unternehmenId
- accessToken, refreshToken, expiresAt
- accountId, accountEmail
- watchFolder, autoCreateVorschlaege
- lastSync, lastCursor, syncStatus, syncFehler
- dateienGesamt, dateienNeu, letzterFehler
- aktiv, createdAt, updatedAt, createdBy

### 6. dropbox_sync_log (Zeile 1657-1673)
**Impact:** Dropbox-Sync-Historie fehlt
**Feature-Status:** ❌ KAPUTT

**Spalten:** 11
- id, connectionId, dropboxPath, dropboxFileId
- fileName, fileSize, belegUrl, vorschlagId
- status, fehlerMeldung, syncedAt

---

## ⚠️ SCHEMA-DRIFT: auszuege Tabelle

**Status:** Tabelle existiert, aber **4 Spalten-Konflikte**

| Spalte | Drizzle | MySQL | Problem |
|--------|---------|-------|---------|
| dateiUrl | varchar(512) NOT NULL | text NOT NULL | 🔴 Typ-Konflikt |
| status | enum(...) NOT NULL DEFAULT 'neu' | enum(...) **NULLABLE** DEFAULT 'neu' | 🔴 Nullable-Konflikt |
| createdAt | timestamp NOT NULL DEFAULT NOW | timestamp **NULLABLE** DEFAULT NOW | 🔴 Nullable-Konflikt |
| updatedAt | timestamp NOT NULL DEFAULT NOW | timestamp **NULLABLE** DEFAULT NOW | 🔴 Nullable-Konflikt |
| erstelltVon | int FK → users.id | varchar(255) NOT NULL | 🔴 **KRITISCHER TYP-KONFLIKT** |

**Impact:**
- `erstelltVon` varchar statt int verhindert korrekte Foreign Key Beziehung
- Nullable-Unterschiede können zu unerwartetem NULL-Verhalten führen
- dateiUrl text statt varchar(512) ist technisch OK, aber inkonsistent

---

## ℹ️ ZUSÄTZLICHE TABELLEN IN MYSQL (nicht in Drizzle)

Diese 4 Tabellen existieren in MySQL, sind aber **NICHT** in drizzle/schema.ts definiert:

| Tabelle | Verdacht |
|---------|----------|
| broker_accounts | Legacy? Alte Implementierung? |
| checked_duplicates | Legacy? Alte Duplikats-Prüfung? |
| credit_cards | Legacy? Vor Finanzkonten-Refactoring? |
| payment_providers | Legacy? Alte Zahlungsanbieter? |

**Empfehlung:** Dateninhalt prüfen. Falls leer oder veraltet → Tabellen löschen. Falls in Verwendung → Schema.ts erweitern.

---

## 🛠️ FIX-VORSCHLÄGE

### ⛔ NICHT AUSFÜHREN OHNE FREIGABE!

### Fix 1: Fehlende Tabellen erstellen

```sql
-- 1. Finanzierungen
CREATE TABLE finanzierungen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unternehmenId INT NOT NULL,
  typ ENUM('kredit', 'leasing', 'mietkauf', 'factoring') NOT NULL,
  vertragsnummer VARCHAR(100),
  bezeichnung VARCHAR(255) NOT NULL,
  beschreibung TEXT,
  kreditgeber VARCHAR(255) NOT NULL,
  kreditgeberKontonummer VARCHAR(20),
  objektBezeichnung VARCHAR(255),
  objektWert DECIMAL(15,2),
  gesamtbetrag DECIMAL(15,2) NOT NULL,
  restschuld DECIMAL(15,2),
  zinssatz DECIMAL(5,3),
  vertragsBeginn DATE NOT NULL,
  vertragsEnde DATE NOT NULL,
  ratenBetrag DECIMAL(15,2) NOT NULL,
  ratenTyp ENUM('monatlich', 'quartal', 'halbjaehrlich', 'jaehrlich') NOT NULL DEFAULT 'monatlich',
  ratenTag INT DEFAULT 1,
  anzahlung DECIMAL(15,2) DEFAULT 0,
  schlussrate DECIMAL(15,2) DEFAULT 0,
  aufwandskonto VARCHAR(20),
  verbindlichkeitskonto VARCHAR(20),
  zinsaufwandskonto VARCHAR(20),
  status ENUM('aktiv', 'abgeschlossen', 'gekuendigt') NOT NULL DEFAULT 'aktiv',
  vertragsDokumentUrl TEXT,
  notizen TEXT,
  createdBy VARCHAR(255),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unternehmenId) REFERENCES unternehmen(id)
);

-- 2. Finanzierung Zahlungen
CREATE TABLE finanzierung_zahlungen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  finanzierungId INT NOT NULL,
  faelligkeit DATE NOT NULL,
  betrag DECIMAL(15,2) NOT NULL,
  zinsenAnteil DECIMAL(15,2),
  tilgungAnteil DECIMAL(15,2),
  status ENUM('offen', 'bezahlt', 'ueberfaellig') NOT NULL DEFAULT 'offen',
  bezahltAm DATE,
  buchungId INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (finanzierungId) REFERENCES finanzierungen(id),
  FOREIGN KEY (buchungId) REFERENCES buchungen(id)
);

-- 3. Finanzierung Dokumente
CREATE TABLE finanzierung_dokumente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  finanzierungId INT NOT NULL,
  dateiUrl VARCHAR(512) NOT NULL,
  dateiName VARCHAR(255) NOT NULL,
  dateityp VARCHAR(50),
  dateiGroesse INT,
  beschreibung TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdBy VARCHAR(255),
  FOREIGN KEY (finanzierungId) REFERENCES finanzierungen(id)
);

-- 4. Buchungsvorschläge (KRITISCH!)
CREATE TABLE buchungsvorschlaege (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unternehmenId INT NOT NULL,
  belegUrl VARCHAR(512),
  lieferant VARCHAR(255),
  kreditorId INT,
  rechnungsnummer VARCHAR(100),
  belegdatum DATE,
  betragBrutto DECIMAL(15,2),
  betragNetto DECIMAL(15,2),
  ustBetrag DECIMAL(15,2),
  ustSatz DECIMAL(5,2),
  zahlungsziel INT,
  iban VARCHAR(34),
  sollKonto VARCHAR(20),
  habenKonto VARCHAR(20),
  buchungstext VARCHAR(255),
  geschaeftspartnerKonto VARCHAR(20),
  confidence DECIMAL(3,2),
  aiNotizen TEXT,
  status ENUM('vorschlag', 'akzeptiert', 'abgelehnt', 'bearbeitet') NOT NULL DEFAULT 'vorschlag',
  buchungId INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bearbeitetVon INT,
  bearbeitetAm TIMESTAMP,
  FOREIGN KEY (unternehmenId) REFERENCES unternehmen(id),
  FOREIGN KEY (kreditorId) REFERENCES kreditoren(id),
  FOREIGN KEY (buchungId) REFERENCES buchungen(id),
  FOREIGN KEY (bearbeitetVon) REFERENCES users(id)
);

-- 5. Dropbox Connections
CREATE TABLE dropbox_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unternehmenId INT NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT,
  expiresAt TIMESTAMP,
  accountId VARCHAR(100),
  accountEmail VARCHAR(255),
  watchFolder VARCHAR(500) NOT NULL,
  autoCreateVorschlaege BOOLEAN NOT NULL DEFAULT TRUE,
  lastSync TIMESTAMP,
  lastCursor TEXT,
  syncStatus ENUM('aktiv', 'fehler', 'pausiert') NOT NULL DEFAULT 'aktiv',
  syncFehler TEXT,
  dateienGesamt INT DEFAULT 0,
  dateienNeu INT DEFAULT 0,
  letzterFehler TIMESTAMP,
  aktiv BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy INT,
  FOREIGN KEY (unternehmenId) REFERENCES unternehmen(id),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- 6. Dropbox Sync Log
CREATE TABLE dropbox_sync_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  connectionId INT NOT NULL,
  dropboxPath VARCHAR(500) NOT NULL,
  dropboxFileId VARCHAR(100),
  fileName VARCHAR(255) NOT NULL,
  fileSize INT,
  belegUrl VARCHAR(512),
  vorschlagId INT,
  status ENUM('sync', 'uploaded', 'analyzed', 'fehler') NOT NULL DEFAULT 'sync',
  fehlerMeldung TEXT,
  syncedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connectionId) REFERENCES dropbox_connections(id),
  FOREIGN KEY (vorschlagId) REFERENCES buchungsvorschlaege(id)
);
```

### Fix 2: auszuege Tabelle korrigieren

```sql
-- WARNUNG: Ändert bestehende Daten!
-- Zuerst Backup machen: mysqldump railway auszuege > auszuege_backup.sql

-- erstelltVon von varchar zu int ändern (BREAKING CHANGE!)
-- Zunächst alle nicht-numerischen Werte auf NULL setzen:
UPDATE auszuege SET erstelltVon = NULL WHERE erstelltVon NOT REGEXP '^[0-9]+$';

-- Dann Typ ändern:
ALTER TABLE auszuege MODIFY COLUMN erstelltVon INT;

-- Foreign Key hinzufügen:
ALTER TABLE auszuege ADD CONSTRAINT fk_auszuege_erstelltVon
  FOREIGN KEY (erstelltVon) REFERENCES users(id);

-- Nullable-Status korrigieren:
ALTER TABLE auszuege MODIFY COLUMN status ENUM('neu','in_bearbeitung','abgeschlossen') NOT NULL DEFAULT 'neu';
ALTER TABLE auszuege MODIFY COLUMN createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE auszuege MODIFY COLUMN updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- dateiUrl zu varchar(512) ändern (optional, nur für Konsistenz):
-- WARNUNG: Schlägt fehl wenn Einträge > 512 Zeichen existieren!
ALTER TABLE auszuege MODIFY COLUMN dateiUrl VARCHAR(512) NOT NULL;
```

---

## 📊 RISIKOANALYSE

### KRITISCH (Sofort beheben)
1. **buchungsvorschlaege fehlt** → KI-Feature unbenutzbar, Kernfunktion kaputt
2. **finanzierungen fehlt** → Finanzierungs-Modul unbenutzbar, vermutlich crasht die App beim Zugriff

### HOCH (Diese Woche beheben)
3. **auszuege.erstelltVon** → Falscher Datentyp verhindert User-Zuordnung
4. **dropbox_* fehlen** → Dropbox-Integration unbenutzbar

### MITTEL (Dokumentieren)
5. **Legacy-Tabellen** → broker_accounts, checked_duplicates, credit_cards, payment_providers prüfen

---

## 🎯 EMPFOHLENE VORGEHENSWEISE

### Phase 1: Datensicherung (SOFORT)
```bash
# Vollständiges DB-Backup vor allen Änderungen
mysqldump -h metro.proxy.rlwy.net -P 55757 -u root -p railway > backup_vor_schema_fix.sql
```

### Phase 2: Kritische Tabellen erstellen (PRIO 1)
1. `buchungsvorschlaege` anlegen → KI-Feature funktionsfähig machen
2. `finanzierungen` + `finanzierung_zahlungen` + `finanzierung_dokumente` anlegen
3. App-Test: Finanzierungs-Modul aufrufen, prüfen ob Crashes behoben

### Phase 3: Schema-Drift beheben (PRIO 2)
1. `auszuege.erstelltVon` Daten migrieren (varchar → int)
2. Foreign Key hinzufügen
3. Nullable-Status korrigieren
4. Test: Auszug-Upload mit User-Zuordnung

### Phase 4: Dropbox-Integration (PRIO 3)
1. `dropbox_connections` + `dropbox_sync_log` anlegen
2. Test: Dropbox-Verbindung herstellen

### Phase 5: Cleanup (PRIO 4)
1. Legacy-Tabellen analysieren
2. Falls leer/ungenutzt: DROP TABLE
3. Falls in Verwendung: Schema.ts erweitern

---

## 📝 LESSONS LEARNED

1. **Fehlende Migration-Workflow**
   → Drizzle-Schema-Änderungen wurden nicht nach MySQL übertragen
   → Empfehlung: `drizzle-kit push` in Deployment-Pipeline integrieren

2. **Keine Schema-Validierung**
   → Production-DB kann von Schema.ts abweichen ohne dass es auffällt
   → Empfehlung: Wöchentlicher Schema-Drift-Check via Cron-Job

3. **Fehlende CREATE TABLE Migrations**
   → Tabellen fehlen komplett, Features crashen still
   → Empfehlung: Backend-Startup-Check: `DESCRIBE [table]` für alle kritischen Tabellen

4. **Inkonsistente Typ-Konventionen**
   → erstelltVon: mal int, mal varchar
   → Empfehlung: Style Guide für Schema-Definitionen erstellen

---

## ✅ NÄCHSTE SCHRITTE

1. ✅ Schema-Drift-Analyse abgeschlossen
2. ⬜ **Freigabe vom User einholen für Fixes**
3. ⬜ DB-Backup erstellen
4. ⬜ CREATE TABLE Statements ausführen
5. ⬜ ALTER TABLE für auszuege ausführen
6. ⬜ Features testen (Finanzierungen, Buchungsvorschläge, Auszüge)
7. ⬜ TECHNICAL_STATUS.md aktualisieren
8. ⬜ Drizzle Migration-Workflow einrichten

---

**Erstellt von:** Claude Sonnet 4.5
**Datum:** 18.02.2026
**Basis:** drizzle/schema.ts + MySQL DESCRIBE für alle 42+4 Tabellen
