import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { buchungen, unternehmen, kreditoren, debitoren } from "../drizzle/schema";
import { eq, and, gte, lte, sql, sum, count } from "drizzle-orm";

// ============================================
// PDF EXPORT SERVICE - Berichte als PDF
// ============================================

interface BerichtsDaten {
  unternehmen: {
    name: string;
    rechtsform: string | null;
    steuernummer: string | null;
    ustIdNr: string | null;
  };
  zeitraum: {
    von: string;
    bis: string;
  };
  erstelltAm: string;
}

interface BwaPosition {
  position: string;
  bezeichnung: string;
  betrag: number;
}

interface BwaData extends BerichtsDaten {
  positionen: BwaPosition[];
  summeErtraege: number;
  summeAufwendungen: number;
  ergebnis: number;
}

interface KennzahlenData extends BerichtsDaten {
  einnahmen: number;
  ausgaben: number;
  gewinn: number;
  buchungenAnzahl: number;
  vorsteuer: number;
  umsatzsteuer: number;
  zahllast: number;
  topKreditoren: Array<{ name: string; betrag: number }>;
  topDebitoren: Array<{ name: string; betrag: number }>;
}

interface SuSaPosition {
  konto: string;
  bezeichnung: string;
  sollAnfang: number;
  habenAnfang: number;
  sollBewegung: number;
  habenBewegung: number;
  sollEnde: number;
  habenEnde: number;
}

interface SuSaData extends BerichtsDaten {
  positionen: SuSaPosition[];
  summeSoll: number;
  summeHaben: number;
}

// HTML-Template für PDF-Generierung
function generatePdfHtml(title: string, content: string, berichtsDaten: BerichtsDaten): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #0d9488;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #0d9488;
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header .unternehmen {
      font-size: 14px;
      font-weight: bold;
      color: #333;
    }
    .header .meta {
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section h2 {
      color: #0d9488;
      font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .font-bold {
      font-weight: bold;
    }
    .text-green {
      color: #059669;
    }
    .text-red {
      color: #dc2626;
    }
    .summary-row {
      background-color: #f0fdfa;
      font-weight: bold;
    }
    .total-row {
      background-color: #0d9488;
      color: white;
      font-weight: bold;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .kpi-card .label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .kpi-card .value {
      font-size: 18px;
      font-weight: bold;
      color: #111827;
    }
    .kpi-card.positive .value {
      color: #059669;
    }
    .kpi-card.negative .value {
      color: #dc2626;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #9ca3af;
      text-align: center;
    }
    @media print {
      body {
        padding: 0;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="unternehmen">${berichtsDaten.unternehmen.name}${berichtsDaten.unternehmen.rechtsform ? ` ${berichtsDaten.unternehmen.rechtsform}` : ''}</div>
    <div class="meta">
      Zeitraum: ${berichtsDaten.zeitraum.von} bis ${berichtsDaten.zeitraum.bis} | 
      Erstellt am: ${berichtsDaten.erstelltAm}
      ${berichtsDaten.unternehmen.steuernummer ? ` | Steuernummer: ${berichtsDaten.unternehmen.steuernummer}` : ''}
      ${berichtsDaten.unternehmen.ustIdNr ? ` | USt-IdNr: ${berichtsDaten.unternehmen.ustIdNr}` : ''}
    </div>
  </div>
  
  ${content}
  
  <div class="footer">
    Erstellt mit Buchhaltung Upload Tool | Alle Angaben ohne Gewähr
  </div>
</body>
</html>
`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE');
}

// ============================================
// PDF EXPORT ROUTER
// ============================================
export const pdfExportRouter = router({
  // BWA (Betriebswirtschaftliche Auswertung) generieren
  generateBwa: protectedProcedure
    .input(
      z.object({
        unternehmensId: z.number(),
        vonDatum: z.string(),
        bisDatum: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      // Unternehmensdaten laden
      const [firma] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmensId));
      
      if (!firma) {
        throw new Error("Unternehmen nicht gefunden");
      }
      
      // Buchungen im Zeitraum laden
      const buchungenData = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmensId),
            gte(buchungen.belegdatum, new Date(input.vonDatum)),
            lte(buchungen.belegdatum, new Date(input.bisDatum))
          )
        );
      
      // BWA-Positionen berechnen
      const positionen: BwaPosition[] = [];
      let summeErtraege = 0;
      let summeAufwendungen = 0;
      
      // Gruppiere nach Sachkonto
      const kontoSummen: Record<string, { bezeichnung: string; betrag: number; typ: string }> = {};
      
      for (const buchung of buchungenData) {
        const konto = buchung.sachkonto || "9999";
        const betrag = parseFloat(buchung.nettobetrag?.toString() || "0");
        
        if (!kontoSummen[konto]) {
          kontoSummen[konto] = {
            bezeichnung: buchung.buchungstext || "Sonstige",
            betrag: 0,
            typ: konto.startsWith("8") || konto.startsWith("4") ? "ertrag" : "aufwand",
          };
        }
        kontoSummen[konto].betrag += betrag;
      }
      
      // Sortiere und füge zu Positionen hinzu
      const sortedKonten = Object.entries(kontoSummen).sort((a, b) => a[0].localeCompare(b[0]));
      
      for (const [konto, data] of sortedKonten) {
        positionen.push({
          position: konto,
          bezeichnung: data.bezeichnung,
          betrag: data.betrag,
        });
        
        if (data.typ === "ertrag") {
          summeErtraege += data.betrag;
        } else {
          summeAufwendungen += data.betrag;
        }
      }
      
      const bwaData: BwaData = {
        unternehmen: {
          name: firma.name,
          rechtsform: firma.rechtsform,
          steuernummer: firma.steuernummer,
          ustIdNr: firma.ustIdNr,
        },
        zeitraum: {
          von: formatDate(new Date(input.vonDatum)),
          bis: formatDate(new Date(input.bisDatum)),
        },
        erstelltAm: formatDate(new Date()),
        positionen,
        summeErtraege,
        summeAufwendungen,
        ergebnis: summeErtraege - summeAufwendungen,
      };
      
      // HTML generieren
      const content = `
        <div class="section">
          <h2>Erträge</h2>
          <table>
            <thead>
              <tr>
                <th>Konto</th>
                <th>Bezeichnung</th>
                <th class="text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${bwaData.positionen
                .filter(p => p.position.startsWith("8") || p.position.startsWith("4"))
                .map(p => `
                  <tr>
                    <td>${p.position}</td>
                    <td>${p.bezeichnung}</td>
                    <td class="text-right">${formatCurrency(p.betrag)}</td>
                  </tr>
                `).join("")}
              <tr class="summary-row">
                <td colspan="2">Summe Erträge</td>
                <td class="text-right">${formatCurrency(bwaData.summeErtraege)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Aufwendungen</h2>
          <table>
            <thead>
              <tr>
                <th>Konto</th>
                <th>Bezeichnung</th>
                <th class="text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${bwaData.positionen
                .filter(p => !p.position.startsWith("8") && !p.position.startsWith("4"))
                .map(p => `
                  <tr>
                    <td>${p.position}</td>
                    <td>${p.bezeichnung}</td>
                    <td class="text-right">${formatCurrency(p.betrag)}</td>
                  </tr>
                `).join("")}
              <tr class="summary-row">
                <td colspan="2">Summe Aufwendungen</td>
                <td class="text-right">${formatCurrency(bwaData.summeAufwendungen)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Ergebnis</h2>
          <table>
            <tbody>
              <tr class="total-row">
                <td>Betriebsergebnis</td>
                <td class="text-right">${formatCurrency(bwaData.ergebnis)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      
      const html = generatePdfHtml("Betriebswirtschaftliche Auswertung (BWA)", content, bwaData);
      
      return {
        html,
        filename: `BWA_${firma.name.replace(/\s+/g, "_")}_${input.vonDatum}_${input.bisDatum}.html`,
      };
    }),

  // Kennzahlen-Übersicht generieren
  generateKennzahlen: protectedProcedure
    .input(
      z.object({
        unternehmensId: z.number(),
        vonDatum: z.string(),
        bisDatum: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      // Unternehmensdaten laden
      const [firma] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmensId));
      
      if (!firma) {
        throw new Error("Unternehmen nicht gefunden");
      }
      
      // Buchungen im Zeitraum laden
      const buchungenData = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmensId),
            gte(buchungen.belegdatum, new Date(input.vonDatum)),
            lte(buchungen.belegdatum, new Date(input.bisDatum))
          )
        );
      
      // Kennzahlen berechnen
      let einnahmen = 0;
      let ausgaben = 0;
      let vorsteuer = 0;
      let umsatzsteuer = 0;
      const kreditorenSummen: Record<string, number> = {};
      const debitorenSummen: Record<string, number> = {};
      
      for (const buchung of buchungenData) {
        const netto = parseFloat(buchung.nettobetrag?.toString() || "0");
        const brutto = parseFloat(buchung.bruttobetrag?.toString() || "0");
        const steuer = brutto - netto;
        
        if (buchung.buchungsart === "ertrag") {
          einnahmen += netto;
          umsatzsteuer += steuer;
          if (buchung.geschaeftspartner) {
            const key = buchung.geschaeftspartner;
            debitorenSummen[key] = (debitorenSummen[key] || 0) + netto;
          }
        } else {
          ausgaben += netto;
          vorsteuer += steuer;
          if (buchung.geschaeftspartner) {
            const key = buchung.geschaeftspartner;
            kreditorenSummen[key] = (kreditorenSummen[key] || 0) + netto;
          }
        }
      }
      
      // Top Kreditoren und Debitoren
      const topKreditoren = Object.entries(kreditorenSummen)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, betrag]) => ({ name, betrag }));
      
      const topDebitoren = Object.entries(debitorenSummen)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, betrag]) => ({ name, betrag }));
      
      const kennzahlenData: KennzahlenData = {
        unternehmen: {
          name: firma.name,
          rechtsform: firma.rechtsform,
          steuernummer: firma.steuernummer,
          ustIdNr: firma.ustIdNr,
        },
        zeitraum: {
          von: formatDate(new Date(input.vonDatum)),
          bis: formatDate(new Date(input.bisDatum)),
        },
        erstelltAm: formatDate(new Date()),
        einnahmen,
        ausgaben,
        gewinn: einnahmen - ausgaben,
        buchungenAnzahl: buchungenData.length,
        vorsteuer,
        umsatzsteuer,
        zahllast: umsatzsteuer - vorsteuer,
        topKreditoren,
        topDebitoren,
      };
      
      // HTML generieren
      const content = `
        <div class="kpi-grid">
          <div class="kpi-card positive">
            <div class="label">Einnahmen</div>
            <div class="value">${formatCurrency(kennzahlenData.einnahmen)}</div>
          </div>
          <div class="kpi-card negative">
            <div class="label">Ausgaben</div>
            <div class="value">${formatCurrency(kennzahlenData.ausgaben)}</div>
          </div>
          <div class="kpi-card ${kennzahlenData.gewinn >= 0 ? 'positive' : 'negative'}">
            <div class="label">Gewinn/Verlust</div>
            <div class="value">${formatCurrency(kennzahlenData.gewinn)}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Buchungen</div>
            <div class="value">${kennzahlenData.buchungenAnzahl}</div>
          </div>
        </div>
        
        <div class="section">
          <h2>Steuer-Übersicht</h2>
          <table>
            <tbody>
              <tr>
                <td>Vorsteuer (abzugsfähig)</td>
                <td class="text-right text-green">${formatCurrency(kennzahlenData.vorsteuer)}</td>
              </tr>
              <tr>
                <td>Umsatzsteuer (geschuldet)</td>
                <td class="text-right text-red">${formatCurrency(kennzahlenData.umsatzsteuer)}</td>
              </tr>
              <tr class="summary-row">
                <td>Zahllast / Erstattung</td>
                <td class="text-right ${kennzahlenData.zahllast >= 0 ? 'text-red' : 'text-green'}">
                  ${formatCurrency(kennzahlenData.zahllast)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Top 5 Lieferanten (Kreditoren)</h2>
          <table>
            <thead>
              <tr>
                <th>Lieferant</th>
                <th class="text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${kennzahlenData.topKreditoren.length > 0 
                ? kennzahlenData.topKreditoren.map(k => `
                    <tr>
                      <td>${k.name}</td>
                      <td class="text-right">${formatCurrency(k.betrag)}</td>
                    </tr>
                  `).join("")
                : '<tr><td colspan="2" class="text-center">Keine Daten vorhanden</td></tr>'
              }
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Top 5 Kunden (Debitoren)</h2>
          <table>
            <thead>
              <tr>
                <th>Kunde</th>
                <th class="text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${kennzahlenData.topDebitoren.length > 0 
                ? kennzahlenData.topDebitoren.map(d => `
                    <tr>
                      <td>${d.name}</td>
                      <td class="text-right">${formatCurrency(d.betrag)}</td>
                    </tr>
                  `).join("")
                : '<tr><td colspan="2" class="text-center">Keine Daten vorhanden</td></tr>'
              }
            </tbody>
          </table>
        </div>
      `;
      
      const html = generatePdfHtml("Kennzahlen-Übersicht", content, kennzahlenData);
      
      return {
        html,
        filename: `Kennzahlen_${firma.name.replace(/\s+/g, "_")}_${input.vonDatum}_${input.bisDatum}.html`,
      };
    }),

  // Summen- und Saldenliste generieren
  generateSuSa: protectedProcedure
    .input(
      z.object({
        unternehmensId: z.number(),
        vonDatum: z.string(),
        bisDatum: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      // Unternehmensdaten laden
      const [firma] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmensId));
      
      if (!firma) {
        throw new Error("Unternehmen nicht gefunden");
      }
      
      // Buchungen im Zeitraum laden
      const buchungenData = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmensId),
            gte(buchungen.belegdatum, new Date(input.vonDatum)),
            lte(buchungen.belegdatum, new Date(input.bisDatum))
          )
        );
      
      // Konten aggregieren
      const kontenSalden: Record<string, SuSaPosition> = {};
      
      for (const buchung of buchungenData) {
        const sollKonto = buchung.sachkonto || "9999";
        const habenKonto = buchung.geschaeftspartnerKonto || "9999";
        const betrag = parseFloat(buchung.bruttobetrag?.toString() || "0");
        
        // Soll-Konto
        if (!kontenSalden[sollKonto]) {
          kontenSalden[sollKonto] = {
            konto: sollKonto,
            bezeichnung: buchung.buchungstext || "Sonstige",
            sollAnfang: 0,
            habenAnfang: 0,
            sollBewegung: 0,
            habenBewegung: 0,
            sollEnde: 0,
            habenEnde: 0,
          };
        }
        kontenSalden[sollKonto].sollBewegung += betrag;
        
        // Haben-Konto
        if (!kontenSalden[habenKonto]) {
          kontenSalden[habenKonto] = {
            konto: habenKonto,
            bezeichnung: "Gegenkonto",
            sollAnfang: 0,
            habenAnfang: 0,
            sollBewegung: 0,
            habenBewegung: 0,
            sollEnde: 0,
            habenEnde: 0,
          };
        }
        kontenSalden[habenKonto].habenBewegung += betrag;
      }
      
      // Endsalden berechnen
      for (const konto of Object.values(kontenSalden)) {
        const sollGesamt = konto.sollAnfang + konto.sollBewegung;
        const habenGesamt = konto.habenAnfang + konto.habenBewegung;
        
        if (sollGesamt > habenGesamt) {
          konto.sollEnde = sollGesamt - habenGesamt;
        } else {
          konto.habenEnde = habenGesamt - sollGesamt;
        }
      }
      
      const positionen = Object.values(kontenSalden).sort((a, b) => a.konto.localeCompare(b.konto));
      
      const summeSoll = positionen.reduce((sum, p) => sum + p.sollBewegung, 0);
      const summeHaben = positionen.reduce((sum, p) => sum + p.habenBewegung, 0);
      
      const susaData: SuSaData = {
        unternehmen: {
          name: firma.name,
          rechtsform: firma.rechtsform,
          steuernummer: firma.steuernummer,
          ustIdNr: firma.ustIdNr,
        },
        zeitraum: {
          von: formatDate(new Date(input.vonDatum)),
          bis: formatDate(new Date(input.bisDatum)),
        },
        erstelltAm: formatDate(new Date()),
        positionen,
        summeSoll,
        summeHaben,
      };
      
      // HTML generieren
      const content = `
        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Konto</th>
                <th>Bezeichnung</th>
                <th class="text-right">Soll</th>
                <th class="text-right">Haben</th>
                <th class="text-right">Saldo Soll</th>
                <th class="text-right">Saldo Haben</th>
              </tr>
            </thead>
            <tbody>
              ${susaData.positionen.map(p => `
                <tr>
                  <td>${p.konto}</td>
                  <td>${p.bezeichnung}</td>
                  <td class="text-right">${formatCurrency(p.sollBewegung)}</td>
                  <td class="text-right">${formatCurrency(p.habenBewegung)}</td>
                  <td class="text-right">${p.sollEnde > 0 ? formatCurrency(p.sollEnde) : ''}</td>
                  <td class="text-right">${p.habenEnde > 0 ? formatCurrency(p.habenEnde) : ''}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="2">Summe</td>
                <td class="text-right">${formatCurrency(susaData.summeSoll)}</td>
                <td class="text-right">${formatCurrency(susaData.summeHaben)}</td>
                <td class="text-right"></td>
                <td class="text-right"></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      
      const html = generatePdfHtml("Summen- und Saldenliste", content, susaData);
      
      return {
        html,
        filename: `SuSa_${firma.name.replace(/\s+/g, "_")}_${input.vonDatum}_${input.bisDatum}.html`,
      };
    }),
});

export type PdfExportRouter = typeof pdfExportRouter;
