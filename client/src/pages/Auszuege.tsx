import { useState, useCallback } from "react";
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
  const { data: auszugDetail, refetch: refetchDetail } = trpc.auszuege.getById.useQuery(
    { id: selectedAuszug! },
    { enabled: !!selectedAuszug }
  );
  const { data: passendeBuchungen } = trpc.auszuege.findePassendeBuchungen.useQuery(
    { positionId: selectedPosition?.id },
    { enabled: !!selectedPosition }
  );

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
        kontoId: uploadKontoId ? parseInt(uploadKontoId) : undefined,
        kontoBezeichnung: uploadKontoBezeichnung || undefined,
        dateiBase64: base64,
        dateiname: uploadedFile.name,
        zeitraumVon: uploadZeitraumVon,
        zeitraumBis: uploadZeitraumBis,
        saldoAnfang: uploadSaldoAnfang || undefined,
        saldoEnde: uploadSaldoEnde || undefined,
        waehrung: "EUR",
      });
    } catch (error) {
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAuszug(auszug.id);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
          <DialogContent className="max-w-2xl">
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

        {/* Detail Dialog - wird im nächsten Teil implementiert */}
      </main>
    </div>
  );
}
