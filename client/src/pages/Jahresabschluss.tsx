import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Loader2,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Download,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ChecklistItem {
  label: string;
  completed: boolean;
  count?: number;
  link?: string;
}

export default function Jahresabschluss() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [selectedJahr, setSelectedJahr] = useState(new Date().getFullYear());

  // Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const anlagenQuery = trpc.jahresabschluss.anlagevermoegen.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0 },
    { enabled: !!selectedUnternehmen }
  );

  const bankkontenQuery = trpc.jahresabschluss.bankkonten.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0, stichtag: `${selectedJahr}-12-31` },
    { enabled: !!selectedUnternehmen }
  );

  const eroeffnungsbilanzQuery = trpc.jahresabschluss.eroeffnungsbilanz.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0, jahr: selectedJahr },
    { enabled: !!selectedUnternehmen }
  );

  const gesellschafterQuery = trpc.jahresabschluss.gesellschafter.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0 },
    { enabled: !!selectedUnternehmen }
  );

  const summenQuery = trpc.jahresabschluss.eroeffnungsbilanz.summen.useQuery(
    { unternehmenId: selectedUnternehmen || 0, jahr: selectedJahr },
    { enabled: !!selectedUnternehmen }
  );

  // Set default Unternehmen
  useEffect(() => {
    if (unternehmenQuery.data && unternehmenQuery.data.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenQuery.data[0].unternehmen.id);
    }
  }, [unternehmenQuery.data, selectedUnternehmen]);

  const anlagen = anlagenQuery.data || [];
  const bankkonten = bankkontenQuery.data || [];
  const eroeffnungsbilanz = eroeffnungsbilanzQuery.data || [];
  const gesellschafter = gesellschafterQuery.data || [];
  const summen = summenQuery.data || {
    sollSumme: 0,
    habenSumme: 0,
    differenz: 0,
    ausgeglichen: false,
  };

  // Checkliste
  const checklist: ChecklistItem[] = [
    {
      label: "Anlagevermögen gepflegt",
      completed: anlagen.length > 0,
      count: anlagen.length,
      link: "/anlagevermoegen",
    },
    {
      label: "Bankkonten abgestimmt",
      completed: bankkonten.length > 0,
      count: bankkonten.length,
      link: "/bankkonten",
    },
    {
      label: "Eröffnungsbilanz erfasst",
      completed: eroeffnungsbilanz.length > 0 && summen.ausgeglichen,
      count: eroeffnungsbilanz.length,
      link: "/eroeffnungsbilanz",
    },
    {
      label: "Gesellschafterkonten aktuell",
      completed: gesellschafter.length > 0,
      count: gesellschafter.length,
      link: "/stammdaten",
    },
  ];

  const vollstaendigkeitsProzent = Math.round(
    (checklist.filter((item) => item.completed).length / checklist.length) * 100
  );

  const isLoading =
    anlagenQuery.isLoading ||
    bankkontenQuery.isLoading ||
    eroeffnungsbilanzQuery.isLoading ||
    gesellschafterQuery.isLoading;

  const handleExportPDF = () => {
    toast.info("PDF-Export wird vorbereitet...");
    // TODO: PDF-Export implementieren
  };

  const handleExportExcel = () => {
    toast.info("Excel-Export wird vorbereitet...");
    // TODO: Excel-Export implementieren
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Jahresabschluss"
        subtitle="Übersicht und Vollständigkeitsprüfung"
      />

      <main className="container py-8 max-w-7xl">
        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <Select
            value={String(selectedUnternehmen || "")}
            onValueChange={(v) => setSelectedUnternehmen(Number(v))}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Unternehmen wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmenQuery.data?.map((u) => (
                <SelectItem key={u.unternehmen.id} value={String(u.unternehmen.id)}>
                  {u.unternehmen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedJahr)} onValueChange={(v) => setSelectedJahr(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !selectedUnternehmen ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Kein Unternehmen ausgewählt</p>
              <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Vollständigkeitsfortschritt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Vollständigkeit Jahresabschluss {selectedJahr}
                  <Badge
                    variant={vollstaendigkeitsProzent === 100 ? "default" : "secondary"}
                    className="text-lg px-3 py-1"
                  >
                    {vollstaendigkeitsProzent}%
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Prüfen Sie die Vollständigkeit aller erforderlichen Daten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Fortschrittsbalken */}
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        vollstaendigkeitsProzent === 100
                          ? "bg-green-500"
                          : vollstaendigkeitsProzent >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${vollstaendigkeitsProzent}%` }}
                    />
                  </div>

                  <Separator />

                  {/* Checkliste */}
                  <div className="space-y-3">
                    {checklist.map((item, index) => (
                      <Link key={index} href={item.link || "#"}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                item.completed ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {item.label}
                            </p>
                            {item.count !== undefined && (
                              <p className="text-sm text-muted-foreground">
                                {item.count} Einträge erfasst
                              </p>
                            )}
                          </div>
                          {!item.completed && (
                            <Badge variant="outline" className="text-xs">
                              Ausstehend
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {vollstaendigkeitsProzent === 100 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle2 className="w-5 h-5" />
                        <p className="font-medium">
                          Alle Prüfpunkte erfüllt - Jahresabschluss kann erstellt werden
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bilanz-Vorschau */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aktiva */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Aktiva
                  </CardTitle>
                  <CardDescription>Vermögenswerte zum {`31.12.${selectedJahr}`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Anlagevermögen</span>
                      <span className="font-mono font-medium">
                        {formatCurrency(
                          anlagen.reduce(
                            (sum, a) => sum + parseFloat(a.anschaffungskosten || "0"),
                            0
                          )
                        )}{" "}
                        €
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Bankguthaben</span>
                      <span className="font-mono font-medium">
                        {formatCurrency(bankkonten.reduce((sum, b) => sum + (b.saldo || 0), 0))} €
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Summe Aktiva</span>
                      <span className="font-mono font-bold text-lg">
                        {formatCurrency(summen.sollSumme)} €
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passiva */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                    Passiva
                  </CardTitle>
                  <CardDescription>
                    Eigenkapital & Verbindlichkeiten zum {`31.12.${selectedJahr}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Eigenkapital</span>
                      <span className="font-mono font-medium">
                        {formatCurrency(
                          gesellschafter.reduce((sum, g) => sum + parseFloat(g.einlage || "0"), 0)
                        )}{" "}
                        €
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Verbindlichkeiten</span>
                      <span className="font-mono font-medium">0,00 €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Summe Passiva</span>
                      <span className="font-mono font-bold text-lg">
                        {formatCurrency(summen.habenSumme)} €
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bilanz-Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bilanz-Status</p>
                    <p className="text-2xl font-bold">
                      {summen.ausgeglichen ? "Ausgeglichen" : "Nicht ausgeglichen"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Differenz</p>
                    <p
                      className={`text-2xl font-bold ${
                        summen.ausgeglichen ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(summen.differenz))} €
                    </p>
                  </div>
                  <div>
                    {summen.ausgeglichen ? (
                      <Badge variant="default" className="text-base px-4 py-2">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Bilanz ausgeglichen
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-base px-4 py-2">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Bitte prüfen
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GuV-Link */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Gewinn- und Verlustrechnung</h3>
                    <p className="text-sm text-muted-foreground">
                      Detaillierte Analyse der Erträge und Aufwendungen
                    </p>
                  </div>
                  <Link href="/kennzahlen">
                    <Button>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Zur GuV
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
