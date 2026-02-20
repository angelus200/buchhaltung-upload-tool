# PROJEKTBERICHT

**Buchhaltung-KI.App — Vollständige Buchhaltungsanwendung mit KI**

Stand: 20. Februar 2026, 17:35 Uhr | Version 4.0

---

## 1. PROJEKTÜBERSICHT

**Anwendung: buchhaltung-ki.app — Vollständige Buchhaltungsanwendung mit KI-Unterstützung**

Ziel: Automatisierung der Buchhaltung für 32 Firmen (DE/AT/CH), Ablösung externer Steuerberater

**Auftraggeber: Thomas Gross, CEO Angelus Group**

Testerinnen: Franziska Schmid, Cornelia Mayer, Isabel Anders

Steuerberaterin: Mariola Bonzani

| Eigenschaft | Wert |
|---|---|
| Live-URL | https://www.buchhaltung-ki.app |
| Kunden-URL (geplant) | https://app.buchhaltung-ki.app |
| Repository | ~/Desktop/buchhaltung-upload-tool |
| Hosting | Railway Pro Plan, us-west2, Auto-Deploy via GitHub |
| Domain | IONOS (buchhaltung-ki.app) |
| Letzter Deploy | Commit f743a01, 20.02.2026 17:25 |
| Build-Status | ✅ Erfolgreich, keine Warnungen |

---

## 2. TECH STACK

| Komponente | Technologie | Version |
|---|---|---|
| Frontend | React, TypeScript, Vite | React 19, Vite 7.3.1 |
| Styling | Tailwind CSS, shadcn/ui | — |
| Backend | Express.js, tRPC | — |
| Datenbank | MySQL, Drizzle ORM | 52 Tabellen |
| Auth | Clerk | Multi-Tenant mit Rollen |
| KI/OCR | Claude Vision API (Anthropic) | Beleg-OCR + Buchungsvorschläge |
| Hosting | Railway Pro Plan | Dockerfile, ~80s Build |
| Versionskontrolle | Git/GitHub | Auto-Deploy bei Push |

---

## 3. FIRMENSTRUKTUR (6 von 32 angelegt)

| Kürzel | Firma | Land | Kontenrahmen | Buchungen |
|---|---|---|---|---|
| ANG | Angelus Managementberatungs und Service KG | DE | SKR04 | 15.716 |
| ALP | Alpenland Heizungswasser KG | DE | SKR04 | 24.987 |
| CH1 | commercehelden GmbH | AT | OeKR | 0 |
| CH2 | Emo Retail OG | AT | RLG | 0 |
| TM | Trademark24-7 AG | CH | KMU | 19 |
| MP | Marketplace24-7 GmbH | CH | OR | 0 |

**Gesamt: 66 Finanzkonten, 6 Firmen, 3 Länder, 4 Kontenrahmen, ~40.722 Buchungen, ~30 Mio EUR**

---

## 4. IMPLEMENTIERTE FEATURES

### 4.1 Kernfunktionen Buchhaltung
- Vollständige CRUD-Operationen für Stammdaten (Kreditoren, Debitoren, Sachkonten, Gesellschafter)
- Buchungsübersicht mit Such-/Filter-/Paginierungsfunktionen
- DATEV-Import und -Export
- BWA-Report-Generierung, Jahresabschluss, Eröffnungsbilanz, Monatsabschluss
- Steuerberater-Rechnungen mit Leistungspositionen und Übergaben

### 4.2 Finanzkonten & Kontoauszüge
- 66 Finanzkonten über 6 Firmen (Banken, Kreditkarten, Zahlungsdienstleister)
- CSV-Import mit automatischer Formaterkennung (12 Bankformate)
- Detail-Ansicht mit Einzelpositionen, Buchungserstellung, AI-Vorschlag, Zuordnung
- Auto-Zuordnung: ±3 Tage / 2 Cent Toleranz; Manuell: ±7 Tage / 5 Cent

### 4.3 CSV-Formate (12)

| Nr | Format | Land |
|---|---|---|
| 1 | Sparkasse | DE |
| 2 | VR Bank | DE |
| 3 | Qonto | AT |
| 4 | Relio | CH |
| 5 | PayPal | Alle |
| 6 | Sumup | DE |
| 7 | Soldo | DE |
| 8 | American Express | DE |
| 9 | The Kingdom Bank | DE |
| 10 | Bilderlings | DE |
| 11 | Stripe | CH |
| 12 | Shopify Pay | AT/CH |

### 4.4 KI-Funktionen
- Beleg-OCR: PDF/Bild → Claude Vision → Formular-Autofill (IBAN → Kreditor-Matching)
- Buchungsvorschläge MVP: Kontoauszugspositionen → KI-Analyse → Sachkonto-Vorschlag
- Dynamischer Kontenrahmen (SKR03/SKR04/OeKR/KMU)

### 4.5 Länderspezifische Module
- **Deutschland:** SKR03/SKR04, USt 19%/7%, DATEV-Export, UStVA, ELSTER-Vorbereitung
- **Österreich:** OeKR/RLG, USt 20%/13%/10%, UVA (in Entwicklung)
- **Schweiz:** KMU/OR, MwSt 8.1%/2.6%/3.8%, MwSt-Modul (22.752 Zeilen)

### 4.6 Multi-Tenant & Security
- Clerk-basierte Authentifizierung mit rollenbasierten Berechtigungen
- 21 unternehmenId-Sicherheitslücken geschlossen
- Einladungssystem bereit (Resend API konfiguriert)
- Dropbox-Integration für Belegimport

---

## 5. DEVELOPMENT-CHRONOLOGIE

### Session 18.01.2026 — Projektstart
- Railway-Hosting (Migration von Manus ~700$/Monat → Railway ~160-300$/Monat)
- Clerk-Authentifizierung + Multi-Tenant Auth-System
- Domain buchhaltung-ki.app bei IONOS

### Session 12.-13.02.2026 — Massive Feature-Session
- 4 kritische Bugs gefixt (Gesellschafter, Kreditkarten, ZDL)
- 66 Finanzkonten angelegt, 12 CSV-Parser implementiert
- Security-Audit: 21 unternehmenId-Lücken geschlossen
- SKR04-Hardcoding entfernt → dynamische Kontenrahmen

### Session 16.-17.02.2026 — Cascading Bug Fixes
- Cascading-Bug-Kette identifiziert und behoben
- Schema-Drift: fehlende 'notizen' Spalte (Root Cause für Upload-Bug)
- Railway Cache-Problem dokumentiert (NO_CACHE=1)
- Vollständigkeitsprüfung eingeführt (23 Mutations, 16 Queries)

### Session 18.-20.02.2026 — Feature + Bug + SaaS-Planung
- 6 Bugs gefixt (Zahlungsstatus, Navigation Crash, STB-Positionen, Schema-Drift)
- AI-Buchungsvorschläge MVP implementiert
- AT-Firmen UID-Nummern ergänzt, Resend API Key konfiguriert

### Session 20.02.2026 (HEUTE) — Bug-Fixes + SaaS-Strategie

**Bug-Fixes deployed:**

| Bug | Root Cause | Fix | Commit |
|---|---|---|---|
| STB Leistungspositionen speichern nicht | Fehlender onError Handler in addPositionMutation | onError + Backend-Logging mit 🟦-Emoji | 9a5ee22 |
| Kontoinhaber nicht speicherbar | Alter Fix (2fb0d1a) nur in finanzkonten.ts, Stammdaten nutzt jahresabschluss.ts | Zod-Schema + Frontend Payload in jahresabschluss.ts | 9a5ee22 |
| Sonner Build-Warnung (13x dynamic import) | Steuerberater.tsx: 13x await import("sonner") statt statisch | 1x statischer Import, 13 dynamische entfernt, 6x async entfernt | f743a01 |

**Kein Bug (Feature existiert bereits):**
- Kontoauszug-Detail-Ansicht: Eye-Button 👁 vorhanden, Tester hat ihn nicht gefunden
- Dropbox-Import: Route /einstellungen/dropbox funktioniert, braucht Testlink

**SaaS-Kommerzialisierung geplant:**
- Zwei-Instanzen-Strategie: www (intern) + app (Kunden auf EU-West Amsterdam)
- Database per Tenant Architektur für physische Datenisolation
- Pricing: 29€/49€/99€/199€ pro Firma/Monat
- Steuerberater-Partnerprogramm als Hauptvertriebskanal
- Break-Even bei ~20 zahlenden Kunden

---

## 6. OFFENE PUNKTE (Priorisiert)

### PRIO 1 — Sofort
- Tester-Feedback zu Bug-Fixes auswerten (Testprotokoll versendet)
- Dropbox-Import: Konkreten Testlink von Franziska anfordern

### PRIO 2 — SaaS-Fundament (März-April)
- Kunden-Instanz aufsetzen: app.buchhaltung-ki.app auf Railway EU-West
- Self-Service Onboarding + Stripe Integration
- DSGVO-Dokumente (DPA, Datenschutzerklärung) mit Anwalt
- GoBD-Verfahrensdokumentation
- Landing Page mit Pricing

### PRIO 3 — Features
- Bulk-Processing für Buchungsvorschläge
- OeKR/KMU Kontenrahmen vervollständigen
- Österreichische UVA / Schweizer MwSt PDF-Export
- Restliche 26 Firmen anlegen

### PRIO 4 — Code-Qualität
- Bundle-Size: index-BQ8UatxH.js = 2.1 MB (Code-Splitting empfohlen)
- npm Vulnerabilities (30 Stück, 1 critical)
- VITE_ANALYTICS_ENDPOINT nicht definiert

---

## 7. HOSTING & KOSTEN

| Posten | Vorher | Jetzt | Ersparnis |
|---|---|---|---|
| Hosting (Manus) | ~700 $/Monat | — | — |
| Hosting (Railway Pro) | — | ~160-300 $/Monat | ~400-540 $/Monat |
| Kunden-Instanz (geplant) | — | ~20-40 $/Monat | Gedeckt ab 1. Kunde |
| Steuerberater (extern) | Variabel | Ziel: Intern | Langfristig signifikant |
