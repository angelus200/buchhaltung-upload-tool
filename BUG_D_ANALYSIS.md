# Bug D Analysis: Buchungsvorschläge zeigen keine Ergebnisse

## 🔍 Executive Summary

**Status:** ❌ **Kein Bug im technischen Sinne, aber fehlendes Feature**

Die Buchungsvorschläge-Seite funktioniert korrekt. Das Problem ist:
- **Isabel hat keine Daten, die als Vorschläge angezeigt werden können**
- **Die Upload-UI für Belege fehlt komplett im Frontend**
- Die Tabelle `buchungsvorschlaege` ist **leer für ALLE Firmen** (nicht nur bei Isabel)

---

## 📊 Datenbank-Analyse (Production Railway)

### Isabels TM-Firma
```
ID: 4
Name: Trademark24-7 AG
Rechtsform: AG
Buchungen: 22 (manuelle Einträge)
Buchungsvorschläge: 0 ❌
Kontoauszüge (auszuege): 0 ❌
```

### Alle Firmen im System
```
┌────┬──────────────────────────────────────────────┬───────────┬───────────────────┐
│ ID │ Name                                         │ Buchungen │ Buchungsvorschläge│
├────┼──────────────────────────────────────────────┼───────────┼───────────────────┤
│ 1  │ Angelus Managementberatungs und Service KG   │ 15,713    │ 0                 │
│ 2  │ commercehelden GmbH                          │ 0         │ 0                 │
│ 3  │ Emo Retail OG                                │ 5         │ 0                 │
│ 4  │ Trademark24-7 AG (Isabel)                    │ 22        │ 0                 │
│ 5  │ Marketplace24-7 GmbH                         │ 16        │ 0                 │
│ 6  │ Alpenland Heizungswasser KG                  │ 24,987    │ 0                 │
│ 7  │ Stellarium Holding AG                        │ 0         │ 0                 │
└────┴──────────────────────────────────────────────┴───────────┴───────────────────┘
```

**Ergebnis:** Die Tabelle `buchungsvorschlaege` ist **komplett leer** - niemand hat das AI-Feature bisher genutzt.

---

## 🔧 Technische Analyse

### 1. Frontend Query (Buchungsvorschlaege.tsx)

#### ✅ Query-Aktivierung
```typescript
// Zeile 58-60: localStorage-Init
const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(() => {
  const saved = localStorage.getItem("selectedUnternehmenId");
  return saved ? parseInt(saved) : null;
});

// Zeile 79-86: Query mit korrekter enabled-Bedingung
const { data: vorschlaege = [] } = trpc.buchungsvorschlaege.list.useQuery(
  {
    unternehmenId: selectedUnternehmen!,
    status: "vorschlag",  // Default-Filter
    minConfidence: undefined, // Keine Confidence-Filterung
  },
  { enabled: !!selectedUnternehmen } // ✅ Korrekt aktiviert
);
```

**Status:** ✅ Query wird korrekt aktiviert (im Gegensatz zu Bug A)

#### ✅ Auto-Select Logik
```typescript
// Zeile 94-107: Fallback auf localStorage + erste Firma
useEffect(() => {
  if (unternehmen && unternehmen.length > 0 && !selectedUnternehmen) {
    const savedId = localStorage.getItem("selectedUnternehmenId");
    if (savedId) {
      const id = parseInt(savedId);
      const exists = unternehmen.find((u) => u.unternehmen.id === id);
      if (exists) {
        setSelectedUnternehmen(id); // ✅ localStorage-Wert gefunden
        return;
      }
    }
    setSelectedUnternehmen(unternehmen[0].unternehmen.id); // ✅ Fallback auf erste Firma
  }
}, [unternehmen, selectedUnternehmen]);
```

**Status:** ✅ Auto-Select funktioniert korrekt

---

### 2. Backend Filter-Logik (server/buchungsvorschlaege.ts)

```typescript
// Zeile 359-381: list.query Implementation
list: protectedProcedure
  .input(
    z.object({
      unternehmenId: z.number(),
      status: z.enum(["vorschlag", "akzeptiert", "abgelehnt", "bearbeitet", "alle"]).default("vorschlag"),
      minConfidence: z.number().min(0).max(1).optional(),
    })
  )
  .query(async ({ input }) => {
    const conditions = [eq(buchungsvorschlaege.unternehmenId, input.unternehmenId)];

    if (input.status !== "alle") {
      conditions.push(eq(buchungsvorschlaege.status, input.status));
    }

    const result = await db
      .select()
      .from(buchungsvorschlaege)
      .where(and(...conditions))
      .orderBy(desc(buchungsvorschlaege.createdAt));

    // Filter nach Confidence (in JS, nach DB-Query)
    if (input.minConfidence !== undefined) {
      return result.filter(v => parseFloat(v.confidence?.toString() || "0") >= input.minConfidence!);
    }

    return result;
  }),
```

**Backend filtert nach:**
- ✅ `unternehmenId` === 4 (Isabel's TM)
- ✅ `status` === "vorschlag"
- ✅ Keine Confidence-Filterung (minConfidence ist undefined)

**Status:** ✅ Backend-Filterung ist NICHT zu restriktiv

---

### 3. Wie werden Buchungsvorschläge erstellt?

#### Methode 1: createFromBeleg (Beleg-Upload)
```typescript
// server/buchungsvorschlaege.ts, Zeile 404-460
createFromBeleg: protectedProcedure
  .input(
    z.object({
      unternehmenId: z.number(),
      imageBase64: z.string(),
      mimeType: z.string(),
      belegUrl: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // 1. AI analysiert Beleg (Rechnung/Lieferantenschein)
    // 2. Extrahiert: Lieferant, Rechnungsnr., Betrag, IBAN, Datum, USt
    // 3. Matcht Kreditor aus Stammdaten
    // 4. Schlägt Sachkonto vor (z.B. 6300 Aufwand)
    // 5. Speichert Vorschlag in buchungsvorschlaege
  })
```

**Aufruf in UI:** ❌ **NICHT IMPLEMENTIERT**
- Dokumentation (Hilfe.tsx) beschreibt Upload-Zone
- Backend-API existiert
- **Frontend-UI fehlt komplett** ❌

#### Methode 2: createFromPosition (Bank-Transaktionen)
```typescript
// server/buchungsvorschlaege.ts, Zeile 584-664
createFromPosition: protectedProcedure
  .input(z.object({ positionId: z.number() }))
  .mutation(async ({ input }) => {
    // 1. Lädt Bank-Transaktion aus auszug_positionen
    // 2. AI analysiert Buchungstext (z.B. "LASTSCHRIFT Telekom")
    // 3. Schlägt Sachkonto vor
    // 4. Speichert Vorschlag
  })
```

**Aufruf in UI:** ✅ Implementiert in `client/src/pages/Auszuege.tsx`
- Button "Buchungsvorschlag erstellen" pro Position
- Zeile 223-231: `createVorschlagMutation`

**Problem:** Isabel hat **keine Kontoauszüge** (auszuege table ist leer für unternehmenId=4)

---

## 📋 Zusammenfassung der 4 Fragen

### 1. ✅ Wird die Query mit gültiger `unternehmenId` aufgerufen?

**JA.** Die Query ist korrekt aktiviert (`enabled: !!selectedUnternehmen`) und erhält:
- `unternehmenId: 4` (Trademark24-7 AG)
- `status: "vorschlag"`
- `minConfidence: undefined`

Im Gegensatz zu Bug A (Anlagevermögen) ist die Query hier **nicht disabled**.

### 2. ✅ Was sind die Backend-Filterbedingungen?

Die Query filtert nach:
```sql
WHERE unternehmenId = 4
  AND status = 'vorschlag'
ORDER BY createdAt DESC
```

Danach optional JS-Filter für `confidence >= minConfidence` (aktuell nicht aktiv).

**Die Bedingungen sind NICHT zu restriktiv.**

### 3. ❌ Hat Isabel Buchungen die den Kriterien entsprechen?

**NEIN.** Isabel hat:
- ✅ 22 Buchungen (manuelle Einträge in `buchungen` Tabelle)
- ❌ 0 Buchungsvorschläge (AI-generierte Vorschläge in `buchungsvorschlaege` Tabelle)

**Warum?**
- Isabel hat nie Belege hochgeladen (UI fehlt)
- Isabel hat keine Kontoauszüge importiert (auszuege table ist leer)

Die 22 Buchungen sind **manuelle Einträge**, keine AI-Vorschläge.

### 4. ❌ Gibt es einen zweiten Fehler unabhängig vom localStorage-Fix?

**JA - fehlendes Feature:**

Die Beleg-Upload-UI ist **nicht implementiert**:
- ❌ Keine Upload-Zone in Buchungsvorschlaege.tsx
- ❌ Keine Datei-Auswahl
- ❌ Keine Drag & Drop Zone
- ✅ Backend-API existiert (createFromBeleg)
- ✅ Dokumentation beschreibt Feature (Hilfe.tsx)
- ❌ Frontend-Integration fehlt komplett

---

## 🎯 Root Cause

Die Buchungsvorschläge-Seite zeigt korrekt **keine Ergebnisse**, weil:

1. **Keine Daten vorhanden:**
   - Isabel hat nie Belege hochgeladen
   - Isabel hat keine Kontoauszüge importiert
   - Keine AI-Analyse = keine Vorschläge

2. **Feature unvollständig:**
   - Upload-UI für Belege fehlt im Frontend
   - User können das Feature nicht nutzen
   - Daher ist die Tabelle leer für ALLE Firmen

---

## 🛠️ Lösungsvorschläge

### Option 1: Beleg-Upload UI implementieren ⭐ Empfohlen

**Was fehlt:**
```tsx
// In Buchungsvorschlaege.tsx hinzufügen:

<Card>
  <CardHeader>
    <CardTitle>Beleg hochladen</CardTitle>
  </CardHeader>
  <CardContent>
    <DropzoneComponent
      accept={{
        'image/*': ['.png', '.jpg', '.jpeg'],
        'application/pdf': ['.pdf']
      }}
      onDrop={(files) => {
        // 1. Datei zu Base64 konvertieren
        // 2. trpc.buchungsvorschlaege.createFromBeleg.mutate()
        // 3. Toast mit Confidence anzeigen
        // 4. Liste neu laden
      }}
    />
  </CardContent>
</Card>
```

**Komponenten:**
- File Upload Zone (react-dropzone)
- Base64 Converter
- Loading State während AI-Analyse
- Success/Error Toast
- Auto-Refresh der Vorschläge-Liste

### Option 2: Demo-Daten für Testing

Für sofortiges Testing SQL-Insert:

```sql
INSERT INTO buchungsvorschlaege (
  unternehmenId, lieferant, rechnungsnummer, belegdatum,
  betragBrutto, betragNetto, ustBetrag, ustSatz,
  sollKonto, habenKonto, buchungstext,
  confidence, aiNotizen, status
) VALUES (
  4, 'AWS (Amazon Web Services)', 'INV-2025-001', '2025-02-01',
  119.00, 100.00, 19.00, 19.00,
  '6835', '0620', 'AWS (Amazon Web Services)',
  0.92, 'AI-Analyse: Cloud-Hosting-Kosten → EDV-Kosten (6835)', 'vorschlag'
);
```

### Option 3: Onboarding mit Sample Vorschlägen

Beim ersten Login automatisch 2-3 Beispiel-Vorschläge erstellen:
- Zeigt Feature-Funktion
- Erlaubt Testing
- Erklärt Workflow

---

## 📝 Nächste Schritte

1. **Sofort:** SQL-Insert für Demo-Daten (Option 2) → Isabel kann Feature testen
2. **Sprint 1:** Beleg-Upload UI implementieren (Option 3)
3. **Sprint 2:** Dropbox-Integration für automatische Beleg-Verarbeitung

---

## ✅ Fazit

**Bug D ist KEIN klassischer Bug, sondern erwartetes Verhalten:**

- ✅ Query funktioniert korrekt
- ✅ Backend-Filter sind nicht zu restriktiv
- ✅ localStorage-Fix aus Bug A hat geholfen
- ❌ **Feature ist unvollständig** (Upload-UI fehlt)
- ❌ Isabel hat keine Daten, die angezeigt werden können

**Recommendation:** Implementiere Beleg-Upload UI oder füge Demo-Daten hinzu.
