import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  XCircle,
  FileSpreadsheet,
  CreditCard,
  Landmark,
  Zap,
  Sparkles,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE");
}

const TYP_CONFIG = {
  bankkonto: {
    label: "Bankkonto",
    icon: Landmark,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  kreditkarte: {
    label: "Kreditkarte",
    icon: CreditCard,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  zahlungsdienstleister: {
    label: "Zahlungsdienstleister",
    icon: Zap,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
};

const STATUS_CONFIG = {
  neu: { label: "Neu", color: "bg-gray-100 text-gray-800" },
  in_bearbeitung: { label: "In Bearbeitung", color: "bg-blue-100 text-blue-800" },
  abgeschlossen: { label: "Abgeschlossen", color: "bg-green-100 text-green-800" },
};

export default function Auszuege() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAuszug, setSelectedAuszug] = useState<number | null>(null);
  const [zuordnungDialogOpen, setZuordnungDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);

  // Upload-State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadTyp, setUploadTyp] = useState<"bankkonto" | "kreditkarte" | "zahlungsdienstleister">("bankkonto");
  const [uploadKontoId, setUploadKontoId] = useState<string>("");
  const [uploadKontoBezeichnung, setUploadKontoBezeichnung] = useState("");
  const [uploadZeitraumVon, setUploadZeitraumVon] = useState("");
  const [uploadZeitraumBis, setUploadZeitraumBis] = useState("");
  const [uploadSaldoAnfang, setUploadSaldoAnfang] = useState("");
  const [uploadSaldoEnde, setUploadSaldoEnde] = useState("");
  const [uploading, setUploading] = useState(false);

  // CSV-Import State
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();
  const { data: auszuege, refetch: refetchAuszuege } = trpc.auszuege.list.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );
  const { data: stats } = trpc.auszuege.stats.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );
  const {
    data: auszugDetail,
    refetch: refetchDetail,
    isLoading: detailLoading,
    error: detailError
  } = trpc.auszuege.getById.useQuery(
    { id: selectedAuszug! },
    {
      enabled: !!selectedAuszug,
      onError: (error) => {
        toast.error(`Fehler beim Laden des Auszugs: ${error.message}`);
      }
    }
  );
  const { data: passendeBuchungen } = trpc.auszuege.findePassendeBuchungen.useQuery(
    { positionId: selectedPosition?.id },
    { enabled: !!selectedPosition }
  );

  // Auto-select Unternehmen aus localStorage oder erstes Unternehmen
  useEffect(() => {
    if (unternehmen && unternehmen.length > 0 && !selectedUnternehmen) {
      const savedId = localStorage.getItem("selectedUnternehmenId");
      if (savedId) {
        const id = parseInt(savedId);
        const exists = unternehmen.find(u => u.unternehmen.id === id);
        if (exists) {
          setSelectedUnternehmen(id);
          return;
        }
      }
      // Fallback: erstes Unternehmen
      setSelectedUnternehmen(unternehmen[0].unternehmen.id);
    }
  }, [unternehmen, selectedUnternehmen]);

  // Mutations
  const uploadMutation = trpc.auszuege.upload.useMutation({
    onSuccess: () => {
      toast.success("Auszug erfolgreich hochgeladen");
      refetchAuszuege();
      setUploadDialogOpen(false);
      resetUploadForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const zuordnenMutation = trpc.auszuege.zuordnen.useMutation({
    onSuccess: () => {
      toast.success("Position zugeordnet");
      refetchDetail();
      setZuordnungDialogOpen(false);
      setSelectedPosition(null);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const autoZuordnenMutation = trpc.auszuege.autoZuordnen.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.zugeordnet} Position(en) automatisch zugeordnet`);
      refetchDetail();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const ignorierenMutation = trpc.auszuege.ignorieren.useMutation({
    onSuccess: () => {
      toast.success("Position ignoriert");
      refetchDetail();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const zuordnungAufhebenMutation = trpc.auszuege.zuordnungAufheben.useMutation({
    onSuccess: () => {
      toast.success("Zuordnung aufgehoben");
      refetchDetail();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const buchungAusPositionMutation = trpc.auszuege.buchungAusPosition.useMutation({
    onSuccess: () => {
      toast.success("Buchung erstellt und Position zugeordnet");
      refetchDetail();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.auszuege.delete.useMutation({
    onSuccess: () => {
      toast.success("Auszug gelöscht");
      refetchAuszuege();
      setDetailDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const createVorschlagMutation = trpc.buchungsvorschlaege.createFromPosition.useMutation({
    onSuccess: (data) => {
      toast.success(`Buchungsvorschlag erstellt (Confidence: ${(data.confidence * 100).toFixed(0)}%)`);
      refetchDetail();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const importCSVMutation = trpc.auszuege.importCSV.useMutation({
    onSuccess: (data) => {
      toast.success(
        `${data.imported} Position(en) importiert, ${data.skipped} übersprungen`
      );
      refetchDetail();
      setCsvImportDialogOpen(false);
      setCsvFile(null);

      // Auto-Zuordnung vorschlagen
      if (data.imported > 0) {
        const shouldAutoMatch = confirm(
          `${data.imported} Positionen erfolgreich importiert.\n\nJetzt automatisch zuordnen?`
        );
        if (shouldAutoMatch && selectedAuszug) {
          autoZuordnenMutation.mutate({ auszugId: selectedAuszug });
        }
      }
    },
    onError: (error) => {
      toast.error(`Import fehlgeschlagen: ${error.message}`);
    },
  });

  // File dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  const resetUploadForm = () => {
    setUploadedFile(null);
    setUploadTyp("bankkonto");
    setUploadKontoId("");
    setUploadKontoBezeichnung("");
    setUploadZeitraumVon("");
    setUploadZeitraumBis("");
    setUploadSaldoAnfang("");
    setUploadSaldoEnde("");
  };

  const handleUpload = async () => {
    if (!selectedUnternehmen || !uploadedFile || !uploadZeitraumVon || !uploadZeitraumBis) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    setUploading(true);
    try {
      // Datei zu Base64 konvertieren
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });

      uploadMutation.mutate({
        unternehmenId: selectedUnternehmen,
        typ: uploadTyp,
        kontoId: uploadKontoId ? parseInt(uploadKontoId) : null,
        kontoBezeichnung: uploadKontoBezeichnung || undefined,
        dateiBase64: base64,
        dateiname: uploadedFile.name,
        zeitraumVon: uploadZeitraumVon,
        zeitraumBis: uploadZeitraumBis,
        saldoAnfang: uploadSaldoAnfang?.trim() || undefined,
        saldoEnde: uploadSaldoEnde?.trim() || undefined,
        waehrung: "EUR",
      });
    } catch (error) {
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  // Ladezustand
  if (!unternehmen) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Auszüge" subtitle="Kontoauszüge, Kreditkartenauszüge & Zahlungsdienstleister" />
        <main className="container py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  // Keine Unternehmen vorhanden
  if (unternehmen.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Auszüge" subtitle="Kontoauszüge, Kreditkartenauszüge & Zahlungsdienstleister" />
        <main className="container py-8">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Kein Unternehmen vorhanden</h2>
            <p className="text-muted-foreground">
              Sie müssen zuerst ein Unternehmen erstellen, um Auszüge zu verwalten.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Auszüge" subtitle="Kontoauszüge, Kreditkartenauszüge & Zahlungsdienstleister" />

      <main className="container py-8">
        {/* Unternehmen auswählen */}
        <div className="flex items-center gap-4 mb-6">
          <Select
            value={String(selectedUnternehmen || "")}
            onValueChange={(v) => setSelectedUnternehmen(Number(v))}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Unternehmen wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmen?.map((u) => (
                <SelectItem key={u.unternehmen.id} value={String(u.unternehmen.id)}>
                  {u.unternehmen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setUploadDialogOpen(true)}
            disabled={!selectedUnternehmen}
            className="ml-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Auszug hochladen
          </Button>
        </div>

        {/* Statistiken */}
        {selectedUnternehmen && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamt</p>
                    <p className="text-2xl font-bold">{stats.gesamt}</p>
                  </div>
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Neu</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.neu}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Bearbeitung</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inBearbeitung}</p>
                  </div>
                  <Loader2 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Abgeschlossen</p>
                    <p className="text-2xl font-bold text-green-600">{stats.abgeschlossen}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Auszüge-Liste */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Auszüge</CardTitle>
            <CardDescription>
              Übersicht aller hochgeladenen Kontoauszüge und Kreditkartenauszüge
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedUnternehmen ? (
              <div className="text-center py-8 text-muted-foreground">
                Bitte wählen Sie ein Unternehmen aus
              </div>
            ) : !auszuege || auszuege.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Auszüge hochgeladen</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Konto</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead className="text-right">Saldo Anfang</TableHead>
                    <TableHead className="text-right">Saldo Ende</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auszuege.map((auszug) => {
                    const typConfig = TYP_CONFIG[auszug.typ];
                    const TypIcon = typConfig.icon;
                    return (
                      <TableRow key={auszug.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypIcon className={`w-4 h-4 ${typConfig.color}`} />
                            {typConfig.label}
                          </div>
                        </TableCell>
                        <TableCell>{auszug.kontoBezeichnung || "-"}</TableCell>
                        <TableCell>
                          {formatDate(auszug.zeitraumVon)} - {formatDate(auszug.zeitraumBis)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {auszug.saldoAnfang ? formatCurrency(auszug.saldoAnfang) : "-"} €
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {auszug.saldoEnde ? formatCurrency(auszug.saldoEnde) : "-"} €
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_CONFIG[auszug.status].color}>
                            {STATUS_CONFIG[auszug.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAuszug(auszug.id);
                                setDetailDialogOpen(true);
                              }}
                              title="Ansehen"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Auszug wirklich löschen?")) {
                                  deleteMutation.mutate({ id: auszug.id });
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Auszug hochladen</DialogTitle>
              <DialogDescription>
                Laden Sie einen Kontoauszug, Kreditkartenauszug oder Auszug eines Zahlungsdienstleisters hoch
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {uploadedFile ? (
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-lg mb-2">Datei hier ablegen oder klicken</p>
                    <p className="text-sm text-muted-foreground">
                      Unterstützt: PDF, CSV, Excel
                    </p>
                  </>
                )}
              </div>

              {/* Typ */}
              <div>
                <Label>Typ *</Label>
                <Select value={uploadTyp} onValueChange={(v: any) => setUploadTyp(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bankkonto">Bankkonto</SelectItem>
                    <SelectItem value="kreditkarte">Kreditkarte</SelectItem>
                    <SelectItem value="zahlungsdienstleister">Zahlungsdienstleister</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Konto */}
              <div>
                <Label>Kontobezeichnung</Label>
                <Input
                  value={uploadKontoBezeichnung}
                  onChange={(e) => setUploadKontoBezeichnung(e.target.value)}
                  placeholder="z.B. Geschäftskonto Sparkasse"
                />
              </div>

              {/* Zeitraum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Zeitraum von *</Label>
                  <Input
                    type="date"
                    value={uploadZeitraumVon}
                    onChange={(e) => setUploadZeitraumVon(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Zeitraum bis *</Label>
                  <Input
                    type="date"
                    value={uploadZeitraumBis}
                    onChange={(e) => setUploadZeitraumBis(e.target.value)}
                  />
                </div>
              </div>

              {/* Saldo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Saldo Anfang (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={uploadSaldoAnfang}
                    onChange={(e) => setUploadSaldoAnfang(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Saldo Ende (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={uploadSaldoEnde}
                    onChange={(e) => setUploadSaldoEnde(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadedFile}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird hochgeladen...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Hochladen
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {auszugDetail && (
                  <>
                    {TYP_CONFIG[auszugDetail.auszug.typ].icon && (
                      React.createElement(TYP_CONFIG[auszugDetail.auszug.typ].icon, {
                        className: `w-5 h-5 ${TYP_CONFIG[auszugDetail.auszug.typ].color}`,
                      })
                    )}
                    Auszug: {auszugDetail.auszug.kontoBezeichnung || "Ohne Bezeichnung"}
                  </>
                )}
                {!auszugDetail && !detailLoading && "Auszug"}
              </DialogTitle>
              <DialogDescription>
                {auszugDetail && (
                  <>
                    Zeitraum: {formatDate(auszugDetail.auszug.zeitraumVon)} -{" "}
                    {formatDate(auszugDetail.auszug.zeitraumBis)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {detailLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Lade Auszug-Details...</p>
              </div>
            )}

            {detailError && !detailLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="font-medium mb-2">Fehler beim Laden</p>
                <p className="text-sm text-muted-foreground mb-4">{detailError.message}</p>
                <Button onClick={() => refetchDetail()} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
              </div>
            )}

            {auszugDetail && !detailLoading && (
              <div className="space-y-4">
                {/* Auszug-Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant="outline" className={STATUS_CONFIG[auszugDetail.auszug.status].color}>
                          {STATUS_CONFIG[auszugDetail.auszug.status].label}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Saldo Anfang</p>
                        <p className="font-mono font-medium">
                          {auszugDetail.auszug.saldoAnfang
                            ? `${formatCurrency(auszugDetail.auszug.saldoAnfang)} €`
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Saldo Ende</p>
                        <p className="font-mono font-medium">
                          {auszugDetail.auszug.saldoEnde
                            ? `${formatCurrency(auszugDetail.auszug.saldoEnde)} €`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Aktionen */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => autoZuordnenMutation.mutate({ auszugId: auszugDetail.auszug.id })}
                    disabled={autoZuordnenMutation.isPending}
                  >
                    {autoZuordnenMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wird zugeordnet...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Auto-Zuordnen
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (auszugDetail.auszug.dateiUrl) {
                        window.open(auszugDetail.auszug.dateiUrl, "_blank");
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Datei öffnen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCsvImportDialogOpen(true)}
                    disabled={!auszugDetail}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    CSV importieren
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Auszug wirklich löschen?")) {
                        deleteMutation.mutate({ id: auszugDetail.auszug.id });
                      }
                    }}
                    className="ml-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </Button>
                </div>

                {/* Positionen */}
                <Card>
                  <CardHeader>
                    <CardTitle>Positionen ({auszugDetail.positionen.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {auszugDetail.positionen.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Keine Positionen gefunden</p>
                        <p className="text-sm">
                          Laden Sie eine CSV-Datei hoch oder fügen Sie Positionen manuell hinzu
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Buchungstext</TableHead>
                            <TableHead className="text-right">Betrag</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[200px]">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auszugDetail.positionen.map((position) => (
                            <TableRow
                              key={position.id}
                              className={
                                position.status === "zugeordnet"
                                  ? "bg-green-50"
                                  : position.status === "ignoriert"
                                  ? "bg-gray-50"
                                  : ""
                              }
                            >
                              <TableCell>{formatDate(position.datum)}</TableCell>
                              <TableCell className="max-w-xs truncate">{position.buchungstext}</TableCell>
                              <TableCell className="text-right font-mono">
                                <span
                                  className={
                                    parseFloat(position.betrag.toString()) >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {formatCurrency(position.betrag)} €
                                </span>
                              </TableCell>
                              <TableCell>
                                {position.status === "zugeordnet" && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Zugeordnet
                                  </Badge>
                                )}
                                {position.status === "offen" && (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Offen
                                  </Badge>
                                )}
                                {position.status === "ignoriert" && (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Ignoriert
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {position.status === "offen" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedPosition(position);
                                          setZuordnungDialogOpen(true);
                                        }}
                                        title="Zu existierender Buchung zuordnen"
                                      >
                                        <LinkIcon className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          createVorschlagMutation.mutate({ positionId: position.id });
                                        }}
                                        disabled={createVorschlagMutation.isPending}
                                        title="Buchungsvorschlag mit AI erstellen"
                                      >
                                        {createVorschlagMutation.isPending ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Sparkles className="w-4 h-4 text-purple-600" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const sachkonto = prompt("Sachkonto (z.B. 4200):");
                                          if (!sachkonto) return;
                                          const gegenkonto = prompt("Gegenkonto (z.B. 1200):");
                                          if (!gegenkonto) return;
                                          const steuersatzStr = prompt("Steuersatz % (0, 7, 19):", "19");
                                          const steuersatz = steuersatzStr ? parseFloat(steuersatzStr) : 19;
                                          const geschaeftspartner = prompt("Geschäftspartner (optional):");

                                          buchungAusPositionMutation.mutate({
                                            positionId: position.id,
                                            sachkonto,
                                            gegenkonto,
                                            steuersatz,
                                            geschaeftspartner: geschaeftspartner || undefined,
                                          });
                                        }}
                                        title="Neue Buchung aus Position erstellen"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => ignorierenMutation.mutate({ positionId: position.id })}
                                        title="Position ignorieren"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  {position.status === "zugeordnet" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        zuordnungAufhebenMutation.mutate({ positionId: position.id })
                                      }
                                      title="Zuordnung aufheben"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CSV Import Dialog */}
        <Dialog open={csvImportDialogOpen} onOpenChange={setCsvImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>CSV importieren</DialogTitle>
              <DialogDescription>
                Sparkasse Rottal-Inn CSV-Datei hochladen und Positionen automatisch importieren
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV-Datei auswählen</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Datei zu groß (max. 5MB)");
                        return;
                      }
                      setCsvFile(file);
                    }
                  }}
                />
                {csvFile && (
                  <p className="text-sm text-muted-foreground">
                    📄 {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium mb-1">ℹ️ Hinweis:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Nur Sparkasse-Format wird unterstützt</li>
                  <li>Duplikate werden automatisch übersprungen</li>
                  <li>Encoding: ISO-8859-1 oder UTF-8</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCsvImportDialogOpen(false);
                  setCsvFile(null);
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={async () => {
                  if (!csvFile || !selectedAuszug) return;

                  setImporting(true);
                  try {
                    // Datei als ArrayBuffer lesen (wichtig für binäre Encodings)
                    const arrayBuffer = await csvFile.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    // Zu Base64 konvertieren
                    let binaryString = '';
                    for (let i = 0; i < uint8Array.length; i++) {
                      binaryString += String.fromCharCode(uint8Array[i]);
                    }
                    const base64 = btoa(binaryString);

                    // Import starten
                    importCSVMutation.mutate({
                      auszugId: selectedAuszug,
                      csvBase64: base64,
                    });
                  } catch (error) {
                    toast.error("Fehler beim Lesen der Datei");
                    console.error(error);
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={!csvFile || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird importiert...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Importieren
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Zuordnung Dialog */}
        <Dialog open={zuordnungDialogOpen} onOpenChange={setZuordnungDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buchung zuordnen</DialogTitle>
              <DialogDescription>
                {selectedPosition && (
                  <>
                    Position: {selectedPosition.buchungstext} • {formatCurrency(selectedPosition.betrag)} € •{" "}
                    {formatDate(selectedPosition.datum)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!passendeBuchungen || passendeBuchungen.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Keine passenden Buchungen gefunden</p>
                  <p className="text-sm">
                    Versuchen Sie, die Buchung manuell zu erfassen oder passen Sie den Zeitraum an
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Beleg</TableHead>
                      <TableHead>Geschäftspartner</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead>Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passendeBuchungen.map((buchung) => (
                      <TableRow key={buchung.id}>
                        <TableCell>{formatDate(buchung.belegdatum)}</TableCell>
                        <TableCell className="font-mono text-sm">{buchung.belegnummer}</TableCell>
                        <TableCell>{buchung.geschaeftspartner}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(parseFloat(buchung.bruttobetrag.toString()))} €
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (selectedPosition) {
                                zuordnenMutation.mutate({
                                  positionId: selectedPosition.id,
                                  buchungId: buchung.id,
                                });
                              }
                            }}
                            disabled={zuordnenMutation.isPending}
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            Zuordnen
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setZuordnungDialogOpen(false);
                  setSelectedPosition(null);
                }}
              >
                Schließen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
