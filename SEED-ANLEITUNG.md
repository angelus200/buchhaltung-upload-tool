# 🌱 Seed-Anleitung: Unternehmen-Daten

## Übersicht der 5 neuen Unternehmen

| # | Firma | Land | Rechtsform | Währung | Kontenrahmen | Farbe |
|---|-------|------|------------|---------|--------------|-------|
| 2 | **Angelus Managementberatungs und Service KG** | 🇩🇪 DE | KG | EUR | SKR04 | 🔵 Indigo (#6366f1) |
| 3 | **commercehelden GmbH** | 🇦🇹 AT | GmbH | EUR | OeKR | 🔴 Pink (#ec4899) |
| 4 | **Emo Retail OG** | 🇦🇹 AT | OG | EUR | OeKR | 🟠 Orange (#f97316) |
| 5 | **Trademark24-7 AG** | 🇨🇭 CH | AG | CHF | KMU | 🔴 Rot (#ef4444) |
| 6 | **Marketplace24-7 GmbH** | 🇨🇭 CH | GmbH | CHF | KMU | 🟣 Lila (#8b5cf6) |

---

## 📋 Details zu den Unternehmen

### 🇩🇪 Angelus Managementberatungs und Service KG
- **Standort:** Konrad-Zuse-Platz 8, 81829 München
- **Steuernummer:** 143/501/60818
- **USt-IdNr:** DE279532189
- **Handelsregister:** Amtsgericht München, HRA 102 679
- **Kontakt:** 0800 175 077 0 | office@angelus.group
- **Website:** www.angelus.group

### 🇦🇹 commercehelden GmbH
- **Standort:** Pembaurstraße 14, 6020 Innsbruck
- **Steuernummer:** 81 505/0224

### 🇦🇹 Emo Retail OG
- **Standort:** Pembaurstraße 14, 6020 Innsbruck
- **Steuernummer:** 90 348/9649

### 🇨🇭 Trademark24-7 AG
- **Standort:** Kantonsstrasse 1, 8807 Freienbach
- **USt-IdNr:** CHE-246.473.858
- **Handelsregister:** CH-130-3033361-7
- **Website:** www.brands-wanted.com

### 🇨🇭 Marketplace24-7 GmbH
- **Standort:** Kantonsstrasse 1, 8807 Freienbach
- **USt-IdNr:** CHE-351.662.058
- **Handelsregister:** CH-130-4033363-2
- **Website:** www.non-dom.group

---

## 🚀 Ausführungsoptionen

### Option 1: Railway Console (Empfohlen)

1. **Railway Dashboard öffnen:**
   ```bash
   # Öffne: https://railway.app
   ```

2. **Zum MySQL-Service navigieren:**
   - Wähle dein Projekt
   - Klicke auf den MySQL-Service
   - Öffne den "Query"-Tab

3. **SQL-Skript einfügen:**
   - Kopiere den Inhalt von `seed-unternehmen.sql`
   - Füge ihn in das Query-Feld ein
   - Klicke "Run Query"

4. **Überprüfung:**
   ```sql
   SELECT id, name, landCode, kontenrahmen, farbe
   FROM unternehmen
   ORDER BY id DESC
   LIMIT 6;
   ```

---

### Option 2: Drizzle Studio (Lokal)

1. **Drizzle Studio starten:**
   ```bash
   pnpm drizzle-kit studio
   ```

2. **Browser öffnet sich automatisch:**
   - Navigiere zur `unternehmen`-Tabelle
   - Klicke auf "New" für jedes Unternehmen
   - Füge die Daten manuell ein

3. **Benutzer-Zuordnungen erstellen:**
   - Navigiere zur `user_unternehmen`-Tabelle
   - Erstelle für jedes neue Unternehmen einen Eintrag mit:
     - `userId`: 1 (deine User-ID)
     - `unternehmenId`: ID des neuen Unternehmens
     - `rolle`: admin
     - Alle Berechtigungen auf `true`

---

### Option 3: Railway CLI

1. **Railway CLI installieren (falls noch nicht vorhanden):**
   ```bash
   npm i -g @railway/cli
   ```

2. **Einloggen:**
   ```bash
   railway login
   ```

3. **Projekt verknüpfen:**
   ```bash
   railway link
   ```

4. **MySQL-Shell öffnen:**
   ```bash
   railway connect mysql
   ```

5. **SQL-Datei ausführen:**
   ```bash
   railway run mysql -u <username> -p <database> < seed-unternehmen.sql
   ```

---

### Option 4: TypeScript-Seed (Programmatisch)

1. **Seed-Skript ausführen:**
   ```bash
   pnpm tsx seed-unternehmen.ts
   ```

2. **Vorteile:**
   - Type-Safety durch TypeScript
   - Automatische Validierung
   - Fehlerbehandlung
   - Kann in CI/CD integriert werden

---

## ✅ Erfolgsprüfung

Nach dem Seeding sollten folgende Abfragen funktionieren:

```sql
-- Alle Unternehmen anzeigen
SELECT * FROM unternehmen ORDER BY id;

-- Benutzer-Zuordnungen prüfen
SELECT
  u.id,
  u.name,
  u.landCode,
  uu.rolle,
  uu.buchungenSchreiben
FROM unternehmen u
JOIN user_unternehmen uu ON u.id = uu.unternehmenId
WHERE uu.userId = 1;

-- Firmen pro Land
SELECT landCode, COUNT(*) as anzahl
FROM unternehmen
GROUP BY landCode;
```

**Erwartetes Ergebnis:**
- DE: 2 Unternehmen (Original + Angelus KG)
- AT: 2 Unternehmen (commercehelden, Emo Retail)
- CH: 2 Unternehmen (Trademark24-7, Marketplace24-7)

---

## 🔒 Wichtige Hinweise

1. **User-ID anpassen:**
   - Das Skript verwendet `createdBy = 1` und `userId = 1`
   - Passe dies an deine tatsächliche User-ID an, falls nötig

2. **LAST_INSERT_ID():**
   - Funktioniert nur in MySQL
   - Bei PostgreSQL: `RETURNING id` verwenden

3. **Bestehende Daten:**
   - Das Skript fügt neue Unternehmen hinzu
   - Bestehende Daten werden NICHT überschrieben
   - Keine `DELETE` oder `TRUNCATE` Befehle enthalten

4. **Berechtigungen:**
   - Alle Unternehmen werden mit Admin-Rechten für User 1 angelegt
   - Volle Berechtigungen für Buchungen, Stammdaten, Berichte, Einladungen

---

## 🐛 Troubleshooting

### Fehler: "Unknown column 'createdBy'"
- **Lösung:** Führe zuerst die Datenbank-Migrationen aus:
  ```bash
  pnpm db:push
  ```

### Fehler: "Foreign key constraint fails"
- **Problem:** User mit ID 1 existiert nicht
- **Lösung:** Erstelle zuerst einen Benutzer oder passe die User-ID im Skript an

### Fehler: "Duplicate entry"
- **Problem:** Unternehmen mit gleichem Namen existiert bereits
- **Lösung:** Lösche das bestehende Unternehmen oder ändere den Namen im Skript

---

## 📚 Weiterführende Informationen

- **Schema-Dokumentation:** `drizzle/schema.ts`
- **Länder-Konfiguration:** `drizzle/schema.ts:32-96`
- **Unternehmen-Router:** `server/buchhaltung.ts:35-230`
- **Frontend-Integration:** `client/src/pages/Unternehmen.tsx`

---

Erstellt: 2026-01-18 | Buchhaltungs-App v1.0
