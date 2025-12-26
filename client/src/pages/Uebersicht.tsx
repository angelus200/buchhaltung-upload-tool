import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import { 
  ArrowLeft, 
  Download, 
  FileSpreadsheet,
  Calendar,
  Euro,
  TrendingUp,
  FileText,
  Building2
} from "lucide-react";

// Demo-Daten für die Übersicht
const DEMO_BUCHUNGEN = [
  {
    id: "1",
    belegdatum: "2025-12-05",
    belegnummer: "RE-2025-001",
    kreditor: "Bürobedarf Müller",
    aufwandskonto: "4930",
    aufwandsbezeichnung: "Bürobedarf",
    nettobetrag: 100.00,
    steuersatz: 19,
    bruttobetrag: 119.00,
  },
  {
    id: "2",
    belegdatum: "2025-12-10",
    belegnummer: "RE-2025-002",
    kreditor: "Telekom",
    aufwandskonto: "4200",
    aufwandsbezeichnung: "Telefon",
    nettobetrag: 200.00,
    steuersatz: 19,
    bruttobetrag: 238.00,
  },
  {
    id: "3",
    belegdatum: "2025-12-15",
    belegnummer: "RE-2025-003",
    kreditor: "Vodafone",
    aufwandskonto: "4210",
    aufwandsbezeichnung: "Internet",
    nettobetrag: 500.00,
    steuersatz: 19,
    bruttobetrag: 595.00,
  },
  {
    id: "4",
    belegdatum: "2025-12-20",
    belegnummer: "RE-2025-004",
    kreditor: "Immobilien AG",
    aufwandskonto: "4120",
    aufwandsbezeichnung: "Miete",
    nettobetrag: 1500.00,
    steuersatz: 19,
    bruttobetrag: 1785.00,
  },
];

const MONATE = [
  { value: "01", label: "Januar" },
  { value: "02", label: "Februar" },
  { value: "03", label: "März" },
  { value: "04", label: "April" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Dezember" },
];

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE");
}

export default function Uebersicht() {
  const [selectedMonth, setSelectedMonth] = useState("12");
  const [selectedYear] = useState("2025");

  const buchungen = DEMO_BUCHUNGEN; // In der echten Anwendung würden diese aus dem State kommen

  const stats = useMemo(() => {
    const total = buchungen.reduce((sum, b) => sum + b.bruttobetrag, 0);
    const netto = buchungen.reduce((sum, b) => sum + b.nettobetrag, 0);
    const steuer = total - netto;
    
    // Gruppierung nach Aufwandskonto
    const nachKonto = buchungen.reduce((acc, b) => {
      if (!acc[b.aufwandskonto]) {
        acc[b.aufwandskonto] = { bezeichnung: b.aufwandsbezeichnung, summe: 0 };
      }
      acc[b.aufwandskonto].summe += b.bruttobetrag;
      return acc;
    }, {} as Record<string, { bezeichnung: string; summe: number }>);

    // Gruppierung nach Kreditor
    const nachKreditor = buchungen.reduce((acc, b) => {
      if (!acc[b.kreditor]) {
        acc[b.kreditor] = 0;
      }
      acc[b.kreditor] += b.bruttobetrag;
      return acc;
    }, {} as Record<string, number>);

    return { total, netto, steuer, nachKonto, nachKreditor };
  }, [buchungen]);

  const monatName = MONATE.find(m => m.value === selectedMonth)?.label || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Einheitlicher Header */}
      <AppHeader title="Monatsübersicht" subtitle="Buchungen und Auswertungen" />

      <main className="container py-8">
        {/* Monatsauswahl und Export */}
        <div className="flex items-center justify-between mb-6">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONATE.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Bericht exportieren
          </Button>
        </div>
        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buchungen</p>
                  <p className="text-2xl font-bold tabular-nums">{buchungen.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Euro className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nettobetrag</p>
                  <p className="text-2xl font-bold tabular-nums font-mono">{formatCurrency(stats.netto)} €</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vorsteuer</p>
                  <p className="text-2xl font-bold tabular-nums font-mono">{formatCurrency(stats.steuer)} €</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Euro className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bruttobetrag</p>
                  <p className="text-2xl font-bold tabular-nums font-mono">{formatCurrency(stats.total)} €</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Buchungsliste */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Buchungen {monatName} {selectedYear}
                </CardTitle>
                <CardDescription>
                  Alle erfassten Buchungen im ausgewählten Zeitraum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Belegnr.</TableHead>
                      <TableHead>Kreditor</TableHead>
                      <TableHead>Konto</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buchungen.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{formatDate(b.belegdatum)}</TableCell>
                        <TableCell className="font-mono text-sm">{b.belegnummer}</TableCell>
                        <TableCell>{b.kreditor}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{b.aufwandskonto}</span>
                          <span className="text-muted-foreground ml-2 text-sm">{b.aufwandsbezeichnung}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(b.bruttobetrag)} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Auswertungen */}
          <div className="space-y-6">
            {/* Nach Aufwandskonto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Nach Aufwandskonto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.nachKonto).map(([konto, data]) => (
                    <div key={konto} className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm">{konto}</span>
                        <span className="text-muted-foreground ml-2 text-sm">{data.bezeichnung}</span>
                      </div>
                      <span className="font-mono tabular-nums font-medium">
                        {formatCurrency(data.summe)} €
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Gesamt</span>
                    <span className="font-mono tabular-nums">{formatCurrency(stats.total)} €</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nach Kreditor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nach Kreditor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.nachKreditor).map(([kreditor, summe]) => (
                    <div key={kreditor} className="flex items-center justify-between">
                      <span className="text-sm truncate max-w-[150px]">{kreditor}</span>
                      <span className="font-mono tabular-nums font-medium text-sm">
                        {formatCurrency(summe)} €
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
