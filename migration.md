# Buchhaltung Upload Tool - Migration zu Railway + Clerk

## Anleitung für Claude Code

**Projekt:** buchhaltung-upload-tool  
**Von:** Manus Hosting + Manus OAuth  
**Nach:** Railway Hosting + Clerk Auth  
**Stand:** Januar 2026

---

## 📋 Übersicht der Migration

### Was bleibt gleich:
- React 19 + TypeScript + Vite + Tailwind + shadcn/ui (Frontend)
- Express.js + tRPC (Backend)
- MySQL + Drizzle ORM (Datenbank)
- Alle Business-Logik-Dateien (Buchhaltung, Steuerberater, etc.)

### Was sich ändert:
| Bereich | Alt (Manus) | Neu (Clerk) |
|---------|-------------|-------------|
| Auth SDK | `server/_core/sdk.ts` | Clerk Backend SDK |
| OAuth Flow | `server/_core/oauth.ts` | Clerk Middleware |
| Frontend Auth | Custom `useAuth.ts` | `@clerk/clerk-react` |
| User ID | `openId` | `clerkId` |
| Login UI | Custom Login.tsx | Clerk Components |
| Environment | Manus-spezifisch | Clerk Keys |

---

## 🚀 Schritt 1: Neue Dependencies installieren

**Prompt für Claude Code:**
```
Öffne package.json und führe folgende Änderungen durch:

1. Entferne diese Dependencies:
   - "jose" (wird nicht mehr benötigt, Clerk macht JWT)

2. Füge diese Dependencies hinzu:
   "@clerk/clerk-react": "^5.20.0"
   "@clerk/express": "^1.3.20"

3. Führe dann aus: pnpm install
```

---

## 🔧 Schritt 2: Environment Variables anpassen

**Prompt für Claude Code:**
```
Erstelle eine neue Datei .env.example mit folgendem Inhalt:

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Database (Railway MySQL)
DATABASE_URL=mysql://user:password@host:port/database

# Optional: Resend für E-Mails
RESEND_API_KEY=re_xxx

# Optional: S3 für Datei-Uploads
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

Lösche die alten Manus-spezifischen Variables:
- VITE_APP_ID
- VITE_OAUTH_PORTAL_URL
- OAUTH_SERVER_URL
- APP_ID
- JWT_SECRET
- OWNER_OPEN_ID
```

---

## 🔑 Schritt 3: Server Auth komplett ersetzen

### 3.1 Neue env.ts erstellen

**Prompt für Claude Code:**
```
Ersetze den Inhalt von server/_core/env.ts mit:

export const ENV = {
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
};
```

### 3.2 Neue context.ts erstellen

**Prompt für Claude Code:**
```
Ersetze den Inhalt von server/_core/context.ts mit:

import { clerkClient } from "@clerk/express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Clerk fügt auth an req an via Middleware
    const auth = (opts.req as any).auth;
    
    if (auth?.userId) {
      // User aus DB holen oder anlegen
      user = await db.getUserByClerkId(auth.userId);
      
      if (!user) {
        // Clerk User-Daten holen
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        
        // In DB anlegen
        await db.upsertUser({
          clerkId: auth.userId,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
          loginMethod: clerkUser.externalAccounts[0]?.provider ?? "email",
          lastSignedIn: new Date(),
        });
        
        user = await db.getUserByClerkId(auth.userId);
      } else {
        // lastSignedIn aktualisieren
        await db.upsertUser({
          clerkId: auth.userId,
          lastSignedIn: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("[Auth] Error:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
```

### 3.3 sdk.ts löschen

**Prompt für Claude Code:**
```
Lösche die Datei server/_core/sdk.ts komplett.
Diese wird nicht mehr benötigt, da Clerk alles übernimmt.
```

### 3.4 oauth.ts löschen

**Prompt für Claude Code:**
```
Lösche die Datei server/_core/oauth.ts komplett.
Clerk verwendet Webhooks statt OAuth Callback.
```

### 3.5 server/index.ts anpassen

**Prompt für Claude Code:**
```
Öffne server/_core/index.ts und passe es an:

1. Füge am Anfang hinzu:
   import { clerkMiddleware } from "@clerk/express";

2. Entferne den Import von registerOAuthRoutes (falls vorhanden)

3. Füge nach app.use(express.json()) ein:
   app.use(clerkMiddleware());

4. Entferne den Aufruf von registerOAuthRoutes(app) (falls vorhanden)

5. Die Clerk Middleware muss VOR den tRPC Routes kommen!
```

---

## 🗄️ Schritt 4: Datenbank-Schema anpassen

**Prompt für Claude Code:**
```
Öffne drizzle/schema.ts und ändere in der users-Tabelle:

1. Ersetze:
   openId: varchar("openId", { length: 64 }).notNull().unique(),
   
   Mit:
   clerkId: varchar("clerkId", { length: 64 }).notNull().unique(),

2. Die restlichen Felder bleiben gleich.
```

### 4.1 db.ts anpassen

**Prompt für Claude Code:**
```
Öffne server/db.ts und ersetze alle Vorkommen von:
- "openId" → "clerkId"
- "getUserByOpenId" → "getUserByClerkId"

Die Funktion getUserByClerkId sollte so aussehen:

export async function getUserByClerkId(clerkId: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return result[0];
}

export async function upsertUser(userData: {
  clerkId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: Date;
}): Promise<void> {
  await db
    .insert(users)
    .values({
      clerkId: userData.clerkId,
      name: userData.name,
      email: userData.email,
      loginMethod: userData.loginMethod,
      lastSignedIn: userData.lastSignedIn ?? new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        name: userData.name,
        email: userData.email,
        loginMethod: userData.loginMethod,
        lastSignedIn: userData.lastSignedIn ?? new Date(),
      },
    });
}
```

---

## 🎨 Schritt 5: Frontend Auth anpassen

### 5.1 main.tsx mit ClerkProvider wrappen

**Prompt für Claude Code:**
```
Ersetze client/src/main.tsx mit:

import { ClerkProvider } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message.includes("10001") || error.message.includes("UNAUTHORIZED");

  if (isUnauthorized) {
    window.location.href = "/login";
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </ClerkProvider>
);
```

### 5.2 useAuth.ts Hook ersetzen

**Prompt für Claude Code:**
```
Ersetze client/src/hooks/useAuth.ts mit:

import { useUser, useClerk } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut, openSignIn } = useClerk();
  
  // Hole zusätzliche User-Daten aus der DB (Rolle, etc.)
  const { data: dbUser, isLoading: dbLoading, refetch } = trpc.auth.me.useQuery(
    undefined,
    { enabled: isSignedIn }
  );

  const login = useCallback(() => {
    openSignIn();
  }, [openSignIn]);

  const logout = useCallback(async () => {
    await signOut();
    window.location.href = "/login";
  }, [signOut]);

  // Kombiniere Clerk-User mit DB-User
  const user = isSignedIn && dbUser ? {
    ...dbUser,
    clerkId: clerkUser?.id,
    imageUrl: clerkUser?.imageUrl,
  } : null;

  return {
    user,
    isLoading: !isLoaded || dbLoading,
    isAuthenticated: isSignedIn && !!dbUser,
    login,
    logout,
    refetch,
  };
}
```

### 5.3 Login.tsx mit Clerk-Komponenten

**Prompt für Claude Code:**
```
Ersetze client/src/pages/Login.tsx mit:

import { SignIn, useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { FileText } from "lucide-react";

export default function Login() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      setLocation("/dashboard");
    }
  }, [isSignedIn, isLoaded, setLocation]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Buchhaltung Upload Tool</h1>
              <p className="text-sm text-slate-500">Belege erfassen und DATEV-Export erstellen</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-xl",
                headerTitle: "text-2xl",
                headerSubtitle: "text-slate-600",
                socialButtonsBlockButton: "h-12",
                formButtonPrimary: "bg-teal-600 hover:bg-teal-700",
              },
            }}
            redirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/50 mt-12">
        <div className="container py-6 text-center text-sm text-slate-500">
          © 2025 Buchhaltung Upload Tool. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}
```

### 5.4 const.ts bereinigen

**Prompt für Claude Code:**
```
Ersetze client/src/const.ts mit:

export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// Diese Funktion wird nicht mehr benötigt, Clerk übernimmt das
// Aber wir behalten sie für Kompatibilität
export const getLoginUrl = () => "/login";
export const getAndClearReturnUrl = () => "/dashboard";
```

---

## 🗑️ Schritt 6: Manus-spezifische Dateien entfernen

**Prompt für Claude Code:**
```
Lösche folgende Dateien/Ordner komplett:

1. server/_core/sdk.ts
2. server/_core/oauth.ts
3. server/_core/types/manusTypes.ts
4. client/src/_core/hooks/useAuth.ts (falls vorhanden)
5. .manus/ Ordner (Manus-spezifische Konfiguration)
6. vite-plugin-manus-runtime aus package.json devDependencies entfernen
```

---

## 🗃️ Schritt 7: Datenbank-Migration erstellen

**Prompt für Claude Code:**
```
Erstelle eine neue Migration-Datei drizzle/0019_clerk_migration.sql:

-- Rename openId to clerkId
ALTER TABLE users CHANGE COLUMN openId clerkId VARCHAR(64) NOT NULL;

-- Update index name if exists
-- (Drizzle sollte das automatisch handhaben)
```

---

## 🚂 Schritt 8: Railway Deployment vorbereiten

### 8.1 Dockerfile erstellen (optional, Railway kann auch ohne)

**Prompt für Claude Code:**
```
Erstelle eine Datei Dockerfile im Root:

FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start
CMD ["pnpm", "start"]
```

### 8.2 railway.json erstellen

**Prompt für Claude Code:**
```
Erstelle eine Datei railway.json im Root:

{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## ✅ Schritt 9: Clerk Dashboard Setup

**Manuelle Schritte (nicht Claude Code):**

1. **Clerk Account erstellen:** https://clerk.com
2. **Neue Application erstellen:** "Buchhaltung Upload Tool"
3. **Production Instance erstellen**
4. **Domain hinzufügen** (z.B. buchhaltung.deinedomain.com)
5. **DNS CNAME Records bei IONOS eintragen:**
   ```
   clerk.buchhaltung.deinedomain.com → frontend-api.clerk.services
   accounts.buchhaltung.deinedomain.com → accounts.clerk.services
   ```
6. **API Keys kopieren:**
   - CLERK_PUBLISHABLE_KEY (pk_live_xxx)
   - CLERK_SECRET_KEY (sk_live_xxx)

---

## 🔄 Schritt 10: Railway Setup

**Manuelle Schritte:**

1. **Railway Projekt erstellen:** https://railway.app
2. **GitHub Repository verbinden:** angelus200/buchhaltung-upload-tool
3. **MySQL Database hinzufügen**
4. **Environment Variables setzen:**
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
   CLERK_PUBLISHABLE_KEY=pk_live_xxx
   CLERK_SECRET_KEY=sk_live_xxx
   DATABASE_URL=${{MySQL.DATABASE_URL}}
   NODE_ENV=production
   ```
5. **Custom Domain hinzufügen**
6. **Deploy!**

---

## 🧪 Schritt 11: Testen

**Prompt für Claude Code:**
```
Erstelle eine Test-Checkliste als TESTING.md:

# Test-Checkliste nach Migration

## Auth Flow
- [ ] Login-Seite lädt
- [ ] Google Login funktioniert
- [ ] Microsoft Login funktioniert
- [ ] Apple Login funktioniert
- [ ] Nach Login → Dashboard Redirect
- [ ] Logout funktioniert
- [ ] Session bleibt nach Reload erhalten

## User Management
- [ ] User wird in DB angelegt nach erstem Login
- [ ] User-Rolle wird korrekt gesetzt
- [ ] Admin-Bereich nur für Admins

## Business Logic
- [ ] Buchungen erstellen
- [ ] Buchungen anzeigen
- [ ] DATEV-Export
- [ ] Unternehmen wechseln
- [ ] Berechtigungen funktionieren

## Performance
- [ ] Seiten laden < 2 Sekunden
- [ ] Keine Console-Errors
- [ ] Mobile-Ansicht funktioniert
```

---

## 📝 Zusammenfassung der Änderungen

| Datei | Aktion |
|-------|--------|
| `package.json` | Dependencies ändern |
| `.env.example` | Neu erstellen |
| `server/_core/env.ts` | Komplett ersetzen |
| `server/_core/context.ts` | Komplett ersetzen |
| `server/_core/sdk.ts` | LÖSCHEN |
| `server/_core/oauth.ts` | LÖSCHEN |
| `server/_core/index.ts` | Clerk Middleware hinzufügen |
| `server/db.ts` | openId → clerkId |
| `drizzle/schema.ts` | openId → clerkId |
| `client/src/main.tsx` | ClerkProvider hinzufügen |
| `client/src/hooks/useAuth.ts` | Komplett ersetzen |
| `client/src/pages/Login.tsx` | Komplett ersetzen |
| `client/src/const.ts` | Bereinigen |
| `.manus/` | LÖSCHEN |
| `Dockerfile` | Neu erstellen |
| `railway.json` | Neu erstellen |

---

## ⚠️ Wichtige Hinweise

1. **Bestehende User:** Nach der Migration müssen sich alle User neu einloggen, da die User-IDs sich ändern (openId → clerkId)

2. **Daten-Migration:** Falls ihr bestehende User-Daten behalten wollt, müsst ihr ein Migrations-Script schreiben, das die openIds zu clerkIds mappt

3. **Webhook (Optional):** Für Echtzeit-Sync von Clerk zu eurer DB könnt ihr einen Clerk Webhook einrichten unter `/api/clerk/webhook`

4. **Admin-Rolle:** Nach der Migration muss mindestens ein User manuell als Admin gesetzt werden:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@beispiel.de';
   ```

---

**Geschätzte Zeit:** 2-3 Stunden für komplette Migration
**Schwierigkeit:** Mittel (hauptsächlich Copy-Paste mit Anpassungen)
