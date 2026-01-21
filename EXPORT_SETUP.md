# Export Setup (PDF & Excel)

## Installation der Dependencies

Um die PDF- und Excel-Export-Funktionalität zu nutzen, müssen die erforderlichen Bibliotheken installiert werden.

### Mit npm:
```bash
npm install jspdf jspdf-autotable exceljs
npm install --save-dev @types/jspdf-autotable
```

### Mit pnpm (empfohlen):
```bash
pnpm install
```

Die benötigten Dependencies wurden bereits zur `package.json` hinzugefügt:
- jsPDF und jspdf-autotable für PDF-Export
- ExcelJS für Excel-Export

## Features

### ✅ Bilanz-Export (PDF)
- Exportiert Aktiva und Passiva als strukturiertes PDF
- Zeigt Summen und Bilanzstatus (ausgeglichen/nicht ausgeglichen)
- Automatische Datumsstempel und Unternehmensdaten
- Deutsche Formatierung (EUR, Datum)

### ✅ GuV-Export (PDF)
- Exportiert Erträge und Aufwendungen als strukturiertes PDF
- Zeigt Jahresüberschuss/-fehlbetrag
- Aggregiert Buchungen nach Sachkonto
- Integriert in Jahresabschluss-Seite

### ✅ Anlagenspiegel-Export (PDF)
- Exportiert Anlagenvermögen im Querformat
- Zeigt AHK, Nutzungsdauer, AfA, Restwerte
- Integriert in Anlagevermögen-Seite
- Deutsche Formatierung mit Summenzeile

### ✅ Excel-Export (Feature 8)
- Umfassender Excel-Export für Bilanz, GuV und Anlagenspiegel
- Verwendet ExcelJS für professionelle Formatierung
- Farbliche Hervorhebungen und Summenzeilen
- Automatische Spaltenbreiten und Zahlenformatierung
- Integriert in Jahresabschluss- und Anlagevermögen-Seite

## Verwendung

### PDF-Export
```typescript
import { exportBilanzPDF, exportGuVPDF, exportAnlagenspiegelPDF } from '@/lib/pdf-export';

// Bilanz-PDF exportieren
exportBilanzPDF(aktiva, passiva, {
  unternehmen: 'Musterunternehmen GmbH',
  stichtag: '2024-12-31',
});

// GuV-PDF exportieren
exportGuVPDF(ertraege, aufwendungen, {
  unternehmen: 'Musterunternehmen GmbH',
  stichtag: '2024-12-31',
  jahr: 2024,
});

// Anlagenspiegel-PDF exportieren
exportAnlagenspiegelPDF(anlagen, {
  unternehmen: 'Musterunternehmen GmbH',
  stichtag: '2024-12-31',
});
```

### Excel-Export
```typescript
import { exportBilanzExcel, exportGuVExcel, exportAnlagenspiegelExcel } from '@/lib/excel-export';

// Bilanz-Excel exportieren
await exportBilanzExcel(aktiva, passiva, {
  unternehmen: 'Musterunternehmen GmbH',
  stichtag: '2024-12-31',
});

// GuV-Excel exportieren
await exportGuVExcel(ertraege, aufwendungen, {
  unternehmen: 'Musterunternehmen GmbH',
  stichtag: '2024-12-31',
  jahr: 2024,
});

// Anlagenspiegel-Excel exportieren
await exportAnlagenspiegelExcel(anlagen, {
  unternehmen: 'Musterunternehmen GmbH',
  stichtag: '2024-12-31',
});
```

Alle Export-Funktionen sind bereits in die entsprechenden Seiten integriert und funktionieren nach Installation der Dependencies.

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
