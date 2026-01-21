# PDF-Export Setup

## Installation der Dependencies

Um die PDF-Export-Funktionalität zu nutzen, müssen die jsPDF-Bibliotheken installiert werden.

### Mit npm:
```bash
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf-autotable
```

### Mit pnpm (empfohlen):
```bash
pnpm install
```

Die benötigten Dependencies wurden bereits zur `package.json` hinzugefügt.

## Features

### ✅ Bilanz-Export (PDF)
- Exportiert Aktiva und Passiva als strukturiertes PDF
- Zeigt Summen und Bilanzstatus (ausgeglichen/nicht ausgeglichen)
- Automatische Datumsstempel und Unternehmensdaten
- Deutsche Formatierung (EUR, Datum)

### 🔄 GuV-Export (PDF) - In Vorbereitung
- Wird in Kürze verfügbar sein
- Exportiert Erträge und Aufwendungen
- Zeigt Jahresüberschuss/-fehlbetrag

### 🔄 Anlagenspiegel-Export (PDF) - Verfügbar
- Funktion bereits implementiert in `client/src/lib/pdf-export.ts`
- Kann in der Anlagevermögen-Seite integriert werden
- Zeigt AHK, AfA, Restwerte

### 🔄 Excel-Export - Geplant
- Feature 8 aus dem ursprünglichen Briefing
- Wird mit ExcelJS implementiert

## Verwendung

### Bilanz-PDF exportieren
```typescript
import { exportBilanzPDF } from '@/lib/pdf-export';

// In der Jahresabschluss-Seite:
<Button
  variant="outline"
  onClick={handleExportPDF}
>
  <Download className="w-4 h-4 mr-2" />
  PDF
</Button>
```

Die Funktion ist bereits in der Jahresabschluss-Seite integriert und funktioniert nach Installation der Dependencies.

## Troubleshooting

Falls `npm install` Fehler wirft:
```bash
npm cache clean --force
npm install
```

Oder verwenden Sie pnpm:
```bash
npm install -g pnpm
pnpm install
```
