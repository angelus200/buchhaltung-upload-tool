import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  CheckCircle2,
  XCircle,
  Edit,
  Loader2,
  FileText,
  TrendingUp,
  AlertCircle,
  Download,
  Sparkles,
  Upload,
} from "lucide-react";

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

const CONFIDENCE_LEVELS = {
  high: { min: 0.8, label: "Hohe Qualität", color: "bg-green-100 text-green-800" },
  medium: { min: 0.5, label: "Mittlere Qualität", color: "bg-yellow-100 text-yellow-800" },
  low: { min: 0, label: "Niedrige Qualität", color: "bg-red-100 text-red-800" },
};

function getConfidenceLevel(confidence: number) {
  if (confidence >= 0.8) return CONFIDENCE_LEVELS.high;
  if (confidence >= 0.5) return CONFIDENCE_LEVELS.medium;
  return CONFIDENCE_LEVELS.low;
}

export default function Buchungsvorschlaege() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    return saved ? parseInt(saved) : null;
  });
  const [filterStatus, setFilterStatus] = useState<string>("vorschlag");
  const [filterMinConfidence, setFilterMinConfidence] = useState<number>(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVorschlag, setSelectedVorschlag] = useState<any>(null);

  // Formular für Bearbeitung
  const [editForm, setEditForm] = useState({
    sollKonto: "",
    habenKonto: "",
    buchungstext: "",
    betragNetto: "",
    betragBrutto: "",
  });

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();

  const { data: vorschlaege = [], refetch: refetchVorschlaege } = trpc.buchungsvorschlaege.list.useQuery(
    {
      unternehmenId: selectedUnternehmen!,
      status: filterStatus as any,
      minConfidence: filterMinConfidence > 0 ? filterMinConfidence : undefined,
    },
    { enabled: !!selectedUnternehmen }
  );

  const { data: stats } = trpc.buchungsvorschlaege.stats.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  // Auto-select Unternehmen
  useEffect(() => {
    if (unternehmen && unternehmen.length > 0 && !selectedUnternehmen) {
      const savedId = localStorage.getItem("selectedUnternehmenId");
      if (savedId) {
        const id = parseInt(savedId);
        const exists = unternehmen.find((u) => u.unternehmen.id === id);
        if (exists) {
          setSelectedUnternehmen(id);
          return;
        }
      }
      setSelectedUnternehmen(unternehmen[0].unternehmen.id);
    }
  }, [unternehmen, selectedUnternehmen]);

  // Mutations
  const acceptMutation = trpc.buchungsvorschlaege.accept.useMutation({
    onSuccess: () => {
      toast.success("Buchung erstellt");
      refetchVorschlaege();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const rejectMutation = trpc.buchungsvorschlaege.reject.useMutation({
    onSuccess: () => {
      toast.success("Vorschlag abgelehnt");
      refetchVorschlaege();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.buchungsvorschlaege.update.useMutation({
    onSuccess: () => {
      toast.success("Vorschlag aktualisiert");
      refetchVorschlaege();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const createFromBelegMutation = trpc.buchungsvorschlaege.createFromBeleg.useMutation({
    onSuccess: (data) => {
      const confidencePercent = (data.confidence * 100).toFixed(0);
      toast.success(`Buchungsvorschlag erstellt (Confidence: ${confidencePercent}%)`);
      refetchVorschlaege();
      setUploading(false);
      setUploadedFileName(null);
    },
    onError: (error) => {
      toast.error(`Fehler beim Analysieren: ${error.message}`);
      setUploading(false);
      setUploadedFileName(null);
    },
  });

  // Upload Handler
  const onDrop = async (acceptedFiles: File[]) => {
    if (!selectedUnternehmen) {
      toast.error("Bitte zuerst ein Unternehmen auswählen");
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadedFileName(file.name);
    setUploading(true);

    try {
      // Konvertiere zu Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Rufe createFromBeleg API auf
      createFromBelegMutation.mutate({
        unternehmenId: selectedUnternehmen,
        imageBase64: base64,
        mimeType: file.type,
      });
    } catch (error) {
      toast.error("Fehler beim Lesen der Datei");
      setUploading(false);
      setUploadedFileName(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: uploading || !selectedUnternehmen,
  });

  const handleEdit = (vorschlag: any) => {
    setSelectedVorschlag(vorschlag);
    setEditForm({
      sollKonto: vorschlag.sollKonto || "",
      habenKonto: vorschlag.habenKonto || "",
      buchungstext: vorschlag.buchungstext || "",
      betragNetto: vorschlag.betragNetto?.toString() || "",
      betragBrutto: vorschlag.betragBrutto?.toString() || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedVorschlag) return;

    updateMutation.mutate({
      id: selectedVorschlag.id,
      sollKonto: editForm.sollKonto,
      habenKonto: editForm.habenKonto,
      buchungstext: editForm.buchungstext,
      betragNetto: editForm.betragNetto,
      betragBrutto: editForm.betragBrutto,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Buchungsvorschläge" subtitle="KI-gestützte Buchungsvorschläge aus Belegen" />

      <main className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Select
              value={selectedUnternehmen?.toString() || ""}
              onValueChange={(value) => {
                setSelectedUnternehmen(parseInt(value));
                localStorage.setItem("selectedUnternehmenId", value);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Firma wählen" />
              </SelectTrigger>
              <SelectContent>
                {unternehmen?.map((u) => (
                  <SelectItem key={u.unternehmen.id} value={u.unternehmen.id.toString()}>
                    {u.unternehmen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedUnternehmen && (
          <>
            {/* Statistik-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Offene Vorschläge</CardDescription>
                  <CardTitle className="text-3xl">{stats?.offen || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Hohe Qualität</CardDescription>
                  <CardTitle className="text-3xl text-green-600">{stats?.hocheQualitaet || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Akzeptiert</CardDescription>
                  <CardTitle className="text-3xl text-blue-600">{stats?.akzeptiert || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Abgelehnt</CardDescription>
                  <CardTitle className="text-3xl text-red-600">{stats?.abgelehnt || 0}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Beleg Upload */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Beleg hochladen
                </CardTitle>
                <CardDescription>
                  Laden Sie Rechnungen oder Belege hoch, um automatische Buchungsvorschläge zu erhalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                    ${uploading || !selectedUnternehmen ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <div>
                        <p className="text-sm font-medium">Analysiere Beleg mit AI...</p>
                        {uploadedFileName && (
                          <p className="text-xs text-muted-foreground mt-1">{uploadedFileName}</p>
                        )}
                      </div>
                    </div>
                  ) : !selectedUnternehmen ? (
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Bitte wählen Sie zuerst ein Unternehmen aus
                      </p>
                    </div>
                  ) : isDragActive ? (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-10 h-10 text-primary" />
                      <p className="text-sm font-medium text-primary">Beleg hier ablegen</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Beleg hierher ziehen oder <span className="text-primary font-medium">klicken zum Auswählen</span>
                      </p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max. 10MB)</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filter */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vorschlag">Offen</SelectItem>
                        <SelectItem value="akzeptiert">Akzeptiert</SelectItem>
                        <SelectItem value="abgelehnt">Abgelehnt</SelectItem>
                        <SelectItem value="alle">Alle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Min. Qualität</Label>
                    <Select value={filterMinConfidence.toString()} onValueChange={(v) => setFilterMinConfidence(parseFloat(v))}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Alle</SelectItem>
                        <SelectItem value="0.5">≥ 50%</SelectItem>
                        <SelectItem value="0.8">≥ 80% (Hoch)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vorschläge-Liste */}
            {vorschlaege.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Keine Buchungsvorschläge gefunden.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Laden Sie Belege hoch, um automatische Vorschläge zu erhalten.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {vorschlaege.map((vorschlag) => {
                  const confidence = parseFloat(vorschlag.confidence?.toString() || "0");
                  const confidenceLevel = getConfidenceLevel(confidence);

                  return (
                    <Card key={vorschlag.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-6">
                          {/* Beleg-Vorschau */}
                          <div className="flex-shrink-0">
                            {vorschlag.belegUrl ? (
                              <a
                                href={vorschlag.belegUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-32 h-32 border rounded-lg overflow-hidden bg-slate-100 hover:opacity-80"
                              >
                                <img
                                  src={vorschlag.belegUrl}
                                  alt="Beleg"
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ) : (
                              <div className="w-32 h-32 border rounded-lg flex items-center justify-center bg-slate-100">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{vorschlag.lieferant || "Unbekannter Lieferant"}</h3>
                                  <Badge className={confidenceLevel.color}>
                                    {Math.round(confidence * 100)}% Qualität
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {vorschlag.rechnungsnummer && `Rechnung ${vorschlag.rechnungsnummer} • `}
                                  {vorschlag.belegdatum && formatDate(vorschlag.belegdatum)}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Brutto</p>
                                <p className="font-medium">{formatCurrency(vorschlag.betragBrutto || 0)} €</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Netto</p>
                                <p className="font-medium">{formatCurrency(vorschlag.betragNetto || 0)} €</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">USt</p>
                                <p className="font-medium">{vorschlag.ustSatz || 0}%</p>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="mb-4">
                              <h4 className="font-semibold mb-2">Vorgeschlagene Buchung:</h4>
                              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-muted-foreground">Soll:</span>{" "}
                                    <span className="font-mono">{vorschlag.sollKonto}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Haben:</span>{" "}
                                    <span className="font-mono">{vorschlag.habenKonto}</span>
                                  </div>
                                </div>
                                <p className="mt-2">{vorschlag.buchungstext}</p>
                              </div>
                            </div>

                            {vorschlag.aiNotizen && (
                              <div className="mb-4">
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <AlertCircle className="w-4 h-4 mt-0.5" />
                                  <p>{vorschlag.aiNotizen}</p>
                                </div>
                              </div>
                            )}

                            {/* Aktionen */}
                            {vorschlag.status === "vorschlag" && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => acceptMutation.mutate({ id: vorschlag.id })}
                                  disabled={acceptMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {acceptMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                  )}
                                  Akzeptieren
                                </Button>
                                <Button variant="outline" onClick={() => handleEdit(vorschlag)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Bearbeiten
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => rejectMutation.mutate({ id: vorschlag.id })}
                                  disabled={rejectMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Ablehnen
                                </Button>
                              </div>
                            )}

                            {vorschlag.status === "akzeptiert" && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Akzeptiert
                              </Badge>
                            )}

                            {vorschlag.status === "abgelehnt" && (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Abgelehnt
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bearbeiten-Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buchungsvorschlag bearbeiten</DialogTitle>
            <DialogDescription>Passen Sie die Buchungsparameter an</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Soll-Konto</Label>
                <Input
                  value={editForm.sollKonto}
                  onChange={(e) => setEditForm({ ...editForm, sollKonto: e.target.value })}
                  placeholder="z.B. 6815"
                />
              </div>
              <div>
                <Label>Haben-Konto</Label>
                <Input
                  value={editForm.habenKonto}
                  onChange={(e) => setEditForm({ ...editForm, habenKonto: e.target.value })}
                  placeholder="z.B. 0620"
                />
              </div>
            </div>

            <div>
              <Label>Buchungstext</Label>
              <Input
                value={editForm.buchungstext}
                onChange={(e) => setEditForm({ ...editForm, buchungstext: e.target.value })}
                placeholder="Beschreibung der Buchung"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nettobetrag</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.betragNetto}
                  onChange={(e) => setEditForm({ ...editForm, betragNetto: e.target.value })}
                />
              </div>
              <div>
                <Label>Bruttobetrag</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.betragBrutto}
                  onChange={(e) => setEditForm({ ...editForm, betragBrutto: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
