# ENTWICKLER-HANDBUCH

**Buchhaltung-KI.App — Technisches Referenzdokument für Claude Code Sessions**

Stand: 20. Februar 2026 | Aktualisiert nach Session vom 20.02.

---

## 1. PROJEKTSTRUKTUR

Die Anwendung folgt einer monolithischen Full-Stack-Architektur mit klarer Trennung:

| Pfad | Beschreibung | Hinweis |
|---|---|---|
| drizzle/schema.ts | DB-Schema (52 Tabellen) | SINGLE SOURCE OF TRUTH |
| server/routers.ts | Haupt-Router-Registry | Alle tRPC-Router registriert |
| server/buchhaltung.ts | Buchungen, Stammdaten | Größter Backend-Router |
| server/steuerberater.ts | STB-Rechnungen + Positionen | 1.167 Zeilen |
| server/jahresabschluss.ts | Jahresabschluss + Bankkonten | Enthält Bankkonten CRUD! |
| server/finanzkonten.ts | Finanzkonten CRUD | NICHT für Bankkonten in Stammdaten |
| server/auszuege.ts | Kontoauszüge, CSV-Import | 12 Parser in server/lib/ |
| server/buchungsvorschlaege.ts | AI-Buchungsvorschläge | Claude API Integration |
| server/mwst.ts | CH MwSt-Abrechnung | 11.667 Zeilen |
| server/ocr.ts | Claude Vision API | Beleg-OCR |
| server/dropbox.ts | Dropbox-Link-Download | Ohne OAuth, Shared Links |
| client/src/pages/Stammdaten.tsx | GRÖSSTE DATEI | VORSICHT bei Änderungen! |
| client/src/pages/MwstAbrechnung.tsx | 22.752 Zeilen | Schweizer MwSt-Modul |
| client/src/pages/Steuerberater.tsx | STB-Rechnungen UI | ~2.008 Zeilen |

---

## 2. KRITISCHE ARCHITEKTUR-REGELN

### Regel 1: Multi-Tenant Isolation
**JEDE DB-Query MUSS nach unternehmenId filtern. Kein SELECT, INSERT, UPDATE oder DELETE ohne unternehmenId!**

21 Sicherheitslücken wurden am 13.02. geschlossen. Bei neuen Queries IMMER prüfen.

### Regel 2: Router-Zuordnung beachten
**WICHTIG: Stammdaten.tsx nutzt jahresabschluss.ts für Bankkonten, NICHT finanzkonten.ts!**

Immer prüfen welchen tRPC-Router das Frontend tatsächlich aufruft bevor man Backend-Fixes macht.

Beispiel Bug 2 (20.02.): Fix in finanzkonten.ts war wirkungslos weil Stammdaten.tsx jahresabschluss.ts nutzt.

### Regel 3: Kontenrahmen dynamisch
KEIN Hardcoding von SKR04! Kontenrahmen dynamisch aus Firmeneinstellungen laden.

SKR03/SKR04 (DE), OeKR/RLG (AT), KMU/OR (CH).

### Regel 4: wirtschaftsjahr + periode
IMMER berechnen bei Buchungen. Buchungen ohne diese Felder sind in der Übersicht UNSICHTBAR.

### Regel 5: Cache-Invalidation
Nach JEDER Mutation: `trpc.useUtils().invalidate()` aufrufen.

Bei tRPC-Queries: Daten werden gecacht. Ohne Invalidation sehen User veraltete Daten.

### Regel 6: Error Handler PFLICHT
**JEDE useMutation MUSS einen onError Handler haben!**

Bug 1 (20.02.): addPositionMutation hatte keinen onError → Fehler wurde verschluckt, User sah nichts.

Pattern: `onError: (error) => { toast.error(\`Fehler: ${error.message}\`); }`

### Regel 7: Import-Konsistenz
sonner (Toast-Library) IMMER statisch importieren: `import { toast } from "sonner";`

NICHT dynamisch: `const { toast } = await import("sonner");` — das erzeugt Vite-Warnungen.

---

## 3. LESSONS LEARNED (22 Regeln)

| # | Regel | Quelle |
|---|---|---|
| 1 | Code-Analyse VOR dem Fix — Root Cause finden, nicht raten | 12.02. |
| 2 | tRPC-Pfade gegen routers.ts abgleichen | 12.02. |
| 3 | Verschachtelte API-Responses: item.finanzkonto.name statt item.name | 12.02. |
| 4 | handleSave if-Blöcke: Fehlende Cases fallen durch zu localStorage | 12.02. |
| 5 | Cache-Invalidation: trpc.useUtils().invalidate() | 13.02. |
| 6 | wirtschaftsjahr/periode IMMER berechnen bei Buchungen | 13.02. |
| 7 | Hard Refresh nach Deploy: Cmd+Shift+R | 16.02. |
| 8 | Commit-Messages auf Deutsch | Dauerhaft |
| 9 | Kontenrahmen pro Land: SKR04=DE, OeKR=AT, KMU=CH | 13.02. |
| 10 | CSV-Parser-Pattern: Datei in server/lib/ → isValid()+parse() → auszuege.ts | 13.02. |
| 11 | pnpm build nach JEDEM Fix | Dauerhaft |
| 12 | useAuth Hook: @/hooks/useAuth, NICHT @/_core/hooks/useAuth | 16.02. |
| 13 | Railway Cache: NO_CACHE=1 Variable setzen → Redeploy → entfernen | 16.02. |
| 14 | Bei SQL-Fehlern: Railway Deploy-Logs prüfen, nicht Frontend-Error | 17.02. |
| 15 | Schema-Drift: Nach Drizzle-Änderungen DB synchron halten | 17.02. |
| 16 | Debug-Logging mit Emoji-Markern (🟦 = OK, 🟠 = Warning, 🔴 = Error) | 17.02. |
| 17 | Stammdaten.tsx: Vollständigkeitsprüfung vor Commit (Mutations zählen) | 16.02. |
| 18 | git diff IMMER reviewen vor Commit | Dauerhaft |
| 19 | Router-Zuordnung: Stammdaten nutzt jahresabschluss.ts für Bankkonten! | 20.02. |
| 20 | onError Handler PFLICHT bei jeder useMutation | 20.02. |
| 21 | sonner statisch importieren, nie dynamisch | 20.02. |
| 22 | Kein Trial and Error — systematische Analyse, dann gezielter Fix | Dauerhaft |

---

## 4. DEPLOYMENT-PROZESS

### Standard-Workflow
1. Lokal: `pnpm build` (MUSS erfolgreich sein)
2. `git diff` reviewen → Freigabe abwarten
3. `git add -A && git commit -m "Beschreibung auf Deutsch"`
4. `git push` → Railway Auto-Deploy (2-4 Min, ~80s Build)
5. Hard Refresh: Cmd+Shift+R (Safari: Cache komplett leeren)

### Bei Cache-Problemen
- Railway Dashboard → Service → Variables
- `NO_CACHE=1` hinzufügen → Redeploy auslösen
- Nach erfolgreichem Deploy: Variable wieder entfernen

### Asset-Hash prüfen
```bash
curl -s https://www.buchhaltung-ki.app | grep assets/index
```
Aktueller Hash: `index-BQ8UatxH.js` (Deploy vom 20.02.)

---

## 5. BUG-FIXING WORKFLOW

### Phase 1: Analyse
- `git log --grep="keyword"` → Gab es bereits einen Fix?
- `grep -rn "funktionsname" server/ client/` → Wo ist der Code?
- Welchen Router nutzt das Frontend? (Nicht raten, suchen!)

### Phase 2: Root Cause
- Console-Logging mit Emoji-Markern einfügen
- DB-Schema prüfen (drizzle/schema.ts)
- Zod Input-Schema prüfen (akzeptiert Backend das Feld?)
- Frontend Mutation prüfen (sendet Frontend das Feld?)

### Phase 3: Fix
- Gezielter Fix an der Root Cause, keine Symptombehandlung
- onError Handler prüfen/ergänzen
- `pnpm build` → `git diff` → Freigabe → Commit

### Phase 4: Verifikation
- Railway Deploy abwarten (2-4 Min)
- Hard Refresh im Browser
- Manueller Test der gefixten Funktion

---

## 6. SAAS-ARCHITEKTUR (GEPLANT)

### Zwei-Instanzen-Strategie

| Eigenschaft | Intern | Kunden |
|---|---|---|
| URL | www.buchhaltung-ki.app | app.buchhaltung-ki.app |
| Region | us-west2 | EU-West Amsterdam |
| Branch | main | production |
| Clerk | Aktueller Account | NEUER Account |
| Daten | 32 eigene Firmen | Externe Kunden |

### Database per Tenant
Jeder Kunde bekommt eigene Datenbank auf geteilter MySQL-Instanz.

unternehmenId BLEIBT — trennt Firmen INNERHALB eines Tenants.

Tenant-DB ist äußere Isolation (Kunde A ≠ Kunde B).

### Pricing

| Plan | Preis/Monat | Firmen | Highlight |
|---|---|---|---|
| Starter | 29€ | 1 | Buchhaltung + CSV + DATEV |
| Business | 49€ | bis 5 | + KI-Belegerkennung + Multi-User |
| Enterprise | 99€ | bis 20 | + API + Priority Support |
| Unlimited | 199€ | Unbegrenzt | + White-Label + Custom |

---

## 7. CHECKLISTE FÜR NEUE SESSIONS

- [ ] **Dieses Dokument lesen**
- [ ] Offene Punkte aus dem Projektbericht prüfen
- [ ] `git pull` → aktuellen Stand holen
- [ ] Railway Dashboard prüfen → letzter Deploy erfolgreich?
- [ ] Tester-Feedback vorhanden? → Bugs priorisieren
- [ ] REGELN einhalten: Kein Trial and Error, systematische Analyse
- [ ] `pnpm build` + `git diff` vor JEDEM Commit
- [ ] Handoff-Dokument am Ende der Session aktualisieren
