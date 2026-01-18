# Einladungssystem für Unternehmen

## Übersicht

Das Einladungssystem ermöglicht es Administratoren, neue Benutzer zu ihren Unternehmen einzuladen. Es umfasst:

1. **Einladungsverwaltung**: Erstellen, Versenden, Stornieren und Erneuern von Einladungen
2. **Benutzerverwaltung**: Verwalten von Benutzern, die bereits Zugriff auf ein Unternehmen haben
3. **Einladungsannahme**: Öffentliche Seite zum Annehmen von Einladungen

---

## Architektur

### Backend (Server)

#### Datenbank (drizzle/schema.ts)
- **Tabelle: `einladungen`**
  - `id`: Primary Key
  - `code`: Eindeutiger Einladungscode (UUID ohne Bindestriche)
  - `email`: E-Mail-Adresse des Eingeladenen
  - `unternehmenId`: Referenz zum Unternehmen
  - `rolle`: Vorgesehene Rolle (admin/buchhalter/viewer)
  - `eingeladenVon`: Benutzer-ID, der die Einladung erstellt hat
  - `status`: Status (pending/accepted/expired/cancelled)
  - `expiresAt`: Ablaufdatum (Standard: 7 Tage)
  - `acceptedAt`: Zeitpunkt der Annahme
  - `acceptedBy`: Benutzer-ID nach Annahme
  - `nachricht`: Optionale persönliche Nachricht

#### tRPC Router (server/einladungen.ts)

**Procedures:**

1. **create** (protectedProcedure)
   - Erstellt neue Einladung
   - Prüft Admin-Berechtigung
   - Validiert, dass keine aktive Einladung existiert
   - Validiert, dass User nicht bereits Mitglied ist
   - Generiert eindeutigen Code
   - Optional: Sendet E-Mail via `sendEinladungsEmail()`

2. **listByUnternehmen** (protectedProcedure)
   - Listet alle Einladungen für ein Unternehmen
   - Prüft Zugriffsberechtigung
   - Lädt Einladenden-Benutzer mit

3. **getByCode** (publicProcedure)
   - Ruft Einladung per Code ab
   - Öffentlich zugänglich (für Annahme-Seite)
   - Lädt Unternehmensdaten und Einladenden-Benutzer

4. **accept** (protectedProcedure)
   - Nimmt Einladung an
   - Prüft Gültigkeit (nicht abgelaufen, Status = pending)
   - Erstellt userUnternehmen-Eintrag
   - Markiert Einladung als angenommen
   - Warnung bei E-Mail-Mismatch (aber kein Fehler)

5. **cancel** (protectedProcedure)
   - Storniert Einladung
   - Nur für Admins
   - Nur für pending Einladungen

6. **resend** (protectedProcedure)
   - Erstellt neuen Code und Ablaufdatum
   - Setzt Status auf pending
   - Nur für Admins

#### Benutzerverwaltung (server/benutzerverwaltung.ts)

**Procedures:**

1. **listByUnternehmen** - Listet alle Benutzer eines Unternehmens
2. **updateRolle** - Ändert Benutzerrolle (nur Admin)
3. **removeFromUnternehmen** - Entfernt Benutzer (nur Admin, mit Schutzmechanismen)
4. **meineBerechtigungen** - Ruft eigene Berechtigungen ab

---

### Frontend (Client)

#### Komponenten

**1. EinladungsVerwaltung.tsx**

Zeigt und verwaltet Einladungen für ein Unternehmen.

**Features:**
- Tabelle mit allen Einladungen (Email, Rolle, Status, Gültigkeit)
- "Einladen" Dialog:
  - E-Mail-Eingabe
  - Rollenauswahl (Admin/Buchhalter/Viewer)
  - Optional: Persönliche Nachricht
- Aktionen pro Einladung:
  - **Link kopieren**: Kopiert Einladungslink in Zwischenablage
  - **Erneut senden**: Generiert neuen Code und verlängert Gültigkeit
  - **Stornieren**: Setzt Status auf cancelled
  - **Vorschau**: Öffnet Einladungsseite in neuem Tab
- Status-Badges:
  - **Ausstehend** (Gelb): Einladung wartet auf Annahme
  - **Angenommen** (Grün): Benutzer hat Einladung angenommen
  - **Abgelaufen** (Rot): Gültigkeit überschritten
  - **Storniert** (Grau): Admin hat Einladung storniert

**Props:**
```typescript
{
  unternehmenId: number;
  unternehmensname: string;
  isAdmin: boolean;
}
```

**2. BenutzerVerwaltungCompany.tsx**

Zeigt und verwaltet Benutzer, die bereits Zugriff auf ein Unternehmen haben.

**Features:**
- Tabelle mit allen Benutzern (Name, Email, Rolle, Letzte Anmeldung)
- Rolle ändern Dialog:
  - Rollenauswahl
  - Beschreibung der Berechtigungen
- Benutzer entfernen:
  - Bestätigungsdialog
  - Warnung bei wichtigen Aktionen
- Schutzmechanismen:
  - Kann eigene Rolle nicht ändern
  - Kann sich nicht selbst entfernen
  - Muss mindestens einen Admin geben
- Rollen-Badges:
  - **Administrator** (Rot): Voller Zugriff
  - **Buchhalter** (Blau): Kann Buchungen erstellen/bearbeiten
  - **Nur Lesen** (Grau): Nur Lesezugriff

**Props:**
```typescript
{
  unternehmenId: number;
  unternehmensname: string;
  isAdmin: boolean;
  currentUserId: number;
}
```

**3. UnternehmenManagement.tsx**

Hauptseite für Benutzer- und Einladungsverwaltung eines Unternehmens.

**Features:**
- Tabs für "Benutzer" und "Einladungen"
- Breadcrumb-Navigation zurück zu Unternehmen
- Integration beider Verwaltungskomponenten
- Berechtigungsprüfung (Admin-Check)

**Route:** `/unternehmen/:id/management`

**4. Einladung.tsx**

Öffentliche Seite zum Annehmen von Einladungen.

**Features:**
- Schöne Darstellung mit Unternehmensfarbe
- Zeigt alle Einladungsdetails:
  - Unternehmensname
  - Rolle
  - Eingeladen von
  - Gültig bis
  - Status
  - Optional: Persönliche Nachricht
- E-Mail-Mismatch-Warnung (wenn angemeldet mit anderer E-Mail)
- Buttons:
  - **Anmelden oder Registrieren** (wenn nicht angemeldet)
  - **Einladung annehmen** (wenn angemeldet)
  - **Zur Startseite** (Alternative Navigation)
- Status-spezifische UI:
  - **Ausstehend**: Zeigt Annahme-Button
  - **Angenommen**: Zeigt "Zum Dashboard" Button
  - **Abgelaufen/Storniert**: Zeigt Fehlermeldung

**Route:** `/einladung/:code`

#### Navigation

In **Unternehmen.tsx** (Unternehmensliste):
- Jede Unternehmenskarte hat einen **"Benutzer verwalten"** Button (Users-Icon)
- Klick navigiert zu `/unternehmen/:id/management`
- Button erscheint neben dem Settings-Icon

---

## Benutzerfluss

### 1. Einladung erstellen

1. Admin navigiert zu Unternehmen-Management (`/unternehmen/:id/management`)
2. Wechselt zum Tab "Einladungen"
3. Klickt "Neuer Benutzer einladen"
4. Gibt E-Mail, Rolle und optional Nachricht ein
5. Klickt "Einladung senden"
6. System:
   - Generiert eindeutigen Code
   - Speichert Einladung in DB
   - Optional: Sendet E-Mail mit Link
   - Zeigt Erfolgstoast mit "Link kopieren" Aktion

### 2. Einladungslink teilen

**Option A: E-Mail automatisch**
- Falls E-Mail-Versand konfiguriert ist, erhält Empfänger automatisch E-Mail

**Option B: Link manuell teilen**
- Admin kopiert Link aus Toast oder Tabelle
- Teilt Link per Chat, E-Mail, etc.

**Link-Format:**
```
https://ihre-domain.com/einladung/abc123...
```

### 3. Einladung annehmen

1. Empfänger öffnet Einladungslink
2. Falls nicht angemeldet:
   - Wird zur Login/Registrierung weitergeleitet
   - Nach Login zurück zur Einladungsseite
3. Falls angemeldet:
   - Sieht Einladungsdetails
   - Klickt "Einladung annehmen"
4. System:
   - Erstellt userUnternehmen-Eintrag
   - Markiert Einladung als angenommen
   - Leitet zum Dashboard weiter

### 4. Benutzer verwalten

1. Admin navigiert zu Unternehmen-Management
2. Tab "Benutzer" zeigt alle aktiven Benutzer
3. Aktionen:
   - **Rolle ändern**: Klick auf Edit-Icon
   - **Benutzer entfernen**: Klick auf Trash-Icon
   - Beide zeigen Bestätigungsdialoge

---

## Berechtigungen

### Globale Rollen (users.role)
- **admin**: Kann alles, überall
- **user**: Normale Benutzer (Standard)

### Unternehmens-Rollen (userUnternehmen.rolle)
- **admin**: Kann Benutzer verwalten, Einstellungen ändern, alles bearbeiten
- **buchhalter**: Kann Buchungen und Stammdaten erstellen/bearbeiten, Berichte exportieren
- **viewer**: Nur Lesezugriff, keine Bearbeitungsrechte

### Berechtigungslogik

**Einladungen erstellen/verwalten:**
- Unternehmens-Admin (userUnternehmen.rolle = 'admin') ODER
- Globaler Admin (users.role = 'admin')

**Benutzer verwalten:**
- Unternehmens-Admin (userUnternehmen.rolle = 'admin') ODER
- Globaler Admin (users.role = 'admin')

**Schutzmechanismen:**
1. Admin kann eigene Rolle nicht ändern
2. Admin kann sich nicht selbst entfernen
3. Unternehmen muss mindestens einen Admin haben
4. Einladung kann nur von Admin storniert werden
5. Einladung kann nur angenommen werden, wenn:
   - Status = pending
   - Nicht abgelaufen
   - User nicht bereits Mitglied

---

## API-Referenz

### Einladung erstellen

```typescript
trpc.einladungen.create.mutate({
  email: "benutzer@beispiel.de",
  unternehmenId: 1,
  rolle: "buchhalter",
  nachricht: "Willkommen im Team!"
});
```

### Einladungen abrufen

```typescript
const { data: einladungen } = trpc.einladungen.listByUnternehmen.useQuery({
  unternehmenId: 1
});
```

### Einladung annehmen

```typescript
trpc.einladungen.accept.mutate({
  code: "abc123..."
});
```

### Benutzer abrufen

```typescript
const { data: benutzer } = trpc.benutzer.listByUnternehmen.useQuery({
  unternehmenId: 1
});
```

### Rolle ändern

```typescript
trpc.benutzer.updateRolle.mutate({
  zuordnungId: 5,
  unternehmenId: 1,
  rolle: "admin"
});
```

### Benutzer entfernen

```typescript
trpc.benutzer.removeFromUnternehmen.mutate({
  zuordnungId: 5,
  unternehmenId: 1
});
```

---

## E-Mail-Versand (Optional)

Das System unterstützt optionalen E-Mail-Versand für Einladungen.

### Setup (server/_core/email.ts)

Implementieren Sie die Funktion `sendEinladungsEmail`:

```typescript
export async function sendEinladungsEmail(params: {
  empfaengerEmail: string;
  unternehmensname: string;
  unternehmensfarbe: string;
  einladenderName: string;
  rolle: string;
  einladungslink: string;
  nachricht?: string;
  gueltigBis: Date;
}): Promise<boolean> {
  // Ihre E-Mail-Implementierung (Resend, SendGrid, etc.)
  // Rückgabe: true bei Erfolg, false bei Fehler
}
```

### E-Mail-Template Empfehlung

- Unternehmensfarbe als Akzent
- Klarer "Einladung annehmen" Button
- Alle wichtigen Details (Unternehmen, Rolle, Gültigkeit)
- Persönliche Nachricht (falls vorhanden)
- Branding/Logo

### Fallback ohne E-Mail

Auch ohne E-Mail-Versand ist das System voll funktionsfähig:
- Admin kopiert Link aus UI
- Link wird manuell per Chat, E-Mail, etc. geteilt
- UI zeigt an, ob E-Mail erfolgreich gesendet wurde

---

## Testing

### Manueller Test-Flow

1. **Als Admin anmelden**
2. **Unternehmen erstellen oder auswählen**
3. **Zu Benutzerverwaltung navigieren** (Users-Icon in Unternehmenskarte)
4. **Einladung erstellen:**
   - Tab "Einladungen"
   - "Neuer Benutzer einladen"
   - Testmail eingeben
   - Rolle wählen
   - Nachricht eingeben
   - Speichern
5. **Link kopieren** (aus Toast oder Tabelle)
6. **In Inkognito-Tab öffnen** (oder ausloggen)
7. **Registrieren** (falls noch kein Account)
8. **Einladung annehmen**
9. **Als Admin: Benutzer-Tab prüfen** (neuer User sollte erscheinen)
10. **Rolle ändern testen**
11. **Benutzer entfernen testen**

### Unit Tests

Empfohlene Test-Dateien:
- `server/einladungen.test.ts` - Backend-Procedures
- `server/benutzerverwaltung.test.ts` - User-Management
- `client/src/components/EinladungsVerwaltung.test.tsx` - UI-Komponente
- `client/src/pages/Einladung.test.tsx` - Acceptance-Page

---

## Troubleshooting

### Problem: Einladung kann nicht angenommen werden

**Mögliche Ursachen:**
1. Einladung ist abgelaufen (> 7 Tage alt)
2. Status ist nicht "pending"
3. Benutzer ist bereits Mitglied
4. Datenbankverbindung fehlt

**Lösung:**
- Admin kann Einladung "Erneut senden" (generiert neuen Code + verlängert Gültigkeit)
- Prüfen Sie Status in DB-Tabelle `einladungen`

### Problem: E-Mail wird nicht versendet

**Mögliche Ursachen:**
1. E-Mail-Funktion nicht implementiert
2. API-Keys fehlen
3. Netzwerkfehler

**Lösung:**
- System funktioniert auch ohne E-Mail
- Admin kann Link manuell kopieren und teilen
- Toast zeigt an, ob E-Mail erfolgreich war

### Problem: Benutzer hat keine Berechtigung

**Mögliche Ursachen:**
1. User ist kein Admin des Unternehmens
2. Berechtigungsprüfung schlägt fehl

**Lösung:**
- Prüfen Sie `userUnternehmen.rolle` in DB
- Globaler Admin (`users.role = 'admin'`) hat immer Zugriff

### Problem: "Letzter Admin" kann nicht entfernt werden

**Erwartetes Verhalten:**
- System verhindert das Entfernen des letzten Admins
- Erst anderen User zum Admin machen, dann entfernen

---

## Sicherheit

### Implementierte Schutzmaßnahmen

1. **Eindeutige Codes**: UUID ohne Bindestriche (32 Zeichen)
2. **Ablaufdatum**: Einladungen verfallen nach 7 Tagen
3. **Status-Prüfung**: Einladungen können nur einmal verwendet werden
4. **Admin-Checks**: Sensible Aktionen erfordern Admin-Berechtigung
5. **Selbstschutz**: User kann sich nicht selbst entfernen/demoten
6. **Mindestens ein Admin**: Verhindert Admin-lose Unternehmen
7. **SQL-Injection**: Drizzle ORM verhindert SQL-Injection
8. **CSRF**: tRPC mit Clerk-Auth verhindert CSRF

### Best Practices

1. **Kurze Gültigkeit**: 7 Tage ist ein guter Kompromiss
2. **E-Mail-Versand**: Reduziert Link-Sharing über unsichere Kanäle
3. **Status-Tracking**: Audit-Trail für Einladungen
4. **Rate-Limiting**: Implementieren Sie Rate-Limiting für create-Endpoint (TODO)
5. **Logging**: Aktivitätsprotokoll trackt Benutzer-Aktionen

---

## Erweiterungsmöglichkeiten

### Kurzfristig

1. **Bulk-Einladungen**: Mehrere E-Mails auf einmal einladen
2. **Einladungs-Templates**: Vordefinierte Nachrichten
3. **Erinnerungs-E-Mails**: Automatische Erinnerung vor Ablauf
4. **CSV-Export**: Einladungsliste exportieren

### Mittelfristig

1. **Berechtigungen granular**: Pro Benutzer individuelle Berechtigungen setzen
2. **Einladungsgruppen**: Mehrere User mit gleicher Rolle einladen
3. **Automatisches Onboarding**: Tutorial nach Annahme
4. **Webhooks**: Benachrichtigung bei Einladungsannahme

### Langfristig

1. **SSO-Integration**: Google/Microsoft Login
2. **2FA**: Zwei-Faktor-Authentifizierung
3. **Audit-Log**: Erweiterte Protokollierung
4. **API-Token**: Programmatischer Zugriff

---

## Changelog

### Version 1.0.0 (2026-01-18)

**Implementiert:**
- ✅ Datenbank-Schema (einladungen-Tabelle)
- ✅ Backend-Procedures (create, list, accept, cancel, resend)
- ✅ Frontend-Komponenten (EinladungsVerwaltung, BenutzerVerwaltungCompany)
- ✅ Einladungs-Annahme-Seite (Einladung.tsx)
- ✅ Unternehmen-Management-Seite (UnternehmenManagement.tsx)
- ✅ Navigation (Users-Button in Unternehmens-Liste)
- ✅ Berechtigungssystem (Admin-Checks, Schutzmechanismen)
- ✅ Status-Management (pending/accepted/expired/cancelled)
- ✅ E-Mail-Integration (optional)

**Bekannte Limitierungen:**
- Kein Rate-Limiting für Einladungen
- Keine Bulk-Einladungen
- Keine automatischen Erinnerungen
- E-Mail-Template muss vom User implementiert werden

---

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie diese Dokumentation
2. Schauen Sie in die Code-Kommentare
3. Testen Sie im Dev-Modus mit Logs
4. Erstellen Sie ein Issue im GitHub-Repo

**Wichtige Dateien für Debugging:**
- `server/einladungen.ts` - Backend-Logik
- `server/benutzerverwaltung.ts` - User-Management
- `client/src/components/EinladungsVerwaltung.tsx` - Einladungs-UI
- `client/src/pages/Einladung.tsx` - Acceptance-Page
- `drizzle/schema.ts` - Datenbankschema
