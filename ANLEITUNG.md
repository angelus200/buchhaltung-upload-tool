# Buchhaltung Upload Tool – Anleitung

## Implementierung und praktische Nutzung für die Unternehmensbuchhaltung

**Version:** 1.2  
**Stand:** Dezember 2025  
**Autor:** Manus AI

---

## Inhaltsverzeichnis

1. [Einführung](#1-einführung)
2. [Systemübersicht](#2-systemübersicht)
3. [Implementierung](#3-implementierung)
4. [Praktische Nutzung](#4-praktische-nutzung)
5. [DATEV-Export und Steuerberater-Schnittstellen](#5-datev-export-und-steuerberater-schnittstellen)
6. [Stammdatenverwaltung](#6-stammdatenverwaltung)
7. [Workflow für den Monatsabschluss](#7-workflow-für-den-monatsabschluss)
8. [Fehlerbehebung und Support](#8-fehlerbehebung-und-support)
9. [Anhang: Technische Spezifikationen](#9-anhang-technische-spezifikationen)

---

## 1. Einführung

Das **Buchhaltung Upload Tool** ist eine webbasierte Anwendung zur Erfassung von Belegen und Erstellung von Buchungssätzen für die deutsche Unternehmensbuchhaltung. Das Tool ermöglicht die Übertragung der erfassten Daten an DATEV und andere Buchhaltungsprogramme für Steuerberater.

### 1.1 Zielgruppe

Das Tool richtet sich an:

- **Sachbearbeiter in der Buchhaltung**, die Belege erfassen und kontieren
- **Unternehmer und Geschäftsführer**, die ihre vorbereitende Buchhaltung selbst erledigen
- **Steuerberater**, die Daten von Mandanten empfangen und weiterverarbeiten

### 1.2 Hauptfunktionen

| Funktion | Beschreibung |
|----------|--------------|
| **Belegerfassung** | Upload von PDF- und Bilddateien per Drag & Drop |
| **Manuelle Buchung** | Eingabeformular für alle buchungsrelevanten Daten |
| **Stammdatenverwaltung** | Verwaltung von Kreditoren, Debitoren, Anlagevermögen u.v.m. |
| **DATEV-Export** | Export im standardisierten EXTF-Format |
| **Monatsübersicht** | Auswertungen und Berichte für den Monatsabschluss |
| **Notizen** | Hinterlegung von Verträgen und Zusatzinformationen |

---

## 2. Systemübersicht

### 2.1 Architektur

Das Tool ist als moderne Single-Page-Application (SPA) aufgebaut und läuft vollständig im Browser. Die Daten werden lokal im Browser-Speicher (LocalStorage) gesichert, bis sie exportiert werden.

```
┌─────────────────────────────────────────────────────────────┐
│                    Buchhaltung Upload Tool                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Beleg-    │  │  Buchungs-  │  │    Stammdaten-      │  │
│  │   Upload    │  │   formular  │  │    verwaltung       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │   Lokaler Speicher    │                       │
│              │   (Browser Storage)   │                       │
│              └───────────┬───────────┘                       │
│                          │                                   │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │    DATEV-Export       │                       │
│              │   (EXTF CSV-Format)   │                       │
│              └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │         Steuerberater               │
         │  ┌─────────┐  ┌─────────────────┐   │
         │  │  DATEV  │  │ Andere Software │   │
         │  │ Kanzlei │  │ (Lexware, SAGE) │   │
         │  └─────────┘  └─────────────────┘   │
         └─────────────────────────────────────┘
```

### 2.2 Kontenrahmen

Das Tool verwendet den **SKR 03** (Standardkontenrahmen), der in Deutschland am weitesten verbreitet ist. Die wichtigsten Kontenbereiche sind:

| Kontenbereich | Bezeichnung | Beispiele |
|---------------|-------------|-----------|
| 0100–0899 | Anlagevermögen | Grundstücke, Maschinen, Fahrzeuge, Beteiligungen |
| 0800–0899 | Eigenkapital | Gezeichnetes Kapital, Rücklagen, Gesellschafterkonten |
| 1000–1999 | Umlaufvermögen & Finanzen | Kasse, Bank, Forderungen |
| 10000–19999 | Debitoren (Kunden) | Personenkonten für Kunden |
| 4000–4999 | Aufwendungen | Miete, Personal, Bürobedarf |
| 70000–79999 | Kreditoren (Lieferanten) | Personenkonten für Lieferanten |
| 8000–8999 | Erlöse | Umsatzerlöse, sonstige Erträge |

---

## 3. Implementierung

### 3.1 Voraussetzungen

Für die Nutzung des Tools benötigen Sie:

- Einen modernen Webbrowser (Chrome, Firefox, Edge, Safari)
- Internetzugang für den initialen Aufruf
- Optional: Zugang zu DATEV Unternehmen online oder einer anderen Buchhaltungssoftware

### 3.2 Ersteinrichtung

#### Schritt 1: Anwendung aufrufen

Öffnen Sie das Tool über die bereitgestellte URL in Ihrem Browser. Die Anwendung lädt automatisch und ist sofort einsatzbereit.

#### Schritt 2: Stammdaten anlegen

Bevor Sie mit der Belegerfassung beginnen, sollten Sie die wichtigsten Stammdaten anlegen:

1. Klicken Sie auf **„Stammdaten"** in der Hauptnavigation
2. Legen Sie Ihre häufigsten **Kreditoren** (Lieferanten) an
3. Erfassen Sie Ihre **Debitoren** (Kunden), falls Sie Ausgangsrechnungen buchen
4. Hinterlegen Sie Ihr **Anlagevermögen** für Abschreibungsbuchungen
5. Erfassen Sie **Bankkonten** und **Kostenstellen** nach Bedarf

#### Schritt 3: Konfiguration prüfen

Das Tool ist vorkonfiguriert für:

- **Kontenrahmen:** SKR 03
- **Steuersätze:** 19%, 7%, 0% (steuerfrei)
- **Währung:** EUR
- **Datumsformat:** TT.MM.JJJJ

### 3.3 Erweiterung auf Full-Stack (optional)

Für eine dauerhafte Datenspeicherung und Mehrbenutzerbetrieb kann das Tool auf eine Full-Stack-Architektur erweitert werden. Dies ermöglicht:

- Zentrale Datenbank für alle Buchungen und Stammdaten
- Benutzerauthentifizierung und Rechteverwaltung
- API-Schnittstelle für automatisierte Datenübertragung
- Automatische Backups und Versionierung

---

## 4. Praktische Nutzung

### 4.1 Belege hochladen

Die einfachste Methode zur Belegerfassung ist der Upload von Belegdateien:

1. **Drag & Drop:** Ziehen Sie PDF- oder Bilddateien (JPG, PNG) in den Upload-Bereich
2. **Dateiauswahl:** Klicken Sie auf den Upload-Bereich und wählen Sie Dateien aus
3. Das System erstellt automatisch einen Buchungsentwurf für jeden Beleg

**Unterstützte Dateiformate:**

| Format | Maximale Größe | Empfehlung |
|--------|----------------|------------|
| PDF | 10 MB | Bevorzugt für Rechnungen |
| JPG/JPEG | 5 MB | Für Kassenbelege |
| PNG | 5 MB | Für Screenshots |

### 4.2 Manuelle Buchung erstellen

Für Buchungen ohne physischen Beleg oder zur manuellen Korrektur:

1. Klicken Sie auf **„Manuelle Buchung"**
2. Wählen Sie die **Buchungsart**:
   - **Aufwandsbuchung:** Eingangsrechnungen, Kosten
   - **Ertragsbuchung:** Ausgangsrechnungen, Erlöse
   - **Anlagenbuchung:** Investitionen, Abschreibungen
   - **Sonstige Buchung:** Umbuchungen, Korrekturen

3. Füllen Sie die Pflichtfelder aus:

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| **Belegdatum** | Datum des Belegs | 15.12.2025 |
| **Belegnummer** | Eindeutige Referenz | RE-2025-0042 |
| **Partner-Typ** | Art des Geschäftspartners | Kreditor (Lieferant) |
| **Geschäftspartner** | Name des Partners | Bürobedarf Müller GmbH |
| **Personenkonto** | Konto des Partners | 70001 |
| **Sachkonto** | Aufwands-/Ertragskonto | 4930 (Bürobedarf) |
| **Nettobetrag** | Betrag ohne Steuer | 250,00 |
| **Steuersatz** | Anwendbarer Steuersatz | 19% |
| **Buchungstext** | Beschreibung | Büromaterial Dezember |

4. Der **Bruttobetrag** wird automatisch berechnet
5. Optional: Geben Sie eine **Kostenstelle** an

### 4.3 Buchungen verwalten

Alle erfassten Buchungen werden in der Übersicht angezeigt:

- **Grüner Haken:** Buchung ist vollständig und exportbereit
- **Gelbes Warnsymbol:** Buchung ist unvollständig, Pflichtfelder fehlen

Sie können jede Buchung bearbeiten oder löschen, solange sie noch nicht exportiert wurde.

### 4.4 Notizen und Zusatzinformationen

Unter **„Notizen"** können Sie wichtige Informationen hinterlegen:

| Kategorie | Verwendung |
|-----------|------------|
| **Vertrag** | Mietverträge, Leasingverträge, Wartungsverträge |
| **Kreditor-Info** | Zahlungsbedingungen, Ansprechpartner |
| **Buchungshinweis** | Kontierungsregeln, Besonderheiten |
| **Allgemein** | Sonstige Anmerkungen |

Diese Informationen dienen als Nachschlagewerk für wiederkehrende Buchungen und zur Dokumentation für Betriebsprüfungen.

---

## 5. DATEV-Export und Steuerberater-Schnittstellen

### 5.1 DATEV-Format (EXTF)

Das Tool exportiert Buchungsdaten im **DATEV-EXTF-Format** (Extended Format), dem Standardformat für den Datenaustausch mit DATEV-Programmen. Dieses Format wird von allen DATEV-Produkten unterstützt:

- DATEV Kanzlei-Rechnungswesen
- DATEV Mittelstand Faktura mit Rechnungswesen
- DATEV Unternehmen online

### 5.2 Export durchführen

1. Stellen Sie sicher, dass alle Buchungen vollständig sind (grüner Haken)
2. Klicken Sie auf **„DATEV Export"**
3. Eine CSV-Datei wird automatisch heruntergeladen
4. Dateiname: `EXTF_Buchungsstapel_JJJJ_MM.csv`

### 5.3 Aufbau der Export-Datei

Die exportierte Datei enthält:

**Header-Zeile (Zeile 1):**
```
"EXTF";700;21;"Buchungsstapel";13;[Timestamp];;"MA";"";"";1001;10001;[Jahr]0101;4;[Startdatum];[Enddatum];"Buchungsstapel";"MA";1;0;0;"EUR";;"";;;"03";;;"";""
```

**Spaltenüberschriften (Zeile 2):**
```
Umsatz;Soll/Haben-Kz;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto;BU-Schluessel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext;...;KOST1
```

**Datenzeilen (ab Zeile 3):**
```
297,50;"S";"EUR";;;;"4930";"70001";"";"1512";"RE-2025-0042";;;"Büromaterial Dezember";0;;;;;"";"100"
```

### 5.4 Import in DATEV

#### DATEV Unternehmen online

1. Melden Sie sich bei DATEV Unternehmen online an
2. Navigieren Sie zu **Belege → Buchungsdatenservice**
3. Klicken Sie auf **„Daten importieren"**
4. Wählen Sie die exportierte CSV-Datei aus
5. Prüfen Sie die Vorschau und bestätigen Sie den Import

#### DATEV Kanzlei-Rechnungswesen

1. Öffnen Sie das Mandantenkonto
2. Wählen Sie **Stapelverarbeitung → Stapel einlesen**
3. Wählen Sie als Format **„ASCII (DATEV-Format)"**
4. Importieren Sie die CSV-Datei
5. Führen Sie eine Plausibilitätsprüfung durch

### 5.5 Alternative Buchhaltungsprogramme

Das DATEV-EXTF-Format wird auch von anderen Programmen unterstützt:

| Programm | Import-Funktion | Hinweise |
|----------|-----------------|----------|
| **Lexware** | Datei → Import → DATEV | Kontenrahmen muss übereinstimmen |
| **SAGE** | Extras → Datenimport | DATEV-Schnittstelle aktivieren |
| **sevDesk** | Einstellungen → Import | CSV-Import mit Mapping |
| **Agenda** | Buchen → Stapelimport | DATEV-kompatibel |

### 5.6 Manuelle Übertragung

Falls kein automatischer Import möglich ist, können die Daten auch manuell übertragen werden. Die Übersichtsseite zeigt alle Buchungen in tabellarischer Form:

1. Öffnen Sie die **„Übersicht"**
2. Wählen Sie den gewünschten Monat
3. Nutzen Sie die Tabelle als Vorlage für die manuelle Erfassung

---

## 6. Stammdatenverwaltung

### 6.1 Übersicht der Stammdaten-Kategorien

| Kategorie | Kontobereich | Typische Felder |
|-----------|--------------|-----------------|
| **Kreditoren** | 70000–79999 | Firma, Adresse, USt-IdNr., IBAN, Zahlungsziel |
| **Debitoren** | 10000–19999 | Firma, Adresse, USt-IdNr., Kreditlimit |
| **Beteiligungen** | 0600–0699 | Unternehmensname, Anteil, Buchwert, Erwerbsdatum |
| **Anlagevermögen** | 0100–0899 | Bezeichnung, Anschaffungskosten, Nutzungsdauer, AfA-Methode |
| **Gesellschafter** | 0800–0899 | Name, Anteil, Einlage, Eintrittsdatum |
| **Bankkonten** | 1200–1299 | Bankname, IBAN, BIC, Kontotyp |
| **Kostenstellen** | KST | Bezeichnung, Nummer, Verantwortlicher, Budget |
| **Verträge** | – | Vertragsart, Partner, Laufzeit, monatlicher Betrag |

### 6.2 Stammdaten anlegen

1. Navigieren Sie zu **„Stammdaten"**
2. Wählen Sie die gewünschte Kategorie (Tab)
3. Klicken Sie auf **„[Kategorie] anlegen"**
4. Füllen Sie die Pflichtfelder aus (mit * markiert)
5. Ergänzen Sie optionale Informationen
6. Klicken Sie auf **„Speichern"**

### 6.3 Best Practices für Stammdaten

**Kreditoren und Debitoren:**
- Verwenden Sie eindeutige Kontonummern (z.B. 70001, 70002, ...)
- Hinterlegen Sie immer die USt-IdNr. für innergemeinschaftliche Geschäfte
- Pflegen Sie Zahlungsziele für das Mahnwesen

**Anlagevermögen:**
- Erfassen Sie alle Anlagegüter mit Anschaffungswert über 800 € netto
- Dokumentieren Sie die Abschreibungsmethode (linear/degressiv)
- Aktualisieren Sie den Restwert regelmäßig

**Verträge:**
- Hinterlegen Sie Kündigungsfristen für rechtzeitige Kündigung
- Verknüpfen Sie Verträge mit dem entsprechenden Buchungskonto
- Notieren Sie den Zahlungsrhythmus (monatlich/quartalsweise/jährlich)

---

## 7. Workflow für den Monatsabschluss

### 7.1 Tägliche Aufgaben

1. **Belege sammeln:** Alle Eingangsrechnungen und Belege digitalisieren
2. **Belege hochladen:** PDF/Bilder in das Tool hochladen
3. **Kontieren:** Buchungssätze vervollständigen
4. **Prüfen:** Vollständigkeit der Pflichtfelder sicherstellen

### 7.2 Wöchentliche Aufgaben

1. **Übersicht prüfen:** Alle Buchungen auf Plausibilität prüfen
2. **Stammdaten aktualisieren:** Neue Kreditoren/Debitoren anlegen
3. **Notizen ergänzen:** Wichtige Informationen dokumentieren

### 7.3 Monatlicher Abschluss

**Checkliste für den Monatsabschluss:**

| Schritt | Aufgabe | Erledigt |
|---------|---------|----------|
| 1 | Alle Belege des Monats erfasst? | ☐ |
| 2 | Alle Buchungen vollständig (grüner Haken)? | ☐ |
| 3 | Summen plausibel (Übersicht prüfen)? | ☐ |
| 4 | DATEV-Export erstellt? | ☐ |
| 5 | Export an Steuerberater übermittelt? | ☐ |
| 6 | Belege archiviert (GoBD-konform)? | ☐ |

### 7.4 Übermittlung an den Steuerberater

**Option A: DATEV Unternehmen online**
- Laden Sie die Export-Datei direkt in DATEV Unternehmen online hoch
- Der Steuerberater erhält automatisch Zugriff

**Option B: E-Mail-Versand**
- Exportieren Sie die CSV-Datei
- Senden Sie die Datei per E-Mail an Ihren Steuerberater
- Fügen Sie die Original-Belege als PDF bei (oder Verweis auf Belegarchiv)

**Option C: Cloud-Speicher**
- Speichern Sie die Export-Datei in einem gemeinsamen Cloud-Ordner
- Informieren Sie den Steuerberater über neue Daten

---

## 8. Fehlerbehebung und Support

### 8.1 Häufige Probleme

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Buchung wird nicht als vollständig markiert | Pflichtfeld fehlt | Alle Felder mit * ausfüllen |
| Export-Datei leer | Keine vollständigen Buchungen | Buchungen vervollständigen |
| DATEV-Import schlägt fehl | Falsches Format | Encoding auf UTF-8 prüfen |
| Daten verschwunden | Browser-Cache gelöscht | Regelmäßig exportieren |

### 8.2 Datensicherung

Da die Daten im Browser gespeichert werden, sollten Sie:

1. **Regelmäßig exportieren:** Mindestens wöchentlich DATEV-Export erstellen
2. **Backups anlegen:** Export-Dateien sicher aufbewahren
3. **Browser-Daten nicht löschen:** Beim Löschen von Browserdaten gehen lokale Daten verloren

### 8.3 GoBD-Konformität

Für eine GoBD-konforme Buchführung beachten Sie:

- **Unveränderbarkeit:** Exportierte Daten nicht nachträglich ändern
- **Nachvollziehbarkeit:** Alle Buchungen mit Belegnummer und -datum
- **Aufbewahrung:** Belege und Buchungsdaten 10 Jahre aufbewahren
- **Verfahrensdokumentation:** Dieses Dokument als Teil der Dokumentation nutzen

---

## 9. Anhang: Technische Spezifikationen

### 9.1 DATEV-EXTF-Format Spezifikation

**Header-Felder:**

| Position | Feld | Wert |
|----------|------|------|
| 1 | Formatkennung | "EXTF" |
| 2 | Versionsnummer | 700 |
| 3 | Datenkategorie | 21 (Buchungsstapel) |
| 4 | Formatname | "Buchungsstapel" |
| 5 | Formatversion | 13 |
| 6 | Erzeugt am | Timestamp |
| 11 | Beraternummer | 1001 |
| 12 | Mandantennummer | 10001 |
| 13 | Wirtschaftsjahresbeginn | JJJJMMTT |
| 14 | Sachkontenlänge | 4 |
| 15 | Datum von | JJJJMMTT |
| 16 | Datum bis | JJJJMMTT |
| 22 | Währung | "EUR" |
| 26 | SKR | "03" |

**Buchungssatz-Felder:**

| Feld | Typ | Länge | Beschreibung |
|------|-----|-------|--------------|
| Umsatz | Numerisch | 13,2 | Bruttobetrag |
| Soll/Haben-Kz | Text | 1 | "S" oder "H" |
| WKZ Umsatz | Text | 3 | Währung (EUR) |
| Konto | Text | 9 | Sachkonto |
| Gegenkonto | Text | 9 | Personenkonto |
| Belegdatum | Numerisch | 4 | TTMM |
| Belegfeld 1 | Text | 36 | Belegnummer |
| Buchungstext | Text | 60 | Beschreibung |
| KOST1 | Text | 36 | Kostenstelle |

### 9.2 Kontenrahmen SKR 03 (Auszug)

**Aufwandskonten (Klasse 4):**

| Konto | Bezeichnung |
|-------|-------------|
| 4120 | Miete |
| 4200 | Telefon |
| 4210 | Internet |
| 4240 | Gas, Strom, Wasser |
| 4260 | Instandhaltung |
| 4500 | Fahrzeugkosten |
| 4600 | Werbekosten |
| 4650 | Bewirtungskosten |
| 4830 | Abschreibungen Sachanlagen |
| 4900 | Sonstige Aufwendungen |
| 4930 | Bürobedarf |
| 4940 | Zeitschriften, Bücher |
| 4950 | Rechts- und Beratungskosten |

**Ertragskonten (Klasse 8):**

| Konto | Bezeichnung |
|-------|-------------|
| 8400 | Erlöse 19% USt |
| 8300 | Erlöse 7% USt |
| 8100 | Steuerfreie Erlöse |
| 8200 | Erlöse Ausland |
| 8900 | Sonstige Erträge |
| 2650 | Zinserträge |
| 2700 | Erträge aus Beteiligungen |

**Anlagekonten (Klasse 0):**

| Konto | Bezeichnung |
|-------|-------------|
| 0200 | Grundstücke |
| 0210 | Gebäude |
| 0400 | Maschinen |
| 0420 | Fahrzeuge |
| 0480 | Betriebs- und Geschäftsausstattung |
| 0500 | Anlagen im Bau |
| 0600 | Beteiligungen |
| 0650 | Wertpapiere des Anlagevermögens |

---

## Kontakt und Support

Bei Fragen zur Nutzung des Tools oder zur Integration mit Ihrer Buchhaltungssoftware wenden Sie sich an Ihren Steuerberater oder IT-Administrator.

---

*Diese Anleitung wurde erstellt von Manus AI. Stand: Dezember 2025.*
