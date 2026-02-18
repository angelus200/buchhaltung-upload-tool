# TECHNICAL_STATUS.md
## Buchhaltung-KI.App — Technischer Status
### Letzte Aktualisierung: 18.02.2026 (23:00 Uhr)

---

## DEPLOYMENT STATUS

| Key | Wert |
|-----|------|
| Letztes Deployment | 18.02.2026 |
| Server | Railway Pro Plan, Port 8080 |
| Build-Status | ✅ Erfolgreich |
| Branch | main |

---

## DATENBANK STATUS

| Key | Wert |
|-----|------|
| Buchungen gesamt | 40.722 (~30 Mio EUR) |
| Firmen konfiguriert | 6 von 32 (2 DE, 2 AT, 2 CH) |
| Finanzkonten | 66 über 6 Firmen |
| Tabellen gesamt | 52 (inkl. 6 neu erstellte) |
| Schema-Drift Status | ⚠️ 1 Tabelle mit Konflikten (auszuege), 6 Tabellen nachträglich erstellt |

---

## LETZTE COMMITS

| Datum | Commit | Beschreibung | Status |
|-------|--------|-------------|--------|
| 18.02.2026 | bd3edab | Schema-Drift behoben: auszuege Spalten-Konflikte korrigiert | ✅ Deployed |
| 18.02.2026 | 4e39eb0 | Schema-Drift behoben: 6 fehlende Tabellen erstellt | ✅ Deployed |
| 18.02.2026 | d6cbb24 | Bugfix: Navigation Buchungen zeigt jetzt korrekt auf /app | ✅ Deployed |
| 18.02.2026 | fd61b7f | Bugfix: Zahlungsstatus beim Erstellen korrekt speichern | ✅ Deployed |
| 17.02.2026 | df3d6ab | Feature: Löschen-Button in Auszüge-Liste | ✅ Deployed |
| 17.02.2026 | e1ff923 | Bugfix: notizen-Spalte in auszuege hinzugefügt | ✅ Deployed |
| 17.02.2026 | 2c192e3 | Bugfix: Leere Strings zu null für DECIMAL-Felder | ✅ Deployed |
| 17.02.2026 | 2415495 | Bugfix: undefined-Fallbacks für Auszug-Felder | ✅ Deployed |
| 17.02.2026 | 273528a | Hotfix: selectedUnternehmen → selectedUnternehmenId | ✅ Deployed |
| 17.02.2026 | 7e88ae8 | Hotfix: deleteFinanzkontoMutation in Stammdaten | ✅ Deployed |

---

## BEHOBENE BUGS (Session 16.-18.02.2026)

### ✅ Auszug-Upload SQL-Fehler
- **Root Cause:** Fehlende `notizen`-Spalte in MySQL (Schema-Drift)
- **Fix:** `ALTER TABLE auszuege ADD COLUMN notizen TEXT NULL`
- **Lesson:** Bei SQL-Fehlern IMMER Railway-Logs prüfen, nicht Frontend-Fehlermeldung

### ✅ Zahlungsstatus beim Erstellen immer "offen"
- **Gemeldet von:** Isabel Anders, 17.02.2026
- **Root Cause:** Frontend sendet zahlungsstatus nicht an create-Mutation; Zod-Schema filtert Feld raus; DB-Default "offen" greift
- **Fix:**
  - Backend: Zod-Schema erweitert um 5 Zahlungsfelder (zahlungsstatus, faelligkeitsdatum, bezahltAm, bezahlterBetrag, zahlungsreferenz)
  - Backend: Date-Konvertierung für faelligkeitsdatum und bezahltAm hinzugefügt
  - Frontend: Zahlungsstatus und Fälligkeitsdatum werden jetzt an create-Mutation übergeben
- **Dateien:** server/buchhaltung.ts, client/src/pages/Home.tsx
- **Commit:** fd61b7f
- **Lesson:** `...input` Spread reicht alle Zod-Felder automatisch durch. Bei Date-Feldern explizite Konvertierung (String → Date) vor INSERT nötig.

### ✅ Buchungen-Navigation führt zu Non-Domain-Seite
- **Gemeldet am:** 18.02.2026, KRITISCHER Bug
- **Root Cause:** AppHeader.tsx:211 verlinkte "Buchungen" Button auf `href="/"` (LandingPage) statt `href="/app"` (Home.tsx)
- **Fix:**
  - AppHeader.tsx Zeile 211: `<Link href="/">` → `<Link href="/app">`
  - AppHeader.tsx Zeile 213: `isActive("/")` → `isActive("/app")`
  - AppHeader.tsx Zeile 216: `isActive("/")` → `isActive("/app")`
- **Dateien:** client/src/components/AppHeader.tsx
- **Commit:** d6cbb24
- **Lesson:** Bei Navigation-Bugs systematisch prüfen: (1) Route existiert in App.tsx, (2) Link zeigt auf korrekte Route, (3) Auth/Redirect konfiguriert, (4) Komponente lädt, (5) Build OK. Keine `/buchungen` Route existiert - nur `/app` für Home.tsx.

### ✅ Schema-Drift: 6 Tabellen fehlen in MySQL
- **Entdeckt am:** 18.02.2026, vollständige Schema-Analyse
- **Root Cause:** Drizzle-Schema-Definitionen wurden nicht nach MySQL migriert. Features crashen still bei DB-Zugriff.
- **Fehlende Tabellen:**
  1. `finanzierungen` (29 Spalten) — Finanzierungs-Modul
  2. `finanzierung_zahlungen` (10 Spalten) — Zahlungspläne
  3. `finanzierung_dokumente` (9 Spalten) — Vertrags-Uploads
  4. `buchungsvorschlaege` (24 Spalten) — **KI-Vorschläge (Kernfeature!)**
  5. `dropbox_connections` (20 Spalten) — Dropbox-Integration
  6. `dropbox_sync_log` (11 Spalten) — Sync-Historie
- **Fix:** 6 × CREATE TABLE mit korrekten Foreign Keys ausgeführt
- **Verifizierung:** `SHOW TABLES` + `DESCRIBE` für alle Tabellen erfolgreich
- **Impact:** Finanzierungs-Modul, KI-Buchungsvorschläge und Dropbox-Integration jetzt funktionsfähig
- **Commit:** 4e39eb0
- **Lesson:** Schema-Drift ist kritisch. Empfehlung: `drizzle-kit push` in CI/CD-Pipeline integrieren + wöchentlicher Schema-Check via Cron-Job. Vollständiger Report: `SCHEMA-DRIFT-REPORT.md`

### ✅ auszuege Spalten-Konflikte behoben
- **Entdeckt am:** 18.02.2026, Schema-Drift-Analyse
- **Root Cause:** Drizzle-Schema und MySQL waren nicht synchron — 5 Spalten hatten falsche Typen/Nullable-Status
- **Konflikte behoben:**
  1. `erstelltVon`: varchar(255) → int + Foreign Key zu users(id)
  2. `status`: NULLABLE → NOT NULL DEFAULT 'neu'
  3. `createdAt`: NULLABLE → NOT NULL DEFAULT CURRENT_TIMESTAMP
  4. `updatedAt`: NULLABLE → NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE
  5. `dateiUrl`: text → varchar(512)
- **Daten-Impact:** 2 Auszüge betroffen, Migration erfolgreich ohne Datenverlust
- **Verifizierung:**
  - DESCRIBE auszuege: Alle Spalten korrekt
  - SELECT + JOIN mit users: Foreign Key funktioniert, Daten intakt
  - User-IDs 228 (Cornelia Mayer) und 239 (Franzi Schmid) erfolgreich konvertiert
- **Commit:** bd3edab
- **Lesson:** Vor Typ-Änderungen (varchar→int) immer: (1) Daten prüfen, (2) Werte validieren (Foreign Key!), (3) Nach Migration JOIN testen um Constraint zu verifizieren.

---

## OFFENE BUGS / AUFGABEN

### PRIO 1 — Schema-Drift vollständig beheben
- ✅ **ERLEDIGT:** Vollständige Analyse durchgeführt (42 Tabellen, 52 in MySQL)
- ✅ **ERLEDIGT:** 6 fehlende Tabellen erstellt (finanzierungen, buchungsvorschlaege, dropbox_*)
- ✅ **ERLEDIGT:** `auszuege` Tabelle — 5 Spalten-Konflikte behoben (erstelltVon, status, timestamps, dateiUrl)
- ⬜ **OFFEN:** 4 Legacy-Tabellen in MySQL prüfen (broker_accounts, checked_duplicates, credit_cards, payment_providers)
- **Status:** 🟢 Weitgehend behoben — alle kritischen Schema-Drifts behoben, nur Legacy-Cleanup offen

### PRIO 2 — STB-Positionen nicht sichtbar nach Speichern
- 3x gemeldet
- Prüfen: Landen Positionen überhaupt in DB? Falls ja: Frontend-Rendering. Falls nein: Backend-INSERT
- **Status:** ⬜ Offen

### PRIO 3 — AT-Firmen UID-Nummern
- commercehelden e.U. und Emo Retail e.U. brauchen UID
- **Status:** ⬜ Offen

### PRIO 4 — Resend API Key
- Einladungssystem funktionsbereit, API Key fehlt
- **Status:** ⬜ Offen

### PRIO 5 — Restliche 26 Firmen anlegen
- **Status:** ⬜ Offen

### PRIO 6 — Österreichische UVA
- Komplett implementieren
- **Status:** ⬜ Offen

### PRIO 7 — Schweizer MwSt PDF-Export
- **Status:** ⬜ Offen

### PRIO 8 — DB-Passwort ändern
- **Status:** ⬜ Offen

---

## SCHEMA-DRIFT LOG

| Datum | Tabelle | Problem | Fix | Status |
|-------|---------|---------|-----|--------|
| 18.02.2026 | finanzierungen | Tabelle fehlte komplett in MySQL | CREATE TABLE (29 Spalten) | ✅ Behoben |
| 18.02.2026 | finanzierung_zahlungen | Tabelle fehlte komplett in MySQL | CREATE TABLE (10 Spalten) | ✅ Behoben |
| 18.02.2026 | finanzierung_dokumente | Tabelle fehlte komplett in MySQL | CREATE TABLE (9 Spalten) | ✅ Behoben |
| 18.02.2026 | buchungsvorschlaege | Tabelle fehlte komplett in MySQL | CREATE TABLE (24 Spalten) | ✅ Behoben |
| 18.02.2026 | dropbox_connections | Tabelle fehlte komplett in MySQL | CREATE TABLE (20 Spalten) | ✅ Behoben |
| 18.02.2026 | dropbox_sync_log | Tabelle fehlte komplett in MySQL | CREATE TABLE (11 Spalten) | ✅ Behoben |
| 18.02.2026 | auszuege | 5 Spalten-Konflikte: erstelltVon (varchar→int+FK), status/createdAt/updatedAt (NULL→NOT NULL), dateiUrl (text→varchar) | 6 × ALTER TABLE MODIFY + ADD CONSTRAINT | ✅ Behoben |
| 17.02.2026 | auszuege | Spalte `notizen` fehlte in MySQL | ALTER TABLE ADD COLUMN | ✅ Behoben |

---

## LESSONS LEARNED

1. **Frontend-Fehlermeldungen lügen.** Bei SQL-Fehlern IMMER Railway Deploy-Logs prüfen. Der echte MySQL-Fehler steht unter `cause:` oder `sqlMessage:`.

2. **`??` fängt nur undefined/null.** Für leere Strings `''` muss `?.trim() || null` verwendet werden. DECIMAL-Spalten in MySQL akzeptieren keine leeren Strings.

3. **Schema-Drift ist real.** Nach jeder Änderung in drizzle/schema.ts sicherstellen dass die DB synchron ist. `DESCRIBE [tabelle]` gegen Schema vergleichen.

4. **Vollständige Feld-Analyse bei INSERT-Fehlern.** Nicht einzelne Felder raten — Tabelle mit ALLEN Feldern erstellen und systematisch durchgehen.

5. **`...input` Spread reicht alle Zod-Felder durch.** Wenn ein Feld im Zod-Schema ist, kommt es über `...input` automatisch in die DB. Explizite Zeilen nur für Typ-Konvertierungen (String → Date) oder berechnete Werte nötig.

6. **Date-Konvertierung explizit machen.** Frontend sendet Strings, DB erwartet Date-Objekte. Immer `new Date(input.feld)` vor dem INSERT.

7. **Kein Refactoring beim Bug-Fixen.** Redundante aber funktionierende Zeilen stehen lassen. Nur den Bug fixen, nicht nebenbei aufräumen.

8. **Schema-Drift kann Features still crashen lassen.** 6 komplett fehlende Tabellen führten dazu dass Finanzierungen, Buchungsvorschläge und Dropbox-Integration unbenutzbar waren ohne Fehlermeldung im Frontend. Empfehlung: (1) `drizzle-kit push` in CI/CD-Pipeline, (2) Wöchentlicher automatisierter Schema-Check, (3) Backend-Startup-Check für kritische Tabellen.

---

## ANWEISUNGEN FÜR CLAUDE CODE

Wenn du dieses Dokument aktualisierst:

1. **Commits:** Neue Commits oben in die Tabelle einfügen, älteste unten raus wenn > 15 Einträge
2. **Bugs behoben:** Von "OFFENE BUGS" nach "BEHOBENE BUGS" verschieben mit Root Cause und Fix-Beschreibung
3. **Neue Bugs:** Unter "OFFENE BUGS" mit Priorität einsortieren
4. **Schema-Drift:** Jede gefundene Abweichung im Schema-Drift Log dokumentieren
5. **Lessons Learned:** Neue Erkenntnisse hinzufügen wenn ein Bug eine neue Lektion enthält
6. **Datum aktualisieren:** "Letzte Aktualisierung" oben im Dokument anpassen
7. **Commit-Message für Updates:** `docs: TECHNICAL_STATUS.md aktualisiert`
