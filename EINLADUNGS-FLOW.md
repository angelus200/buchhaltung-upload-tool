# 📧 Einladungs-Flow - Vollständige Dokumentation

## ✅ Status: Vollständig implementiert

Der Einladungs-Flow für neue Benutzer ist **komplett funktionsfähig** und produktionsbereit.

---

## 📋 Implementierte Features

### 1. Datenbank-Schema ✅
**Tabelle:** `einladungen` (drizzle/schema.ts:469-496)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | int (PK) | Auto-Inkrement ID |
| code | varchar(64) unique | UUID ohne Bindestriche |
| email | varchar(320) | E-Mail des Eingeladenen |
| unternehmenId | int (FK) | Verknüpfung zum Unternehmen |
| rolle | enum | admin, buchhalter, viewer |
| eingeladenVon | int (FK) | User-ID des Einladenden |
| status | enum | pending, accepted, expired, cancelled |
| expiresAt | timestamp | Ablaufdatum (7 Tage) |
| acceptedAt | timestamp | Annahme-Zeitpunkt |
| acceptedBy | int (FK) | User-ID nach Annahme |
| nachricht | text | Optionale persönliche Nachricht |
| createdAt | timestamp | Erstellungszeitpunkt |
| updatedAt | timestamp | Aktualisierungszeitpunkt |

---

### 2. Backend API ✅
**Router:** `server/einladungen.ts` (502 Zeilen)
**Registriert in:** `server/routers.ts:44`

#### Endpoints:

##### a) `einladungen.create` (protected)
```typescript
Input: {
  email: string (email validation),
  unternehmenId: number,
  rolle: "admin" | "buchhalter" | "viewer",
  nachricht?: string
}

Output: {
  id: number,
  code: string,
  email: string,
  expiresAt: Date,
  inviteUrl: string,
  fullInviteUrl: string,
  unternehmensname: string,
  emailSent: boolean
}
```

**Validierungen:**
- Nur Admins dürfen einladen
- Keine doppelten aktiven Einladungen
- Keine Einladung wenn bereits Mitglied
- Generiert sicheren UUID-Code
- Sendet E-Mail via Resend

##### b) `einladungen.listByUnternehmen` (protected)
Listet alle Einladungen eines Unternehmens mit einladendem Benutzer.

##### c) `einladungen.getByCode` (public)
```typescript
Input: { code: string }

Output: {
  id: number,
  email: string,
  rolle: string,
  status: string,
  nachricht?: string,
  expiresAt: Date,
  unternehmensname: string,
  unternehmensfarbe: string,
  eingeladenVonName: string
}
```

**Besonderheit:** Öffentlich zugänglich, damit Landing-Page ohne Login funktioniert.

##### d) `einladungen.accept` (protected)
```typescript
Input: { code: string }

Output: {
  success: boolean,
  unternehmensname: string,
  rolle: string,
  emailMismatch: boolean,
  originalEmail: string,
  userEmail: string
}
```

**Ablauf:**
1. Prüft ob Einladung gültig & nicht abgelaufen
2. Erlaubt Annahme auch bei E-Mail-Mismatch (mit Warnung)
3. Erstellt `user_unternehmen` Eintrag
4. Markiert Einladung als "accepted"
5. Redirect zu Dashboard

##### e) `einladungen.cancel` (protected)
Admins können pending Einladungen stornieren.

##### f) `einladungen.resend` (protected)
Generiert neuen Code und verlängert Ablaufdatum.

---

### 3. E-Mail-Funktionalität ✅
**Datei:** `server/_core/email.ts` (190 Zeilen)
**Provider:** Resend

**Template-Features:**
- Responsive HTML-E-Mail mit Firmenfarbe
- Text-Fallback für Plain-Text-Clients
- Persönliche Nachricht (optional)
- Rollenbeschreibung (deutsch)
- Gültigkeitsdatum formatiert
- CTA-Button + Fallback-Link

**Absender:** `Buchhaltung Upload Tool <noreply@resend.dev>`

**Umgebungsvariable:** `RESEND_API_KEY` (optional - ohne wird Warnung geloggt)

---

### 4. Frontend - Landing Page ✅
**Datei:** `client/src/pages/Einladung.tsx`
**Route:** `/einladung/:code` (registriert in App.tsx:116-119)

**Features:**
- Zeigt Firmenname, Logo, Rolle
- Status-Badge (Ausstehend, Angenommen, Abgelaufen)
- Optionale Nachricht vom Einladenden
- Gültigkeitsdatum

**Flows:**
1. **Nicht eingeloggt:**
   - Button: "Anmelden oder Registrieren"
   - Speichert Return-URL in localStorage
   - Redirect zu Clerk Login/Signup

2. **Eingeloggt:**
   - Button: "Einladung annehmen"
   - Warnung bei E-Mail-Mismatch
   - Nach Annahme: Redirect zu Dashboard

3. **Fehler-States:**
   - Nicht gefunden
   - Abgelaufen
   - Bereits verwendet
   - Bereits Mitglied

---

### 5. Frontend - Verwaltung ✅
**Datei:** `client/src/components/EinladungsVerwaltung.tsx`
**Verwendung:** In Benutzerverwaltung eingebettet

**Features:**

#### Modal "Benutzer einladen"
- E-Mail-Eingabe mit Validation
- Rolle-Dropdown (Admin, Buchhalter, Nur Lesen)
- Optionale persönliche Nachricht (Textarea)
- Button: "Einladung senden"

#### Einladungs-Tabelle
- Liste aller Einladungen des Unternehmens
- Spalten: E-Mail, Rolle, Status, Eingeladen von, Erstellt am
- Aktionen:
  - **Link kopieren** (Copy Icon)
  - **Erneut senden** (RotateCw Icon)
  - **Stornieren** (X Icon)

#### Status-Badges
- 🟡 Ausstehend (pending)
- 🟢 Angenommen (accepted)
- 🔴 Abgelaufen (expired)
- ⚫ Storniert (cancelled)

---

## 🚀 Verwendung

### Für Administratoren

**1. Benutzer einladen:**
```
1. Gehe zu /benutzerverwaltung
2. Klicke "Benutzer einladen"
3. Gebe E-Mail-Adresse ein
4. Wähle Rolle
5. Optional: Persönliche Nachricht
6. Klicke "Einladung senden"
```

**Ergebnis:**
- E-Mail wird versendet (wenn Resend konfiguriert)
- Einladungs-Link kann manuell kopiert werden
- Einladung erscheint in der Tabelle

**2. Einladungs-Link teilen:**
```
Format: https://buchhaltung-ki.app/einladung/[32-stelliger-code]

z.B.: https://buchhaltung-ki.app/einladung/a1b2c3d4e5f6...
```

**3. Einladung verwalten:**
- **Erneut senden:** Neuer Code + verlängertes Ablaufdatum
- **Stornieren:** Verhindert Annahme
- **Link kopieren:** In Zwischenablage

---

### Für Eingeladene Benutzer

**1. Link öffnen:**
```
User erhält E-Mail mit Link oder Admin teilt Link direkt
```

**2. Einladung ansehen:**
- Firmenname
- Rolle (Admin, Buchhalter, Nur Lesen)
- Nachricht vom Einladenden (falls vorhanden)
- Gültig bis Datum

**3a. Noch kein Account:**
```
1. Klicke "Anmelden oder Registrieren"
2. Clerk Signup mit E-Mail
3. Nach Registrierung automatisch zu Einladung zurück
4. Klicke "Einladung annehmen"
```

**3b. Bereits eingeloggt:**
```
1. Klicke "Einladung annehmen"
2. Automatischer Redirect zu Dashboard
3. Unternehmen ist nun verfügbar
```

---

## ⚙️ Konfiguration

### Erforderliche Environment Variables

**Keine!** Der Flow funktioniert **ohne** Konfiguration:
- Einladungen werden in DB gespeichert
- Link kann manuell geteilt werden
- Acceptance funktioniert sofort

### Optionale Environment Variables

#### E-Mail-Versand aktivieren (Empfohlen)
```bash
# .env oder Railway Environment Variables
RESEND_API_KEY=re_xxx
```

**Resend API Key erhalten:**
1. Registriere auf https://resend.com
2. Erstelle API Key
3. Setze Variable in Railway

**Vorteile:**
- Automatischer E-Mail-Versand
- Professionelle HTML-Vorlage
- Tracking via Resend Dashboard

**Ohne Resend:**
- Console-Warnung im Log
- Link muss manuell geteilt werden
- Funktionalität bleibt erhalten

---

## 🔒 Sicherheit

### Implementierte Schutzmaßnahmen

1. **UUID-Token:** 32 Zeichen (ohne Bindestriche), kryptografisch sicher
2. **Ablaufdatum:** 7 Tage nach Erstellung
3. **Status-Tracking:** Verhindert doppelte Verwendung
4. **Admin-Only:** Nur Admins dürfen einladen/stornieren
5. **Ownership-Check:** User kann nur eigene Unternehmen einladen
6. **No Double-Membership:** Prüfung ob bereits Mitglied
7. **Public Endpoint:** `getByCode` ist absichtlich public (für Landing-Page)
8. **E-Mail-Flexibilität:** Acceptance auch mit anderem Email möglich (mit Warnung)

---

## 🧪 Testing

### Manuelle Tests

**1. Einladung erstellen:**
```bash
curl -X POST http://localhost:3000/api/trpc/einladungen.create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","unternehmenId":1,"rolle":"buchhalter"}'
```

**2. Einladung abrufen:**
```bash
curl http://localhost:3000/api/trpc/einladungen.getByCode?input={\"code\":\"xxx\"}
```

**3. Frontend-Flow:**
```
1. Als Admin einloggen
2. Gehe zu /benutzerverwaltung
3. Klicke "Benutzer einladen"
4. Einladung erstellen
5. Link kopieren
6. In Inkognito-Tab öffnen
7. Registrieren + Annehmen
8. Prüfe Dashboard: Unternehmen sichtbar
```

### Unit Tests

**Datei:** `server/einladungen.test.ts`

Test-Coverage:
- Schema-Validierung
- Code-Generierung
- Ablaufdatum-Berechnung
- Status-Übergänge
- E-Mail-Format

---

## 📊 Monitoring

### Datenbank-Queries

```sql
-- Alle aktiven Einladungen
SELECT * FROM einladungen
WHERE status = 'pending'
AND expiresAt > NOW()
ORDER BY createdAt DESC;

-- Annahmerate
SELECT
  status,
  COUNT(*) as anzahl,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM einladungen), 2) as prozent
FROM einladungen
GROUP BY status;

-- Abgelaufene Einladungen (Cleanup)
SELECT COUNT(*) FROM einladungen
WHERE status = 'pending'
AND expiresAt < NOW();
```

### Logs

```bash
# E-Mail-Versand
[Email] Invitation email sent successfully to user@example.com, ID: re_xxx

# E-Mail-Fehler
[Email] Failed to send invitation email: [error details]

# Einladung nicht konfiguriert
[Email] Skipping email send - Resend not configured
```

---

## 🐛 Troubleshooting

### Problem: E-Mail kommt nicht an

**Ursache:** Resend API Key fehlt oder falsch

**Lösung:**
1. Prüfe `RESEND_API_KEY` in Railway Environment Variables
2. Prüfe Resend Dashboard: https://resend.com/emails
3. Verwende manuellen Link-Versand als Fallback

---

### Problem: "Einladung nicht gefunden"

**Ursache:** Code falsch oder bereits verwendet

**Lösung:**
1. Prüfe DB: `SELECT * FROM einladungen WHERE code = 'xxx'`
2. Prüfe Status und expiresAt
3. Admin kann "Erneut senden" für neuen Link

---

### Problem: "Sie sind bereits Mitglied"

**Ursache:** User hat bereits Zugriff auf Unternehmen

**Lösung:**
1. Prüfe `user_unternehmen` Tabelle
2. Entferne alten Eintrag falls nötig
3. Oder: User nutzt falschen Account

---

### Problem: E-Mail-Mismatch-Warnung

**Ursache:** User registrierte sich mit anderer E-Mail

**Verhalten:**
- Annahme ist trotzdem möglich
- Warnung wird angezeigt
- Kann ignoriert werden

**Rationale:**
- Flexibilität für User (z.B. Firmen-E-Mail vs. privat)
- Admin entscheidet bei Einladung

---

## 📈 Erweiterungen (Optional)

### Mögliche zukünftige Features

1. **Bulk-Einladungen:** CSV-Upload für mehrere User
2. **Rollen-Templates:** Vordefinierte Berechtigungssets
3. **Einladungs-Historie:** Audit-Log für Compliance
4. **Reminder-E-Mails:** Automatisch nach 3 Tagen
5. **Custom Expiration:** Admin wählt Gültigkeitsdauer
6. **Webhook-Integration:** Slack/Teams Benachrichtigung

---

## 📚 Weitere Ressourcen

- **Schema:** `drizzle/schema.ts:469-496`
- **Backend Router:** `server/einladungen.ts`
- **E-Mail Template:** `server/_core/email.ts`
- **Frontend Landing:** `client/src/pages/Einladung.tsx`
- **Frontend Verwaltung:** `client/src/components/EinladungsVerwaltung.tsx`
- **Unit Tests:** `server/einladungen.test.ts`

---

**Status:** ✅ Produktionsbereit | 📦 Vollständig implementiert | 🧪 Getestet

Erstellt: 2026-01-18 | Buchhaltungs-App v1.0
