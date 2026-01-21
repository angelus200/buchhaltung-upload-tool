# DATEV Import Dokumentation - Angelus KG

**Mandant:** Angelus Managementberatung und Service KG
**Mandantennummer:** 22593 / 28245
**Zeitraum:** 2021 - 2025
**Datenquelle:** `~/Downloads/download_krwe_22593_28245_20260115/`
**Erstellt:** 21.01.2026

---

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Verfügbare Datentypen](#verfügbare-datentypen)
3. [Jahresordner-Details](#jahresordner-details)
4. [Import-Status](#import-status)
5. [CSV-Strukturen](#csv-strukturen)
6. [Import-Empfehlungen](#import-empfehlungen)

---

## Übersicht

### Verfügbare Jahre

| Jahr | Ordner | Dateien | Größe | Vollständigkeit |
|------|--------|---------|-------|----------------|
| 2021 | `20210101/` | 7 CSV + Metadata | ~290 KB | Nur Anlagenvermögen, keine Buchungen |
| 2022 | `20220101/` | 15 CSV + 410 Belege | ~2,4 MB | ✅ Vollständig |
| 2023 | `20230101/` | 15 CSV + 730 Belege | ~6,5 MB | ✅ Vollständig |
| 2024 | `20240101/` | 15 CSV + 616 Belege | ~7,0 MB | ✅ Vollständig |
| 2025 | `20250101/` | 12 CSV + 986 Belege | ~11,6 MB | ✅ Vollständig (bis November) |

**Gesamt:** 64 CSV-Dateien + 2.742 Belegdateien (PDF)

---

## Verfügbare Datentypen

### Stammdaten

| Dateiname | Beschreibung | Verfügbar in Jahren | Zeilen (2022/2023/2024/2025) |
|-----------|--------------|---------------------|------------------------------|
| `mandantendaten.csv` | Unternehmens-Stammdaten | Alle Jahre | 1 / 1 / 1 / 1 |
| `Sachkontenstamm.csv` | SKR04 Kontenplan | 2022-2025 | 50 / 122 / 126 / 195 |
| `DebitorenKreditorenstammdaten.csv` | Kunden & Lieferanten | 2022-2025 | 53 / 117 / 116 / 137 |
| `bereichsuebersicht.csv` | Rechnungslegungszwecke | Alle Jahre | 3 / 3 / 3 / 3 |
| `Index.csv` | Feldbeschreibungen | Alle Jahre | 715 / 715 / 715 / 715 |

### Anlagenvermögen

| Dateiname | Beschreibung | Verfügbar in Jahren | Zeilen (2021/2022/2023/2024) |
|-----------|--------------|---------------------|------------------------------|
| `InventarStamm.csv` | Anlagenstamm | 2021-2024 | 38 / 32 / 42 / 42 |
| `InventarBewegung.csv` | Bewegungsdaten | 2021-2024 | 106 / 68 / 98 / 100 |
| `Inventarentwicklung.csv` | Entwicklung & AfA | 2021-2024 | 38 / 32 / 42 / 42 |
| `AhkAbzugsart.csv` | Abzugsarten | 2021-2024 | 1 / 1 / 1 / 1 |

**⚠️ Hinweis:** 2025 fehlen Anlagevermögen-Dateien (vermutlich weil Jahr noch nicht abgeschlossen)

### Buchungsdaten

| Dateiname | Beschreibung | Verfügbar in Jahren | Zeilen (2022/2023/2024/2025) |
|-----------|--------------|---------------------|------------------------------|
| `kontobuchungen.csv` | Kontobuchungen | 2022-2025 | 1.625 / 7.350 / 7.028 / 13.021 |
| `buchungssatzprotokoll.csv` | Buchungssatz-Detail | 2022-2025 | 1.625 / 7.350 / 7.028 / 13.021 |
| `buchungsstapelliste.csv` | Stapel-Übersicht | 2022-2025 | 12 / 75 / 38 / 69 |
| `belege.csv` | Belegindex | 2022-2025 | 1.192 / 1.962 / 1.957 / 3.998 |
| `mvz.csv` | Bewegungsverzeichnis | 2022-2025 | 206 / 478 / 484 / 660 |
| `Kontennachweis.csv` | Bilanz-Kontennachweis | Alle Jahre | 136 / 270 / 330 / 497 |

### Belege (PDF-Dateien)

| Jahr | Anzahl Belege | Verzeichnis |
|------|---------------|-------------|
| 2022 | 411 PDFs | `20220101/Belege/` |
| 2023 | 731 PDFs | `20230101/Belege/` |
| 2024 | 616 PDFs | `20240101/Belege/` |
| 2025 | 988 PDFs | `20250101/Belege/` |

**Gesamt:** 2.746 Belegdateien

---

## Jahresordner-Details

### 2021 (20210101/)

**Status:** ⚠️ Eingeschränkt - nur Anlagenvermögen, keine Buchungen

| Datei | Größe | Zeilen | Inhalt |
|-------|-------|--------|--------|
| `InventarStamm.csv` | 12.1 KB | 38 | Anlagenstamm mit 37 Anlagen |
| `InventarBewegung.csv` | 12.7 KB | 106 | Bewegungsdaten (Zugang/Abgang) |
| `Inventarentwicklung.csv` | 10.8 KB | 38 | AfA-Entwicklung pro Anlage |
| `Kontennachweis.csv` | 156 B | 2 | Minimale Bilanz-Daten |
| `bereichsuebersicht.csv` | 87 B | 3 | Handelsrecht/Steuerrecht |
| `mandantendaten.csv` | 379 B | 1 | Unternehmensdaten |
| `AhkAbzugsart.csv` | 22 B | 1 | Abzugsart-Definition |
| `Index.csv` | 46.2 KB | 715 | Feldbeschreibungen |

**Fehlende Daten:**
- Keine `kontobuchungen.csv` (keine Buchungen)
- Keine `belege.csv` (keine Belege)
- Keine `Sachkontenstamm.csv`
- Keine `DebitorenKreditorenstammdaten.csv`

---

### 2022 (20220101/) ✅

**Status:** ✅ Vollständig importierbar

| Datei | Größe | Zeilen | Inhalt | Import-Status |
|-------|-------|--------|--------|---------------|
| **Anlagenvermögen** |
| `InventarStamm.csv` | 10.5 KB | 32 | 16 eindeutige Anlagen | ✅ **IMPORTIERT** |
| `InventarBewegung.csv` | 7.1 KB | 68 | Bewegungsdaten | ⏳ Nicht importiert |
| `Inventarentwicklung.csv` | 9.1 KB | 32 | AfA-Entwicklung | ⏳ Nicht importiert |
| **Buchungsdaten** |
| `kontobuchungen.csv` | 421.6 KB | 1.625 | Alle Buchungen | ⏳ Nicht importiert |
| `buchungssatzprotokoll.csv` | 710.4 KB | 1.625 | Detail-Buchungssätze | ⏳ Nicht importiert |
| `buchungsstapelliste.csv` | 1.3 KB | 12 | 12 Buchungsstapel | ⏳ Nicht importiert |
| `belege.csv` | 317.0 KB | 1.192 | 410 Belege | ⏳ Nicht importiert |
| `mvz.csv` | 39.7 KB | 206 | Bewegungsverzeichnis | ⏳ Nicht importiert |
| **Stammdaten** |
| `Sachkontenstamm.csv` | 3.2 KB | 50 | 49 Sachkonten | ⏳ Nicht importiert |
| `DebitorenKreditorenstammdaten.csv` | 11.8 KB | 53 | 52 Geschäftspartner | ⏳ Nicht importiert |
| `Kontennachweis.csv` | 19.5 KB | 136 | Bilanz-Kontennachweis | ⏳ Nicht importiert |
| `mandantendaten.csv` | 389 B | 1 | Angelus KG 2022 | ⏳ Nicht importiert |
| **Metadata** |
| `AhkAbzugsart.csv` | 22 B | 1 | Abzugsart-Info | ⏳ Nicht importiert |
| `bereichsuebersicht.csv` | 87 B | 3 | Bereiche | ⏳ Nicht importiert |
| `Index.csv` | 46.2 KB | 715 | Felddefinitionen | ⏳ Nicht importiert |

**Belege:** 411 PDFs im Verzeichnis `Belege/`

---

### 2023 (20230101/) ✅

**Status:** ✅ Vollständig importierbar

| Datei | Größe | Zeilen | Datenvolumen | Import-Status |
|-------|-------|--------|--------------|---------------|
| **Anlagenvermögen** |
| `InventarStamm.csv` | 13.7 KB | 42 | 41 Anlagen | ⏳ Nicht importiert |
| `InventarBewegung.csv` | 10.7 KB | 98 | Bewegungen | ⏳ Nicht importiert |
| `Inventarentwicklung.csv` | 12.1 KB | 42 | AfA-Entwicklung | ⏳ Nicht importiert |
| **Buchungsdaten** |
| `kontobuchungen.csv` | 1.6 MB | 7.350 | **2.795 Buchungen** | ⏳ Nicht importiert |
| `buchungssatzprotokoll.csv` | 3.6 MB | 7.350 | Detail-Buchungssätze | ⏳ Nicht importiert |
| `buchungsstapelliste.csv` | 9.0 KB | 75 | 74 Stapel | ⏳ Nicht importiert |
| `belege.csv` | 517.2 KB | 1.962 | 730 Belege | ⏳ Nicht importiert |
| `mvz.csv` | 95.5 KB | 478 | Bewegungsverzeichnis | ⏳ Nicht importiert |
| **Stammdaten** |
| `Sachkontenstamm.csv` | 7.8 KB | 122 | 121 Sachkonten | ⏳ Nicht importiert |
| `DebitorenKreditorenstammdaten.csv` | 26.2 KB | 117 | 116 Geschäftspartner | ⏳ Nicht importiert |
| `Kontennachweis.csv` | 40.3 KB | 270 | Bilanz-Kontennachweis | ⏳ Nicht importiert |

**Belege:** 731 PDFs im Verzeichnis `Belege/`

**Besonderheiten:**
- Deutlich mehr Buchungen als 2022 (7.350 vs 1.625)
- Größtes Jahr hinsichtlich Buchungsvolumen

---

### 2024 (20240101/) ✅

**Status:** ✅ Vollständig importierbar

| Datei | Größe | Zeilen | Datenvolumen | Import-Status |
|-------|-------|--------|--------------|---------------|
| **Anlagenvermögen** |
| `InventarStamm.csv` | 13.9 KB | 42 | 41 Anlagen | ⏳ Nicht importiert |
| `InventarBewegung.csv` | 10.5 KB | 100 | Bewegungen | ⏳ Nicht importiert |
| `Inventarentwicklung.csv` | 12.0 KB | 42 | AfA-Entwicklung | ⏳ Nicht importiert |
| **Buchungsdaten** |
| `kontobuchungen.csv` | 1.6 MB | 7.028 | **2.627 Buchungen** | ⏳ Nicht importiert |
| `buchungssatzprotokoll.csv` | 4.0 MB | 7.028 | Detail-Buchungssätze | ⏳ Nicht importiert |
| `buchungsstapelliste.csv` | 4.5 KB | 38 | 37 Stapel | ⏳ Nicht importiert |
| `belege.csv` | 515.3 KB | 1.957 | 610 Belege | ⏳ Nicht importiert |
| `mvz.csv` | 96.5 KB | 484 | Bewegungsverzeichnis | ⏳ Nicht importiert |
| **Stammdaten** |
| `Sachkontenstamm.csv` | 8.0 KB | 126 | 125 Sachkonten | ⏳ Nicht importiert |
| `DebitorenKreditorenstammdaten.csv` | 26.1 KB | 116 | 115 Geschäftspartner | ⏳ Nicht importiert |
| `Kontennachweis.csv` | 48.4 KB | 330 | Bilanz-Kontennachweis | ⏳ Nicht importiert |

**Belege:** 616 PDFs im Verzeichnis `Belege/`

---

### 2025 (20250101/) ✅

**Status:** ✅ Vollständig (bis November 2025)

| Datei | Größe | Zeilen | Datenvolumen | Import-Status |
|-------|-------|--------|--------------|---------------|
| **Buchungsdaten** |
| `kontobuchungen.csv` | 2.9 MB | 13.021 | **4.825 Buchungen** | ⏳ Nicht importiert |
| `buchungssatzprotokoll.csv` | 6.7 MB | 13.021 | Detail-Buchungssätze | ⏳ Nicht importiert |
| `buchungsstapelliste.csv` | 7.1 KB | 69 | 68 Stapel | ⏳ Nicht importiert |
| `belege.csv` | 1.0 MB | 3.998 | 986 Belege | ⏳ Nicht importiert |
| `mvz.csv` | 131.4 KB | 660 | Bewegungsverzeichnis | ⏳ Nicht importiert |
| **Stammdaten** |
| `Sachkontenstamm.csv` | 12.2 KB | 195 | 194 Sachkonten | ⏳ Nicht importiert |
| `DebitorenKreditorenstammdaten.csv` | 29.3 KB | 137 | 136 Geschäftspartner | ⏳ Nicht importiert |
| `Kontennachweis.csv` | 74.5 KB | 497 | Bilanz-Kontennachweis | ⏳ Nicht importiert |

**Belege:** 988 PDFs im Verzeichnis `Belege/`

**Besonderheiten:**
- ⚠️ **Keine Anlagenvermögen-Dateien** (Jahr noch nicht abgeschlossen)
- Größtes Buchungsvolumen (13.021 Zeilen)
- Meiste Belege (988 PDFs)

---

## Import-Status

### ✅ Bereits importiert

| Datentyp | Jahr | Anzahl | Importdatum | Methode |
|----------|------|--------|-------------|---------|
| **Anlagevermögen** | 2022 | 16 Anlagen | 21.01.2026 | Python-Skript (`import_anlagen_to_db_v2.py`) |
| | | 79.673,19 EUR | | |

**Details:**
- 16 eindeutige Anlagen (von 32 DATEV-Einträgen, Duplikate entfernt)
- Kategorien: Gebäude (29.500 €), Fahrzeuge (32.501 €), BGA (17.379 €), Software (293 €)
- Importiert in Tabelle `anlagevermoegen` mit `unternehmenId = 1`

### ⏳ Noch nicht importiert

#### Priorität 1: Stammdaten (erforderlich für Buchungen)

| Datei | Jahre | Gesamt-Zeilen | Abhängigkeiten |
|-------|-------|---------------|----------------|
| `Sachkontenstamm.csv` | 2022-2025 | 493 | Keine |
| `DebitorenKreditorenstammdaten.csv` | 2022-2025 | 523 | Keine |

#### Priorität 2: Buchungsdaten

| Datei | Jahre | Gesamt-Zeilen | Abhängigkeiten |
|-------|-------|---------------|----------------|
| `kontobuchungen.csv` | 2022-2025 | 29.024 | Sachkonten, Deb/Kred |
| `belege.csv` | 2022-2025 | 9.109 | Sachkonten, Deb/Kred |
| `buchungsstapelliste.csv` | 2022-2025 | 194 | Keine |

#### Priorität 3: Anlagenvermögen (weitere Jahre)

| Datei | Jahre | Gesamt-Zeilen | Status |
|-------|-------|---------------|--------|
| `InventarStamm.csv` | 2021, 2023, 2024 | 122 | 2022 bereits importiert |
| `InventarBewegung.csv` | 2021-2024 | 372 | Nicht importiert |
| `Inventarentwicklung.csv` | 2021-2024 | 154 | Nicht importiert |

#### Priorität 4: Belege (PDF-Dateien)

| Jahr | Anzahl PDFs | Status |
|------|-------------|--------|
| 2022 | 411 | ⏳ Nicht hochgeladen |
| 2023 | 731 | ⏳ Nicht hochgeladen |
| 2024 | 616 | ⏳ Nicht hochgeladen |
| 2025 | 988 | ⏳ Nicht hochgeladen |

**Gesamt:** 2.746 PDFs (Größe: ~1-2 GB geschätzt)

---

## CSV-Strukturen

### mandantendaten.csv

**Zweck:** Unternehmens-Stammdaten
**Zeilen:** 1 (nur Header-Daten, keine echte Kopfzeile)

```csv
Spalte | Beispiel (2022) | Beschreibung
-------|-----------------|-------------
1 | 22593 | Mandantennummer 1
2 | 28245 | Mandantennummer 2
3 | 2022 | Wirtschaftsjahr
4 | Angelus KG | Kurzname
5 | Angelus Managementberatung und Service KG | Vollständiger Name
6 | Angelus Managementberatung und Service KG | Name (Wiederholung)
7-9 | "" | Leerfelder
10 | Unternehmensberatung | Branche
```

**Import-Empfehlung:** Für Validierung und Metadaten nutzbar

---

### Sachkontenstamm.csv

**Zweck:** SKR04-Kontenplan des Unternehmens
**Zeilen:** 50 (2022) → 195 (2025)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 120000 | Kontonummer
2 | Forderungen Alpenland Heizungswasser KG | Kontobeschreibung
3 | 1 | Bereich (0=alle, 1=HR, 2=SR)
4 | 4 | Kontoart
5 | 90 | EU-Kennzeichen
6 | 0 | Konto-Typ
7 | 0,00 | Limit/Schwellenwert
8 | 0 | Status
9 | 0 | Flags
10 | Sammelkonto Debitor | Zusatztext
```

**Beispieldaten (2022):**
```
120000;Forderungen Alpenland Heizungswasser KG;1;4;90;0;0,00;0;0;Sammelkonto Debitor
137010;Auslagen Mitarbeiter;1;0;0;0;0,00;0;0;
140100;Abziehbare Vorsteuer 7%;1;4;30;70;0,00;0;0;Abziehbare Vorsteuer
```

**Import-Empfehlung:**
- In Tabelle `sachkonten` importieren
- Kontonummer als Primary Key
- Beschreibung und Zusatztext kombinieren
- Jahr als Filter verwenden (neueste Version bevorzugen)

---

### DebitorenKreditorenstammdaten.csv

**Zweck:** Kunden (Debitoren) und Lieferanten (Kreditoren)
**Zeilen:** 53 (2022) → 137 (2025)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 1010000 | Kundennummer/Lieferantennummer
2 | "" | Name/Firma (oder Leer)
3 | "" | Zusatz
4 | "" | Nachname
5 | "" | Vorname
6 | Alpenland Heizungswasser KG | Name (oder Leer)
7 | 0 | Typ (0=Kreditor, 1=Debitor, 2=Beide)
8 | "" | Zusatzinfo
9 | "" | Zusatzinfo
10 | STR | Kennzeichen
```

**Beispieldaten (2022):**
```
1010000;;;;;;Alpenland Heizungswasser KG;0;;;STR
1010102;Biehl, Paul;;;;;;;;2;;;
```

**Import-Empfehlung:**
- In Tabellen `kreditoren` und `debitoren` importieren
- Typ 0 → kreditoren, Typ 1 → debitoren, Typ 2 → beide
- Name aus Spalte 2 oder 6 (je nachdem was gefüllt)
- Personennamen: Spalte 4 (Nachname), Spalte 5 (Vorname)

---

### kontobuchungen.csv

**Zweck:** Alle Buchungen eines Jahres (Hauptdaten)
**Zeilen:** 1.625 (2022) → 13.021 (2025)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 0 | Bereich (0=alle, 1=HR, 2=SR)
2 | 120000 | Sachkonto
3 | 31.01.2022 | Datum
4 | "" | Gegenkonto (optional)
5 | 440000 | Buchungsschlüssel oder Gegenkonto
6 | Alpenland Heizungswasser KG | Buchungstext
7 | 0,00 | Soll-Betrag
8 | 0,00 | Haben-Betrag
9 | 149 | Belegnummer
10 | "" | Zusatzinfo
```

**Beispieldaten (2022):**
```
0;120000;31.01.2022;;440000;Alpenland Heizungswasser KG;0,00;0,00;149;
0;120000;05.02.2022;;440000;Feelino GmbH;0,00;0,00;144;
0;120000;17.02.2022;;412500;Shayna Holdings Limited;0,00;0,00;145;
```

**Import-Empfehlung:**
- In Tabelle `buchungen` importieren
- Datum parsen (DD.MM.YYYY → YYYY-MM-DD)
- Betrag aus Soll oder Haben (Vorzeichen beachten)
- Belegnummer als Referenz zu `belege.csv`
- Buchungsart aus Sachkonto ableiten (SKR04: 4000-4999 = Ertrag, 6000-7999 = Aufwand)

---

### belege.csv

**Zweck:** Index aller Belege mit PDF-Referenzen
**Zeilen:** 1.192 (2022) → 3.998 (2025)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 0 | Bereich
2 | 1010000 | Debitor/Kreditor-Nr
3 | 31.01.2022 | Belegdatum
4 | 440000 | Sachkonto/Buchungsschlüssel
5 | Alpenland Heizungswasser KG | Name
6 | 149 | Belegnummer
7 | 01-2022/0001 | Buchungsstapel
8 | 1 | Position im Stapel
9 | BEDI "94239C24-..." | Beleg-ID
10 | Beleg_94239C24-..._0001.pdf | PDF-Dateiname
```

**Beispieldaten (2022):**
```
0;1010000;31.01.2022;440000;Alpenland Heizungswasser KG;149;01-2022/0001;1;BEDI "94239C24-C1E0-5549-B5A5-06128EEA7C9C";Beleg_94239C24-C1E0-5549-B5A5-06128EEA7C9C_0001.pdf
```

**Import-Empfehlung:**
- In Tabelle `belege` importieren
- PDF-Dateien hochladen (S3/Railway Storage)
- `belegdatum`, `belegnummer`, `belegartId` erfassen
- Verknüpfung zu `buchungen` über Belegnummer
- PDF-Pfad: `20YYMMDD/Belege/{PDF-Dateiname}`

---

### buchungssatzprotokoll.csv

**Zweck:** Detail-Protokoll aller Buchungssätze
**Zeilen:** Identisch zu `kontobuchungen.csv`

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 0 | Bereich
2 | 01-2022/0001 | Buchungsstapel
3 | 1 | Zeile im Stapel
4 | 31.01.2022 | Datum
5 | 149 | Belegnummer
6-10 | "" | Zusatzfelder (meist leer)
```

**Import-Empfehlung:**
- Für Debugging/Audit-Trail nutzbar
- Nicht zwingend erforderlich wenn `kontobuchungen.csv` importiert

---

### buchungsstapelliste.csv

**Zweck:** Übersicht der Buchungsstapel (monatliche Buchungsläufe)
**Zeilen:** 12 (2022) → 69 (2025)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 0 | Bereich
2 | 01-2022/0001 | Stapel-ID
3 | 1 | Bereich
4 | 1 | Monat
5 | 1 | Nummer
6 | 01.01.2022 | Von-Datum
7 | 31.01.2022 | Bis-Datum
8 | 01.2022 | Bezeichnung
9 | SF | Stapel-Typ
10 | RE | Belegart
```

**Beispieldaten (2022):**
```
0;01-2022/0001;1;1;1;01.01.2022;31.01.2022;01.2022;SF;RE
0;02-2022/0001;1;2;1;01.02.2022;28.02.2022;02.2022;SF;RE
```

**Import-Empfehlung:**
- Für Gruppierung/Organisation nutzbar
- Optional: In separate Tabelle für Reporting

---

### mvz.csv (Bewegungsverzeichnis)

**Zweck:** Konten-Saldenliste mit Bewegungen
**Zeilen:** 206 (2022) → 660 (2025)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 1 | Bereich
2 | 120000 | Sachkonto
3 | Forderungen Alpenland... | Kontobeschreibung
4 | 31.12.2022 | Stichtag
5 | 0,00 | EB Soll
6 | 0,00 | EB Haben
7 | 215650,73 | Bewegung Soll
8 | 0,00 | Bewegung Haben
9 | 12352,20 | Saldo Soll
10 | 0,00 | Saldo Haben
```

**Import-Empfehlung:**
- Für Bilanz-Erstellung und Kontenabstimmung
- Optional: Validierung gegen `kontobuchungen.csv`

---

### Kontennachweis.csv

**Zweck:** Bilanz-Kontennachweis (Aktiva/Passiva-Positionen)
**Zeilen:** 2 (2021) → 497 (2025)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 1 | Bereich
2 | 1 | Bilanzposition-Nr
3 | Kontennachweis zur Bilanz | Berichtstyp
4 | AKTIVA | Seite (AKTIVA/PASSIVA)
5 | 1 | Position
6 | 1 | Unterposition
7 | "" | Zusatz
8 | EUR | Währung
9 | Forderungen aus Lieferungen... | Positionsbezeichnung
10 | 215650,73 | Betrag
```

**Import-Empfehlung:**
- Für Bilanz-Darstellung im Frontend
- Verknüpfung mit `mvz.csv` für Details

---

### InventarStamm.csv

**Zweck:** Anlagenstamm (Fixed Assets)
**Zeilen:** 32 (2022) - davon 16 eindeutig

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 1 | Bereich
2 | 99 | Inventarnummer
3 | 1 | Status
4 | Lineare Normalabschreibung (01) | AfA-Methode
5 | "" | Zusatz
6 | "" | Zusatz
7 | 2 Direkte Brutto-Methode... | Bewertungsmethode
8 | 01.07.2013 | Anschaffungsdatum (DD.MM.YYYY)
9 | VE (Vereinfachungsregel) | Abschreibungsregel
10 | 33,33 | Abschreibungssatz (%)
```

**Weitere Spalten:** (siehe DATEV Index.csv)
- Spalte 11: Anschaffungskosten
- Spalte 13: Anschaffungsdatum (nochmal)
- Spalte 30: Bezeichnung
- Spalte 33: Sachkonto

**Import-Empfehlung:**
- ✅ Bereits importiert für 2022 (16 Anlagen)
- Noch zu importieren: 2021, 2023, 2024
- Nutzungsdauer berechnen aus Abschreibungssatz: `ND = 100 / Satz`

---

### InventarBewegung.csv

**Zweck:** Bewegungen im Anlagenvermögen (Zugänge/Abgänge)
**Zeilen:** 68 (2022) → 100 (2024)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 1 | Bereich
2 | 99 | Inventarnummer
3 | 1 | Bewegungsart
4 | 01.01.2022 | Datum
5 | 100 | Bewegungscode
6 | Vortrag | Bewegungstext
7 | 1 | Menge
8 | i | Einheit
9 | 1,00 | Einzelpreis
10 | 293,28 | Gesamtwert
```

**Import-Empfehlung:**
- Für AfA-Berechnung und Anlagenspiegel
- Verknüpfung mit `InventarStamm.csv` über Inventarnummer

---

### Inventarentwicklung.csv

**Zweck:** AfA-Entwicklung pro Anlage über Zeit
**Zeilen:** 32 (2022) → 42 (2024)

```csv
Spalte | Beispiel | Beschreibung
-------|----------|-------------
1 | 1 | Bereich
2 | 13500 | Sachkonto
3 | 13500001 | Anlage-ID (mit führenden Leerzeichen)
4 | UGS UnternehmensGründungsSimulation | Bezeichnung
5 | Linear | Abschreibungsmethode
6 | 36 | Nutzungsdauer (Monate)
7 | 33,33 | Abschreibungssatz
8 | 36 | Nutzungsdauer (nochmal)
9 | 33,33 | Abschreibungssatz (nochmal)
10 | 09.07.2013 | Anschaffungsdatum
```

**Import-Empfehlung:**
- Für detaillierte AfA-Planung
- Ergänzung zu `InventarStamm.csv`

---

### bereichsuebersicht.csv

**Zweck:** Rechnungslegungsbereiche (Handelsrecht/Steuerrecht)
**Zeilen:** 3 (konstant)

```csv
0;0;Für alle Rechnungslegungszwecke gültig
1;50;Handelsrecht
2;30;Steuerrecht
```

**Import-Empfehlung:**
- Als Lookup-Tabelle für Bereichs-Codes (0/1/2)

---

### Index.csv

**Zweck:** Feldbeschreibungen für alle CSV-Dateien (DATEV-Metadaten)
**Zeilen:** 715 (konstant)

```csv
Dateiname (*.csv);Feldbeschreibung;Feldname
Sachkontenstamm.csv;Kontonummer des Kontos;Ktonr
Sachkontenstamm.csv;Beschriftung;Text
```

**Import-Empfehlung:**
- Für Dokumentation und Feld-Mapping
- Nicht in DB importieren, als Referenz nutzen

---

### AhkAbzugsart.csv

**Zweck:** Anschaffungskosten-Abzugsarten
**Zeilen:** 1

```csv
32501;Bew.Res.§7a;
```

**Import-Empfehlung:**
- Nur Metadaten, nicht importieren

---

## Import-Empfehlungen

### Phase 1: Stammdaten (Foundation)

**Zuerst importieren** (keine Abhängigkeiten):

1. **Sachkontenstamm** (2022-2025)
   - Tabelle: `sachkonten`
   - Felder: `kontonummer`, `beschreibung`, `unternehmenId = 1`
   - Strategie: Neueste Version bevorzugen (2025), ältere nur für historische Abfragen

2. **DebitorenKreditorenstammdaten** (2022-2025)
   - Tabellen: `debitoren` + `kreditoren`
   - Felder: `nummer`, `name`, `typ`, `unternehmenId = 1`
   - Duplikate: Anhand Nummer deduplizieren

### Phase 2: Anlagenvermögen (weitere Jahre)

3. **InventarStamm** (2021, 2023, 2024)
   - Tabelle: `anlagevermoegen`
   - Status 2022: ✅ Bereits importiert (16 Anlagen)
   - Noch zu importieren: 2021 (37 Anlagen), 2023 (41), 2024 (41)
   - Duplikate: Anhand Inventarnummer deduplizieren

### Phase 3: Buchungsdaten (Hauptdaten)

4. **kontobuchungen** (2022-2025)
   - Tabelle: `buchungen`
   - Zeilen: 29.024 Buchungen gesamt
   - Abhängigkeiten: Sachkonten + Deb/Kred müssen existieren
   - Belegnummer als Referenz zu `belege` speichern

5. **belege** (2022-2025)
   - Tabelle: `belege`
   - Zeilen: 9.109 Belege
   - PDF-Upload parallel: 2.746 PDFs (~1-2 GB)

### Phase 4: Optional (Erweiterte Daten)

6. **buchungsstapelliste** - Für Reporting/Gruppierung
7. **mvz** - Für Bilanz-Validierung
8. **Kontennachweis** - Für Bilanz-Darstellung
9. **InventarBewegung** + **Inventarentwicklung** - Für AfA-Berechnung

### Technische Empfehlungen

#### CSV-Parsing
```python
import csv
with open(file_path, 'r', encoding='latin-1') as f:
    reader = csv.reader(f, delimiter=';')
    # DATEV-CSVs haben oft keine Header-Zeile!
```

#### Datum-Parsing
```python
from datetime import datetime
datev_datum = "31.01.2022"  # DD.MM.YYYY
db_datum = datetime.strptime(datev_datum, "%d.%m.%Y").strftime("%Y-%m-%d")
```

#### Betrag-Parsing
```python
betrag_str = "1.234,56"  # Deutsches Format
betrag = float(betrag_str.replace('.', '').replace(',', '.'))
```

#### Buchungsart ableiten (SKR04)
```python
def bestimme_buchungsart(sachkonto):
    konto = int(sachkonto)
    if 4000 <= konto <= 4999:
        return "ertrag"
    elif 6000 <= konto <= 7999:
        return "aufwand"
    elif konto < 3000:
        return "aktiv"
    else:
        return "passiv"
```

### Import-Reihenfolge (Beispiel-Skript)

```python
# 1. Stammdaten
import_sachkonten(years=[2022, 2023, 2024, 2025])
import_debitoren_kreditoren(years=[2022, 2023, 2024, 2025])

# 2. Anlagenvermögen
import_anlagen(years=[2021, 2023, 2024])  # 2022 bereits importiert

# 3. Buchungen
import_kontobuchungen(years=[2022, 2023, 2024, 2025])
import_belege(years=[2022, 2023, 2024, 2025])

# 4. Belege-PDFs hochladen (parallel, async)
upload_belege_pdfs(years=[2022, 2023, 2024, 2025])
```

---

## Datenqualität & Vollständigkeit

### Übersicht nach Jahr

| Jahr | Vollständigkeit | Datenqualität | Anmerkungen |
|------|----------------|---------------|-------------|
| 2021 | 30% | ⚠️ Eingeschränkt | Nur Anlagenvermögen, keine Buchungen |
| 2022 | 100% | ✅ Sehr gut | Komplett, 410 Belege |
| 2023 | 100% | ✅ Sehr gut | Komplett, 730 Belege |
| 2024 | 100% | ✅ Sehr gut | Komplett, 616 Belege |
| 2025 | 90% | ✅ Gut | Bis November, keine Anlagendateien |

### Datenkonsistenz

**Geprüft:**
- ✅ Belegnummern in `belege.csv` stimmen mit `kontobuchungen.csv` überein
- ✅ Sachkonten in Buchungen existieren in `Sachkontenstamm.csv`
- ✅ Debitoren/Kreditoren in Buchungen existieren in `DebitorenKreditorenstammdaten.csv`
- ✅ PDF-Dateien existieren für alle Einträge in `belege.csv`

**Duplikate:**
- ⚠️ `InventarStamm.csv` 2022: 32 Einträge, aber nur 16 eindeutige (nach Inventarnummer)
  - **Lösung:** Import-Skript dedupliziert automatisch

### Fehlende Daten

| Was fehlt | Betroffene Jahre | Auswirkung |
|-----------|------------------|------------|
| Anlagendateien | 2025 | Kein Anlagenspiegel 2025 möglich (Jahr noch offen) |
| Buchungen | 2021 | Kein Jahresabschluss 2021 möglich |
| Geschäftspartner | 2021 | Keine Kunden/Lieferanten-Listen |

---

## Zusammenfassung

### Kernzahlen

| Metrik | Wert |
|--------|------|
| **Verfügbare Jahre** | 5 (2021-2025) |
| **CSV-Dateien** | 64 |
| **Belege (PDFs)** | 2.746 |
| **Buchungen (Zeilen)** | 29.024 |
| **Sachkonten** | ~200 (dedupliziert) |
| **Geschäftspartner** | ~150 (dedupliziert) |
| **Anlagen** | ~50 (dedupliziert) |
| **Datenvolumen** | ~30 MB (CSV) + ~1-2 GB (PDFs) |

### Empfohlene Nächste Schritte

1. **Sachkontenstamm importieren** (2022-2025) → Foundation für alle Buchungen
2. **Debitoren/Kreditoren importieren** (2022-2025) → Geschäftspartner
3. **Buchungen importieren** (2022-2025) → Hauptdaten
4. **Belege-Index importieren** (2022-2025) → Belegverwaltung
5. **PDFs hochladen** (async) → S3/Railway Storage
6. **Anlagen nachladen** (2021, 2023, 2024) → Vollständiger Anlagenspiegel

### Geschätzte Import-Dauer

| Phase | Geschätzte Dauer | Methode |
|-------|------------------|---------|
| Stammdaten | 5-10 Min | Python-Skript |
| Anlagenvermögen | 5 Min | Python-Skript |
| Buchungen | 20-30 Min | Python-Skript (Batch-Insert) |
| Belege-Index | 10 Min | Python-Skript |
| PDFs Upload | 30-60 Min | Async (parallel) |
| **GESAMT** | **1-2 Stunden** | Automatisiert |

---

**Dokumentation erstellt am:** 21.01.2026
**Letzte Aktualisierung:** 21.01.2026
**Version:** 1.0
