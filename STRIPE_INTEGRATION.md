# Stripe Integration - Vollständige Dokumentation

## ✅ IMPLEMENTIERT (Commit: 0ae9ab3)

### **Phase 1: Backend Foundation**
- ✅ Stripe Package installiert (`npm install stripe`)
- ✅ Drizzle Schema erweitert (2 neue Tabellen: `subscriptions`, `onboarding_orders`)
- ✅ Migration generiert (`drizzle/0011_modern_iron_fist.sql`)
- ✅ Stripe Client erstellt (`server/lib/stripe.ts`)
- ✅ Stripe tRPC Router (`server/stripe.ts`) mit 3 Endpoints:
  - `createCheckoutSession` (PUBLIC)
  - `linkUserToSubscription` (PROTECTED)
  - `getSubscriptionStatus` (PROTECTED)
- ✅ Webhook Handler (`server/_core/stripeWebhook.ts`)
- ✅ Webhook Route registriert (VOR JSON body parser - kritisch!)
- ✅ Router in `appRouter` registriert

### **Phase 2: Frontend & Flow**
- ✅ Landing Page (`client/src/pages/LandingPage.tsx`)
- ✅ Sign-Up Page (`client/src/pages/SignUpAfterPayment.tsx`)
- ✅ Setup Page (`client/src/pages/Setup.tsx`)
- ✅ Routing umgestellt in `App.tsx`:
  - `/` → Landing Page (öffentlich)
  - `/sign-up` → Sign-Up nach Zahlung (öffentlich)
  - `/app` → Haupt-Dashboard (geschützt)
  - `/app/setup` → Setup (geschützt, kein Sub-Check)

### **Phase 3: Polish & Guards**
- ✅ Subscription Guard in `ProtectedRoute.tsx` integriert
- ✅ Plan Limits (`client/src/lib/planLimits.ts`)
- ✅ Build erfolgreich (keine TS-Fehler)

---

## 📋 NEUE DATEIEN

### Backend
```
server/lib/stripe.ts                  → Stripe Client
server/stripe.ts                      → tRPC Router für Stripe
server/_core/stripeWebhook.ts         → Webhook Handler
drizzle/0011_modern_iron_fist.sql     → DB Migration
```

### Frontend
```
client/src/pages/LandingPage.tsx      → Öffentliche Landing Page
client/src/pages/SignUpAfterPayment.tsx → Sign-Up nach Zahlung
client/src/pages/Setup.tsx            → Subscription-Setup
client/src/lib/planLimits.ts          → Plan-Limits Konstanten
```

### Geänderte Dateien
```
client/src/App.tsx                    → Routing erweitert
client/src/components/ProtectedRoute.tsx → Subscription Guard
server/_core/index.ts                 → Webhook Route registriert
server/routers.ts                     → Stripe Router registriert
drizzle/schema.ts                     → 2 neue Tabellen
package.json                          → Stripe dependency
```

---

## 🔐 ENVIRONMENT VARIABLES (RAILWAY)

### ✅ Bereits konfiguriert (laut User):
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Subscription Plans (monatlich)
STRIPE_PRICE_STARTER=price_1T1WiMA8fUoWsdr5QCfQDykK    # 299 EUR/Monat
STRIPE_PRICE_BUSINESS=price_1T1WklA8fUoWsdr5CRPtOmjG   # 499 EUR/Monat

# Onboarding (einmalig)
STRIPE_PRICE_ONBOARDING_BASIS=price_1T1WlcA8fUoWsdr5iy4rzSpI      # 499 EUR
STRIPE_PRICE_ONBOARDING_KOMPLETT=price_1T1WmSA8fUoWsdr5hFz0c7gR   # 1.499 EUR

# Schulungen (einmalig)
STRIPE_PRICE_SCHULUNG_EINZEL=price_1T1WneA8fUoWsdr5OFoFbiwT      # 149 EUR
STRIPE_PRICE_SCHULUNG_TEAM=price_1T1WokA8fUoWsdr5hIPzOb9s        # 349 EUR
STRIPE_PRICE_SCHULUNG_INTENSIV=price_1T1WpbA8fUoWsdr5ccNxGyMt    # 799 EUR

# App URL für Redirects
VITE_APP_URL=https://buchhaltung-ki.app
```

---

## 🗄️ DATENBANK MIGRATION

### Tabelle: `subscriptions`
```sql
CREATE TABLE `subscriptions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `clerkUserId` varchar(255),
  `stripeCustomerId` varchar(255) NOT NULL,
  `stripeSubscriptionId` varchar(255),
  `stripePriceId` varchar(255),
  `plan` enum('starter','business','enterprise') NOT NULL,
  `status` enum('active','canceled','past_due','trialing','incomplete') NOT NULL DEFAULT 'incomplete',
  `currentPeriodEnd` timestamp,
  `email` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabelle: `onboarding_orders`
```sql
CREATE TABLE `onboarding_orders` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `stripeCustomerId` varchar(255) NOT NULL,
  `clerkUserId` varchar(255),
  `packageType` enum('basis','komplett','enterprise','schulung_einzel','schulung_team','schulung_intensiv') NOT NULL,
  `stripePaymentIntentId` varchar(255),
  `status` enum('paid','pending','refunded') NOT NULL DEFAULT 'pending',
  `amount` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
```

**Migration ausführen:**
```bash
npx drizzle-kit push
```

---

## 🔄 USER FLOW

### Neukunden-Flow (Subscription erstellen):
1. User besucht `/` (Landing Page)
2. User klickt "Jetzt buchen" bei Starter oder Business Plan
3. Optional: User wählt Onboarding-Paket oder Schulung
4. Redirect zu Stripe Checkout
5. User zahlt bei Stripe
6. Stripe Redirect zu `/sign-up?session_id={CHECKOUT_SESSION_ID}`
7. User erstellt Clerk Account
8. Clerk Redirect zu `/app/setup?session_id={CHECKOUT_SESSION_ID}`
9. Setup-Page verknüpft Clerk User ID mit Stripe Customer
10. Redirect zu `/app` (Dashboard)

### Webhook-Events (Stripe → Backend):
- **checkout.session.completed**: Subscription in DB speichern
- **customer.subscription.updated**: Status/Plan in DB aktualisieren
- **customer.subscription.deleted**: Status auf "canceled" setzen
- **invoice.payment_failed**: Status auf "past_due" setzen

### Subscription Guard:
- Prüft bei jedem geschützten Route-Aufruf ob User aktive Subscription hat
- Kein aktives Abo → Redirect zu `/` (Landing Page)
- Ausnahme: `/app/setup` (für Verknüpfung nach Sign-Up)

---

## 🔧 STRIPE WEBHOOK KONFIGURATION

### In Stripe Dashboard:
1. Gehe zu: **Developers → Webhooks**
2. Klicke: **Add endpoint**
3. Endpoint URL: `https://buchhaltung-ki.app/api/stripe/webhook`
4. Events auswählen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Webhook Secret kopieren → als `STRIPE_WEBHOOK_SECRET` in Railway eintragen

---

## 📊 PLAN-LIMITS

```typescript
PLAN_LIMITS = {
  starter: {
    maxFirmen: 1,
    maxUser: 2,
  },
  business: {
    maxFirmen: 5,
    maxUser: 5,
  },
  enterprise: {
    maxFirmen: 999,
    maxUser: 999,
  },
}
```

### Prüfung implementieren:
- Bei Firma-Erstellung: `isPlanLimitReached(plan, 'maxFirmen', currentCount)`
- Bei User-Einladung: `isPlanLimitReached(plan, 'maxUser', currentCount)`

---

## ⚠️ KRITISCHE HINWEISE

### 1. Webhook Route Reihenfolge
```typescript
// RICHTIG (in server/_core/index.ts):
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(express.json({ limit: "50mb" }));  // ← DANACH!

// FALSCH:
app.use(express.json());  // ← VOR Webhook = Signature Verification schlägt fehl!
app.post("/api/stripe/webhook", ...);
```

### 2. Subscription Status Enums
- `active` → User kann App nutzen
- `trialing` → User in Trial-Phase (falls aktiviert)
- `incomplete` → Zahlung ausstehend (initial)
- `past_due` → Zahlungsproblem
- `canceled` → Abo gekündigt

### 3. Console Logs
Alle Stripe-bezogenen Logs haben 🔵 Emoji-Marker für einfaches Filtern:
```typescript
console.log("🔵 Checkout Session created:", session.id);
```

---

## 🧪 TESTING

### Lokales Testing (Stripe CLI):
```bash
# Stripe CLI installieren
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Webhook Events weiterleiten
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test-Checkout erstellen
stripe trigger checkout.session.completed
```

### Production Testing:
1. Test-Zahlung mit Stripe Test-Karten: `4242 4242 4242 4242`
2. Prüfe Webhook Logs in Stripe Dashboard
3. Prüfe DB: `SELECT * FROM subscriptions ORDER BY createdAt DESC LIMIT 5;`

---

## 📞 SUPPORT & TROUBLESHOOTING

### Häufige Probleme:

**1. Webhook schlägt fehl (401/403)**
→ `STRIPE_WEBHOOK_SECRET` falsch konfiguriert oder Webhook Route nach JSON parser registriert

**2. createCheckoutSession gibt 500 Error**
→ Price IDs prüfen (ENV Variables korrekt gesetzt?)

**3. User wird nach Sign-Up auf Landing Page geleitet**
→ Subscription nicht verknüpft, DB prüfen: `SELECT * FROM subscriptions WHERE email = 'user@example.com';`

**4. Migration schlägt fehl**
→ `drizzle-kit push` interaktiv, manuell SQL ausführen in Railway MySQL

---

## 🎯 NÄCHSTE SCHRITTE (Optional)

### Verbesserungen:
1. **Customer Portal** für Abo-Verwaltung (Upgrade/Downgrade/Cancel)
2. **Invoice History** im User-Bereich
3. **Proration** bei Plan-Wechsel
4. **Trial Period** (7/14 Tage kostenlos)
5. **Usage-based Billing** (z.B. extra Firmen zukaufen)
6. **Email-Benachrichtigungen** bei Zahlungsfehlern (Resend Integration)
7. **Admin Dashboard** für Subscription-Übersicht

### Plan-Limit Enforcement:
- Im `unternehmenRouter.create` Endpoint Limit-Check einbauen
- Im `benutzerRouter.invite` Endpoint User-Limit prüfen
- Sinnvolle Fehlermeldungen mit Upgrade-CTA

---

## 📄 VERKÄUFER-IMPRESSUM

**Marketplace24-7 GmbH**
Kantonsstrasse 1
8807 Freienbach SZ
Schweiz

**Marke:** Non Dom Group

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Code auf GitHub gepusht (✅ Erledigt: Commit 0ae9ab3)
- [ ] Railway ENV Variables gesetzt (User muss bestätigen)
- [ ] Railway Deploy getriggert (Auto-Deploy nach Push)
- [ ] DB Migration ausgeführt (`npx drizzle-kit push` oder manuell SQL)
- [ ] Stripe Webhook konfiguriert (URL + Secret)
- [ ] Webhook Events getestet (Stripe CLI oder Test-Zahlung)
- [ ] Landing Page erreichbar (`https://buchhaltung-ki.app/`)
- [ ] Sign-Up Flow getestet (Ende-zu-Ende)
- [ ] Subscription Guard funktioniert (ohne Abo → Redirect zu Landing Page)
- [ ] Plan Limits implementiert (optional, später)
- [ ] NO_CACHE=1 aus Railway ENV entfernen (falls noch gesetzt)

---

**Stand:** 2026-02-16
**Version:** 1.0
**Autor:** Claude Sonnet 4.5
