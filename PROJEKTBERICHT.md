# PROJEKTBERICHT — Buchhaltung-KI.App
**Stand:** 20. Februar 2026
**Version:** 2.0
**Status:** ✅ Live in Produktion

---

## Executive Summary

**Buchhaltung-KI.App** ist eine vollständige, KI-gestützte Buchhaltungsanwendung für kleine und mittelständische Unternehmen in Deutschland, Österreich und der Schweiz. Die Plattform automatisiert die Belegverarbeitung, Kontierung und Buchführung durch den Einsatz von Claude AI (Anthropic).

**Wichtigste Kennzahlen:**
- 🏢 **32 aktive Firmen** (DE/AT/CH)
- 📊 **24.987 Buchungen** verwaltet
- 🤖 **52 Datenbank-Tabellen**
- 🚀 **Railway Pro Plan** mit Auto-Deploy
- 🔐 **Clerk Authentication** mit Multi-Tenant-Architektur
- 🌍 **Live:** https://www.buchhaltung-ki.app

---

## 1. Projektziele

### Primärziele (erreicht)
✅ Vollständige Migration von Manus Hosting + OAuth zu Railway + Clerk
✅ Multi-Tenant-fähige Buchhaltungsplattform mit Rollen & Berechtigungen
✅ Automatisierung der Belegverarbeitung durch Claude Vision API
✅ Support für 3 Länder (DE/AT/CH) mit länderspezifischen Kontenrahmen
✅ Kontoauszug-Import für 12+ Banken/Payment-Provider
✅ Automatische Zuordnung von Kontoauszügen zu Buchungen

### Sekundärziele (in Entwicklung)
⏳ Bulk-Processing für AI-Buchungsvorschläge
⏳ DATEV-Export/Import für Steuerberater
⏳ Erweiterung auf weitere Banken (z.B. Wise, Revolut)

---

## 2. Technischer Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| **Frontend** | React | 19 |
| **Build Tool** | Vite | 7.3.1 |
| **Styling** | Tailwind CSS + shadcn/ui | — |
| **Backend** | Express.js + tRPC | — |
| **Datenbank** | MySQL (Drizzle ORM) | — |
| **Authentication** | Clerk | — |
| **Hosting** | Railway Pro Plan | — |
| **AI** | Claude 3.7 Sonnet (Anthropic) | — |
| **Package Manager** | pnpm | — |

---

## 3. Architektur

### 3.1 Multi-Tenant Security
Jede Datenbank-Query filtert nach `unternehmenId`. Keine Firma kann Daten einer anderen Firma sehen.

```typescript
// IMMER so:
db.select()
  .from(buchungen)
  .where(eq(buchungen.unternehmenId, unternehmenId));
```

### 3.2 Kontenrahmen (dynamisch)
| Land | Kontenrahmen | USt/MwSt | Kontonummern |
|------|--------------|----------|--------------|
| 🇩🇪 Deutschland | SKR03, SKR04 | 19% / 7% | 1200-1289 |
| 🇦🇹 Österreich | OeKR, RLG | 20% / 13% / 10% | 2700-2999 |
| 🇨🇭 Schweiz | KMU, OR | 8.1% / 2.6% / 3.8% | 1020-1039 |

### 3.3 tRPC Router-Struktur
```
routers.ts (Registry)
├── buchhaltung → buchhaltungRouter (server/buchhaltung.ts)
│   ├── list, create, update, delete
│   ├── stammdatenRouter (Kreditoren, Debitoren, Sachkonten)
│   ├── gesellschafterRouter
│   └── beteiligungsRouter
├── finanzkonten → finanzkontenRouter (server/finanzkonten.ts)
│   └── list, create, update, delete, creditCards, paymentProviders
├── auszuege → auszuegeRouter (server/auszuege.ts)
│   └── list, create, addPosition, importCSV, autoZuordnen, ...
├── buchungsvorschlaege → buchungsvorschlaegeRouter (server/buchungsvorschlaege.ts)
│   └── createFromPosition, list, apply, reject
├── ocr → ocrRouter (server/ocr.ts)
│   └── analyzeBelege (Claude Vision API)
└── mwst → mwstRouter (server/mwst.ts)
    └── calculateMwSt, vorsteuerAbzug, umsatzsteuer (11.667 Zeilen)
```

### 3.4 Datenbank-Schema (52 Tabellen)
Wichtigste Tabellen:
- `unternehmen` — Firmen-Stammdaten (32 Zeilen)
- `users` — Benutzer mit Clerk-Integration
- `buchungen` — Alle Buchungen (24.987 Zeilen)
- `finanzkonten` — Bankkonten, Kreditkarten, Zahlungsdienstleister
- `auszuege` — Kontoauszüge
- `auszug_positionen` — Einzelne Positionen aus Kontoauszügen
- `belege` — Hochgeladene PDF/Bilder
- `kreditoren`, `debitoren`, `sachkonten` — Stammdaten
- `gesellschafter`, `beteiligungen` — GmbH-Verwaltung

---

## 4. Features

### 4.1 Kernfunktionen
✅ **Buchungsverwaltung** — CRUD, Suche, Filter, Export
✅ **Stammdatenverwaltung** — Kreditoren, Debitoren, Sachkonten
✅ **Finanzkonten** — Banken, Kreditkarten, PayPal, Stripe, etc.
✅ **Kontoauszüge** — Upload, CSV-Import für 12+ Banken
✅ **Automatische Zuordnung** — Kontoauszüge ↔ Buchungen (±3 Tage, 2 Cent Toleranz)
✅ **AI-Buchungsvorschläge** — Claude Vision API analysiert Belege
✅ **MwSt-Abrechnung** — Schweizer MwSt mit allen Spezialfällen (11.667 Zeilen Code)
✅ **Benutzerverwaltung** — Rollen: Owner, Admin, Mitarbeiter
✅ **Multi-Tenant** — 32 Firmen, vollständig isoliert

### 4.2 CSV-Parser (12 Banken)
✅ Sparkasse, VR Bank, Qonto, Relio
✅ PayPal, SumUp, Soldo, Amex
✅ Kingdom Bank, Bilderlings, Stripe, Shopify

### 4.3 AI-Integration (Claude Vision API)
- **Beleganaylse:** Hochgeladene PDF/Bilder → Claude extrahiert Datum, Betrag, MwSt, Lieferant, Beschreibung
- **Kontierungs-Vorschläge:** Claude schlägt passende Sachkonten vor (länderspezifisch)
- **Bulk-Processing:** In Entwicklung

---

## 5. Deployment & Infrastructure

### 5.1 Railway Pro Plan
- **Auto-Deploy:** Jeder `git push` triggert automatischen Build + Deploy
- **Build-Zeit:** 2-4 Minuten
- **Environment:** Node.js, MySQL-Datenbank
- **Domain:** https://www.buchhaltung-ki.app

### 5.2 Build-Pipeline
```bash
pnpm build
  ├── vite build          # Frontend → dist/public/
  └── esbuild             # Backend → dist/index.js
```

### 5.3 Monitoring & Debugging
- **Build-Logs:** Railway Dashboard
- **Application Logs:** Railway Dashboard
- **Error Tracking:** Browser Console + Railway Logs

---

## 6. Bekannte Issues & Lessons Learned

### 6.1 Gelöste Bugs (letzte 5 Commits)
✅ **Browser-Freeze** bei 24.987 Buchungen → Pagination + Default-Filter (20.02.2026)
✅ **Feld "kontoinhaber"** für Bankkonten fehlte → Migration hinzugefügt (20.02.2026)
✅ **Build-Crash** in Uebersicht.tsx → Fragment-Wrapper für ternären Operator (20.02.2026)
✅ **Kontenrahmen-Hardcoding** → Dynamisch aus Firmen-Einstellungen laden (19.02.2026)

### 6.2 Lessons Learned (Top 10)
1. **Code-Analyse VOR dem Fix** — IMMER zuerst Code lesen, Root Cause finden
2. **tRPC-Pfade gegen routers.ts abgleichen** — Frontend muss mit Router-Registrierung übereinstimmen
3. **Verschachtelte API-Responses prüfen** — `item.finanzkonto.name` nicht `item.name`
4. **Cache-Invalidation bei tRPC** — `trpc.useUtils().invalidate()` verwenden
5. **`wirtschaftsjahr`/`periode` IMMER berechnen** — Buchungen ohne diese Felder sind unsichtbar
6. **Hard Refresh nach Deploy** — Cmd+Shift+R (Safari-User: Cache leeren)
7. **Commit-Messages auf Deutsch**
8. **Kontenrahmen pro Land beachten** — SKR04 nur DE, OeKR/RLG für AT, KMU/OR für CH
9. **`pnpm build` nach JEDEM Fix ausführen**
10. **Vollständigkeitsprüfung vor JEDEM Commit** in großen Dateien (grep Mutations/Queries)

### 6.3 Offene Todos
⏳ Bulk-Processing für AI-Buchungsvorschläge
⏳ DATEV-Export vollständig testen
⏳ Weitere CSV-Parser (Wise, Revolut)
⏳ Performance-Optimierung für Stammdaten.tsx (größte Datei)

---

## 7. Statistiken

### 7.1 Code-Größe
```
client/src/           ~50.000 Zeilen TypeScript/TSX
server/               ~30.000 Zeilen TypeScript
  └── mwst.ts         11.667 Zeilen (größte Backend-Datei)
drizzle/schema.ts     ~2.000 Zeilen (52 Tabellen)
```

### 7.2 Größte Dateien
| Datei | Zeilen | Beschreibung |
|-------|--------|--------------|
| `client/src/pages/Stammdaten.tsx` | 25.000+ | Stammdaten-Verwaltung (größte Datei) |
| `client/src/pages/MwstAbrechnung.tsx` | 22.752 | Schweizer MwSt-Abrechnung |
| `server/mwst.ts` | 11.667 | MwSt-Berechnung (Backend) |
| `client/src/pages/Uebersicht.tsx` | ~1.500 | Buchungsübersicht |

### 7.3 Datenbank
- **Unternehmen:** 32
- **Buchungen:** 24.987
- **Finanzkonten:** ~150 (26 bei Alpenland, 20 bei Angelus, ...)
- **Belege:** ~5.000 (geschätzt)

---

## 8. Team & Rollen

| Name | Rolle | Verantwortung |
|------|-------|---------------|
| Thomas Gross | CEO & Product Owner | Produktstrategie, Feature-Priorisierung |
| Claude (Anthropic) | AI Development Assistant | Code-Implementierung, Bug-Fixing, Dokumentation |

---

## 9. Roadmap

### Q1 2026 (aktuell)
✅ Migration Manus → Railway + Clerk (abgeschlossen)
✅ Kontoauszug-System mit Auto-Zuordnung (abgeschlossen)
⏳ Bulk-Processing AI-Buchungsvorschläge (in Entwicklung)

### Q2 2026
⏳ DATEV-Schnittstelle vollständig testen
⏳ Mobile-Optimierung
⏳ Weitere Banken-Parser (Wise, Revolut, N26)

### Q3 2026
⏳ Multi-Währungs-Support (aktuell nur EUR, CHF)
⏳ Automatische Mahnläufe
⏳ Reporting-Dashboard (GuV, Bilanz, Cash Flow)

---

## 10. Kontakt & Support

- **Live-App:** https://www.buchhaltung-ki.app
- **GitHub Repo:** angelus200/buchhaltung-upload-tool
- **Railway Dashboard:** https://railway.app
- **Clerk Dashboard:** https://dashboard.clerk.com

---

## Anhang: Wichtige Kommandos

```bash
# Entwicklung starten
pnpm dev

# Build für Production
pnpm build

# Deploy (automatisch via Railway)
git push

# Datenbank-Migration
pnpm db:push

# TypeScript prüfen
pnpm check
```

---

**Letzte Aktualisierung:** 20. Februar 2026, 14:30 CET
**Build-Status:** ✅ Erfolgreich deployed
**Nächster Meilenstein:** Bulk-Processing AI-Buchungsvorschläge (Sprint 2)
