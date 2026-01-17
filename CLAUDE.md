# CLAUDE.md - Projektanweisungen für Claude Code

## Projekt: Buchhaltung Upload Tool

**Ziel:** Migration von Manus Hosting + Manus OAuth zu Railway + Clerk

---

## 🔧 Technischer Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Express.js + tRPC |
| Datenbank | MySQL (Drizzle ORM) |
| Auth | **NEU: Clerk** (ersetzt Manus OAuth) |
| Hosting | **NEU: Railway** (ersetzt Manus) |
| Package Manager | pnpm |

---

## 📁 Projektstruktur

```
buchhaltung-upload-tool/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # UI-Komponenten (shadcn/ui)
│   │   ├── hooks/             # Custom Hooks (inkl. useAuth.ts)
│   │   ├── pages/             # Seiten-Komponenten
│   │   ├── lib/               # Utilities (trpc.ts, utils.ts)
│   │   ├── contexts/          # React Contexts
│   │   ├── App.tsx            # Haupt-App mit Routing
│   │   ├── main.tsx           # Entry Point
│   │   └── const.ts           # Konstanten
│   └── index.html
├── server/                    # Express Backend
│   ├── _core/                 # Core-Funktionalität
│   │   ├── index.ts           # Express Server Setup
│   │   ├── context.ts         # tRPC Context (Auth)
│   │   ├── trpc.ts            # tRPC Setup
│   │   ├── env.ts             # Environment Variables
│   │   ├── sdk.ts             # ❌ LÖSCHEN (Manus OAuth)
│   │   └── oauth.ts           # ❌ LÖSCHEN (Manus OAuth)
│   ├── db.ts                  # Datenbank-Funktionen
│   ├── routers.ts             # tRPC Router
│   ├── buchhaltung.ts         # Buchhaltungs-Logik
│   ├── steuerberater.ts       # Steuerberater-Logik
│   └── ...                    # Weitere Business-Logik
├── drizzle/                   # Datenbank
│   ├── schema.ts              # Tabellen-Definitionen
│   └── migrations/            # SQL Migrations
├── shared/                    # Shared Code
│   ├── const.ts               # Shared Konstanten
│   └── types.ts               # Shared Types
└── package.json
```

---

## 🚀 Befehle

```bash
# Entwicklung starten
pnpm dev

# Build für Production
pnpm build

# Production starten
pnpm start

# TypeScript prüfen
pnpm check

# Tests ausführen
pnpm test

# Datenbank-Migration
pnpm db:push
```

---

## 🔑 Environment Variables (NEU für Clerk + Railway)

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Database (Railway MySQL)
DATABASE_URL=mysql://user:password@host:port/database

# Optional
RESEND_API_KEY=re_xxx
NODE_ENV=production
```

**ALTE Variables (entfernen):**
- ~~VITE_APP_ID~~
- ~~VITE_OAUTH_PORTAL_URL~~
- ~~OAUTH_SERVER_URL~~
- ~~APP_ID~~
- ~~JWT_SECRET~~
- ~~OWNER_OPEN_ID~~

---

## 📋 Migrations-Aufgaben

### Phase 1: Dependencies
- [ ] `@clerk/clerk-react` und `@clerk/express` hinzufügen
- [ ] `jose` entfernen (Clerk übernimmt JWT)
- [ ] `vite-plugin-manus-runtime` aus devDependencies entfernen

### Phase 2: Backend Auth ersetzen
- [ ] `server/_core/env.ts` - Clerk Variables
- [ ] `server/_core/context.ts` - Clerk Auth Integration
- [ ] `server/_core/index.ts` - Clerk Middleware hinzufügen
- [ ] `server/_core/sdk.ts` - LÖSCHEN
- [ ] `server/_core/oauth.ts` - LÖSCHEN
- [ ] `server/_core/types/manusTypes.ts` - LÖSCHEN

### Phase 3: Datenbank
- [ ] `drizzle/schema.ts` - `openId` → `clerkId`
- [ ] `server/db.ts` - `getUserByOpenId` → `getUserByClerkId`

### Phase 4: Frontend Auth ersetzen
- [ ] `client/src/main.tsx` - ClerkProvider hinzufügen
- [ ] `client/src/hooks/useAuth.ts` - Clerk Hooks verwenden
- [ ] `client/src/pages/Login.tsx` - Clerk SignIn Component
- [ ] `client/src/const.ts` - Alte OAuth-Funktionen entfernen

### Phase 5: Cleanup
- [ ] `.manus/` Ordner löschen
- [ ] `client/src/_core/` prüfen und bereinigen

---

## ⚠️ Wichtige Hinweise

1. **User-ID Änderung:** `openId` (Manus) wird zu `clerkId` (Clerk) - alle DB-Referenzen anpassen

2. **Keine Breaking Changes an Business-Logik:** Die Dateien in `server/buchhaltung.ts`, `server/steuerberater.ts`, etc. bleiben unverändert

3. **tRPC bleibt gleich:** Die Router-Struktur und Procedures ändern sich nicht

4. **shadcn/ui Komponenten:** Nicht ändern, funktionieren weiterhin

5. **Drizzle ORM:** Schema-Änderung nur bei `users` Tabelle

---

## 🎯 Coding-Standards

- **TypeScript:** Strikt typisiert, keine `any` wenn vermeidbar
- **Imports:** Aliase verwenden (`@/` für client/src, `@shared/` für shared)
- **Fehlerbehandlung:** try/catch mit aussagekräftigen Fehlermeldungen
- **Deutsche Sprache:** UI-Texte und Kommentare auf Deutsch
- **Komponenten:** Funktionale React-Komponenten mit Hooks

---

## 🔄 Git Workflow

```bash
# Nach jeder größeren Änderung
git add .
git commit -m "Migration: [Beschreibung]"
git push origin main

# Railway deployed automatisch nach Push
```

---

## 📞 Kontakt bei Problemen

- **Railway Dashboard:** https://railway.app
- **Clerk Dashboard:** https://dashboard.clerk.com
- **GitHub Repo:** angelus200/buchhaltung-upload-tool
