# DATEV EXTF/CSV Import/Export System

## Übersicht

Vollständiges Import/Export-System für DATEV-Buchungsstapel im EXTF- und CSV-Format. Ermöglicht den nahtlosen Datenaustausch mit Steuerberatern und DATEV-Software.

---

## Features

### ✅ Import
- **DATEV EXTF Format**: Unterstützt vollständigen EXTF-Header mit Metadaten
- **DATEV CSV Format**: Standard-CSV mit Semikolon-Trennung
- **Deutsche Formatierung**:
  - Zahlen: Komma als Dezimaltrennzeichen (1.234,56)
  - Datum: DDMM oder DDMMYYYY (0101, 01012025)
- **Drag & Drop Upload**: Intuitive Datei-Upload-Oberfläche
- **Live-Vorschau**: Tabelle mit allen geparsten Buchungen
- **Row-Level Validierung**: Fehler- und Warnungen pro Zeile
- **Bulk-Import**: Mehrere Hundert Buchungen auf einmal

### ✅ Export
- **DATEV EXTF Export**: Generiert standardkonforme EXTF-Dateien
- **Metadaten-Integration**: Beraternummer, Mandantennummer, Zeitraum
- **Filter**: Nach Status, Datum exportieren
- **Download**: Direkt als .csv-Datei

---

## Architektur

### Backend (Server)

#### 1. DATEV Parser (server/lib/datev-parser.ts)

**Hauptfunktionen:**

```typescript
// Parse komplette DATEV-Datei
parseDatevFile(content: string): DatevParseResult

// Export Buchungen zu DATEV
exportToDatev(buchungen: Array<...>, metadata: {...}): string

// Validierung
isValidDatevFile(content: string): boolean
```

**Datenstrukturen:**

```typescript
interface DatevHeader {
  format: 'EXTF' | 'CSV';
  beraternummer?: string;
  mandantennummer?: string;
  wirtschaftsjahrBeginn?: number;
  datumVon?: Date;
  datumBis?: Date;
}

interface DatevBuchung {
  umsatz: number;
  sollHaben: 'S' | 'H';
  konto: string;
  gegenkonto: string;
  belegdatum: Date;
  belegnummer: string;
  buchungstext: string;
  rowNumber: number;
  errors: string[];
  warnings: string[];
}

interface DatevParseResult {
  header: DatevHeader;
  buchungen: DatevBuchung[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    totalUmsatz: number;
  };
}
```

**Parser-Logik:**

1. **Header-Erkennung:**
   - Erkennt EXTF vs. CSV automatisch
   - Extrahiert Metadaten aus EXTF-Header
   - Findet Beraternummer, Mandantennummer, Zeitraum

2. **Zahlen-Parsing:**
   ```typescript
   parseGermanNumber("1.234,56") → 1234.56
   parseGermanNumber("1234,56") → 1234.56
   parseGermanNumber("1234") → 1234
   ```

3. **Datums-Parsing:**
   ```typescript
   parseGermanDate("0101", 2025) → Date(2025, 0, 1)  // 01.01.2025
   parseGermanDate("01012025") → Date(2025, 0, 1)    // 01.01.2025
   parseGermanDate("3112") → Date(current_year, 11, 31)
   ```

4. **Row-Parsing:**
   - Spalte 0: Umsatz (Brutto)
   - Spalte 1: Soll/Haben (S/H)
   - Spalte 6: Konto
   - Spalte 7: Gegenkonto
   - Spalte 9: Belegdatum
   - Spalte 10/11: Belegnummer (Belegfeld 1/2)
   - Spalte 13: Buchungstext

5. **Validierung:**
   - Pflichtfelder: Umsatz > 0, S/H, Konto, Gegenkonto, Datum
   - Format-Prüfung: Zahlen, Datum, Konto-Format
   - Warnings: Fehlende optionale Felder

#### 2. DATEV Router (server/datev.ts)

**Endpoints:**

**parse (Mutation)**
```typescript
Input: { fileContent: string, fileName?: string }
Output: {
  success: boolean;
  header: DatevHeader;
  buchungen: DatevBuchung[];
  errors: string[];
  warnings: string[];
  stats: { ... };
}
```
- Parst DATEV-Datei
- Gibt Vorschau zurück
- Speichert NICHT in Datenbank

**import (Mutation)**
```typescript
Input: {
  unternehmenId: number;
  buchungen: Array<DatevBuchung>;
  metadata?: { ... };
}
Output: {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  message: string;
}
```
- Importiert geparste Buchungen in DB
- Filtert ungültige Zeilen automatisch
- Berechnet Netto aus Brutto
- Bestimmt Buchungsart aus Konto
- Setzt Status auf "geprueft"

**export (Query)**
```typescript
Input: {
  unternehmenId: number;
  datumVon?: Date;
  datumBis?: Date;
  status?: "entwurf" | "geprueft" | "exportiert";
}
Output: {
  success: boolean;
  content: string;  // DATEV EXTF Format
  fileName: string;
  count: number;
}
```
- Exportiert Buchungen als DATEV EXTF
- Verwendet Unternehmens-Metadaten
- Filtert nach Datum und Status
- Generiert Download-Dateinamen

**getImportHistory (Query)**
```typescript
Input: { unternehmenId: number; limit?: number }
Output: Array<{
  date: Date;
  count: number;
  firstBuchung: Buchung;
}>
```
- Zeigt letzte Imports
- Gruppiert nach Tag

---

### Frontend (Client)

#### DatevImport.tsx

**Komponenten:**

1. **Unternehmens-Auswahl:**
   - Dropdown mit allen Unternehmen
   - Zeigt Mandantennummer an
   - Erforderlich für Import/Export

2. **File Upload (Drag & Drop):**
   ```typescript
   useDropzone({
     onDrop,
     accept: { "text/csv": [".csv"], "text/plain": [".txt"] },
     maxFiles: 1,
   });
   ```
   - Drag & Drop Zone
   - Akzeptiert .csv und .txt
   - Zeigt Upload-Status

3. **Datei-Informationen:**
   - Format (EXTF/CSV)
   - Beraternummer
   - Mandantennummer
   - Zeitraum (Von - Bis)

4. **Statistik-Karten:**
   - Gesamt-Zeilen
   - Gültige Zeilen (grün)
   - Ungültige Zeilen (rot)
   - Gesamtumsatz

5. **Fehler/Warnungen:**
   - Globale Fehler (Alert-Komponenten)
   - Zeilenbezogene Fehler (in Tabelle)
   - Warnungen (Info-Stil)

6. **Vorschau-Tabelle:**
   - Spalten: Nr, Status, Datum, Beleg, Konto, Gegenkonto, S/H, Betrag, Text
   - Status-Badges: OK (grün), Fehler (rot)
   - Rot hinterlegt bei Fehlern
   - Limit 50 Zeilen Anzeige (mit "...mehr" Hinweis)
   - Fehlertext unter Buchungstext bei Fehlern

7. **Import-Button:**
   - Disabled wenn kein Unternehmen oder keine gültigen Buchungen
   - Zeigt Anzahl zu importierender Buchungen
   - Loading-State während Import

8. **Export-Bereich:**
   - Export-Button (nur wenn Unternehmen gewählt)
   - Generiert DATEV-Datei
   - Automatischer Download

---

## DATEV Format-Spezifikation

### EXTF Header Format

```
"EXTF";Version;Kategorie;Format-Nr;Format-Ver;Erstellt;Importiert;Herkunft;Exportiert;Name;Beraternr;Mandantennr;WJ-Beginn;Sachkontenlänge;Datum-von;Datum-bis;...
```

**Beispiel:**
```
"EXTF";510;"Buchungsstapel";16;1;20250118;;RE;"Buchhaltung Tool";;12345;10001;01;4;0101;3112;
```

**Felder:**
- **Version**: 510 (Standard DATEV EXTF Version)
- **Kategorie**: "Buchungsstapel"
- **Beraternummer**: 4-7 stellig
- **Mandantennummer**: 1-5 stellig
- **WJ-Beginn**: 01-12 (Monat)
- **Sachkontenlänge**: 4 (Standard)
- **Datum-von**: DDMMYYYY
- **Datum-bis**: DDMMYYYY

### CSV Daten Format

**Spalten (Semikolon-getrennt):**

```
Umsatz;S/H;WKZ;Kurs;Basis-Umsatz;WKZ;Konto;Gegenkonto;BU-Schlüssel;Belegdatum;Belegfeld1;Belegfeld2;Skonto;Buchungstext
```

**Beispiel-Zeile:**
```
1234,56;S;EUR;;1234,56;EUR;4400;70000;;0101;RE-2025-001;;;Beratungsleistung Januar
```

**Feld-Details:**
- **Umsatz**: Bruttobetrag mit Komma (1234,56)
- **S/H**: S = Soll (Aufwand), H = Haben (Ertrag)
- **Konto**: Sachkonto (SKR03/SKR04)
- **Gegenkonto**: Debitor/Kreditor-Konto
- **Belegdatum**: DDMM oder DDMMYYYY
- **Belegfeld 1/2**: Belegnummer (kombiniert)
- **Buchungstext**: Beschreibung

---

## Verwendung

### Import-Workflow

1. **DATEV-Datei vorbereiten:**
   - DATEV-Export aus Steuerberater-Software
   - Als .csv oder .txt speichern
   - Muss EXTF oder Standard-CSV sein

2. **In Anwendung importieren:**
   - Navigation: `DATEV Import` (im Menü)
   - Unternehmen auswählen
   - Datei hochladen (Drag & Drop oder Click)
   - Vorschau prüfen (Fehler/Warnungen beachten)
   - "Buchungen importieren" klicken

3. **Ergebnis:**
   - Success-Toast mit Anzahl importierter Buchungen
   - Buchungen erscheinen in `/uebersicht`
   - Status: "geprueft"

### Export-Workflow

1. **Buchungen vorbereiten:**
   - Sicherstellen dass Buchungen vollständig sind
   - Optional: Status auf "exportiert" setzen

2. **Export starten:**
   - Navigation: `DATEV Import`
   - Unternehmen auswählen
   - "Buchungen exportieren" klicken

3. **Datei erhalten:**
   - Browser lädt .csv-Datei herunter
   - Dateiname: `EXTF_[Mandantennr]_[Datum].csv`
   - Kann an Steuerberater gesendet werden

---

## Mapping: DATEV → Buchungen

| DATEV Feld | Buchungen Feld | Logik |
|------------|----------------|-------|
| Umsatz | bruttobetrag | Direkt |
| - | nettobetrag | Berechnet: Brutto / (1 + USt%) |
| - | steuersatz | Standard: 19% (TODO: aus BU-Schlüssel) |
| Konto | sachkonto | Direkt |
| Gegenkonto | geschaeftspartnerKonto | Direkt |
| Belegdatum | belegdatum | Parse DDMM/DDMMYYYY |
| Belegfeld 1/2 | belegnummer | Kombiniert |
| Buchungstext | buchungstext | Direkt |
| S/H + Konto | buchungsart | Heuristik: 4xxx=Ertrag, 6xxx=Aufwand |
| Gegenkonto | geschaeftspartnerTyp | Heuristik: 7xxx=Kreditor, 1xxx=Debitor |

### Buchungsart-Erkennung

```typescript
const kontoFirstDigit = parseInt(konto.charAt(0), 10);

if (kontoFirstDigit === 4) {
  buchungsart = "ertrag";
} else if (kontoFirstDigit >= 6 && kontoFirstDigit <= 7) {
  buchungsart = "aufwand";
} else if (kontoFirstDigit === 0) {
  buchungsart = "anlage";
} else {
  buchungsart = "sonstig";
}
```

### Geschäftspartner-Typ-Erkennung

```typescript
const gegenkontoFirstDigit = parseInt(gegenkonto.charAt(0), 10);

if (gegenkontoFirstDigit === 7) {
  geschaeftspartnerTyp = "kreditor";
} else if (gegenkontoFirstDigit === 1) {
  geschaeftspartnerTyp = "debitor";
} else {
  geschaeftspartnerTyp = "sonstig";
}
```

---

## Validierung

### Import-Validierung

**Pflichtfelder:**
- ✅ Umsatz > 0
- ✅ Soll/Haben (S oder H)
- ✅ Konto (nicht leer)
- ✅ Gegenkonto (nicht leer)
- ✅ Belegdatum (gültiges Datum)

**Optionale Felder:**
- ⚠️ Belegnummer (generiert Zeilennummer falls fehlt)
- ⚠️ Buchungstext (Warnung falls fehlt)

**Format-Validierung:**
- Zahlen: Muss parsebar sein
- Datum: DDMM oder DDMMYYYY
- S/H: Genau "S" oder "H"

### Fehlerbehandlung

**Parser-Fehler:**
- Zeile: "Umsatz ist erforderlich und muss > 0 sein"
- Zeile: "Soll/Haben muss 'S' oder 'H' sein"
- Zeile: "Belegdatum ist erforderlich (Format: DDMM oder DDMMYYYY)"

**Import-Fehler:**
- Ungültige Zeilen werden übersprungen
- Fehler-Array enthält Details pro Zeile
- Success-Message zeigt Anzahl importierter vs. fehlgeschlagener Buchungen

---

## Testing

### Manueller Test-Flow

1. **Test-Datei erstellen:**

```csv
"EXTF";510;"Buchungsstapel";16;1;20250118;;RE;"Test";;12345;10001;01;4;0101;3112;
"Umsatz";"S/H";"WKZ";"Kurs";"Basis";"WKZ";"Konto";"Gegenkonto";"BU";"Datum";"Beleg1";"Beleg2";"Skonto";"Text"
119,00;S;EUR;;100,00;EUR;4400;10001;;0101;RE-001;;;Testbuchung 1
238,00;H;EUR;;200,00;EUR;6800;70000;;1501;ER-001;;;Testbuchung 2
```

2. **Import testen:**
   - Datei speichern als test.csv
   - In DATEV Import hochladen
   - Vorschau prüfen: 2 Buchungen, beide OK
   - Import durchführen
   - In Übersicht prüfen: 2 neue Buchungen

3. **Export testen:**
   - DATEV Export klicken
   - Datei öffnen und prüfen
   - Struktur sollte identisch sein

### Fehler-Test

**Ungültige Zeilen:**
```csv
0,00;S;EUR;;0,00;EUR;4400;10001;;0101;RE-002;;;Fehler: Umsatz = 0
119,00;X;EUR;;100,00;EUR;4400;10001;;0101;RE-003;;;Fehler: S/H ungültig
119,00;S;EUR;;100,00;EUR;;;0101;RE-004;;;Fehler: Konto fehlt
```

**Erwartetes Verhalten:**
- Parse-Phase: Alle 3 Zeilen als "ungültig" markiert
- Preview: Rot hinterlegt mit Fehlertext
- Import: Nur gültige Zeilen werden importiert

---

## Troubleshooting

### Problem: "Ungültiges DATEV-Format"

**Ursache:**
- Datei ist keine CSV oder hat falsches Format
- Zu wenig Spalten
- Falsche Kodierung

**Lösung:**
- Datei in Texteditor öffnen
- Prüfen: Semikolon als Trenner?
- Prüfen: Mindestens 10 Spalten?
- UTF-8 Kodierung verwenden

### Problem: Alle Zahlen sind 0

**Ursache:**
- Englisches Zahlenformat (Punkt statt Komma)

**Lösung:**
- Parser erwartet deutsches Format: 1234,56
- In Excel: Region auf Deutschland stellen
- Beim Export "Deutsch" wählen

### Problem: Datum-Fehler "ungültig"

**Ursache:**
- Falsches Format (z.B. DD.MM.YYYY mit Punkten)
- Ungültige Daten (32.01., 00.00.)

**Lösung:**
- DDMM (0101) oder DDMMYYYY (01012025)
- Keine Trennzeichen
- Gültige Datumswerte (Tag 1-31, Monat 1-12)

### Problem: Import schlägt fehl "Datenbank nicht verfügbar"

**Ursache:**
- DB-Verbindung unterbrochen
- Berechtigungsproblem

**Lösung:**
- Seite neu laden
- Prüfen: Ist Unternehmen ausgewählt?
- Prüfen: Hat User Zugriff auf Unternehmen?

---

## Erweiterungsmöglichkeiten

### Kurzfristig

1. **BU-Schlüssel Mapping:**
   - Automatische Steuersatz-Erkennung aus BU-Schlüssel
   - 40 = 19%, 41 = 7%, etc.

2. **Konten-Validierung:**
   - Prüfen ob Konto in Sachkonten-Tabelle existiert
   - Warnung bei unbekannten Konten

3. **Import-Duplikat-Erkennung:**
   - Prüfen auf Belegnummer + Datum
   - Warnung bei Duplikaten

4. **Erweiterte Filter:**
   - Export nach Kostenstelle
   - Export nach Geschäftspartner

### Mittelfristig

1. **DATEV Unternehmen Online API:**
   - Direkter Upload zu DATEV Cloud
   - Keine manuellen Dateien mehr

2. **Import-Historie:**
   - Detaillierte Liste aller Imports
   - Re-Import verhindern
   - Rollback-Funktion

3. **CSV-Konfigurator:**
   - User kann Spalten-Mapping anpassen
   - Verschiedene DATEV-Versionen unterstützen

4. **Validierungsregeln:**
   - Custom Regeln pro Unternehmen
   - Kontenplan-spezifische Validierung

### Langfristig

1. **Automatisierte Imports:**
   - Scheduled Import aus Dropbox/Google Drive
   - E-Mail-Attachment Import

2. **DATEV-Schnittstelle:**
   - Direkter Daten-Sync
   - Echtzeit-Abgleich

3. **Machine Learning:**
   - Automatische Buchungstext-Vervollständigung
   - Konto-Vorschläge basierend auf Text

---

## Sicherheit

### Implementierte Maßnahmen

1. **Input-Validierung:**
   - Alle Felder werden validiert
   - Zahlen: Nur numerisch
   - Datum: Nur gültige Daten
   - Konto: Nur alphanumerisch

2. **File-Type Validation:**
   - Nur .csv und .txt erlaubt
   - Format-Check vor Parsing

3. **SQL-Injection Schutz:**
   - Drizzle ORM verhindert SQL-Injection
   - Keine Raw-Queries

4. **XSS-Schutz:**
   - React escaped alle Outputs
   - Keine dangerouslySetInnerHTML

5. **Berechtigungsprüfung:**
   - User muss Zugriff auf Unternehmen haben
   - protectedProcedure für alle Endpoints

### Best Practices

1. **File Size Limits:**
   - TODO: Max. File Size implementieren (z.B. 10 MB)
   - Verhindert Memory-Probleme

2. **Rate Limiting:**
   - TODO: Max. Imports pro Stunde
   - Verhindert Missbrauch

3. **Audit-Log:**
   - Imports im Aktivitätsprotokoll tracken
   - Wer hat wann was importiert

---

## Performance

### Optimierungen

1. **Bulk-Insert:**
   - Alle Buchungen in einer Transaction
   - Schneller als einzelne Inserts

2. **Chunking:**
   - TODO: Große Dateien in Chunks parsen
   - Verhindert Memory-Overflow

3. **Worker-Thread:**
   - TODO: Parsing in separatem Thread
   - UI bleibt responsiv

### Limits

- **Max. Zeilen pro Import:** ~5000 (empfohlen)
- **Max. File Size:** 10 MB (TODO: implementieren)
- **Timeout:** 2 Minuten (tRPC Default)

---

## Changelog

### Version 1.0.0 (2026-01-18)

**Implementiert:**
- ✅ DATEV EXTF/CSV Parser
- ✅ Deutsche Zahlen- und Datumsformate
- ✅ Row-Level Validierung
- ✅ Import zu Datenbank
- ✅ Export zu DATEV
- ✅ Drag & Drop UI
- ✅ Preview-Tabelle
- ✅ Error Handling
- ✅ Navigation Integration

**Bekannte Limitierungen:**
- BU-Schlüssel wird nicht ausgewertet (Steuersatz ist fix 19%)
- Keine Duplikat-Erkennung
- Keine Konten-Validierung
- Kein File-Size Limit
- Kein Rate Limiting

---

## Support

Bei Fragen oder Problemen:
1. Diese Dokumentation lesen
2. Code-Kommentare prüfen (server/lib/datev-parser.ts)
3. DATEV-Spezifikation konsultieren
4. GitHub Issue erstellen

**Wichtige Dateien:**
- `server/lib/datev-parser.ts` - Parser-Logik
- `server/datev.ts` - tRPC Endpoints
- `client/src/pages/DatevImport.tsx` - UI-Komponente
