# Multi-Tenant Auth System

## Übersicht

Das Buchhaltung Upload Tool verwendet ein **2-stufiges Rollen-System** für Multi-Tenancy:

### 1. Globale Rollen (`users.role`)
- **`admin`** - System-Administrator (Zugriff auf alle Unternehmen)
- **`user`** - Standard-Benutzer

### 2. Unternehmens-Rollen (`userUnternehmen.rolle`)
- **`admin`** - Unternehmens-Administrator (kann Benutzer seines Unternehmens verwalten)
- **`buchhalter`** - Buchhalter (kann Buchungen erstellen/bearbeiten)
- **`viewer`** - Betrachter (nur Lese-Zugriff)

## Datenbank-Schema

### `users` Tabelle
```typescript
{
  id: number;
  clerkId: string;           // Clerk Auth ID
  name: string;
  email: string;
  role: "admin" | "user";    // Globale Rolle
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}
```

### `userUnternehmen` Tabelle (Many-to-Many)
```typescript
{
  id: number;
  userId: number;                              // → users.id
  unternehmenId: number;                       // → unternehmen.id
  rolle: "admin" | "buchhalter" | "viewer";   // Pro-Unternehmen Rolle

  // Detaillierte Berechtigungen
  buchungenLesen: boolean;
  buchungenSchreiben: boolean;
  stammdatenLesen: boolean;
  stammdatenSchreiben: boolean;
  berichteLesen: boolean;
  berichteExportieren: boolean;
  einladungenVerwalten: boolean;

  createdAt: Date;
}
```

## Frontend Route Protection

### 1. **ProtectedRoute** - Für alle authentifizierten Benutzer
```typescript
// Verwendet für: Dashboard, Buchungen, Stammdaten, etc.
<Route path="/dashboard">
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
</Route>
```

**Prüft:**
- ✅ User ist eingeloggt (via Clerk)
- ❌ Redirected zu `/login` wenn nicht eingeloggt

### 2. **AdminRoute** - Nur für System-Administratoren
```typescript
// Verwendet für: Admin-Panel
<Route path="/admin">
  <AdminRoute>
    <AdminBoard />
  </AdminRoute>
</Route>
```

**Prüft:**
- ✅ User ist eingeloggt
- ✅ `user.role === "admin"`
- ❌ Redirected zu `/` wenn nicht admin

### 3. **Öffentliche Routen** - Keine Authentifizierung
```typescript
// Login-Seite
<Route path="/login" component={Login} />
```

## Berechtigungs-Flow

### Szenario 1: Globaler Admin
1. User loggt sich ein (Clerk)
2. Backend erstellt/updated User in DB mit `role: "admin"`
3. Frontend: `useAuth()` liefert `user.role === "admin"`
4. Zugriff auf **alle Routen** inkl. `/admin`

### Szenario 2: Unternehmens-Admin
1. User loggt sich ein (Clerk)
2. Backend erstellt User mit `role: "user"`
3. User wird zu Unternehmen zugeordnet mit `rolle: "admin"`
4. User kann:
   - ✅ Benutzer seines Unternehmens verwalten
   - ✅ Buchungen für sein Unternehmen erstellen
   - ❌ Zugriff auf `/admin` (nur für globale Admins)

### Szenario 3: Standard-Buchhalter
1. User loggt sich ein (Clerk)
2. Backend erstellt User mit `role: "user"`
3. User wird zu Unternehmen zugeordnet mit `rolle: "buchhalter"`
4. User kann:
   - ✅ Buchungen lesen/schreiben (wenn `buchungenSchreiben: true`)
   - ❌ Benutzer verwalten
   - ❌ Zugriff auf `/admin`

## Backend Context (tRPC)

Jeder tRPC-Request hat Zugriff auf:
```typescript
type TrpcContext = {
  user: User | null;  // DB User mit role
  req: Request;
  res: Response;
}
```

### Beispiel: Geschützte Procedure
```typescript
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { user: ctx.user } });
});
```

### Beispiel: Admin-Only Procedure
```typescript
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
```

## Unternehmens-Isolation

Alle Business-Tabellen haben `unternehmenId`:
- `buchungen.unternehmenId`
- `kreditoren.unternehmenId`
- `debitoren.unternehmenId`
- `sachkonten.unternehmenId`
- etc.

**Wichtig:** Queries müssen immer `WHERE unternehmenId = ?` filtern!

### Beispiel: Sichere Query
```typescript
// Backend Router
getBuchungen: protectedProcedure
  .input(z.object({ unternehmenId: z.number() }))
  .query(async ({ ctx, input }) => {
    // Prüfe: Hat User Zugriff auf dieses Unternehmen?
    const access = await db.userUnternehmen
      .where(eq(userId, ctx.user.id))
      .where(eq(unternehmenId, input.unternehmenId))
      .where(eq(buchungenLesen, true));

    if (!access) throw new TRPCError({ code: "FORBIDDEN" });

    // Lade Buchungen nur für dieses Unternehmen
    return db.buchungen
      .where(eq(unternehmenId, input.unternehmenId))
      .all();
  });
```

## Best Practices

### ✅ DO:
- Immer `unternehmenId` in Queries filtern
- User-Berechtigungen auf Backend prüfen (nicht nur Frontend)
- Detaillierte Berechtigungen aus `userUnternehmen` verwenden
- Globale Admins (`user.role === "admin"`) können über alle Unternehmen hinweg administrieren

### ❌ DON'T:
- Frontend-Berechtigungen als einzige Sicherheit verwenden
- Vergessen, `unternehmenId` zu filtern
- Unternehmens-Daten ohne Zugriffsprüfung zurückgeben
- Admin-Rechte vergeben ohne genaue Anforderungen

## Zukunft: Company Context Hook

Für bessere UX könnte ein `useCompany()` Hook erstellt werden:
```typescript
const { currentCompany, switchCompany, companies } = useCompany();
// User sieht nur Unternehmen, zu denen er Zugriff hat
```

Dies würde die aktuelle Unternehmens-ID im Context speichern und automatisch in allen Queries verwenden.
