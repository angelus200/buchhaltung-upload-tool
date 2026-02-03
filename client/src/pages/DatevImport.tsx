import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Info,
  FileText,
  Calendar,
  Building2,
  TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDropzone } from "react-dropzone";

interface ParsedBuchung {
  umsatz: number;
  sollHaben: "S" | "H";
  waehrung?: string;
  konto: string;
  gegenkonto: string;
  belegdatum: Date;
  belegnummer: string;
  buchungstext: string;
  buSchluessel?: string;
  skonto?: number;
  rowNumber: number;
  errors: string[];
  warnings: string[];
}

interface ParseResult {
  header: {
    format: string;
    beraternummer?: string;
    mandantennummer?: string;
    wirtschaftsjahrBeginn?: number;
    datumVon?: Date;
    datumBis?: Date;
  };
  buchungen: ParsedBuchung[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    totalUmsatz: number;
  };
}

export default function DatevImport() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  // Export Dialog State
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [exportSachkonten, setExportSachkonten] = useState("");
  const [exportOnlyChecked, setExportOnlyChecked] = useState(true);

  // Get unternehmen list
  const { data: unternehmenList = [] } = trpc.unternehmen.list.useQuery();

  // Parse mutation
  const parseMutation = trpc.datev.parse.useMutation({
    onSuccess: (data) => {
      setParseResult(data as any);
      toast.success("Datei erfolgreich geparst", {
        description: `${data.stats.validRows} gültige Buchungen gefunden`,
      });
    },
    onError: (error) => {
      toast.error("Fehler beim Parsen", {
        description: error.message,
      });
    },
  });

  // Import mutation
  const importMutation = trpc.datev.import.useMutation({
    onSuccess: (data) => {
      toast.success("Import erfolgreich!", {
        description: data.message,
      });
      setParseResult(null);
      setFileName("");
    },
    onError: (error) => {
      toast.error("Import fehlgeschlagen", {
        description: error.message,
      });
    },
  });

  // Export mutation - disabled initially, wird manuell über refetch getriggert
  const trpcUtils = trpc.useUtils();

  // File dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseMutation.mutate({
        fileContent: content,
        fileName: file.name,
      });
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!parseResult || !selectedUnternehmen) {
      toast.error("Bitte wählen Sie ein Unternehmen und laden Sie eine Datei hoch");
      return;
    }

    // Filter out invalid rows
    const validBuchungen = parseResult.buchungen.filter((b) => b.errors.length === 0);

    if (validBuchungen.length === 0) {
      toast.error("Keine gültigen Buchungen zum Importieren");
      return;
    }

    setIsImporting(true);
    try {
      await importMutation.mutateAsync({
        unternehmenId: selectedUnternehmen,
        buchungen: validBuchungen,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    if (!selectedUnternehmen) {
      toast.error("Bitte wählen Sie ein Unternehmen");
      return;
    }

    try {
      // Parse Sachkonten-Filter (comma-separated)
      const sachkontenArray = exportSachkonten
        ? exportSachkonten.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;

      const result = await trpcUtils.datev.export.fetch({
        unternehmenId: selectedUnternehmen,
        datumVon: exportDateFrom || undefined,
        datumBis: exportDateTo || undefined,
        sachkonten: sachkontenArray,
        status: exportOnlyChecked ? "geprueft" : undefined,
      });

      if (result) {
        // Download file
        const blob = new Blob([result.content], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = result.fileName;
        link.click();

        toast.success("Export erfolgreich!", {
          description: `${result.count} Buchungen exportiert`,
        });

        setExportDialogOpen(false);
      }
    } catch (error) {
      toast.error("Export fehlgeschlagen", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-teal-600" />
            DATEV Import/Export
          </h1>
          <p className="text-muted-foreground mt-2">
            Importieren Sie Buchungsstapel aus DATEV-Dateien (EXTF/CSV) oder exportieren Sie Ihre
            Buchungen für den Steuerberater.
          </p>
        </div>

        {/* Company Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Unternehmen auswählen
            </CardTitle>
            <CardDescription>Wählen Sie das Unternehmen für den Import/Export</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedUnternehmen?.toString() || ""}
              onValueChange={(v) => setSelectedUnternehmen(parseInt(v))}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Unternehmen wählen..." />
              </SelectTrigger>
              <SelectContent>
                {unternehmenList.map((u) => (
                  <SelectItem key={u.unternehmen.id} value={u.unternehmen.id.toString()}>
                    {u.unternehmen.name}
                    {u.unternehmen.mandantennummer && ` (Mandant ${u.unternehmen.mandantennummer})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              DATEV Datei importieren
            </CardTitle>
            <CardDescription>
              Laden Sie eine DATEV EXTF oder CSV Datei hoch (.csv oder .txt)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-300 hover:border-teal-400 hover:bg-slate-50"
              }`}
            >
              <input {...getInputProps()} />
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              {isDragActive ? (
                <p className="text-lg text-teal-600">Datei hier ablegen...</p>
              ) : (
                <>
                  <p className="text-lg text-slate-900 mb-2">
                    Datei hierher ziehen oder klicken zum Auswählen
                  </p>
                  <p className="text-sm text-slate-500">
                    Unterstützte Formate: .csv, .txt (DATEV EXTF oder CSV)
                  </p>
                </>
              )}
            </div>

            {/* File info */}
            {fileName && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>Datei geladen: {fileName}</AlertDescription>
              </Alert>
            )}

            {/* Parsing status */}
            {parseMutation.isPending && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>Datei wird geparst...</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Parse Result */}
        {parseResult && (
          <>
            {/* Metadata */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Datei-Informationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <p className="font-medium">{parseResult.header.format}</p>
                  </div>
                  {parseResult.header.beraternummer && (
                    <div>
                      <p className="text-sm text-muted-foreground">Beraternummer</p>
                      <p className="font-medium">{parseResult.header.beraternummer}</p>
                    </div>
                  )}
                  {parseResult.header.mandantennummer && (
                    <div>
                      <p className="text-sm text-muted-foreground">Mandantennummer</p>
                      <p className="font-medium">{parseResult.header.mandantennummer}</p>
                    </div>
                  )}
                  {parseResult.header.datumVon && parseResult.header.datumBis && (
                    <div>
                      <p className="text-sm text-muted-foreground">Zeitraum</p>
                      <p className="font-medium">
                        {new Date(parseResult.header.datumVon).toLocaleDateString("de-DE")} -{" "}
                        {new Date(parseResult.header.datumBis).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Statistik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamt</p>
                    <p className="text-2xl font-bold">{parseResult.stats.totalRows}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gültig</p>
                    <p className="text-2xl font-bold text-green-600">
                      {parseResult.stats.validRows}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ungültig</p>
                    <p className="text-2xl font-bold text-red-600">
                      {parseResult.stats.invalidRows}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
                    <p className="text-2xl font-bold">
                      {parseResult.stats.totalUmsatz.toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      €
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Errors and Warnings */}
            {(parseResult.errors.length > 0 || parseResult.warnings.length > 0) && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Meldungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parseResult.errors.map((error, i) => (
                    <Alert key={i} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                  {parseResult.warnings.map((warning, i) => (
                    <Alert key={i}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Preview Table */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Vorschau ({parseResult.buchungen.length} Buchungen)
                </CardTitle>
                <CardDescription>
                  Überprüfen Sie die Buchungen vor dem Import. Nur gültige Buchungen werden
                  importiert.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nr.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Beleg</TableHead>
                        <TableHead>Konto</TableHead>
                        <TableHead>Gegenkonto</TableHead>
                        <TableHead>S/H</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                        <TableHead>Text</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.buchungen.slice(0, 50).map((buchung) => (
                        <TableRow
                          key={buchung.rowNumber}
                          className={buchung.errors.length > 0 ? "bg-red-50" : ""}
                        >
                          <TableCell>{buchung.rowNumber}</TableCell>
                          <TableCell>
                            {buchung.errors.length === 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                OK
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Fehler
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(buchung.belegdatum).toLocaleDateString("de-DE")}
                          </TableCell>
                          <TableCell>{buchung.belegnummer}</TableCell>
                          <TableCell className="font-mono text-sm">{buchung.konto}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {buchung.gegenkonto}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{buchung.sollHaben}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {buchung.umsatz.toLocaleString("de-DE", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            €
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {buchung.buchungstext}
                            {buchung.errors.length > 0 && (
                              <p className="text-xs text-red-600 mt-1">
                                {buchung.errors.join(", ")}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parseResult.buchungen.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      ... und {parseResult.buchungen.length - 50} weitere Buchungen
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Import Button */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setParseResult(null);
                  setFileName("");
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedUnternehmen || isImporting || parseResult.stats.validRows === 0}
                className="gap-2"
              >
                {isImporting ? (
                  "Importiere..."
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {parseResult.stats.validRows} Buchungen importieren
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Export Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              DATEV Datei exportieren
            </CardTitle>
            <CardDescription>
              Exportieren Sie Ihre Buchungen als DATEV EXTF Datei für den Steuerberater
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setExportDialogOpen(true)}
              disabled={!selectedUnternehmen}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export konfigurieren
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Wählen Sie Zeitraum und Filter für den Export
            </p>
          </CardContent>
        </Card>

        {/* Export Options Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                DATEV Export konfigurieren
              </DialogTitle>
              <DialogDescription>
                Wählen Sie den Zeitraum und optional bestimmte Sachkonten für den Export.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Zeitraum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-from">Datum von</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="date-to">Datum bis</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Sachkonten Filter */}
              <div>
                <Label htmlFor="sachkonten">
                  Sachkonten (optional)
                  <span className="text-xs text-muted-foreground ml-2">
                    Komma-getrennt, z.B. 1200,1800,4000
                  </span>
                </Label>
                <Input
                  id="sachkonten"
                  value={exportSachkonten}
                  onChange={(e) => setExportSachkonten(e.target.value)}
                  placeholder="z.B. 1200,1800,4000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leer lassen für alle Konten
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="only-checked"
                  checked={exportOnlyChecked}
                  onCheckedChange={(checked) => setExportOnlyChecked(checked as boolean)}
                />
                <Label htmlFor="only-checked" className="text-sm font-normal cursor-pointer">
                  Nur geprüfte Buchungen exportieren
                </Label>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-900">
                  💡 <strong>Hinweis:</strong> Wenn Sie keinen Zeitraum angeben, werden alle
                  Buchungen des Unternehmens exportiert.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Jetzt exportieren
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
