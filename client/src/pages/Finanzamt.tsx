import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit,
  Calendar,
  Euro,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Gavel,
  Mail,
  Search,
  Filter,
  Download,
  Upload,
  Building2,
  Loader2
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";

// Dokumenttypen
const DOKUMENT_TYPEN = [
  { value: "schriftverkehr", label: "Schriftverkehr", icon: Mail },
  { value: "bescheid", label: "Bescheid", icon: FileText },
  { value: "einspruch", label: "Einspruch", icon: Gavel },
  { value: "mahnung", label: "Mahnung", icon: AlertTriangle },
  { value: "anfrage", label: "Anfrage", icon: Search },
  { value: "pruefung", label: "Betriebsprüfung", icon: FileWarning },
  { value: "sonstiges", label: "Sonstiges", icon: FileText },
];

const STEUERARTEN = [
  { value: "USt", label: "Umsatzsteuer" },
  { value: "ESt", label: "Einkommensteuer" },
  { value: "KSt", label: "Körperschaftsteuer" },
  { value: "GewSt", label: "Gewerbesteuer" },
  { value: "LSt", label: "Lohnsteuer" },
  { value: "KapESt", label: "Kapitalertragsteuer" },
  { value: "sonstige", label: "Sonstige" },
];

const STATUS_OPTIONEN = [
  { value: "neu", label: "Neu", color: "bg-blue-100 text-blue-800" },
  { value: "in_bearbeitung", label: "In Bearbeitung", color: "bg-amber-100 text-amber-800" },
  { value: "einspruch", label: "Einspruch eingelegt", color: "bg-purple-100 text-purple-800" },
  { value: "erledigt", label: "Erledigt", color: "bg-green-100 text-green-800" },
  { value: "archiviert", label: "Archiviert", color: "bg-gray-100 text-gray-800" },
];

interface NeuesDokumentForm {
  dokumentTyp: string;
  steuerart: string;
  steuerjahr: string;
  aktenzeichen: string;
  betreff: string;
  beschreibung: string;
  eingangsdatum: string;
  frist: string;
  betrag: string;
  zahlungsfrist: string;
  dateiUrl: string;
  dateiName: string;
}

export default function Finanzamt() {
  const { user } = useAuth();
  // Hole die ausgewählte Unternehmens-ID aus dem LocalStorage
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    return saved ? parseInt(saved) : null;
  });

  // Aktualisiere selectedUnternehmenId wenn sich LocalStorage ändert
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("selectedUnternehmenId");
      setSelectedUnternehmenId(saved ? parseInt(saved) : null);
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    const checkStorage = () => {
      const saved = localStorage.getItem("selectedUnternehmenId");
      const newId = saved ? parseInt(saved) : null;
      if (newId !== selectedUnternehmenId) {
        setSelectedUnternehmenId(newId);
      }
    };
    
    const interval = setInterval(checkStorage, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedUnternehmenId]);
  const [filterTyp, setFilterTyp] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<string>("alle");
  const [filterSteuerart, setFilterSteuerart] = useState<string>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortierung, setSortierung] = useState<string>("datum_desc");
  const [gruppierung, setGruppierung] = useState<string>("keine");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [neuesDokument, setNeuesDokument] = useState<NeuesDokumentForm>({
    dokumentTyp: "bescheid",
    steuerart: "",
    steuerjahr: new Date().getFullYear().toString(),
    aktenzeichen: "",
    betreff: "",
    beschreibung: "",
    eingangsdatum: new Date().toISOString().split("T")[0],
    frist: "",
    betrag: "",
    zahlungsfrist: "",
    dateiUrl: "",
    dateiName: "",
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [selectedDokumentId, setSelectedDokumentId] = useState<number | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [neueVersion, setNeueVersion] = useState({
    versionTyp: "antwort" as const,
    betreff: "",
    beschreibung: "",
    datum: new Date().toISOString().split("T")[0],
    dateiUrl: "",
    dateiName: "",
  });

  // Unternehmen laden
  const { data: unternehmenList } = trpc.unternehmen.list.useQuery();
  
  // Dokumente laden
  const { data: dokumente, refetch: refetchDokumente } = trpc.finanzamt.list.useQuery(
    { 
      unternehmenId: selectedUnternehmenId!,
      dokumentTyp: filterTyp !== "alle" ? filterTyp as any : undefined,
      status: filterStatus !== "alle" ? filterStatus as any : undefined,
      steuerart: filterSteuerart !== "alle" ? filterSteuerart as any : undefined,
    },
    { enabled: !!selectedUnternehmenId }
  );

  // Statistiken laden
  const { data: statistiken } = trpc.finanzamt.statistiken.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Mutations
  const createMutation = trpc.finanzamt.create.useMutation({
    onSuccess: () => {
      toast.success("Dokument erfolgreich angelegt");
      refetchDokumente();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.finanzamt.update.useMutation({
    onSuccess: () => {
      toast.success("Status aktualisiert");
      refetchDokumente();
    },
  });

  const deleteMutation = trpc.finanzamt.delete.useMutation({
    onSuccess: () => {
      toast.success("Dokument gelöscht");
      refetchDokumente();
    },
  });

  const uploadMutation = trpc.finanzamt.uploadDatei.useMutation({
    onSuccess: (data) => {
      setNeuesDokument(prev => ({
        ...prev,
        dateiUrl: data.url,
        dateiName: data.dateiName,
      }));
      setPreviewUrl(data.url);
      setUploadingFile(false);
      toast.success(`Datei "${data.dateiName}" hochgeladen`);
    },
    onError: (error) => {
      toast.error(`Upload fehlgeschlagen: ${error.message}`);
      setUploadingFile(false);
    },
  });

  // OCR-Analyse Mutation
  const ocrMutation = trpc.finanzamt.ocrAnalyse.useMutation({
    onSuccess: (data) => {
      setOcrLoading(false);
      if (data.fehler) {
        toast.error(`OCR-Fehler: ${data.fehler}`);
        return;
      }
      // Übernehme erkannte Daten ins Formular
      setNeuesDokument(prev => ({
        ...prev,
        dokumentTyp: data.dokumentTyp || prev.dokumentTyp,
        steuerart: data.steuerart || prev.steuerart,
        aktenzeichen: data.aktenzeichen || prev.aktenzeichen,
        steuerjahr: data.steuerjahr?.toString() || prev.steuerjahr,
        betreff: data.betreff || prev.betreff,
        betrag: data.betrag?.toString() || prev.betrag,
        frist: data.frist || prev.frist,
        zahlungsfrist: data.zahlungsfrist || prev.zahlungsfrist,
        eingangsdatum: data.eingangsdatum || prev.eingangsdatum,
        beschreibung: data.zusammenfassung || prev.beschreibung,
      }));
      toast.success("Dokument analysiert - Daten übernommen");
    },
    onError: (error) => {
      setOcrLoading(false);
      toast.error(`OCR-Fehler: ${error.message}`);
    },
  });

  // Versionen laden
  const { data: versionen, refetch: refetchVersionen } = trpc.finanzamt.versionen.useQuery(
    { dokumentId: selectedDokumentId! },
    { enabled: !!selectedDokumentId }
  );

  // Version hinzufügen Mutation
  const addVersionMutation = trpc.finanzamt.addVersion.useMutation({
    onSuccess: () => {
      toast.success("Version hinzugefügt");
      refetchVersionen();
      setVersionDialogOpen(false);
      setNeueVersion({
        versionTyp: "antwort",
        betreff: "",
        beschreibung: "",
        datum: new Date().toISOString().split("T")[0],
        dateiUrl: "",
        dateiName: "",
      });
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setNeuesDokument({
      dokumentTyp: "bescheid",
      steuerart: "",
      steuerjahr: new Date().getFullYear().toString(),
      aktenzeichen: "",
      betreff: "",
      beschreibung: "",
      eingangsdatum: new Date().toISOString().split("T")[0],
      frist: "",
      betrag: "",
      zahlungsfrist: "",
      dateiUrl: "",
      dateiName: "",
    });
    setPreviewUrl(null);
    setDragActive(false);
  };

  // Datei verarbeiten (für Input und Drag&Drop)
  const processFile = async (file: File) => {
    if (!selectedUnternehmenId) {
      toast.error("Bitte zuerst ein Unternehmen auswählen");
      return;
    }

    setUploadingFile(true);
    
    // Lokale Vorschau für Bilder und PDFs
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    
    if (isImage) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
    }

    try {
      // Konvertiere zu Base64 für S3-Upload
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        uploadMutation.mutate({
          unternehmenId: selectedUnternehmenId,
          dateiName: file.name,
          dateiBase64: base64,
          contentType: file.type,
        });
      };
      reader.onerror = () => {
        toast.error("Fehler beim Lesen der Datei");
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Fehler beim Hochladen");
      setUploadingFile(false);
    }
  };

  // Datei-Upload Handler (Input)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Drag & Drop Handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // OCR-Analyse starten
  const startOcrAnalyse = () => {
    if (!neuesDokument.dateiUrl) {
      toast.error("Bitte zuerst eine Datei hochladen");
      return;
    }
    setOcrLoading(true);
    // Verwende die bereits hochgeladene Base64-Datei oder lade sie neu
    // Da wir die URL haben, müssen wir die Datei erneut als Base64 senden
    // Für OCR verwenden wir die previewUrl oder laden die Datei neu
    if (previewUrl) {
      ocrMutation.mutate({
        dateiBase64: previewUrl,
        contentType: neuesDokument.dateiName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      });
    } else {
      toast.error("Keine Vorschau verfügbar für OCR");
      setOcrLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleCreate = () => {
    if (!selectedUnternehmenId) return;
    if (!neuesDokument.betreff) {
      toast.error("Bitte Betreff eingeben");
      return;
    }

    createMutation.mutate({
      unternehmenId: selectedUnternehmenId,
      dokumentTyp: neuesDokument.dokumentTyp as any,
      steuerart: neuesDokument.steuerart ? neuesDokument.steuerart as any : undefined,
      steuerjahr: neuesDokument.steuerjahr ? parseInt(neuesDokument.steuerjahr) : undefined,
      aktenzeichen: neuesDokument.aktenzeichen || undefined,
      betreff: neuesDokument.betreff,
      beschreibung: neuesDokument.beschreibung || undefined,
      eingangsdatum: neuesDokument.eingangsdatum,
      frist: neuesDokument.frist || undefined,
      betrag: neuesDokument.betrag ? parseFloat(neuesDokument.betrag.replace(",", ".")) : undefined,
      zahlungsfrist: neuesDokument.zahlungsfrist || undefined,
      dateiUrl: neuesDokument.dateiUrl || undefined,
      dateiName: neuesDokument.dateiName || undefined,
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, status: status as any });
  };

  const handleDelete = (id: number) => {
    if (confirm("Dokument wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Gefilterte Dokumente
  const filteredDokumente = (dokumente?.filter(d => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return d.betreff.toLowerCase().includes(query) || 
             d.aktenzeichen?.toLowerCase().includes(query) ||
             d.beschreibung?.toLowerCase().includes(query);
    }
    return true;
  }) || []).sort((a, b) => {
    // Sortierung anwenden
    switch (sortierung) {
      case "datum_desc":
        return new Date(b.eingangsdatum).getTime() - new Date(a.eingangsdatum).getTime();
      case "datum_asc":
        return new Date(a.eingangsdatum).getTime() - new Date(b.eingangsdatum).getTime();
      case "aktenzeichen_asc":
        return (a.aktenzeichen || "").localeCompare(b.aktenzeichen || "");
      case "aktenzeichen_desc":
        return (b.aktenzeichen || "").localeCompare(a.aktenzeichen || "");
      case "steuerjahr_desc":
        return (b.steuerjahr || 0) - (a.steuerjahr || 0);
      case "steuerjahr_asc":
        return (a.steuerjahr || 0) - (b.steuerjahr || 0);
      case "betrag_desc":
        return parseFloat(b.betrag || "0") - parseFloat(a.betrag || "0");
      case "betrag_asc":
        return parseFloat(a.betrag || "0") - parseFloat(b.betrag || "0");
      default:
        return 0;
    }
  });

  // Gruppierte Dokumente
  const gruppierteDokumente = (() => {
    if (gruppierung === "steuerart") {
      return STEUERARTEN.map(s => ({
        key: s.value,
        label: s.label,
        dokumente: filteredDokumente.filter(d => d.steuerart === s.value)
      })).filter(g => g.dokumente.length > 0);
    } else if (gruppierung === "steuerjahr") {
      // Alle einzigartigen Steuerjahre sammeln und absteigend sortieren
      const jahre = Array.from(new Set(filteredDokumente.map(d => d.steuerjahr).filter(Boolean))) as number[];
      jahre.sort((a, b) => b - a);
      const ohneJahr = filteredDokumente.filter(d => !d.steuerjahr);
      const result = jahre.map(jahr => ({
        key: String(jahr),
        label: `Steuerjahr ${jahr}`,
        dokumente: filteredDokumente.filter(d => d.steuerjahr === jahr)
      }));
      if (ohneJahr.length > 0) {
        result.push({ key: "ohne", label: "Ohne Steuerjahr", dokumente: ohneJahr });
      }
      return result;
    } else if (gruppierung === "dokumenttyp") {
      return DOKUMENT_TYPEN.map(t => ({
        key: t.value,
        label: t.label,
        dokumente: filteredDokumente.filter(d => d.dokumentTyp === t.value)
      })).filter(g => g.dokumente.length > 0);
    }
    return null;
  })();

  // Prüfe ob Frist überfällig
  const isFristUeberfaellig = (frist: Date | string | null, status: string) => {
    if (!frist || status === "erledigt" || status === "archiviert") return false;
    return new Date(frist) < new Date();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Finanzamt
            </h1>
            <p className="text-muted-foreground">Schriftverkehr, Bescheide und Einsprüche verwalten</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedUnternehmenId}>
                <Plus className="w-4 h-4 mr-2" />
                Neues Dokument
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Neues Finanzamt-Dokument</DialogTitle>
                <DialogDescription>
                  Erfassen Sie ein neues Dokument vom oder an das Finanzamt
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Dokumenttyp</Label>
                  <Select 
                    value={neuesDokument.dokumentTyp} 
                    onValueChange={(v) => setNeuesDokument({...neuesDokument, dokumentTyp: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOKUMENT_TYPEN.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <t.icon className="w-4 h-4" />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Steuerart</Label>
                  <Select 
                    value={neuesDokument.steuerart} 
                    onValueChange={(v) => setNeuesDokument({...neuesDokument, steuerart: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STEUERARTEN.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Steuerjahr</Label>
                  <Input 
                    type="number" 
                    value={neuesDokument.steuerjahr}
                    onChange={(e) => setNeuesDokument({...neuesDokument, steuerjahr: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Aktenzeichen</Label>
                  <Input 
                    placeholder="z.B. 123/456/78901"
                    value={neuesDokument.aktenzeichen}
                    onChange={(e) => setNeuesDokument({...neuesDokument, aktenzeichen: e.target.value})}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Betreff *</Label>
                  <Input 
                    placeholder="z.B. Umsatzsteuerbescheid 2024"
                    value={neuesDokument.betreff}
                    onChange={(e) => setNeuesDokument({...neuesDokument, betreff: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Eingangsdatum</Label>
                  <Input 
                    type="date"
                    value={neuesDokument.eingangsdatum}
                    onChange={(e) => setNeuesDokument({...neuesDokument, eingangsdatum: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frist (z.B. Einspruchsfrist)</Label>
                  <Input 
                    type="date"
                    value={neuesDokument.frist}
                    onChange={(e) => setNeuesDokument({...neuesDokument, frist: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Betrag (€)</Label>
                  <Input 
                    placeholder="0,00"
                    value={neuesDokument.betrag}
                    onChange={(e) => setNeuesDokument({...neuesDokument, betrag: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Zahlungsfrist</Label>
                  <Input 
                    type="date"
                    value={neuesDokument.zahlungsfrist}
                    onChange={(e) => setNeuesDokument({...neuesDokument, zahlungsfrist: e.target.value})}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Beschreibung/Notizen</Label>
                  <Textarea 
                    placeholder="Weitere Details..."
                    value={neuesDokument.beschreibung}
                    onChange={(e) => setNeuesDokument({...neuesDokument, beschreibung: e.target.value})}
                    rows={3}
                  />
                </div>

                {/* Datei-Upload mit Drag & Drop */}
                <div className="space-y-2 col-span-2">
                  <Label>Dokument anhängen</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                      ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                      ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input 
                      id="file-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                    {uploadingFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                      </div>
                    ) : dragActive ? (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-primary" />
                        <p className="text-sm font-medium text-primary">Datei hier ablegen</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Datei hierher ziehen oder <span className="text-primary font-medium">klicken</span>
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC (max. 10MB)</p>
                      </div>
                    )}
                  </div>

                  {/* Vorschau und hochgeladene Datei */}
                  {neuesDokument.dateiName && (
                    <div className="mt-3 border rounded-lg overflow-hidden">
                      {/* Vorschau für Bilder */}
                      {previewUrl && (neuesDokument.dateiName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                        <div className="bg-gray-100 p-2">
                          <img 
                            src={previewUrl} 
                            alt="Vorschau" 
                            className="max-h-40 mx-auto object-contain rounded"
                          />
                        </div>
                      )}
                      {/* Vorschau für PDFs */}
                      {previewUrl && neuesDokument.dateiName.endsWith('.pdf') && (
                        <div className="bg-gray-100">
                          <iframe 
                            src={previewUrl} 
                            className="w-full h-48 border-0"
                            title="PDF Vorschau"
                          />
                        </div>
                      )}
                      {/* Datei-Info */}
                      <div className="flex items-center gap-2 p-3 bg-green-50">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium flex-1">{neuesDokument.dateiName}</span>
                        {/* OCR-Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            startOcrAnalyse();
                          }}
                          disabled={ocrLoading}
                        >
                          {ocrLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Search className="w-3 h-3 mr-1" />
                              OCR
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNeuesDokument({...neuesDokument, dateiUrl: "", dateiName: ""});
                            setPreviewUrl(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {/* OCR-Hinweis */}
                      {!ocrLoading && (
                        <div className="px-3 pb-2 text-xs text-muted-foreground">
                          Klicken Sie auf "OCR" um Aktenzeichen, Beträge und Fristen automatisch zu erkennen
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Anlegen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {!selectedUnternehmenId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Bitte wählen Sie ein Unternehmen aus</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Statistik-Karten */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gesamt</p>
                      <p className="text-2xl font-bold">{statistiken?.gesamt || 0}</p>
                    </div>
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Offen</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {(statistiken?.neu || 0) + (statistiken?.inBearbeitung || 0)}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Überfällige Fristen</p>
                      <p className="text-2xl font-bold text-red-600">{statistiken?.ueberfaelligeFristen || 0}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Einsprüche</p>
                      <p className="text-2xl font-bold text-purple-600">{statistiken?.einsprueche || 0}</p>
                    </div>
                    <Gavel className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Suchen..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Select value={filterTyp} onValueChange={setFilterTyp}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Dokumenttyp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Typen</SelectItem>
                      {DOKUMENT_TYPEN.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Status</SelectItem>
                      {STATUS_OPTIONEN.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterSteuerart} onValueChange={setFilterSteuerart}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Steuerart" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Steuerarten</SelectItem>
                      {STEUERARTEN.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sortierung und Gruppierung */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sortieren:</span>
                    <Select value={sortierung} onValueChange={setSortierung}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="datum_desc">Datum (neueste zuerst)</SelectItem>
                        <SelectItem value="datum_asc">Datum (älteste zuerst)</SelectItem>
                        <SelectItem value="aktenzeichen_asc">Aktenzeichen (A-Z)</SelectItem>
                        <SelectItem value="aktenzeichen_desc">Aktenzeichen (Z-A)</SelectItem>
                        <SelectItem value="steuerjahr_desc">Steuerjahr (neuestes)</SelectItem>
                        <SelectItem value="steuerjahr_asc">Steuerjahr (ältestes)</SelectItem>
                        <SelectItem value="betrag_desc">Betrag (höchster)</SelectItem>
                        <SelectItem value="betrag_asc">Betrag (niedrigster)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Gruppieren:</span>
                    <Select value={gruppierung} onValueChange={setGruppierung}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keine">Keine Gruppierung</SelectItem>
                        <SelectItem value="steuerart">Nach Steuerart</SelectItem>
                        <SelectItem value="steuerjahr">Nach Steuerjahr</SelectItem>
                        <SelectItem value="dokumenttyp">Nach Dokumententyp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dokumente-Liste */}
            <div className="space-y-4">
              {filteredDokumente.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Keine Dokumente gefunden</p>
                  </CardContent>
                </Card>
              ) : gruppierteDokumente ? (
                // Gruppierte Ansicht nach Steuerart
                gruppierteDokumente.map((gruppe) => (
                  <div key={gruppe.key} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Euro className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">{gruppe.label}</h3>
                      <Badge variant="secondary">{gruppe.dokumente.length}</Badge>
                    </div>
                    <div className="space-y-3 pl-7">
                      {gruppe.dokumente.map((dok) => {
                        const typInfo = DOKUMENT_TYPEN.find(t => t.value === dok.dokumentTyp);
                        const statusInfo = STATUS_OPTIONEN.find(s => s.value === dok.status);
                        const TypeIcon = typInfo?.icon || FileText;
                        const ueberfaellig = isFristUeberfaellig(dok.frist, dok.status);

                        return (
                          <Card key={dok.id} className={`${ueberfaellig ? "border-red-300 bg-red-50/50" : ""}`}>
                            <CardContent className="py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <TypeIcon className={`w-5 h-5 ${
                                    dok.dokumentTyp === "bescheid" ? "text-blue-600" :
                                    dok.dokumentTyp === "einspruch" ? "text-purple-600" :
                                    dok.dokumentTyp === "mahnung" ? "text-red-600" :
                                    "text-gray-600"
                                  }`} />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{dok.betreff}</span>
                                      {ueberfaellig && (
                                        <Badge variant="destructive" className="text-xs">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Überfällig
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {dok.aktenzeichen && <span>Az: {dok.aktenzeichen} • </span>}
                                      {dok.steuerjahr && <span>Jahr {dok.steuerjahr} • </span>}
                                      {new Date(dok.eingangsdatum).toLocaleDateString('de-DE')}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {dok.betrag && (
                                    <span className="font-medium text-primary">
                                      {parseFloat(dok.betrag).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                    </span>
                                  )}
                                  <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                // Normale Liste
                filteredDokumente.map((dok) => {
                  const typInfo = DOKUMENT_TYPEN.find(t => t.value === dok.dokumentTyp);
                  const statusInfo = STATUS_OPTIONEN.find(s => s.value === dok.status);
                  const TypeIcon = typInfo?.icon || FileText;
                  const ueberfaellig = isFristUeberfaellig(dok.frist, dok.status);

                  return (
                    <Card key={dok.id} className={ueberfaellig ? "border-red-300 bg-red-50/50" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${
                              dok.dokumentTyp === "bescheid" ? "bg-blue-100" :
                              dok.dokumentTyp === "einspruch" ? "bg-purple-100" :
                              dok.dokumentTyp === "mahnung" ? "bg-red-100" :
                              "bg-gray-100"
                            }`}>
                              <TypeIcon className={`w-6 h-6 ${
                                dok.dokumentTyp === "bescheid" ? "text-blue-600" :
                                dok.dokumentTyp === "einspruch" ? "text-purple-600" :
                                dok.dokumentTyp === "mahnung" ? "text-red-600" :
                                "text-gray-600"
                              }`} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{dok.betreff}</h3>
                                {ueberfaellig && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Überfällig!
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                                {dok.steuerart && (
                                  <span className="flex items-center gap-1">
                                    <Euro className="w-3 h-3" />
                                    {STEUERARTEN.find(s => s.value === dok.steuerart)?.label}
                                  </span>
                                )}
                                {dok.steuerjahr && (
                                  <span>• Jahr {dok.steuerjahr}</span>
                                )}
                                {dok.aktenzeichen && (
                                  <span>• Az: {dok.aktenzeichen}</span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(dok.eingangsdatum).toLocaleDateString('de-DE')}
                                </span>
                              </div>

                              {dok.beschreibung && (
                                <p className="text-sm text-muted-foreground mb-2">{dok.beschreibung}</p>
                              )}

                              <div className="flex flex-wrap gap-3 text-sm">
                                {dok.betrag && (
                                  <span className="font-medium text-primary">
                                    {parseFloat(dok.betrag).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                                  </span>
                                )}
                                {dok.frist && (
                                  <span className={`flex items-center gap-1 ${ueberfaellig ? "text-red-600 font-medium" : ""}`}>
                                    <Clock className="w-3 h-3" />
                                    Frist: {new Date(dok.frist).toLocaleDateString('de-DE')}
                                  </span>
                                )}
                                {dok.zahlungsfrist && (
                                  <span className="flex items-center gap-1">
                                    <Euro className="w-3 h-3" />
                                    Zahlung bis: {new Date(dok.zahlungsfrist).toLocaleDateString('de-DE')}
                                  </span>
                                )}
                              </div>

                              {/* Datei-Anzeige */}
                              {dok.dateiName && dok.dateiUrl && (
                                <div className="mt-3 flex items-center gap-2">
                                  <a 
                                    href={dok.dateiUrl} 
                                    download={dok.dateiName}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    {dok.dateiName}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Select 
                              value={dok.status} 
                              onValueChange={(v) => handleStatusChange(dok.id, v)}
                            >
                              <SelectTrigger className={`w-[160px] ${statusInfo?.color}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONEN.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Versionierung-Button */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedDokumentId(dok.id);
                                setVersionDialogOpen(true);
                              }}
                              className="text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Version
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(dok.id)}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Versionierung Dialog */}
        <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Neue Version hinzufügen</DialogTitle>
              <DialogDescription>
                Fügen Sie eine neue Version zu diesem Dokument hinzu (z.B. Einspruch, Antwort, Ergänzung)
              </DialogDescription>
            </DialogHeader>

            {/* Bestehende Versionen anzeigen */}
            {versionen && versionen.length > 0 && (
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Bisherige Versionen:</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {versionen.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                      <Badge variant="outline" className="text-xs">
                        V{v.version}
                      </Badge>
                      <span className="capitalize">{v.versionTyp.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{new Date(v.datum).toLocaleDateString('de-DE')}</span>
                      {v.dateiName && (
                        <a href={v.dateiUrl} download={v.dateiName} className="text-blue-600 hover:underline ml-auto">
                          <Download className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Versionstyp</Label>
                <Select 
                  value={neueVersion.versionTyp} 
                  onValueChange={(v: any) => setNeueVersion({...neueVersion, versionTyp: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einspruch">Einspruch</SelectItem>
                    <SelectItem value="antwort">Antwort vom Finanzamt</SelectItem>
                    <SelectItem value="ergaenzung">Ergänzung/Nachtrag</SelectItem>
                    <SelectItem value="korrektur">Korrigierte Version</SelectItem>
                    <SelectItem value="anlage">Anlage/Anhang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Betreff</Label>
                <Input 
                  placeholder="z.B. Einspruch gegen Bescheid vom..."
                  value={neueVersion.betreff}
                  onChange={(e) => setNeueVersion({...neueVersion, betreff: e.target.value})}
                />
              </div>

              <div>
                <Label>Datum</Label>
                <Input 
                  type="date"
                  value={neueVersion.datum}
                  onChange={(e) => setNeueVersion({...neueVersion, datum: e.target.value})}
                />
              </div>

              <div>
                <Label>Beschreibung</Label>
                <Textarea 
                  placeholder="Weitere Details..."
                  value={neueVersion.beschreibung}
                  onChange={(e) => setNeueVersion({...neueVersion, beschreibung: e.target.value})}
                  rows={2}
                />
              </div>

              {/* Datei-Upload für Version */}
              <div>
                <Label>Dokument anhängen</Label>
                <Input 
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedUnternehmenId) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const base64 = reader.result as string;
                        uploadMutation.mutate({
                          unternehmenId: selectedUnternehmenId,
                          dateiName: file.name,
                          dateiBase64: base64,
                          contentType: file.type,
                        }, {
                          onSuccess: (data) => {
                            setNeueVersion(prev => ({
                              ...prev,
                              dateiUrl: data.url,
                              dateiName: data.dateiName,
                            }));
                          }
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {neueVersion.dateiName && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {neueVersion.dateiName}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setVersionDialogOpen(false)}>Abbrechen</Button>
              <Button 
                onClick={() => {
                  if (selectedDokumentId) {
                    addVersionMutation.mutate({
                      dokumentId: selectedDokumentId,
                      versionTyp: neueVersion.versionTyp,
                      betreff: neueVersion.betreff || undefined,
                      beschreibung: neueVersion.beschreibung || undefined,
                      datum: neueVersion.datum,
                      dateiUrl: neueVersion.dateiUrl || undefined,
                      dateiName: neueVersion.dateiName || undefined,
                    });
                  }
                }}
                disabled={addVersionMutation.isPending}
              >
                {addVersionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Version hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
