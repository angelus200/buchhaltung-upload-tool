import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import {
  FileText,
  Download,
  FileSpreadsheet,
  Loader2,
  Info,
  TrendingUp,
  TrendingDown,
  Calculator,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrency(value: number): string {
  return value.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MwstAbrechnung() {
  const { isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [selectedJahr, setSelectedJahr] = useState(new Date().getFullYear());
  const [selectedQuartal, setSelectedQuartal] = useState<number>(1);

  // Schweizer Unternehmen laden
  const unternehmenQuery = trpc.mwst.listSchweizerUnternehmen.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // MWST-Abrechnung laden
  const abrechnungQuery = trpc.mwst.quartalsabrechnung.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      jahr: selectedJahr,
      quartal: selectedQuartal,
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Erstes Unternehmen automatisch auswählen
  const unternehmenListe = unternehmenQuery.data || [];
  if (!selectedUnternehmen && unternehmenListe.length > 0) {
    setSelectedUnternehmen(unternehmenListe[0].id);
  }

  const abrechnung = abrechnungQuery.data;
  const isLoading = abrechnungQuery.isLoading;

  // PDF Export
  const handlePdfExport = () => {
    toast.info("PDF-Export wird vorbereitet...");
    // TODO: PDF-Export implementieren
  };

  // Excel Export
  const handleExcelExport = () => {
    if (!abrechnung) return;

    // Erstelle CSV-Daten
    const csvRows = [
      ["Schweizer MWST-Quartalsabrechnung"],
      [""],
      ["Unternehmen:", abrechnung.unternehmen.name],
      ["UID-Nummer:", abrechnung.unternehmen.ustIdNr || ""],
      ["Zeitraum:", abrechnung.zeitraum.bezeichnung],
      ["Von:", abrechnung.zeitraum.von],
      ["Bis:", abrechnung.zeitraum.bis],
      [""],
      ["I. UMSATZ"],
      ["Ziffer", "Bezeichnung", "Betrag CHF"],
      ["200", abrechnung.umsatz.ziffer200.bezeichnung, abrechnung.umsatz.ziffer200.betrag.toFixed(2)],
      [
        "220-280",
        abrechnung.umsatz.ziffer220bis280.bezeichnung,
        abrechnung.umsatz.ziffer220bis280.betrag.toFixed(2),
      ],
      ["299", abrechnung.umsatz.ziffer299.bezeichnung, abrechnung.umsatz.ziffer299.betrag.toFixed(2)],
      [""],
      ["II. STEUERBERECHNUNG"],
      ["Ziffer", "Bezeichnung", "Betrag CHF", "Satz %", "Steuer CHF"],
      [
        "303",
        abrechnung.steuerberechnung.ziffer303.bezeichnung,
        abrechnung.steuerberechnung.ziffer303.betrag.toFixed(2),
        abrechnung.steuerberechnung.ziffer303.satz.toFixed(1),
        abrechnung.steuerberechnung.ziffer303.steuer.toFixed(2),
      ],
      [
        "313",
        abrechnung.steuerberechnung.ziffer313.bezeichnung,
        abrechnung.steuerberechnung.ziffer313.betrag.toFixed(2),
        abrechnung.steuerberechnung.ziffer313.satz.toFixed(1),
        abrechnung.steuerberechnung.ziffer313.steuer.toFixed(2),
      ],
      [
        "343",
        abrechnung.steuerberechnung.ziffer343.bezeichnung,
        abrechnung.steuerberechnung.ziffer343.betrag.toFixed(2),
        abrechnung.steuerberechnung.ziffer343.satz.toFixed(1),
        abrechnung.steuerberechnung.ziffer343.steuer.toFixed(2),
      ],
      [
        "399",
        abrechnung.steuerberechnung.ziffer399.bezeichnung,
        "",
        "",
        abrechnung.steuerberechnung.ziffer399.steuer.toFixed(2),
      ],
      [""],
      ["III. VORSTEUER"],
      ["Ziffer", "Bezeichnung", "Steuer CHF"],
      [
        "400",
        abrechnung.vorsteuer.ziffer400.bezeichnung,
        abrechnung.vorsteuer.ziffer400.steuer.toFixed(2),
      ],
      [
        "405",
        abrechnung.vorsteuer.ziffer405.bezeichnung,
        abrechnung.vorsteuer.ziffer405.steuer.toFixed(2),
      ],
      ["479", abrechnung.vorsteuer.ziffer479.bezeichnung, abrechnung.vorsteuer.ziffer479.steuer.toFixed(2)],
      [""],
      ["IV. ERGEBNIS"],
      ["Ziffer", "Bezeichnung", "Betrag CHF"],
      ["500", abrechnung.ergebnis.ziffer500.bezeichnung, abrechnung.ergebnis.ziffer500.betrag.toFixed(2)],
      ["510", abrechnung.ergebnis.ziffer510.bezeichnung, abrechnung.ergebnis.ziffer510.betrag.toFixed(2)],
    ];

    // Konvertiere zu CSV
    const csv = csvRows.map((row) => row.join(";")).join("\n");

    // Download CSV
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `MWST_${abrechnung.zeitraum.bezeichnung}_${abrechnung.unternehmen.name.replace(/\s+/g, "_")}.csv`
    );
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Excel-Export erfolgreich!");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schweizer MWST-Quartalsabrechnung</h1>
            <p className="text-muted-foreground mt-2">
              Quartalsabrechnung nach ESTV-Formular für Schweizer Unternehmen
            </p>
          </div>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Abrechnungsparameter</CardTitle>
            <CardDescription>Wählen Sie Unternehmen, Jahr und Quartal aus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Unternehmens-Auswahl */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Unternehmen</label>
                <Select
                  value={selectedUnternehmen?.toString()}
                  onValueChange={(value) => setSelectedUnternehmen(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unternehmen auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {unternehmenListe.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {u.name} {u.ustIdNr && `(${u.ustIdNr})`}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Jahr-Auswahl */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Jahr</label>
                <Select value={selectedJahr.toString()} onValueChange={(value) => setSelectedJahr(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2026, 2025, 2024, 2023, 2022].map((jahr) => (
                      <SelectItem key={jahr} value={jahr.toString()}>
                        {jahr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quartal-Auswahl */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quartal</label>
                <Select
                  value={selectedQuartal.toString()}
                  onValueChange={(value) => setSelectedQuartal(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1 (Januar - März)</SelectItem>
                    <SelectItem value="2">Q2 (April - Juni)</SelectItem>
                    <SelectItem value="3">Q3 (Juli - September)</SelectItem>
                    <SelectItem value="4">Q4 (Oktober - Dezember)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Banner für Nicht-Schweizer Unternehmen */}
        {unternehmenListe.length === 0 && !unternehmenQuery.isLoading && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">Keine Schweizer Unternehmen gefunden</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Die MWST-Quartalsabrechnung ist nur für Schweizer Unternehmen verfügbar. Bitte erstellen Sie
                    zunächst ein Unternehmen mit Land "Schweiz" (CH).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Abrechnung anzeigen */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {abrechnung && !isLoading && (
          <>
            {/* Export-Buttons */}
            <div className="flex gap-2">
              <Button onClick={handlePdfExport} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                PDF exportieren
              </Button>
              <Button onClick={handleExcelExport} variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel exportieren
              </Button>
            </div>

            {/* I. UMSATZ */}
            <Card>
              <CardHeader>
                <CardTitle>I. Umsatz (exkl. MWST)</CardTitle>
                <CardDescription>Ziffern 200-299 des ESTV-Formulars</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Ziffer</TableHead>
                      <TableHead>Bezeichnung</TableHead>
                      <TableHead className="text-right">Betrag CHF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">200</TableCell>
                      <TableCell>{abrechnung.umsatz.ziffer200.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(abrechnung.umsatz.ziffer200.betrag)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">220-280</TableCell>
                      <TableCell>{abrechnung.umsatz.ziffer220bis280.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        -{formatCurrency(abrechnung.umsatz.ziffer220bis280.betrag)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">299</TableCell>
                      <TableCell className="font-bold">{abrechnung.umsatz.ziffer299.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(abrechnung.umsatz.ziffer299.betrag)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* II. STEUERBERECHNUNG */}
            <Card>
              <CardHeader>
                <CardTitle>II. Steuerberechnung</CardTitle>
                <CardDescription>Ziffern 303-399 des ESTV-Formulars</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Ziffer</TableHead>
                      <TableHead>Bezeichnung</TableHead>
                      <TableHead className="text-right">Betrag CHF</TableHead>
                      <TableHead className="text-right">Satz %</TableHead>
                      <TableHead className="text-right">Steuer CHF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">303</TableCell>
                      <TableCell>{abrechnung.steuerberechnung.ziffer303.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(abrechnung.steuerberechnung.ziffer303.betrag)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {abrechnung.steuerberechnung.ziffer303.satz}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-teal-600">
                        {formatCurrency(abrechnung.steuerberechnung.ziffer303.steuer)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">313</TableCell>
                      <TableCell>{abrechnung.steuerberechnung.ziffer313.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(abrechnung.steuerberechnung.ziffer313.betrag)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {abrechnung.steuerberechnung.ziffer313.satz}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-teal-600">
                        {formatCurrency(abrechnung.steuerberechnung.ziffer313.steuer)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">343</TableCell>
                      <TableCell>{abrechnung.steuerberechnung.ziffer343.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(abrechnung.steuerberechnung.ziffer343.betrag)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {abrechnung.steuerberechnung.ziffer343.satz}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-teal-600">
                        {formatCurrency(abrechnung.steuerberechnung.ziffer343.steuer)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">399</TableCell>
                      <TableCell className="font-bold">{abrechnung.steuerberechnung.ziffer399.bezeichnung}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-mono font-bold text-teal-600">
                        {formatCurrency(abrechnung.steuerberechnung.ziffer399.steuer)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* III. VORSTEUER */}
            <Card>
              <CardHeader>
                <CardTitle>III. Vorsteuer</CardTitle>
                <CardDescription>Ziffern 400-479 des ESTV-Formulars</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Ziffer</TableHead>
                      <TableHead>Bezeichnung</TableHead>
                      <TableHead className="text-right">Steuer CHF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">400</TableCell>
                      <TableCell>{abrechnung.vorsteuer.ziffer400.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {formatCurrency(abrechnung.vorsteuer.ziffer400.steuer)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">405</TableCell>
                      <TableCell>{abrechnung.vorsteuer.ziffer405.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {formatCurrency(abrechnung.vorsteuer.ziffer405.steuer)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">479</TableCell>
                      <TableCell className="font-bold">{abrechnung.vorsteuer.ziffer479.bezeichnung}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-orange-600">
                        {formatCurrency(abrechnung.vorsteuer.ziffer479.steuer)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* IV. ERGEBNIS */}
            <Card className="border-2 border-teal-200 bg-teal-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  IV. Ergebnis
                </CardTitle>
                <CardDescription>Ziffern 500/510 des ESTV-Formulars</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Geschuldete Steuer (Ziffer 399)</div>
                        <div className="text-2xl font-bold text-teal-600">
                          {formatCurrency(abrechnung.zusammenfassung.geschuldeteSteu)} CHF
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Total Vorsteuer (Ziffer 479)</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(abrechnung.zusammenfassung.vorsteuer)} CHF
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div className="bg-white rounded-lg p-6 border-2 border-teal-300">
                    {abrechnung.zusammenfassung.istZahllast ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive" className="bg-red-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Zahllast
                          </Badge>
                          <span className="text-sm text-muted-foreground">Ziffer 500</span>
                        </div>
                        <div className="text-4xl font-bold text-red-600">
                          {formatCurrency(abrechnung.ergebnis.ziffer500.betrag)} CHF
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Zu bezahlender Betrag an die ESTV
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" className="bg-green-600">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Guthaben
                          </Badge>
                          <span className="text-sm text-muted-foreground">Ziffer 510</span>
                        </div>
                        <div className="text-4xl font-bold text-green-600">
                          {formatCurrency(abrechnung.ergebnis.ziffer510.betrag)} CHF
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Guthaben von der ESTV
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
