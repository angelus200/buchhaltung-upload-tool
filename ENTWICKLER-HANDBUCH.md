# ENTWICKLER-HANDBUCH — Buchhaltung-KI.App
**Version 2.0 — Stand:** 20. Februar 2026

---

## GOLDENE REGEL
**ERST ANALYSIEREN → DANN PLANEN → DANN UMSETZEN — KEINE SCHNELLSCHÜSSE!**

---

## 1. PROJEKT-SETUP

### Repository & Umgebung
```bash
cd ~/Desktop/buchhaltung-upload-tool
git log --oneline -10
git status
pnpm build
```

### Wichtige Pfade
| Pfad | Beschreibung |
|------|--------------|
| `drizzle/schema.ts` | Datenbank-Schema (52 Tabellen) |
| `server/routers.ts` | Haupt-Router-Registry |
| `server/buchhaltung.ts` | Buchungen, Stammdaten, Gesellschafter |
| `server/finanzkonten.ts` | Finanzkonten CRUD |
| `server/auszuege.ts` | Kontoauszüge, CSV-Import |
| `server/buchungsvorschlaege.ts` | AI-Buchungsvorschläge |
| `server/ocr.ts` | Claude Vision API, Belegerkennung |
| `server/mwst.ts` | Schweizer MwSt (11.667 Zeilen) |
| `server/lib/` | CSV-Parser pro Bankformat |
| `client/src/pages/Stammdaten.tsx` | **GRÖSSTE DATEI — VORSICHT!** |
| `client/src/pages/MwstAbrechnung.tsx` | 22.752 Zeilen |
| `client/src/pages/Uebersicht.tsx` | Buchungsübersicht |
| `scripts/seed-finanzkonten.ts` | Seed DE-Finanzkonten |
| `scripts/seed-finanzkonten-at-ch.ts` | Seed AT/CH-Finanzkonten |

---

## 2. BUG-FIXING WORKFLOW

### Schritt 1: Root Cause Analyse
```bash
# Fehler reproduzieren / Logs lesen
# Code um die Fehlerstelle herum lesen (±50 Zeilen)
# Hypothese aufstellen
```

### Schritt 2: Fix planen
1. Root Cause dem CEO erklären
2. Mögliche Seiteneffekte benennen
3. Warten auf Freigabe

### Schritt 3: Implementieren
```bash
# Fix umsetzen
pnpm build                    # MUSS erfolgreich sein
git diff                      # Diff zeigen, auf Freigabe warten
```

### Schritt 4: Commit & Deploy
```bash
git add -A
git commit -m "Beschreibung auf Deutsch"
git push                      # Railway Auto-Deploy (2-4 Min)
```

### Schritt 5: Verifizieren
1. **Hard Refresh:** Cmd+Shift+R
2. **Safari-User:** Cmd+Q → Entwickler → Cache leeren
3. Asset-Hash in Browser-DevTools prüfen

---

## 3. VOLLSTÄNDIGKEITSPRÜFUNG (Pflicht vor Commits in großen Dateien)

Insbesondere bei Änderungen an `Stammdaten.tsx`:

```bash
# Alle .mutate Aufrufe
grep -n "\.mutate\b" client/src/pages/Stammdaten.tsx

# Alle useMutation Definitionen
grep -n "useMutation" client/src/pages/Stammdaten.tsx

# Alle useQuery Definitionen
grep -n "useQuery" client/src/pages/Stammdaten.tsx
```

**Für JEDE Variable die `.mutate()` oder `.data` aufruft:**
1. Prüfe ob sie definiert ist
2. Erstelle Tabelle: `Variable → Definiert (Ja/Nein) → Zeile Definition → Zeile Verwendung`
3. **Kein Commit ohne diese Prüfung!**

---

## 4. ARCHITEKTUR-REGELN

### 4.1 Multi-Tenant Security
```typescript
// JEDE DB-Query MUSS nach unternehmenId filtern!
// ❌ FALSCH:
db.select().from(buchungen);

// ✅ RICHTIG:
db.select().from(buchungen).where(eq(buchungen.unternehmenId, unternehmenId));
```

### 4.2 API-Response-Format
```typescript
// Backend gibt verschachtelte Objekte zurück:
{ finanzkonto: { id, name, typ, ... }, sachkonto: { ... } }

// ✅ RICHTIG:
item.finanzkonto.typ

// ❌ FALSCH (gibt undefined):
item.typ
```

### 4.3 tRPC-Router-Registrierung
```
stammdaten → stammdatenRouter (aus buchhaltung.ts)
  ├── kreditoren, debitoren, sachkonten
  ├── gesellschafter    ← unter stammdaten, NICHT unter buchhaltung!
  └── beteiligungen

finanzkonten → finanzkontenRouter (aus finanzkonten.ts)
  └── list, create, update, delete, creditCards, paymentProviders

auszuege → auszuegeRouter (aus auszuege.ts)
  └── list, create, addPosition, importCSV, autoZuordnen, buchungAusPosition, etc.
```

**Frontend-tRPC-Pfade MÜSSEN mit `routers.ts` übereinstimmen!**

### 4.4 Kontenrahmen (dynamisch, KEIN Hardcoding!)

| Land | Kontenrahmen | USt/MwSt | Kontonummern |
|------|--------------|----------|--------------|
| 🇩🇪 DE | SKR03, SKR04 | 19% / 7% | 1200-1289 |
| 🇦🇹 AT | OeKR, RLG | 20% / 13% / 10% | 2700-2999 |
| 🇨🇭 CH | KMU, OR | 8.1% / 2.6% / 3.8% | 1020-1039 |

```typescript
// ✅ RICHTIG: Kontenrahmen aus Firma laden
const [firma] = await db.select().from(unternehmen).where(...);
const kontenrahmen = firma?.kontenrahmen || "SKR04";

// ❌ FALSCH: Hardcoded
const kontenrahmen = "SKR04";
```

### 4.5 Buchungen: `wirtschaftsjahr` & `periode`
```typescript
// IMMER berechnen bei Buchungserstellung!
const datum = new Date(buchungsDatum);
const monat = datum.getMonth() + 1;
const wirtschaftsjahr = datum.getFullYear();
const periode = monat;

// Buchungen OHNE diese Felder sind in der Übersicht UNSICHTBAR!
```

### 4.6 Cache-Invalidation
```typescript
// Nach JEDER Mutation:
const utils = trpc.useUtils();
await utils.invalidate();

// NICHT: Auf automatische Refetches vertrauen
```

### 4.7 useAuth Hook
```typescript
// ✅ RICHTIG:
import { useAuth } from "@/hooks/useAuth";

// ❌ FALSCH (anderer Pfad, anderes Verhalten):
import { useAuth } from "@/_core/hooks/useAuth";
```

---

## 5. CSV-PARSER ENTWICKLUNG

### Neuen Parser erstellen
1. Neue Datei: `server/lib/[bankname]-parser.ts`
2. Implementiere: `isValid(lines: string[]): boolean` + `parse(lines: string[]): ParsedRow[]`
3. In `server/auszuege.ts` → `importCSV` Mutation erweitern
4. Duplikat-Erkennung beachten

### Bestehende Parser (12)
```
server/lib/
├── sparkasse-parser.ts      # Semikolon, ISO-8859-1, DD.MM.YY
├── vrbank-parser.ts         # Semikolon, ISO-8859-1
├── qonto-parser.ts          # Komma/Semi, UTF-8
├── relio-parser.ts          # Komma/Semi, UTF-8
├── paypal-parser.ts         # Komma/Semi, UTF-8
├── sumup-parser.ts          # Komma/Semi, UTF-8
├── soldo-parser.ts          # Komma/Semi, UTF-8
├── amex-parser.ts           # Komma/Semi, UTF-8
├── kingdom-parser.ts        # Komma, UTF-8
├── bilderlings-parser.ts    # Semikolon, UTF-8
├── stripe-parser.ts         # Komma, UTF-8
└── shopify-parser.ts        # Komma/Semi, UTF-8
```

---

## 6. DEPLOYMENT & TROUBLESHOOTING

### Normaler Deploy
```bash
pnpm build              # Lokaler Build-Test
git add -A
git commit -m "Beschreibung auf Deutsch"
git push                # Railway deployed automatisch (2-4 Min)
```

### Railway Cache-Problem
**Symptom:** Deploy erfolgreich, aber alte Version wird ausgeliefert.

1. Railway Dashboard → Service → Variables
2. Variable hinzufügen: `NO_CACHE=1`
3. Redeploy triggern
4. Warten bis Build fertig
5. Variable `NO_CACHE=1` wieder **ENTFERNEN**

### Asset-Hash verifizieren
```bash
# Welcher Hash wird vom Server ausgeliefert?
curl -s https://www.buchhaltung-ki.app | grep -o 'index-[a-zA-Z0-9_]*\.js'
```

### Build-Fehler debuggen
```bash
# Lokaler Build mit voller Ausgabe
pnpm build 2>&1 | tail -50

# TypeScript-Fehler finden
npx tsc --noEmit
```

---

## 7. DATENBANK-REGELN

### Absolute Verbote
❌ **`DROP TABLE`** — NIEMALS
❌ **`DELETE FROM` ohne `WHERE`** — NIEMALS
❌ **`TRUNCATE`** — NIEMALS
❌ **`ALTER TABLE` ohne vorheriges Backup / `SELECT`**

### Sichere Änderungen
```sql
-- Neue Spalte hinzufügen (immer mit DEFAULT):
ALTER TABLE tabelle ADD COLUMN neues_feld VARCHAR(255) DEFAULT NULL;

-- Vor UPDATE/DELETE: Erst SELECT mit gleicher WHERE zeigen:
SELECT * FROM tabelle WHERE id = 123;
-- Dann erst:
UPDATE tabelle SET feld = 'wert' WHERE id = 123;
```

### Schema-Änderungen
1. **NUR additiv** (neue Spalten, neue Tabellen)
2. `pnpm db:push` **NUR mit expliziter Freigabe**
3. Schema-Drift prüfen: Drizzle Schema vs. tatsächliche MySQL-Tabellen

---

## 8. KONTOAUSZUG-SYSTEM

### Datenbank-Tabellen
```
auszuege:
  id, unternehmenId, typ, kontoId, kontoBezeichnung,
  dateiUrl, dateiname, zeitraumVon/zeitraumBis,
  saldoAnfang/saldoEnde, waehrung, status, notizen

auszug_positionen:
  id, auszugId, datum, buchungstext, betrag, saldo,
  referenz, kategorie, zugeordneteBuchungId,
  status ("offen" | "zugeordnet" | "ignoriert")
```

### Zuordnungs-Logik
1. **Auto-Zuordnung:** ±3 Tage, 2 Cent Toleranz
2. **Manuelle Suche:** ±7 Tage, 5 Cent Toleranz
3. **Buchung aus Position:** Mit `wirtschaftsjahr`/`periode` Berechnung

### AI-Buchungsvorschläge
1. **Einzelne Position** → Sparkles-Button → Claude AI analysiert → Vorschlag
2. Kontenrahmen wird dynamisch aus Firmeneinstellungen geladen
3. Fallback: SKR04
4. **Bulk-Processing:** Noch nicht implementiert (Sprint 2)

---

## 9. FINANZKONTEN-STRUKTUR

### Kontonummern-Schema
| Land | Bereich | Banken | Kreditkarten | ZDL |
|------|---------|--------|--------------|-----|
| 🇩🇪 DE (SKR04) | 1200-1289 | 1200er | 1220-1283 | 1270er |
| 🇦🇹 AT (OeKR/RLG) | 2700-2999 | 2700er | 2800er | 2900er |
| 🇨🇭 CH (KMU/OR) | 1020-1039 | 1020er | — | 1030er |

### Firmen-Finanzkonten Übersicht
- **Alpenland:** 26 Konten (2 Banken, 1 PayPal, 23 Kreditkarten inkl. 20 Soldo virtuell)
- **Angelus:** 20 Konten (4 Banken, 1 PayPal, 15 Kreditkarten inkl. 10 Soldo virtuell)
- **commercehelden:** 6 Konten (1 Bank, 3 KK, 2 ZDL)
- **Emo Retail:** 6 Konten (1 Bank, 3 KK, 2 ZDL)
- **Trademark24-7:** 4 Konten (1 Bank, 3 ZDL)
- **Marketplace24-7:** 4 Konten (1 Bank, 3 ZDL)

---

## 10. LESSONS LEARNED (20 Regeln)

1. **Code-Analyse VOR dem Fix** — IMMER zuerst Code lesen, Root Cause finden
2. **tRPC-Pfade gegen `routers.ts` abgleichen** — Frontend muss mit Router-Registrierung übereinstimmen
3. **Verschachtelte API-Responses prüfen** — `item.finanzkonto.name` nicht `item.name`
4. **`handleSave` if-Blöcke prüfen** — Fehlende Cases fallen durch zu `localStorage`!
5. **Cache-Invalidation bei tRPC** — `trpc.useUtils().invalidate()` verwenden
6. **`wirtschaftsjahr`/`periode` IMMER berechnen** — Buchungen ohne diese Felder sind unsichtbar
7. **Hard Refresh nach Deploy** — Cmd+Shift+R
8. **Commit-Messages auf Deutsch**
9. **Kontenrahmen pro Land beachten** — SKR04 nur DE, OeKR/RLG für AT, KMU/OR für CH
10. **CSV-Parser-Pattern:** Neue Datei in `server/lib/` → `isValid()` + `parse()` → `auszuege.ts` erweitern
11. **`pnpm build` nach JEDEM Fix ausführen**
12. **`useAuth` Hook:** IMMER `@/hooks/useAuth`, NICHT `@/_core/hooks/useAuth`
13. **Nach jedem Fix bestehende Funktionalität prüfen** — nicht nur den Bug-Fix testen
14. **Safari hat aggressiven Cache** — User müssen Cmd+Q + Cache leeren nach Deploy
15. **Vollständigkeitsprüfung vor JEDEM Commit** in `Stammdaten.tsx` (grep Mutations/Queries)
16. **Bei mehreren Bugs** — ALLE auf einmal finden und in EINEM Commit fixen
17. **Schema-Drift regelmäßig prüfen** — Drizzle Schema vs. MySQL `DESCRIBE`
18. **Cascading-Bugs vermeiden** — Bei Fixes in einer Datei ALLE Stellen prüfen die betroffen sein könnten
19. **Railway Cache-Problem:** `NO_CACHE=1` Variable setzen → Redeploy → Variable entfernen
20. **JSX-Conditional-Rendering:** Ternäre Operatoren mit mehreren Elementen brauchen Fragment-Wrapper `<>...</>`

---

## 11. CHECKLISTE FÜR NEUE CLAUDE CODE SESSION

```bash
□ Dieses Handbuch als Kontext laden
□ cd ~/Desktop/buchhaltung-upload-tool
□ git log --oneline -10  (letzten Stand prüfen)
□ git status              (sauberer Working Tree?)
□ pnpm build              (Build OK?)
□ Aufgabe vom CEO entgegennehmen
□ Erst analysieren, dann planen, dann umsetzen
□ pnpm build nach JEDEM Fix
□ git diff zeigen VOR dem Commit
□ Freigabe abwarten
□ Commit auf Deutsch, dann push
```

---

**Letzte Aktualisierung:** 20. Februar 2026, 14:30 CET
**Version:** 2.0
**Nächste Review:** Bei größeren Architektur-Änderungen
