# Context.ts Verbesserung: Email & Name von Clerk holen

## Problem

Aktuell werden neue User ohne Email und Name erstellt:

```typescript
await db.upsertUser({
  clerkId: auth.userId,
  lastSignedIn: new Date(),
  // email und name fehlen!
});
```

## Lösung

Clerk User API nutzen, um vollständige User-Daten zu erhalten:

```typescript
import { getAuth, clerkClient } from "@clerk/express";

// In createContext():
if (auth.userId) {
  user = await db.getUserByClerkId(auth.userId) ?? null;

  if (!user) {
    // Hole vollständige User-Daten von Clerk
    const clerkUser = await clerkClient.users.getUser(auth.userId);

    await db.upsertUser({
      clerkId: auth.userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      name: clerkUser.fullName ?? clerkUser.firstName ?? null,
      loginMethod: "clerk",
      lastSignedIn: new Date(),
    });

    user = await db.getUserByClerkId(auth.userId) ?? null;
  }
}
```

## Vorteile

✅ Email wird automatisch aus Clerk übernommen
✅ Name wird automatisch gesetzt
✅ Bessere User-Verwaltung im Admin-Panel
✅ Email kann für Benachrichtigungen genutzt werden

## Environment Variable

Stelle sicher, dass `CLERK_SECRET_KEY` in `.env` gesetzt ist:

```env
CLERK_SECRET_KEY=sk_live_xxx
```

Der `clerkClient` benötigt den Secret Key für API-Calls.

## Alternativen

Falls API-Calls zu langsam sind, kann man auch:

1. **Clerk Session Claims** nutzen (Email im JWT)
2. **Lazy Loading**: Email beim ersten `/dashboard` Besuch nachladen
3. **Webhook**: Clerk Webhook bei User-Erstellung nutzen

Für die meisten Fälle ist die direkte API-Nutzung die sauberste Lösung.
