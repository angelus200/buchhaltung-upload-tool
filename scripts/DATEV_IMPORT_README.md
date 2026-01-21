# DATEV GDPdU Import für Angelus KG

Dieses Script importiert DATEV-Export-Daten (GDPdU-Format) in die Buchhaltungsdatenbank.

## 📋 Voraussetzungen

### 1. Datenbank-Setup
- MySQL-Datenbank mit aktuellem Schema (siehe `drizzle/schema.ts`)
- `DATABASE_URL` in `.env` gesetzt
- Angelus KG als Unternehmen in der DB vorhanden

### 2. DATEV-Export vorbereiten
Die DATEV-Export-Dateien müssen unter folgendem Pfad liegen:
```
~/Downloads/datev-import/
├── Sachkontenstamm.csv
├── DebitorenKreditorenstammdaten.csv
├── buchungssatzprotokoll.csv
├── belege.csv
└── Belege/
    ├── Beleg_*.pdf
    └── ...
```

### 3. Unternehmen anlegen (falls noch nicht vorhanden)

Falls "Angelus Managementberatungs und Service KG" noch nicht in der Datenbank existiert:

```sql
INSERT INTO unternehmen (
  name,
  rechtsform,
  landCode,
  waehrung,
  kontenrahmen,
  wirtschaftsjahrBeginn,
  aktiv
) VALUES (
  'Angelus Managementberatungs und Service KG',
  'KG',
  'DE',
  'EUR',
  'SKR03',
  1,
  true
);
```

## 🚀 Import durchführen

### Schritt 1: DATEV-Daten bereitstellen

Kopiere die DATEV-Export-ZIP-Datei und entpacke sie:

```bash
# ZIP entpacken
unzip ~/Downloads/download_krwe_22593_28245_20260115.zip -d ~/Downloads/datev-import-temp

# Nur 2025-Daten kopieren (aktuellstes Jahr)
mkdir -p ~/Downloads/datev-import
cp -r ~/Downloads/datev-import-temp/download_krwe_22593_28245_20260115/20250101/* ~/Downloads/datev-import/
```

### Schritt 2: Import-Script ausführen

```bash
cd /pfad/zu/buchhaltung-upload-tool

# Import starten
tsx scripts/import-datev-angelus.ts
```

### Schritt 3: Import-Fortschritt beobachten

Das Script gibt detaillierte Fortschrittsinformationen aus:

```
======================================================================
DATEV GDPDU IMPORT - ANGELUS KG
======================================================================
✅ DATEV-Import-Ordner gefunden: /Users/thomasgross/Downloads/datev-import
ℹ️  Verbinde zur Datenbank...
✅ Datenbankverbindung hergestellt
ℹ️  Suche Unternehmen: Angelus Managementberatungs und Service KG...
✅ Unternehmen gefunden: Angelus Managementberatungs und Service KG (ID: 1)

======================================================================
1. SACHKONTEN IMPORTIEREN
======================================================================
ℹ️  Lese Sachkontenstamm.csv...
ℹ️  195 Zeilen eingelesen
ℹ️  Verarbeite 195 Sachkonten...
ℹ️  100 Sachkonten importiert...
✅ Sachkonten-Import abgeschlossen: 195 importiert, 0 übersprungen

======================================================================
2. DEBITOREN/KREDITOREN IMPORTIEREN
======================================================================
...
```

## 📊 Was wird importiert?

### 1. Sachkonten (sachkonten)
- **Quelle:** `Sachkontenstamm.csv`
- **Anzahl:** ~195 Konten
- **Mapping:**
  - Kontonummer → `kontonummer`
  - Beschriftung → `bezeichnung`
  - Kontotyp → abgeleitet aus Kontonummernbereich

### 2. Debitoren/Kreditoren (debitoren, kreditoren)
- **Quelle:** `DebitorenKreditorenstammdaten.csv`
- **Anzahl:** ~137 Geschäftspartner
- **Aufteilung:**
  - Kontonr 10000-69999 → Debitoren
  - Kontonr 70000-99999 → Kreditoren
- **Mapping:**
  - PKKtonr → `kontonummer`
  - Name_Unternehmen → `name`
  - Adressdaten → `strasse`, `plz`, `ort`, `land`
  - EU_UStID → `ustIdNr`
  - IBAN/BIC → `iban`, `bic`

### 3. Buchungen (buchungen)
- **Quelle:** `buchungssatzprotokoll.csv`
- **Anzahl:** ~13.021 Buchungszeilen → ~3.998 Buchungssätze
- **Besonderheit:** Soll/Haben-Zeilen werden zu Buchungssätzen gruppiert
- **Mapping:**
  - Belegnr → `belegnummer`, `datevBelegnummer`
  - Belegdatum → `belegdatum`
  - Buchungstext → `buchungstext`, `datevBuchungstext`
  - Konto/Gegenkonto → `sollKonto`, `habenKonto`
  - Umsätze → `nettobetrag`, `bruttobetrag`

### 4. Belege (belege)
- **Quelle:** `belege.csv`
- **Anzahl:** ~3.998 Belegverweise (davon 986 PDFs + Bilder für 2025)
- **Mapping:**
  - BEDI-ID → `datevBelegId`
  - Dateiname → `dateiName`
  - Pfad → `dateiPfad`
  - Dateigröße → `dateiGroesse` (falls Datei existiert)

## ⚠️ Wichtige Hinweise

### Performance
- **Batch-Inserts:** Das Script verwendet Batch-Inserts (100 Datensätze pro Query) für optimale Performance
- **Dauer:** Ca. 5-15 Sekunden für vollständigen Import (abhängig von DB-Performance)

### Duplikate
- Das Script überspringt automatisch Duplikate (basierend auf `ER_DUP_ENTRY`-Fehler)
- Wiederholte Ausführung ist sicher und updated keine bestehenden Daten

### Import-Tracking
Alle importierten Buchungen erhalten:
- `importQuelle`: `"datev_gdpdu"`
- `importDatum`: Aktueller Zeitstempel
- `importReferenz`: `"DATEV_2025_Q1"`

So können importierte Buchungen später identifiziert und gefiltert werden.

### Vereinfachungen im Buchungs-Import

Das Script verwendet **vereinfachte Logik** für den Buchungs-Import:
- Soll/Haben-Paare werden nach Belegnummer gruppiert
- Steuersatz wird aktuell auf 0 gesetzt (TODO: aus DATEV extrahieren)
- Periode wird auf 1 (Januar) gesetzt (TODO: aus Belegdatum extrahieren)
- Geschäftspartner-Zuordnung basiert auf Kontonummernbereich

Für produktiven Einsatz sollten diese Punkte verbessert werden.

## 🔍 Import-Validierung

Nach dem Import solltest du die Daten prüfen:

```sql
-- Anzahl importierter Datensätze
SELECT 'Sachkonten' as Typ, COUNT(*) as Anzahl
FROM sachkonten WHERE unternehmenId = 1
UNION ALL
SELECT 'Debitoren', COUNT(*) FROM debitoren WHERE unternehmenId = 1
UNION ALL
SELECT 'Kreditoren', COUNT(*) FROM kreditoren WHERE unternehmenId = 1
UNION ALL
SELECT 'Buchungen', COUNT(*) FROM buchungen WHERE unternehmenId = 1
UNION ALL
SELECT 'Belege', COUNT(*) FROM belege WHERE unternehmenId = 1;

-- Import-Quelle prüfen
SELECT importQuelle, importReferenz, COUNT(*) as Anzahl
FROM buchungen
WHERE unternehmenId = 1
GROUP BY importQuelle, importReferenz;

-- Buchungssummen prüfen
SELECT
  buchungsart,
  COUNT(*) as Anzahl,
  SUM(bruttobetrag) as Summe
FROM buchungen
WHERE unternehmenId = 1 AND importQuelle = 'datev_gdpdu'
GROUP BY buchungsart;
```

## 📝 Nächste Schritte

Nach erfolgreichem Import:

1. **Belege verknüpfen:** Verknüpfe Belege mit Buchungen basierend auf `datevBelegId`
2. **Belegdateien kopieren:** Kopiere Belegdateien nach S3 oder lokalen Storage
3. **Steuersätze nachbearbeiten:** Extrahiere korrekte Steuersätze aus DATEV-Daten
4. **Perioden korrigieren:** Berechne Periode aus Belegdatum
5. **Saldenprüfung:** Prüfe ob Soll/Haben-Summen ausgeglichen sind

## 🐛 Fehlerbehandlung

### "DATEV-Import-Ordner nicht gefunden"
→ Prüfe ob `~/Downloads/datev-import/` existiert und die CSV-Dateien enthält

### "Unternehmen nicht gefunden"
→ Lege Angelus KG in der `unternehmen`-Tabelle an (siehe SQL oben)

### "Database connection failed"
→ Prüfe `DATABASE_URL` in `.env`

### "ER_DUP_ENTRY"
→ Normal bei wiederholtem Import, Duplikate werden übersprungen

## 📚 Referenzen

- DATEV GDPdU-Format: https://www.datev.de
- Drizzle ORM: https://orm.drizzle.team/
- MySQL2: https://github.com/sidorares/node-mysql2

---

**Erstellt:** 21.01.2026
**Autor:** Claude Code
**Version:** 1.0
