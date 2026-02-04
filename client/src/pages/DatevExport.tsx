import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileArchive, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function DatevExport() {
  const [zeitraumVon, setZeitraumVon] = useState("");
  const [zeitraumBis, setZeitraumBis] = useState("");
  const [exportFormat, setExportFormat] = useState("standard");
  const [statusFilter, setStatusFilter] = useState<"entwurf" | "geprueft" | "exportiert" | undefined>(undefined);
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(null);

  // Lade gewähltes Unternehmen aus LocalStorage
  useEffect(() => {
    const savedId = localStorage.getItem("selectedUnternehmenId");
    if (savedId) {
      setSelectedUnternehmenId(parseInt(savedId));
    }
  }, []);

  // tRPC Query für Export
  const exportMutation = trpc.datev.export.useQuery(
    {
      unternehmenId: selectedUnternehmenId!,
      datumVon: zeitraumVon || undefined,
      datumBis: zeitraumBis || undefined,
      status: statusFilter,
    },
    {
      enabled: false, // Manueller Trigger
    }
  );

  const handleExport = async () => {
    if (!selectedUnternehmenId) {
      toast.error("Kein Unternehmen ausgewählt", {
        description: "Bitte wählen Sie zuerst ein Unternehmen aus",
      });
      return;
    }

    if (!zeitraumVon || !zeitraumBis) {
      toast.error("Bitte wählen Sie einen Zeitraum");
      return;
    }

    try {
      // Trigger Export
      const result = await exportMutation.refetch();

      if (result.data && result.data.success) {
        // Erstelle Download
        const blob = new Blob([result.data.content], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("DATEV Export erfolgreich", {
          description: `${result.data.count} Buchungen exportiert`,
        });
      }
    } catch (error) {
      console.error("Export-Fehler:", error);
      toast.error("Fehler beim Erstellen des Exports", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  };

  return (
    <DashboardLayout title="DATEV Export">
      <div className="space-y-6">
        {/* Info-Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Exportieren Sie Ihre Buchungen als DATEV CSV-Datei (EXTF-Format) für Ihren Steuerberater oder
            zur direkten Weiterverarbeitung in DATEV-Software.
          </AlertDescription>
        </Alert>

        {/* Hauptkonfiguration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5" />
              Export-Konfiguration
            </CardTitle>
            <CardDescription>
              Wählen Sie den Zeitraum und die zu exportierenden Daten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zeitraum */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zeitraumVon" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Zeitraum von
                </Label>
                <Input
                  id="zeitraumVon"
                  type="date"
                  value={zeitraumVon}
                  onChange={(e) => setZeitraumVon(e.target.value)}
                  placeholder="TT.MM.JJJJ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zeitraumBis" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Zeitraum bis
                </Label>
                <Input
                  id="zeitraumBis"
                  type="date"
                  value={zeitraumBis}
                  onChange={(e) => setZeitraumBis(e.target.value)}
                  placeholder="TT.MM.JJJJ"
                />
              </div>
            </div>

            {/* Status-Filter (optional) */}
            <div className="space-y-2">
              <Label htmlFor="statusFilter">Buchungsstatus (optional)</Label>
              <Select
                value={statusFilter || "alle"}
                onValueChange={(val) => setStatusFilter(val === "alle" ? undefined : (val as any))}
              >
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Status auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Buchungen</SelectItem>
                  <SelectItem value="entwurf">Nur Entwürfe</SelectItem>
                  <SelectItem value="geprueft">Nur geprüfte</SelectItem>
                  <SelectItem value="exportiert">Nur exportierte</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Filtern Sie optional nach Buchungsstatus. Leer = alle Buchungen.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Export-Format</h4>
              <p className="text-sm text-blue-800">
                Export erfolgt im <strong>DATEV CSV Standard-Format</strong> (EXTF).
                Die Datei enthält alle Buchungen mit:
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Belegdatum, Belegnummer</li>
                <li>• Sachkonto, Gegenkonto</li>
                <li>• Brutto-/Nettobetrag, Steuersatz</li>
                <li>• Buchungstext</li>
              </ul>
            </div>

            {/* Export-Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleExport}
                disabled={exportMutation.isLoading || !zeitraumVon || !zeitraumBis || !selectedUnternehmenId}
                className="gap-2"
                size="lg"
              >
                <Download className="w-4 h-4" />
                {exportMutation.isLoading ? "Exportiere..." : "DATEV Export starten"}
              </Button>
            </div>

            {/* Fehlermeldung */}
            {exportMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {exportMutation.error?.message || "Fehler beim Export"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Format-Informationen */}
        <Card>
          <CardHeader>
            <CardTitle>Export-Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Was enthält der Export?</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• <strong>Buchungsstapel:</strong> Alle Buchungen des gewählten Zeitraums im DATEV-Format</li>
                <li>• <strong>CSV-Datei:</strong> EXTF-Format gemäß DATEV-Standard</li>
                <li>• <strong>Header:</strong> Beraternummer, Mandantennummer, Wirtschaftsjahr</li>
                <li>• <strong>Buchungszeilen:</strong> Datum, Belegnummer, Konten, Beträge, Texte</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Verwendung</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>1. Klicken Sie auf "DATEV Export starten"</li>
                <li>2. Die CSV-Datei wird automatisch heruntergeladen</li>
                <li>3. Importieren Sie die Datei in DATEV oder senden Sie sie an Ihren Steuerberater</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Technische Details</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Format: DATEV CSV (EXTF)</li>
                <li>• Encoding: UTF-8</li>
                <li>• Dezimaltrennzeichen: Komma (,)</li>
                <li>• Datumsformat: TTMMJJ oder DD.MM.YYYY</li>
                <li>• Kontenrahmen: Gemäß Unternehmenseinstellungen (SKR03/SKR04)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
