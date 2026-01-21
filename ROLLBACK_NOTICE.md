# Rollback Notice - Clerk Configuration

## Was ist passiert?

Die Runtime-Loading Lösung für Clerk Keys hat nicht funktioniert wie erwartet. 
Alle Änderungen wurden rückgängig gemacht.

## Aktueller Stand

✅ **Zurück zur funktionierenden Konfiguration:**

- `client/src/main.tsx` nutzt wieder `VITE_CLERK_PUBLISHABLE_KEY`
- Kein systemRouter.config Endpoint
- Original env.ts wiederhergestellt

## Railway Konfiguration

**WICHTIG:** Setze BEIDE Variablen in Railway:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_clerkxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_live_clerkxxxxxxxxx  
CLERK_SECRET_KEY=sk_live_clerkxxxxxxxxx
```

### Warum BEIDE Keys?

- `VITE_CLERK_PUBLISHABLE_KEY` → Für Frontend (Build-Zeit)
- `CLERK_PUBLISHABLE_KEY` → Für Backend (Runtime)
- `CLERK_SECRET_KEY` → Für Backend Auth (Runtime)

## Railway Deployment Trigger

Nachdem du die Variablen gesetzt hast:

```bash
git commit --allow-empty -m "Trigger redeploy with correct env vars"
git push origin main
```

Oder im Railway Dashboard: "Redeploy" Button klicken

## Wichtig

Die App benötigt jetzt einen **Rebuild** mit den gesetzten VITE_ Variablen.
Ein einfaches Redeploy reicht NICHT aus - es muss ein kompletter Build sein.

---

**Rollback durchgeführt:** 2026-01-22  
**Commit:** 19f4108
