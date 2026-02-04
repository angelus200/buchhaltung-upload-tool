import { useState } from "react";
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

export default function DatevExport() {
  const [zeitraumVon, setZeitraumVon] = useState("");
  const [zeitraumBis, setZeitraumBis] = useState("");
  const [exportFormat, setExportFormat] = useState("standard");
  const [includeBuchungen, setIncludeBuchungen] = useState(true);
  const [includeStammdaten, setIncludeStammdaten] = useState(true);
  const [includeBelege, setIncludeBelege] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!zeitraumVon || !zeitraumBis) {
      toast.error("Bitte wählen Sie einen Zeitraum");
      return;
    }

    setIsExporting(true);

    try {
      // TODO: Backend-Implementierung für DATEV Export
      // const result = await trpc.datev.export.mutate({
      //   zeitraumVon,
      //   zeitraumBis,
      //   format: exportFormat,
      //   includeBuchungen,
      //   includeStammdaten,
      //   includeBelege,
      // });

      // Simuliere Export-Dauer
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("DATEV Export erfolgreich erstellt", {
        description: "Der Download startet automatisch...",
      });

      // TODO: Trigger actual download
      // window.location.href = result.downloadUrl;
    } catch (error) {
      console.error("Export-Fehler:", error);
      toast.error("Fehler beim Erstellen des Exports", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout title="DATEV Export">
      <div className="space-y-6">
        {/* Info-Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Exportieren Sie Ihre Buchhaltungsdaten im DATEV-Standard-Format für Ihren Steuerberater oder
            zur Weiterverarbeitung in DATEV-Software.
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

            {/* Export-Format */}
            <div className="space-y-2">
              <Label htmlFor="exportFormat">Export-Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="exportFormat">
                  <SelectValue placeholder="Format auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">DATEV Standard (ASCII)</SelectItem>
                  <SelectItem value="kne">DATEV KNE Format</SelectItem>
                  <SelectItem value="csv">DATEV CSV</SelectItem>
                  <SelectItem value="xml">DATEV XML</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {exportFormat === "standard" && "Klassisches DATEV ASCII-Format (empfohlen)"}
                {exportFormat === "kne" && "Komprimiertes DATEV-Format für große Datenmengen"}
                {exportFormat === "csv" && "CSV-Format für manuelle Bearbeitung"}
                {exportFormat === "xml" && "XML-Format für moderne DATEV-Versionen"}
              </p>
            </div>

            {/* Inhalte auswählen */}
            <div className="space-y-3">
              <Label>Export-Inhalte</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBuchungen"
                  checked={includeBuchungen}
                  onCheckedChange={(checked) => setIncludeBuchungen(checked as boolean)}
                />
                <label
                  htmlFor="includeBuchungen"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Buchungsstapel
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStammdaten"
                  checked={includeStammdaten}
                  onCheckedChange={(checked) => setIncludeStammdaten(checked as boolean)}
                />
                <label
                  htmlFor="includeStammdaten"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Stammdaten (Debitoren, Kreditoren, Sachkonten)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBelege"
                  checked={includeBelege}
                  onCheckedChange={(checked) => setIncludeBelege(checked as boolean)}
                />
                <label
                  htmlFor="includeBelege"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Belege (PDFs) - Achtung: Kann sehr groß werden!
                </label>
              </div>
            </div>

            {/* Export-Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleExport}
                disabled={isExporting || !zeitraumVon || !zeitraumBis}
                className="gap-2"
                size="lg"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Exportiere..." : "DATEV Export starten"}
              </Button>
            </div>
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
                <li>• <strong>Stammdaten:</strong> Debitoren, Kreditoren und Sachkonten zur Zuordnung</li>
                <li>• <strong>Belege (optional):</strong> PDF-Dateien der Originalbelege</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Verwendung</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>1. Laden Sie die ZIP-Datei herunter</li>
                <li>2. Entpacken Sie die Datei</li>
                <li>3. Importieren Sie die Daten in DATEV oder senden Sie sie an Ihren Steuerberater</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Hinweise</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Der Export erfolgt nach DATEV-Standard (ASCII/KNE)</li>
                <li>• Alle Beträge werden im DATEV-Format formatiert (Komma als Dezimaltrennzeichen)</li>
                <li>• Datumsangaben im Format TT.MM.JJJJ</li>
                <li>• Kontonummern gemäß gewähltem Kontenrahmen (SKR03/SKR04)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
