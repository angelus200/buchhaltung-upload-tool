# TECHNICAL_STATUS.md
## Buchhaltung-KI.App — Technischer Status
### Letzte Aktualisierung: 18.02.2026

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
| Tabelle auszuege | 17 Spalten (inkl. notizen) |

---

## LETZTE COMMITS

| Datum | Commit | Beschreibung | Status |
|-------|--------|-------------|--------|
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

---

## OFFENE BUGS / AUFGABEN

### PRIO 1 — Schema-Drift prüfen
- DESCRIBE für ALLE Tabellen gegen drizzle/schema.ts vergleichen
- Es könnten weitere fehlende Spalten existieren
- **Status:** ⬜ Offen

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
