# Project TODO

- [x] Datenbank-Schema für Unternehmen/Mandanten erstellen
- [x] Datenbank-Schema für Buchungen erstellen
- [x] Datenbank-Schema für Stammdaten (Kreditoren, Debitoren, etc.) erstellen
- [x] Kontenrahmen SKR 03 und SKR 04 implementieren
- [x] Unternehmensverwaltung (Mandanten) UI erstellen
- [ ] Unternehmensauswahl im Header/Dashboard
- [ ] Buchungen mit Datenbank verbinden
- [ ] Stammdaten mit Datenbank verbinden
- [ ] DATEV-Export pro Unternehmen
- [x] Home.tsx TypeScript-Fehler beheben (useAuth Import)
- [ ] Login-Problem beheben - Anwendung ohne Authentifizierung nutzbar machen
- [x] Benutzerdefinierte Benachrichtigungen implementieren
- [ ] Supabase als externe Datenbank konfigurieren (verschoben auf später)
- [ ] Datenbank-Schema für PostgreSQL anpassen (verschoben auf später)
- [ ] Supabase-Verbindung testen (verschoben auf später)
- [ ] Tabellen in Supabase erstellen (verschoben auf später)
- [x] Rollen und Berechtigungen implementieren (Administrator, Buchhalter, Nur-Lesen)
- [x] Benutzer-Unternehmen-Zuordnung implementieren
- [x] Aktivitätsprotokoll implementieren
- [x] Mitarbeiter-Dashboard mit Login-Schutz erstellen
- [x] Admin-Board für Rechteverwaltung erstellen
- [x] Navigation und Routing für Dashboard/Admin-Board anpassen
- [x] Login-Seite für Mitarbeiter-Registrierung erstellen
- [x] Farbcodierung pro Firma implementieren
- [x] Logo-Upload pro Unternehmen implementieren
- [x] Firmenname prominent im Header anzeigen
- [x] Datenbank-Schema für Farbe und Logo erweitern
- [x] Beleg-Vorschau-Komponente erstellen (PDF, JPG, PNG)
- [x] Vorschau neben dem Buchungsformular integrieren
- [x] Datenbank-Schema für Einladungen erstellen
- [x] API-Endpunkte für Einladungen implementieren
- [x] Einladungs-UI im Admin-Board erstellen
- [x] Einladungsannahme-Seite erstellen
- [ ] E-Mail-Versand für Einladungen implementieren
- [x] OAuth-Callback-Fehler beheben ("OAuth callback failed")
- [x] Einheitliche Navigationskomponente erstellen
- [x] Navigation in alle Seiten integrieren
- [x] Korrekte Verknüpfungen zwischen allen Bereichen
- [ ] Nutzerverwaltung im Admin-Board sichtbar machen
- [x] Fehlermeldungen beim Anlegen eines Unternehmens beheben (Manus-DB verwendet)
- [x] Dashboard mit Kennzahlen erstellen (Einnahmen, Ausgaben, Gewinn/Verlust)
- [x] API-Endpunkte für Kennzahlen-Berechnung
- [x] Diagramme für Einnahmen/Ausgaben über Zeit
- [x] Gewinn- und Verlustrechnung visualisieren
- [x] OCR-Integration für automatische Belegerkennung
- [x] Belegdaten automatisch extrahieren (Datum, Betrag, Steuersatz, Lieferant)
- [x] OCR-Ergebnisse in Buchungsformular übernehmen
- [x] PDF-Export für BWA (Betriebswirtschaftliche Auswertung)
- [x] PDF-Export für Kennzahlen-Übersicht
- [x] PDF-Export für Summen- und Saldenliste
- [x] Unterscheidung bezahlt/unbezahlt für Rechnungen
- [x] Datenbank-Schema um Zahlungsstatus erweitern
- [x] Übersicht offener Rechnungen erstellen
- [x] Zahlungsstatus in Buchungsliste anzeigen
- [x] Filter für bezahlt/unbezahlt hinzufügen
- [x] Zahlungen-Seite mit Statistik-Karten erstellen
- [x] Zahlungsstatus-Update-Funktion implementieren

## Fälligkeitskalender
- [x] Kalender-Komponente mit Monatsansicht erstellen
- [x] API-Endpunkt für Fälligkeiten im Zeitraum implementieren
- [x] Fälligkeitskalender-Seite erstellen
- [x] Navigation um Kalender-Link erweitern
- [x] Farbcodierung nach Zahlungsstatus (offen, überfällig, bezahlt)
- [x] Klick auf Tag zeigt Details der Fälligkeiten
- [x] Monatswechsel-Navigation implementieren
- [x] Monatsstatistiken mit offenen/überfälligen Beträgen
- [x] Nächste Fälligkeiten-Tabelle


## Mitarbeiter-Einladung und Rechteverwaltung
- [x] Datenbank-Schema für detaillierte Berechtigungen erweitern
- [x] API-Endpunkte für Berechtigungsverwaltung erstellen
- [x] Berechtigungs-UI im Admin-Board implementieren
- [x] Berechtigungsprüfung in allen relevanten Komponenten
- [x] Separate Rechte für: Buchungen (lesen/schreiben), Stammdaten (lesen/schreiben), Berichte (lesen/exportieren)
- [x] Rollen-Vorlagen (Admin, Buchhalter, Viewer) mit Standard-Berechtigungen
- [x] Tests für Berechtigungsverwaltung


## Bug-Fixes
- [x] Bug beim Unternehmen anlegen beheben - Failed query: insert into unternehmen (leere Strings wurden nicht korrekt behandelt)


## Unternehmen bearbeiten
- [x] Bearbeitungs-Dialog für bestehende Unternehmen erstellen
- [x] Formular mit vorausgefüllten Daten anzeigen
- [x] Logo-Änderung ermöglichen
- [x] Farbe-Änderung ermöglichen
- [x] Speichern-Funktion mit Erfolgsmeldung
- [x] API-Endpunkt um farbe und logoUrl erweitert
- [x] Tests für Unternehmen-Update erstellt

- [x] Bug beim Unternehmen anlegen erneut beheben - logoUrl-Spalte auf TEXT erweitert

- [x] Login-Problem beheben - Benutzer war eingeloggt, nur kein Unternehmen zugeordnet
- [x] logoUrl-Spalte auf TEXT erweitern für base64-Logos (varchar(500) war zu kurz)

- [x] 404-Fehler beim Anmelden beheben (useAuth.ts verwendete falsche Login-URL)


## Automatische Weiterleitung nach Login
- [x] Return-URL vor Login speichern (localStorage und State-Parameter)
- [x] OAuth-State um Return-URL erweitern (JSON-Format)
- [x] Nach erfolgreichem Login zur gespeicherten URL weiterleiten
- [x] Fallback auf Dashboard wenn keine Return-URL vorhanden
- [x] Sicherheitsvalidierung gegen Open-Redirect-Angriffe
- [x] Tests für Return-URL-Funktionalität (11 Tests)


## Verbesserte Einladungsfunktion
- [x] E-Mail-Einladung für nicht-registrierte Benutzer ermöglichen
- [x] Einladungslink mit Token generieren (bereits implementiert)
- [x] Einladungsseite für eingeladene Benutzer (bereits implementiert)
- [x] Nach Registrierung automatisch zur Einladung weiterleiten
- [x] Button-Text verbessert: "Anmelden oder Registrieren"
- [x] Hinweistext im Admin-Board verbessert


## Automatischer E-Mail-Versand für Einladungen
- [x] Resend-Integration implementiert
- [x] E-Mail-Template für Einladungen erstellt (HTML + Text)
- [x] Automatischen E-Mail-Versand bei Einladungserstellung implementiert
- [x] Erfolgs-/Fehlermeldung für E-Mail-Versand im UI anzeigen
- [x] Hinweis wenn E-Mail-Versand nicht konfiguriert ist


## Bug-Fix: Einladung für nicht-registrierte Benutzer
- [x] Problem analysieren: Einladung funktioniert nur für bereits registrierte Benutzer
- [x] Einladungsflow korrigieren sodass auch neue Benutzer eingeladen werden können
- [x] Nach OAuth-Registrierung automatisch Einladung annehmen (E-Mail-Prüfung entfernt)


## Internationale Unternehmen (DE, AT, CH, UK, CY)
- [x] Länderauswahl im Unternehmen-Formular hinzufügen
- [x] Länderspezifische Kontenrahmen (SKR03/04 für DE, ÖKR für AT, KMU für CH, UK GAAP, CY)
- [x] Währungsunterstützung (EUR, CHF, GBP)
- [x] Länderspezifische Rechtsformen pro Land
- [x] Datenbank-Schema um landCode und waehrung erweitert


## Bug-Fix: Eingeladener Admin sieht Firma nicht
- [ ] Problem analysieren: n.gross@angelus.group sieht Firma Commercehelden nicht
- [ ] Benutzer-Unternehmen-Zuordnung in Datenbank prüfen
- [ ] Einladungsannahme-Flow korrigieren falls nötig


## Logout-Button im Header
- [x] Benutzer-Dropdown-Menü im Header implementiert
- [x] Logout-Button mit roter Hervorhebung hinzugefügt
- [x] Benutzer-Initialen als Avatar angezeigt
- [x] Menü mit "Mein Dashboard", "Einstellungen" und "Abmelden"


## OCR-Verbesserung
- [x] OCR mit Vision-AI (Gemini) für echte Bilderkennung implementieren
- [x] Beträge besser aus Rechnungen extrahieren
- [x] Geschäftspartner automatisch erkennen
- [x] Automatische OCR-Analyse beim Beleg-Upload
- [x] Manueller Analyse-Button für erneute Erkennung


## BWA-Import Alpenland Heizungswasser KG
- [x] BWA-PDF analysiert und Daten extrahiert
- [x] Sachkonten als JSON-Vorlage gespeichert (Tabelle existiert noch nicht)
- [x] Kreditoren (Lieferanten) in Datenbank importiert (40 Einträge)
- [x] Debitoren (Kunden) in Datenbank importiert (4 Einträge)


## Sachkonten-Tabelle
- [x] Sachkonten-Tabelle im Schema definieren
- [x] Datenbank-Migration durchgeführt
- [x] SKR04-Konten aus JSON importiert (70+ Konten)


## Sachkonten-Dropdown in Buchungsmaske
- [x] API-Endpunkt für Sachkonten erstellen (list und listGrouped)
- [x] Sachkonten-Dropdown in der Buchungsmaske implementieren
- [x] Kategorien als Gruppen im Dropdown anzeigen
- [x] Unit-Tests für Sachkonten-Router erstellt


## Erweiterte Sachkonten-Funktionen
- [x] Sachkonten in der Stammdaten-Seite anzeigen und bearbeiten
- [x] Suchfunktion im Sachkonto-Dropdown implementieren (Combobox mit Suche)
- [x] Standard-Sachkonto pro Lieferant (Kreditor) hinzugefügt
- [x] Automatische Sachkonto-Vorschläge bei Lieferantenauswahl


## PDF-OCR
- [x] PDF-zu-Bild-Konvertierung im Backend implementieren (pdftoppm)
- [x] OCR-Endpunkt für PDF-Dateien erweitern (analyzePdf)
- [x] Frontend für PDF-Upload mit OCR anpassen


## Bug-Fix: Kreditoren/Debitoren aus Datenbank laden
- [x] Kreditoren aus Datenbank laden statt localStorage
- [x] Debitoren aus Datenbank laden statt localStorage
- [x] Stammdaten-Seite mit Datenbank-Queries aktualisieren


## Kreditor/Debitor Konvertierung
- [x] API-Endpunkt für Kreditor → Debitor Konvertierung
- [x] API-Endpunkt für Debitor → Kreditor Konvertierung
- [x] Konvertierungs-Button in der UI hinzugefügt
- [x] Falsch zugeordnete Einträge (10000-10999) korrigiert (40 Einträge zu Debitoren verschoben)


## Vollständiger Debitoren-Import aus Summen und Salden
- [x] Debitoren aus Blatt 6 extrahieren (10000xx)
- [x] Debitoren aus Blatt 7 extrahieren (10101xx - 10601xx)
- [x] Debitoren aus Blatt 8 extrahieren (10601xx - 11401xx)
- [x] Debitoren aus Blatt 9 extrahieren (11401xx - 12701xx + 20000xx)
- [x] Alle 171 Debitoren in Datenbank importiert


## Vollständiger Kreditoren-Import aus Summen und Salden
- [x] Kreditoren aus Blatt 11 extrahieren (70000xx)
- [x] Kreditoren aus Blatt 12 extrahieren (70000xx - 70301xx)
- [x] Kreditoren aus Blatt 13 extrahieren (70301xx - 71001xx)
- [x] Kreditoren aus Blatt 14 extrahieren (71101xx - 72301xx)
- [x] Kreditoren aus Blatt 15 extrahieren (72301xx - 80001xx)
- [x] Alle 194 Kreditoren in Datenbank importiert


## Angelus Managementberatung und Service KG - Stammdaten Import
- [x] Debitoren aus BWA extrahiert (24 Einträge)
- [x] Kreditoren aus BWA extrahiert (183 Einträge)
- [x] Alle Debitoren in Datenbank importiert
- [x] Alle Kreditoren in Datenbank importiert


## Alpenland - Steuerberater Stammdaten Import (07.01.2026)
- [x] Kreditoren-Stammdaten vom Steuerberater importiert (442 aktualisiert mit Adresse, USt-ID, IBAN)
- [x] Debitoren-Stammdaten vom Steuerberater importiert (171 aktualisiert, 329 neu eingefügt)


## Angelus - Steuerberater Stammdaten Import (07.01.2026)
- [x] Kreditoren-Stammdaten vom Steuerberater importiert (183 aktualisiert, 131 neu = 314 gesamt)
- [x] Debitoren-Stammdaten vom Steuerberater importiert (24 aktualisiert, 22 neu = 46 gesamt)


## Buchungen-Seite Verbesserung
- [x] Bei Beleg-Upload automatisch Belegdatum erkennen und anzeigen
- [x] Bei Beleg-Upload automatisch Belegnummer erkennen und anzeigen
- [x] Bei Beleg-Upload automatisch Kontoverbindung (IBAN) erkennen und anzeigen
- [x] USt-ID wird ebenfalls erkannt und angezeigt


## Kreditor-Matching und Zahlungsstatus
- [x] IBAN-Matching: Erkannte IBAN automatisch mit Kreditoren-Stammdaten abgleichen
- [x] Zahlungsstatus-Feld hinzufügen (bezahlt/offen/teilbezahlt/storniert)
- [x] Fälligkeitsdatum-Feld hinzufügen (Standard: 14 Tage nach Belegdatum)
- [x] UI für Zahlungsstatus und Fälligkeit in Buchungskarte
- [x] Überfällig-Warnung bei offenen Rechnungen
- [x] Automatisches Zahlungsdatum bei Status "bezahlt"


## Finanzamtskommunikation Modul
- [x] Datenbank-Schema für Finanzamt-Dokumente (Schriftverkehr, Bescheide, Einsprüche, Mahnungen, Anfragen, Prüfungen)
- [x] Backend-Router für CRUD-Operationen
- [x] Finanzamt-Seite mit Dokumenten-Upload und Kategorisierung
- [x] Bescheide-Verwaltung mit Fristen und Steuerarten (USt, ESt, KSt, GewSt, LSt, KapESt)
- [x] Einsprüche-Tracking mit Status (neu, in Bearbeitung, Einspruch, erledigt, archiviert)
- [x] Automatische To-Do-Erstellung bei Fristen und Zahlungsfristen
- [x] Statistik-Dashboard für Finanzamt-Dokumente
- [x] Unit-Tests erstellt

## Interne Aufgaben und To-Dos Modul
- [x] Datenbank-Schema für Aufgaben
- [x] Backend-Router für Aufgaben-CRUD
- [x] Aufgaben-Seite mit Liste und Filterung
- [x] Aufgaben-Erstellung mit Fälligkeit und Priorität (niedrig, normal, hoch, dringend)
- [x] Kategorien: Finanzamt, Buchhaltung, Steuern, Personal, Allgemein, Frist, Zahlung, Prüfung
- [x] Status-Tracking (offen, in Bearbeitung, wartend, erledigt, storniert)
- [x] CSV-Export für Aufgaben
- [x] Integration mit Finanzamt-Modul (automatische Aufgaben bei Fristen)
- [x] Navigation in AppHeader integriert
- [x] Unit-Tests erstellt


## Datei-Upload für Finanzamt-Dokumente
- [x] Datei-Upload-Komponente in Finanzamt-Dialog integrieren
- [x] Dateien zu S3 hochladen und URL speichern (Backend vorbereitet)
- [x] Datei-Vorschau und Download in Dokumenten-Liste
- [ ] Mehrere Dateien pro Dokument ermöglichen (später)

## Aufgaben-Zuweisung an Teammitglieder
- [x] Benutzer-Dropdown für Zuweisung in Aufgaben-Dialog
- [x] Zugewiesene Person in Aufgaben-Liste anzeigen
- [x] Filter "Meine Aufgaben" bereits im Backend (nurMeine Parameter)
- [ ] E-Mail-Benachrichtigung bei Zuweisung (später)

## Dashboard-Integration
- [x] Offene Aufgaben Widget auf Startseite
- [x] Überfällige Fristen Widget auf Startseite
- [x] Finanzamt-Fristen Widget auf Startseite
- [x] Dringende Aufgaben Widget auf Startseite
- [x] Klickbare Widgets mit Navigation zu Aufgaben/Finanzamt


## Bug-Fix: Datei-Upload Finanzamt funktioniert nicht
- [x] Problem analysiert: dateiUrl Spalte war TEXT (65KB max), zu klein für Base64-PDFs
- [x] Spalte auf MEDIUMTEXT geändert (16MB max)
- [x] Upload-Funktion getestet und funktioniert


## S3-Storage für Finanzamt-Dateien
- [x] S3-Upload-Endpunkt für Finanzamt-Dateien erstellen (uploadDatei Mutation)
- [x] Frontend auf S3-Upload umstellen
- [x] Datei-URL statt Base64 in Datenbank speichern

## PDF-Vorschau im Finanzamt-Dialog
- [x] PDF-Vorschau-Komponente im Dialog integrieren (iframe)
- [x] Vorschau für Bilder (JPG, PNG, GIF, WebP) hinzufügen
- [x] Vorschau beim Hochladen anzeigen

## Drag & Drop für Finanzamt-Dateien
- [x] Drag & Drop Zone im Dialog implementieren
- [x] Visuelles Feedback beim Ziehen (Farbwechsel, Icon)
- [ ] Mehrere Dateien unterstützen (optional - später)

## Dokumenten-Versionierung

- [x] Datenbank-Schema für Dokumenten-Versionen erstellt (finanzamt_dok_versionen)
- [x] Backend-Endpunkte für Versionierung (versionen, addVersion, deleteVersion)
- [x] UI für Versionshistorie in Dokumenten-Ansicht (Dialog mit bestehenden Versionen)
- [x] Verknüpfung zwischen Bescheid → Einspruch → Antwort (Versionstypen)
- [x] Versionstypen: Original, Einspruch, Antwort, Ergänzung, Korrektur, Anlage
- [x] Datei-Upload für jede Version
- [x] Unit-Tests für Versionierung erstellt

## OCR für Finanzamt-Dokumente
- [x] OCR-Endpunkt für Finanzamt-Dokumente erstellt (ocrAnalyse mit Vision AI)
- [x] Automatische Extraktion von Aktenzeichen
- [x] Automatische Extraktion von Beträgen
- [x] Automatische Extraktion von Fristen und Zahlungsfristen
- [x] Automatische Extraktion von Steuerart und Steuerjahr
- [x] Automatische Extraktion von Betreff und Zusammenfassung
- [x] UI für OCR-Ergebnisse im Upload-Dialog (blauer OCR-Button)
- [x] Automatische Übernahme erkannter Daten ins Formular
- [x] Unit-Tests für OCR erstellt


## Erweiterte Sortierung für Finanzamt-Dokumente
- [x] Sortier-Dropdown im Filter-Bereich hinzugefügt
- [x] Sortierung nach Datum (neueste/älteste zuerst)
- [x] Sortierung nach Aktenzeichen (A-Z, Z-A)
- [x] Sortierung nach Steuerjahr (neuestes/ältestes zuerst)
- [x] Sortierung nach Betrag (höchster/niedrigster)
- [x] Gruppierung nach Steuerart (USt, ESt, KSt, etc.) mit kompakter Ansicht
- [x] Unit-Tests für Sortierung und Gruppierung erstellt (15 Tests)


## Zusätzliche Gruppierungsoptionen
- [x] Gruppierung nach Steuerjahr hinzugefügt (absteigend sortiert, "Ohne Steuerjahr" separat)
- [x] Gruppierung nach Dokumententyp hinzugefügt (Bescheid, Einspruch, Mahnung, etc.)
- [x] Unit-Tests aktualisiert (7 neue Tests, 239 gesamt)


## Farbige Icons für Dokumententypen
- [x] Farbige Icons für jeden Dokumententyp in gruppierter Ansicht
- [x] Bescheid (blau), Einspruch (lila), Mahnung (rot), Schriftverkehr (grau), Anfrage (amber), Betriebsprüfung (orange)
- [x] Farbige Hintergrund-Badges für bessere Sichtbarkeit
- [x] Gruppen-Icons passen sich dem Gruppierungstyp an


## Steuerberater-Datenübergabe-Tracking (Phase 1)
- [x] Datenbank-Schema für Übergaben erstellt (stb_uebergaben, stb_uebergabe_positionen)
- [x] Backend-Router für CRUD-Operationen (list, getById, create, update, delete, addPositionen, removePosition, statistiken, nichtUebergebeneBuchungen, exportProtokoll)
- [x] Steuerberater-Seite mit Übergabe-Verwaltung erstellt
- [x] Buchungen als "an Steuerberater übergeben" markieren (Interface erweitert)
- [x] Übergabe-Historie mit Filterung nach Status
- [x] Export-Funktion für Übergabe-Protokolle (CSV)
- [x] Statistiken-Dashboard (Gesamt, Vorbereitet, Übergeben, Rückfragen, Abgeschlossen, Gesamtbetrag)
- [x] Navigation in AppHeader integriert
- [x] Unit-Tests erstellt (12 Tests)
- [ ] Navigation in AppHeader integrieren


## Steuerberater-Aufwands-Kontrolle (Phase 2)
- [ ] Datenbank-Schema für Steuerberater-Rechnungen erstellen (stb_rechnungen)
- [ ] Datenbank-Schema für Leistungspositionen erstellen (stb_rechnung_positionen)
- [ ] Kategorisierung: Notwendig vs. Vermeidbar (Nachfragen, Korrekturen, fehlende Belege)
- [ ] Backend-Router für Rechnungen CRUD
- [ ] Backend-Router für Aufwands-Analyse und Kennzahlen
- [ ] Rechnungs-Erfassung UI auf Steuerberater-Seite
- [ ] Leistungspositionen mit Kategorisierung erfassen
- [ ] Aufwands-Analyse Dashboard (Kosten pro Buchung, Fehlerquote, vermeidbare Kosten)
- [ ] Jahresvergleich der Steuerberater-Kosten
- [ ] Empfehlungen zur Kostenreduktion
