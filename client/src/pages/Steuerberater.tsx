import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  Send, 
  FileText, 
  Calendar, 
  Euro, 
  Plus, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Trash2,
  Eye,
  Upload,
  Mail,
  Cloud,
  Building,
  Package,
  Filter,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Image,
  File
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";

// Übergabearten
const UEBERGABEARTEN = [
  { value: "datev_export", label: "DATEV-Export", icon: Download },
  { value: "email", label: "Per E-Mail", icon: Mail },
  { value: "portal", label: "Steuerberater-Portal", icon: Cloud },
  { value: "persoenlich", label: "Persönliche Übergabe", icon: Building },
  { value: "post", label: "Per Post", icon: Package },
  { value: "cloud", label: "Cloud-Speicher", icon: Cloud },
  { value: "sonstig", label: "Sonstige", icon: FileText },
];

// Status-Optionen
const STATUS_OPTIONEN = [
  { value: "vorbereitet", label: "Vorbereitet", color: "bg-gray-100 text-gray-800" },
  { value: "uebergeben", label: "Übergeben", color: "bg-blue-100 text-blue-800" },
  { value: "bestaetigt", label: "Bestätigt", color: "bg-green-100 text-green-800" },
  { value: "rueckfrage", label: "Rückfrage", color: "bg-amber-100 text-amber-800" },
  { value: "abgeschlossen", label: "Abgeschlossen", color: "bg-emerald-100 text-emerald-800" },
];

export default function Steuerberater() {
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUebergabe, setSelectedUebergabe] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  // Tab-State: "übergaben" oder "rechnungen" oder "analyse"
  const [activeTab, setActiveTab] = useState<"uebergaben" | "rechnungen" | "analyse">("uebergaben");
  
  // Rechnungen-State
  const [rechnungDialogOpen, setRechnungDialogOpen] = useState(false);
  const [rechnungDetailDialogOpen, setRechnungDetailDialogOpen] = useState(false);
  const [selectedRechnung, setSelectedRechnung] = useState<number | null>(null);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  
  const [neueRechnung, setNeueRechnung] = useState({
    rechnungsnummer: "",
    rechnungsdatum: new Date().toISOString().split("T")[0],
    zeitraumVon: "",
    zeitraumBis: "",
    nettobetrag: "",
    steuersatz: "19.00",
    bruttobetrag: "",
    beschreibung: "",
  });

  // Upload-State für Rechnungsdokument
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // 🔥 FALLBACK: Automatische Analyse beim File-Upload (useEffect)
  // Falls onChange aus irgendeinem Grund nicht triggert
  useEffect(() => {
    console.log("🔥 useEffect TRIGGERED - uploadedFile changed:", uploadedFile);
    if (uploadedFile && !analyzing) {
      console.log("🔥 Starting automatic analysis via useEffect...");
      console.log("🔥 File:", uploadedFile.name, "Type:", uploadedFile.type, "Size:", uploadedFile.size);
      analyzeUploadedFile(uploadedFile);
    } else if (!uploadedFile) {
      console.log("🔥 No file uploaded yet");
    } else if (analyzing) {
      console.log("🔥 Analysis already running, skipping...");
    }
  }, [uploadedFile]);

  const [neuePosition, setNeuePosition] = useState({
    beschreibung: "",
    kategorie: "sonstig",
    bewertung: "unklar",
    vermeidbarUrsache: "",
    menge: "1",
    einzelpreis: "",
    gesamtpreis: "",
  });
  
  // Formular-State
  const [neueUebergabe, setNeueUebergabe] = useState({
    bezeichnung: "",
    beschreibung: "",
    uebergabeart: "datev_export" as const,
    zeitraumVon: "",
    zeitraumBis: "",
    uebergabedatum: new Date().toISOString().split("T")[0],
  });

  // Unternehmen aus LocalStorage laden
  useEffect(() => {
    const stored = localStorage.getItem("selectedUnternehmenId");
    if (stored) {
      setSelectedUnternehmenId(parseInt(stored));
    }
  }, []);

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();
  const { data: uebergaben, refetch: refetchUebergaben } = trpc.steuerberater.list.useQuery(
    { unternehmenId: selectedUnternehmenId!, status: filterStatus === "alle" ? undefined : filterStatus || undefined },
    { enabled: !!selectedUnternehmenId }
  );
  const { data: statistiken } = trpc.steuerberater.statistiken.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );
  const { data: uebergabeDetail } = trpc.steuerberater.getById.useQuery(
    { id: selectedUebergabe! },
    { enabled: !!selectedUebergabe }
  );
  
  // Rechnungen-Queries
  const { data: rechnungen, refetch: refetchRechnungen } = trpc.steuerberater.rechnungenList.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );
  const { data: rechnungDetail, refetch: refetchRechnungDetail } = trpc.steuerberater.rechnungGetById.useQuery(
    { id: selectedRechnung! },
    { enabled: !!selectedRechnung }
  );
  const { data: rechnungenStatistiken } = trpc.steuerberater.rechnungenStatistiken.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );
  const { data: aufwandsAnalyse } = trpc.steuerberater.aufwandsAnalyse.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );
  const { data: jahresvergleich } = trpc.steuerberater.jahresvergleich.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Mutations
  const createMutation = trpc.steuerberater.create.useMutation({
    onSuccess: () => {
      refetchUebergaben();
      setDialogOpen(false);
      resetForm();
    },
  });
  const updateMutation = trpc.steuerberater.update.useMutation({
    onSuccess: () => {
      refetchUebergaben();
    },
  });
  const deleteMutation = trpc.steuerberater.delete.useMutation({
    onSuccess: () => {
      refetchUebergaben();
      setDetailDialogOpen(false);
    },
  });
  
  // Rechnungen-Mutations
  const createRechnungMutation = trpc.steuerberater.rechnungCreate.useMutation({
    onSuccess: () => {
      refetchRechnungen();
      setRechnungDialogOpen(false);
      resetRechnungForm();
    },
  });
  const deleteRechnungMutation = trpc.steuerberater.rechnungDelete.useMutation({
    onSuccess: () => {
      refetchRechnungen();
      setRechnungDetailDialogOpen(false);
    },
  });
  const addPositionMutation = trpc.steuerberater.rechnungAddPosition.useMutation({
    onSuccess: () => {
      refetchRechnungDetail();
      setPositionDialogOpen(false);
      resetPositionForm();
    },
  });
  const deletePositionMutation = trpc.steuerberater.rechnungDeletePosition.useMutation({
    onSuccess: () => {
      refetchRechnungDetail();
    },
  });

  // OCR Mutations
  const ocrMutation = trpc.ocr.analyzeImage.useMutation();
  const pdfOcrMutation = trpc.ocr.analyzePdf.useMutation();

  // Automatische AI-Analyse beim Datei-Upload
  const analyzeUploadedFile = async (file: File) => {
    console.log("🚀 analyzeUploadedFile FUNCTION CALLED!");
    console.log("🚀 Received file:", file);

    if (!file) {
      console.error("🚀 NO FILE! Returning...");
      return;
    }

    console.log("🚀 File OK, checking type...");
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    console.log("🚀 isPdf:", isPdf, "| isImage:", isImage, "| file.type:", file.type);

    if (!isPdf && !isImage) {
      console.warn("🚀 Datei-Typ nicht unterstützt:", file.type);
      console.warn("🚀 EXITING - unsupported file type");
      return; // Nur PDFs und Bilder analysieren
    }

    console.log("🔍 Starte AI-Analyse für:", file.name, "Typ:", file.type);
    console.log("🔍 Calling setAnalyzing(true)...");
    setAnalyzing(true);
    console.log("🔍 analyzing state set to true");

    try {
      // Datei zu Base64 konvertieren
      console.log("📄 Konvertiere Datei zu Base64...");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1]; // Entferne Data-URL-Prefix
          console.log("✅ Base64-Konvertierung erfolgreich, Größe:", base64Data.length, "Zeichen");
          resolve(base64Data);
        };
        reader.onerror = (error) => {
          console.error("❌ FileReader Fehler:", error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });

      // Wähle die richtige OCR-Methode
      console.log("🤖 Starte OCR-API-Call...");
      let result;
      if (isPdf) {
        console.log("📋 Verwende PDF-OCR...");
        result = await pdfOcrMutation.mutateAsync({
          pdfBase64: base64,
          kontenrahmen: "SKR04",
        });
      } else {
        console.log("🖼️ Verwende Bild-OCR...");
        result = await ocrMutation.mutateAsync({
          imageBase64: base64,
          mimeType: file.type,
          kontenrahmen: "SKR04",
        });
      }

      console.log("✅ OCR-Ergebnis (RAW):", JSON.stringify(result, null, 2));

      // Felder mit erkannten Daten füllen
      const updates: any = {};
      let updateCount = 0;

      console.log("🔍 Prüfe Felder:");
      console.log("  - belegnummer:", result.belegnummer, "→", !!result.belegnummer);
      console.log("  - belegdatum:", result.belegdatum, "→", !!result.belegdatum);
      console.log("  - nettobetrag:", result.nettobetrag, "→", result.nettobetrag && result.nettobetrag > 0);
      console.log("  - bruttobetrag:", result.bruttobetrag, "→", result.bruttobetrag && result.bruttobetrag > 0);
      console.log("  - steuersatz:", result.steuersatz, "→", result.steuersatz && result.steuersatz > 0);
      console.log("  - geschaeftspartner:", result.geschaeftspartner, "→", !!result.geschaeftspartner);

      if (result.belegnummer) {
        updates.rechnungsnummer = result.belegnummer;
        updateCount++;
        console.log("  ✅ Setze rechnungsnummer:", result.belegnummer);
      }
      if (result.belegdatum) {
        updates.rechnungsdatum = result.belegdatum;
        updateCount++;
        console.log("  ✅ Setze rechnungsdatum:", result.belegdatum);
      }
      if (result.nettobetrag != null && result.nettobetrag >= 0) {
        updates.nettobetrag = result.nettobetrag.toFixed(2);
        updateCount++;
        console.log("  ✅ Setze nettobetrag:", result.nettobetrag.toFixed(2));
      } else {
        console.log("  ⚠️ Nettobetrag NICHT gesetzt:", result.nettobetrag);
      }
      if (result.bruttobetrag != null && result.bruttobetrag >= 0) {
        updates.bruttobetrag = result.bruttobetrag.toFixed(2);
        updateCount++;
        console.log("  ✅ Setze bruttobetrag:", result.bruttobetrag.toFixed(2));
      } else {
        console.log("  ⚠️ Bruttobetrag NICHT gesetzt:", result.bruttobetrag);
      }
      if (result.steuersatz != null && result.steuersatz >= 0) {
        updates.steuersatz = result.steuersatz.toFixed(2);
        updateCount++;
        console.log("  ✅ Setze steuersatz:", result.steuersatz.toFixed(2));
      } else {
        console.log("  ⚠️ Steuersatz NICHT gesetzt:", result.steuersatz);
      }
      if (result.geschaeftspartner) {
        updates.beschreibung = `Rechnung von ${result.geschaeftspartner}`;
        updateCount++;
        console.log("  ✅ Setze beschreibung:", updates.beschreibung);
      }

      console.log("📦 Updates-Objekt:", JSON.stringify(updates, null, 2));
      console.log("🔢 Update Count:", updateCount);

      if (updateCount > 0) {
        console.log("🔄 Rufe setNeueRechnung auf mit updates:", updates);
        setNeueRechnung((prev) => {
          const newState = {
            ...prev,
            ...updates,
          };
          console.log("📝 Neuer State:", JSON.stringify(newState, null, 2));
          return newState;
        });

        console.log("✅ Felder aktualisiert:", updates);

        // Erfolgs-Toast
        const toast = await import("sonner");
        toast.toast.success(
          `AI-Analyse erfolgreich: ${updateCount} Feld(er) erkannt`,
          {
            description: `Konfidenz: ${result.konfidenz}%`,
            duration: 5000,
          }
        );
      } else {
        console.warn("⚠️ Keine Felder erkannt");
        const toast = await import("sonner");
        toast.toast.warning(
          "Keine Daten automatisch erkannt",
          {
            description: "Bitte füllen Sie die Felder manuell aus",
            duration: 5000,
          }
        );
      }
    } catch (error) {
      console.error("❌ AI-Analyse fehlgeschlagen:", error);
      const toast = await import("sonner");
      toast.toast.error(
        "Fehler bei der AI-Analyse",
        {
          description: error instanceof Error ? error.message : "Unbekannter Fehler",
          duration: 5000,
        }
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setNeueUebergabe({
      bezeichnung: "",
      beschreibung: "",
      uebergabeart: "datev_export",
      zeitraumVon: "",
      zeitraumBis: "",
      uebergabedatum: new Date().toISOString().split("T")[0],
    });
  };

  const resetRechnungForm = () => {
    setNeueRechnung({
      rechnungsnummer: "",
      rechnungsdatum: new Date().toISOString().split("T")[0],
      zeitraumVon: "",
      zeitraumBis: "",
      nettobetrag: "",
      steuersatz: "19.00",
      bruttobetrag: "",
      beschreibung: "",
    });
    setUploadedFile(null);
  };
  
  const resetPositionForm = () => {
    setNeuePosition({
      beschreibung: "",
      kategorie: "sonstig",
      bewertung: "unklar",
      vermeidbarUrsache: "",
      menge: "1",
      einzelpreis: "",
      gesamtpreis: "",
    });
  };
  
  const handleCreateRechnung = async () => {
    if (!selectedUnternehmenId || !neueRechnung.rechnungsnummer || !neueRechnung.nettobetrag) return;

    setUploading(true);
    try {
      let dateiBase64: string | undefined;
      let dateiName: string | undefined;

      // Upload Datei falls vorhanden
      if (uploadedFile) {
        // Konvertiere zu base64
        dateiBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        dateiName = uploadedFile.name;
      }

      createRechnungMutation.mutate({
        unternehmenId: selectedUnternehmenId,
        rechnungsnummer: neueRechnung.rechnungsnummer,
        rechnungsdatum: neueRechnung.rechnungsdatum,
        zeitraumVon: neueRechnung.zeitraumVon || undefined,
        zeitraumBis: neueRechnung.zeitraumBis || undefined,
        nettobetrag: neueRechnung.nettobetrag,
        steuersatz: neueRechnung.steuersatz,
        bruttobetrag: neueRechnung.bruttobetrag || (parseFloat(neueRechnung.nettobetrag) * 1.19).toFixed(2),
        beschreibung: neueRechnung.beschreibung || undefined,
        dateiBase64,
        dateiName,
      });
    } catch (error) {
      console.error("Upload fehlgeschlagen:", error);
    } finally {
      setUploading(false);
    }
  };
  
  const handleAddPosition = () => {
    if (!selectedRechnung || !neuePosition.beschreibung || !neuePosition.einzelpreis) return;
    
    const gesamtpreis = (parseFloat(neuePosition.menge || "1") * parseFloat(neuePosition.einzelpreis)).toFixed(2);
    
    addPositionMutation.mutate({
      rechnungId: selectedRechnung,
      beschreibung: neuePosition.beschreibung,
      kategorie: neuePosition.kategorie,
      bewertung: neuePosition.bewertung,
      vermeidbarUrsache: neuePosition.vermeidbarUrsache || undefined,
      menge: neuePosition.menge,
      einzelpreis: neuePosition.einzelpreis,
      gesamtpreis,
    });
  };
  
  // Bidirektionale Berechnung: Netto <-> Brutto
  const updateBruttobetrag = (netto: string, steuersatz: string) => {
    if (netto && parseFloat(netto) > 0) {
      const nettoNum = parseFloat(netto);
      const steuerNum = parseFloat(steuersatz);
      const brutto = nettoNum * (1 + steuerNum / 100);
      setNeueRechnung((prev) => ({ ...prev, bruttobetrag: brutto.toFixed(2) }));
    }
  };

  const updateNettobetrag = (brutto: string, steuersatz: string) => {
    if (brutto && parseFloat(brutto) > 0) {
      const bruttoNum = parseFloat(brutto);
      const steuerNum = parseFloat(steuersatz);
      const netto = bruttoNum / (1 + steuerNum / 100);
      setNeueRechnung((prev) => ({ ...prev, nettobetrag: netto.toFixed(2) }));
    }
  };

  const handleCreate = () => {
    if (!selectedUnternehmenId || !neueUebergabe.bezeichnung) return;
    
    createMutation.mutate({
      unternehmenId: selectedUnternehmenId,
      bezeichnung: neueUebergabe.bezeichnung,
      beschreibung: neueUebergabe.beschreibung || undefined,
      uebergabeart: neueUebergabe.uebergabeart,
      zeitraumVon: neueUebergabe.zeitraumVon || undefined,
      zeitraumBis: neueUebergabe.zeitraumBis || undefined,
      uebergabedatum: neueUebergabe.uebergabedatum,
    });
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateMutation.mutate({
      id,
      status: newStatus as "vorbereitet" | "uebergeben" | "bestaetigt" | "rueckfrage" | "abgeschlossen",
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("de-DE");
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return "0,00 €";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(parseFloat(amount.toString()));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header mit Unternehmen-Auswahl */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send className="w-6 h-6 text-primary" />
              Steuerberater-Übergaben
            </h1>
            <p className="text-muted-foreground">
              Dokumentation der Datenübergaben an den Steuerberater
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={selectedUnternehmenId?.toString() || ""}
              onValueChange={(v) => {
                setSelectedUnternehmenId(parseInt(v));
                localStorage.setItem("selectedUnternehmenId", v);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Unternehmen auswählen" />
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
        
        {/* Tab-Navigation */}
        {selectedUnternehmenId && (
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab("uebergaben")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "uebergaben"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Übergaben
            </button>
            <button
              onClick={() => setActiveTab("rechnungen")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "rechnungen"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Rechnungen
            </button>
            <button
              onClick={() => setActiveTab("analyse")}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === "analyse"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Aufwands-Analyse
            </button>
          </div>
        )}
        
        {/* Tab-spezifische Aktionen */}
        {selectedUnternehmenId && (
          <div className="flex items-center gap-3 mb-6">
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedUnternehmenId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Übergabe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Neue Übergabe erfassen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Bezeichnung *</Label>
                    <Input
                      value={neueUebergabe.bezeichnung}
                      onChange={(e) => setNeueUebergabe({ ...neueUebergabe, bezeichnung: e.target.value })}
                      placeholder="z.B. Monatsabschluss Januar 2025"
                    />
                  </div>
                  
                  <div>
                    <Label>Übergabeart</Label>
                    <Select
                      value={neueUebergabe.uebergabeart}
                      onValueChange={(v) => setNeueUebergabe({ ...neueUebergabe, uebergabeart: v as typeof neueUebergabe.uebergabeart })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UEBERGABEARTEN.map((art) => (
                          <SelectItem key={art.value} value={art.value}>
                            {art.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Zeitraum von</Label>
                      <Input
                        type="date"
                        value={neueUebergabe.zeitraumVon}
                        onChange={(e) => setNeueUebergabe({ ...neueUebergabe, zeitraumVon: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Zeitraum bis</Label>
                      <Input
                        type="date"
                        value={neueUebergabe.zeitraumBis}
                        onChange={(e) => setNeueUebergabe({ ...neueUebergabe, zeitraumBis: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Übergabedatum *</Label>
                    <Input
                      type="date"
                      value={neueUebergabe.uebergabedatum}
                      onChange={(e) => setNeueUebergabe({ ...neueUebergabe, uebergabedatum: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label>Beschreibung / Notizen</Label>
                    <Textarea
                      value={neueUebergabe.beschreibung}
                      onChange={(e) => setNeueUebergabe({ ...neueUebergabe, beschreibung: e.target.value })}
                      placeholder="Optionale Notizen zur Übergabe..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleCreate} disabled={!neueUebergabe.bezeichnung || createMutation.isPending}>
                    {createMutation.isPending ? "Wird erstellt..." : "Übergabe erstellen"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {!selectedUnternehmenId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Bitte wählen Sie ein Unternehmen aus, um die Steuerberater-Übergaben zu verwalten.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Übergaben-Tab */}
            {activeTab === "uebergaben" && (
              <>
                {/* Statistiken */}
                {statistiken && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Gesamt</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.gesamt}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">Vorbereitet</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.vorbereitet}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Übergeben</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.uebergeben}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-muted-foreground">Rückfragen</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.rueckfragen}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-muted-foreground">Abgeschlossen</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.abgeschlossen}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Gesamtbetrag</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(statistiken.gesamtBetrag)}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Status</SelectItem>
                    {STATUS_OPTIONEN.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchUebergaben()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Aktualisieren
              </Button>
            </div>

            {/* Übergaben-Liste */}
            <div className="space-y-4">
              {!uebergaben || uebergaben.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Noch keine Übergaben erfasst. Erstellen Sie eine neue Übergabe.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                uebergaben.map((uebergabe) => {
                  const artInfo = UEBERGABEARTEN.find(a => a.value === uebergabe.uebergabeart);
                  const statusInfo = STATUS_OPTIONEN.find(s => s.value === uebergabe.status);
                  const ArtIcon = artInfo?.icon || FileText;
                  
                  return (
                    <Card key={uebergabe.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <ArtIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{uebergabe.bezeichnung}</span>
                                <Badge className={statusInfo?.color}>
                                  {statusInfo?.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(uebergabe.uebergabedatum)}
                                </span>
                                {uebergabe.zeitraumVon && uebergabe.zeitraumBis && (
                                  <span>
                                    Zeitraum: {formatDate(uebergabe.zeitraumVon)} - {formatDate(uebergabe.zeitraumBis)}
                                  </span>
                                )}
                                <span>{artInfo?.label}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {uebergabe.anzahlBuchungen || 0} Buchungen
                              </div>
                              <div className="font-semibold">
                                {formatCurrency(uebergabe.gesamtbetrag)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Select
                                value={uebergabe.status}
                                onValueChange={(v) => handleStatusChange(uebergabe.id, v)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONEN.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUebergabe(uebergabe.id);
                                  setDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {uebergabe.rueckfragen && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-800 font-medium text-sm mb-1">
                              <AlertTriangle className="w-4 h-4" />
                              Rückfrage vom Steuerberater
                            </div>
                            <p className="text-sm text-amber-700">{uebergabe.rueckfragen}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
              </>
            )}
            
            {/* Rechnungen-Tab */}
            {activeTab === "rechnungen" && (
              <div className="space-y-6">
                {/* Rechnungen-Statistiken */}
                {rechnungenStatistiken && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Rechnungen</span>
                        </div>
                        <p className="text-2xl font-bold">{rechnungenStatistiken.gesamt}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Euro className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Gesamtkosten</span>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(rechnungenStatistiken.gesamtBetrag)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Offen</span>
                        </div>
                        <p className="text-lg font-bold text-amber-600">{rechnungenStatistiken.offen}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Bezahlt</span>
                        </div>
                        <p className="text-lg font-bold text-green-600">{rechnungenStatistiken.bezahlt}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {/* Neue Rechnung Button */}
                <div className="flex justify-end">
                  <Dialog open={rechnungDialogOpen} onOpenChange={setRechnungDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Rechnung
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Steuerberater-Rechnung erfassen</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Rechnungsnummer *</Label>
                            <Input
                              value={neueRechnung.rechnungsnummer}
                              onChange={(e) => setNeueRechnung({ ...neueRechnung, rechnungsnummer: e.target.value })}
                              placeholder="z.B. 2025-001"
                            />
                          </div>
                          <div>
                            <Label>Rechnungsdatum *</Label>
                            <Input
                              type="date"
                              value={neueRechnung.rechnungsdatum}
                              onChange={(e) => setNeueRechnung({ ...neueRechnung, rechnungsdatum: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Zeitraum von</Label>
                            <Input
                              type="date"
                              value={neueRechnung.zeitraumVon}
                              onChange={(e) => setNeueRechnung({ ...neueRechnung, zeitraumVon: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Zeitraum bis</Label>
                            <Input
                              type="date"
                              value={neueRechnung.zeitraumBis}
                              onChange={(e) => setNeueRechnung({ ...neueRechnung, zeitraumBis: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Nettobetrag *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={neueRechnung.nettobetrag}
                              onChange={(e) => {
                                setNeueRechnung({ ...neueRechnung, nettobetrag: e.target.value });
                                updateBruttobetrag(e.target.value, neueRechnung.steuersatz);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>MwSt %</Label>
                            <Select
                              value={neueRechnung.steuersatz}
                              onValueChange={(v) => {
                                setNeueRechnung({ ...neueRechnung, steuersatz: v });
                                // Intelligente Neuberechnung: Wenn Netto vorhanden, berechne Brutto
                                // Ansonsten wenn Brutto vorhanden, berechne Netto
                                if (neueRechnung.nettobetrag && parseFloat(neueRechnung.nettobetrag) > 0) {
                                  updateBruttobetrag(neueRechnung.nettobetrag, v);
                                } else if (neueRechnung.bruttobetrag && parseFloat(neueRechnung.bruttobetrag) > 0) {
                                  updateNettobetrag(neueRechnung.bruttobetrag, v);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="19.00">19%</SelectItem>
                                <SelectItem value="7.00">7%</SelectItem>
                                <SelectItem value="0.00">0%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Bruttobetrag</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={neueRechnung.bruttobetrag}
                              onChange={(e) => {
                                setNeueRechnung({ ...neueRechnung, bruttobetrag: e.target.value });
                                // Automatische Rückrechnung zu Netto
                                updateNettobetrag(e.target.value, neueRechnung.steuersatz);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Beschreibung</Label>
                          <Textarea
                            value={neueRechnung.beschreibung}
                            onChange={(e) => setNeueRechnung({ ...neueRechnung, beschreibung: e.target.value })}
                            placeholder="Optionale Notizen..."
                            rows={2}
                          />
                        </div>

                        {/* Dokument-Upload */}
                        <div className="border-2 border-dashed border-muted rounded-lg p-4">
                          <Label className="flex items-center gap-2 mb-2">
                            <Upload className="w-4 h-4" />
                            Rechnungsdokument hochladen (optional)
                          </Label>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              console.log("🎯 FILE UPLOAD TRIGGERED!");
                              console.log("🎯 Event:", e);
                              console.log("🎯 Files:", e.target.files);
                              const file = e.target.files?.[0];
                              console.log("🎯 Selected File:", file);
                              if (file) {
                                console.log("🎯 File Details:", {
                                  name: file.name,
                                  type: file.type,
                                  size: file.size,
                                });
                                console.log("🎯 Calling setUploadedFile...");
                                setUploadedFile(file);
                                console.log("🎯 Calling analyzeUploadedFile...");
                                // Starte automatische AI-Analyse
                                analyzeUploadedFile(file);
                                console.log("🎯 analyzeUploadedFile called!");
                              } else {
                                console.warn("🎯 NO FILE SELECTED!");
                              }
                            }}
                            className="cursor-pointer"
                            disabled={analyzing}
                          />
                          {analyzing && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Analysiere Rechnung mit AI...</span>
                            </div>
                          )}
                          {uploadedFile && !analyzing && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <File className="w-4 h-4" />
                              <span>{uploadedFile.name}</span>
                              <span className="text-xs">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadedFile(null)}
                                className="ml-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Unterstützte Formate: PDF, JPG, PNG (max. 10 MB)
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRechnungDialogOpen(false)}>
                          Abbrechen
                        </Button>
                        <Button onClick={handleCreateRechnung} disabled={!neueRechnung.rechnungsnummer || !neueRechnung.nettobetrag || createRechnungMutation.isPending || uploading}>
                          {uploading ? "Lädt hoch..." : createRechnungMutation.isPending ? "Wird erstellt..." : "Rechnung erfassen"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Rechnungen-Liste */}
                <div className="space-y-4">
                  {!rechnungen || rechnungen.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Noch keine Steuerberater-Rechnungen erfasst.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    rechnungen.map((rechnung) => (
                      <Card key={rechnung.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                        setSelectedRechnung(rechnung.id);
                        setRechnungDetailDialogOpen(true);
                      }}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{rechnung.rechnungsnummer}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(rechnung.rechnungsdatum)}
                                {rechnung.zeitraumVon && ` | Zeitraum: ${formatDate(rechnung.zeitraumVon)} - ${formatDate(rechnung.zeitraumBis)}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">{formatCurrency(rechnung.bruttobetrag)}</p>
                              <p className="text-sm text-muted-foreground">Details anzeigen</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Analyse-Tab */}
            {activeTab === "analyse" && (
              <div className="space-y-6">
                {aufwandsAnalyse && (
                  <>
                    {/* Zusammenfassung */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Aufwands-Analyse</CardTitle>
                        <CardDescription>Bewertung der Steuerberater-Kosten nach Notwendigkeit</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground">Gesamtkosten</p>
                            <p className="text-2xl font-bold">{formatCurrency(aufwandsAnalyse.gesamtkosten)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Notwendige Kosten</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(aufwandsAnalyse.gesamtkosten - (aufwandsAnalyse.vermeidbareKosten || 0))}</p>
                            <p className="text-xs text-muted-foreground">{(100 - (aufwandsAnalyse.vermeidbarkeitsquote || 0)).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Vermeidbare Kosten</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(aufwandsAnalyse.vermeidbareKosten)}</p>
                            <p className="text-xs text-muted-foreground">{aufwandsAnalyse.vermeidbarkeitsquote?.toFixed(1) || '0'}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Einsparpotenzial</p>
                            <p className="text-2xl font-bold text-amber-600">{formatCurrency(aufwandsAnalyse.vermeidbareKosten)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Empfehlungen */}
                    {aufwandsAnalyse.empfehlungen && aufwandsAnalyse.empfehlungen.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Empfehlungen zur Kostenreduktion</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {aufwandsAnalyse.empfehlungen.map((empfehlung: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{empfehlung}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Kosten nach Kategorie */}
                    {aufwandsAnalyse.kostenNachKategorie && aufwandsAnalyse.kostenNachKategorie.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Kosten nach Kategorie</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(aufwandsAnalyse.kostenNachKategorie as Record<string, number>).map(([kategorie, summe]) => (
                              <div key={kategorie} className="flex items-center justify-between">
                                <span className="capitalize">{kategorie.replace(/_/g, " ")}</span>
                                <span className="font-semibold">{formatCurrency(summe)}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
                
                {/* Jahresvergleich */}
                {jahresvergleich && jahresvergleich.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Jahresvergleich</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Jahr</th>
                              <th className="text-right py-2">Rechnungen</th>
                              <th className="text-right py-2">Gesamtkosten</th>
                              <th className="text-right py-2">Notwendig</th>
                              <th className="text-right py-2">Vermeidbar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jahresvergleich.map((jahr) => (
                              <tr key={jahr.jahr} className="border-b">
                                <td className="py-2 font-medium">{jahr.jahr}</td>
                                <td className="text-right py-2">{jahr.anzahl}</td>
                                <td className="text-right py-2">{formatCurrency(jahr.kosten)}</td>
                                <td className="text-right py-2 text-green-600">-</td>
                                <td className="text-right py-2 text-red-600">-</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Rechnungs-Detail-Dialog */}
      <Dialog open={rechnungDetailDialogOpen} onOpenChange={setRechnungDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Rechnung {rechnungDetail?.rechnung?.rechnungsnummer}</DialogTitle>
          </DialogHeader>
          {rechnungDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Rechnungsdatum</Label>
                  <p>{formatDate(rechnungDetail.rechnung?.rechnungsdatum)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Netto</Label>
                  <p>{formatCurrency(rechnungDetail.rechnung?.nettobetrag)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Brutto</Label>
                  <p className="font-semibold">{formatCurrency(rechnungDetail.rechnung?.bruttobetrag)}</p>
                </div>
              </div>

              {/* Dokument-Download */}
              {rechnungDetail.rechnung?.dateiUrl && (
                <div className="border border-dashed border-muted rounded-lg p-3 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                      <File className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {rechnungDetail.rechnung?.dateiName || "Rechnungsdokument"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hochgeladenes Dokument
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = rechnungDetail.rechnung?.dateiUrl;
                        if (url) {
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Öffnen
                    </Button>
                  </div>
                </div>
              )}

              {/* Positionen */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-muted-foreground">Leistungspositionen</Label>
                  <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Position
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Leistungsposition hinzufügen</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Beschreibung *</Label>
                          <Input
                            value={neuePosition.beschreibung}
                            onChange={(e) => setNeuePosition({ ...neuePosition, beschreibung: e.target.value })}
                            placeholder="z.B. Buchführung Januar"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Kategorie</Label>
                            <Select
                              value={neuePosition.kategorie}
                              onValueChange={(v) => setNeuePosition({ ...neuePosition, kategorie: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="buchfuehrung">Buchführung</SelectItem>
                                <SelectItem value="jahresabschluss">Jahresabschluss</SelectItem>
                                <SelectItem value="steuererklaerung">Steuererklärung</SelectItem>
                                <SelectItem value="beratung">Beratung</SelectItem>
                                <SelectItem value="korrektur">Korrektur</SelectItem>
                                <SelectItem value="nachfrage">Nachfrage/Rückfrage</SelectItem>
                                <SelectItem value="sonstig">Sonstige</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Bewertung</Label>
                            <Select
                              value={neuePosition.bewertung}
                              onValueChange={(v) => setNeuePosition({ ...neuePosition, bewertung: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="notwendig">Notwendig</SelectItem>
                                <SelectItem value="vermeidbar">Vermeidbar</SelectItem>
                                <SelectItem value="unklar">Unklar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {neuePosition.bewertung === "vermeidbar" && (
                          <div>
                            <Label>Ursache der Vermeidbarkeit</Label>
                            <Textarea
                              value={neuePosition.vermeidbarUrsache}
                              onChange={(e) => setNeuePosition({ ...neuePosition, vermeidbarUrsache: e.target.value })}
                              placeholder="z.B. Fehlende Belege, unvollständige Unterlagen..."
                              rows={2}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Menge</Label>
                            <Input
                              type="number"
                              value={neuePosition.menge}
                              onChange={(e) => setNeuePosition({ ...neuePosition, menge: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Einzelpreis *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={neuePosition.einzelpreis}
                              onChange={(e) => setNeuePosition({ ...neuePosition, einzelpreis: e.target.value })}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Gesamt</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(parseFloat(neuePosition.menge || "1") * parseFloat(neuePosition.einzelpreis || "0")).toFixed(2)}
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPositionDialogOpen(false)}>
                          Abbrechen
                        </Button>
                        <Button onClick={handleAddPosition} disabled={!neuePosition.beschreibung || !neuePosition.einzelpreis || addPositionMutation.isPending}>
                          {addPositionMutation.isPending ? "Wird hinzugefügt..." : "Hinzufügen"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {rechnungDetail.positionen && rechnungDetail.positionen.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Beschreibung</th>
                          <th className="text-left p-2">Kategorie</th>
                          <th className="text-left p-2">Bewertung</th>
                          <th className="text-right p-2">Betrag</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rechnungDetail.positionen.map((pos) => (
                          <tr key={pos.id} className="border-t">
                            <td className="p-2">
                              <p>{pos.beschreibung}</p>
                              {pos.vermeidbarUrsache && (
                                <p className="text-xs text-red-600">Ursache: {pos.vermeidbarUrsache}</p>
                              )}
                            </td>
                            <td className="p-2 capitalize">{pos.kategorie?.replace(/_/g, " ")}</td>
                            <td className="p-2">
                              <Badge className={
                                pos.bewertung?.startsWith("vermeidbar") ? "bg-red-100 text-red-800" :
                                pos.bewertung === "unklar" ? "bg-gray-100 text-gray-800" :
                                "bg-green-100 text-green-800"
                              }>
                                {pos.bewertung?.startsWith("vermeidbar") ? "Vermeidbar" :
                                 pos.bewertung === "unklar" ? "Unklar" : "Notwendig"}
                              </Badge>
                            </td>
                            <td className="p-2 text-right font-medium">{formatCurrency(pos.gesamtpreis)}</td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePositionMutation.mutate({ id: pos.id });
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Noch keine Positionen erfasst.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedRechnung && deleteRechnungMutation.mutate({ id: selectedRechnung })}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
            <Button variant="outline" onClick={() => setRechnungDetailDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail-Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Übergabe-Details</DialogTitle>
          </DialogHeader>
          {uebergabeDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Bezeichnung</Label>
                  <p className="font-medium">{uebergabeDetail.bezeichnung}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={STATUS_OPTIONEN.find(s => s.value === uebergabeDetail.status)?.color}>
                    {STATUS_OPTIONEN.find(s => s.value === uebergabeDetail.status)?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Übergabedatum</Label>
                  <p>{formatDate(uebergabeDetail.uebergabedatum)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Übergabeart</Label>
                  <p>{UEBERGABEARTEN.find(a => a.value === uebergabeDetail.uebergabeart)?.label}</p>
                </div>
                {uebergabeDetail.zeitraumVon && (
                  <div>
                    <Label className="text-muted-foreground">Zeitraum</Label>
                    <p>{formatDate(uebergabeDetail.zeitraumVon)} - {formatDate(uebergabeDetail.zeitraumBis)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Gesamtbetrag</Label>
                  <p className="font-semibold">{formatCurrency(uebergabeDetail.gesamtbetrag)}</p>
                </div>
              </div>
              
              {uebergabeDetail.beschreibung && (
                <div>
                  <Label className="text-muted-foreground">Beschreibung</Label>
                  <p className="text-sm">{uebergabeDetail.beschreibung}</p>
                </div>
              )}
              
              {/* Positionen */}
              <div>
                <Label className="text-muted-foreground mb-2 block">
                  Enthaltene Buchungen ({uebergabeDetail.positionen?.length || 0})
                </Label>
                {uebergabeDetail.positionen && uebergabeDetail.positionen.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Datum</th>
                          <th className="text-left p-2">Beleg-Nr.</th>
                          <th className="text-left p-2">Partner</th>
                          <th className="text-right p-2">Betrag</th>
                          <th className="text-center p-2">Beleg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uebergabeDetail.positionen.map((pos: any) => (
                          <tr key={pos.id} className="border-t">
                            <td className="p-2">
                              {pos.finanzamtDokument ? (
                                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                  FA-Dok
                                </Badge>
                              ) : pos.buchung ? formatDate(pos.buchung.belegdatum) : "-"}
                            </td>
                            <td className="p-2">
                              {pos.finanzamtDokument ? pos.finanzamtDokument.aktenzeichen || "-" : pos.buchung?.belegnummer || "-"}
                            </td>
                            <td className="p-2">
                              {pos.finanzamtDokument ? (
                                <span className="text-teal-700">{pos.finanzamtDokument.betreff}</span>
                              ) : pos.buchung?.geschaeftspartner || pos.beschreibung || "-"}
                            </td>
                            <td className="p-2 text-right">{formatCurrency(pos.betrag)}</td>
                            <td className="p-2 text-center">
                              {pos.buchung?.belegUrl ? (
                                <div className="flex items-center justify-center gap-1">
                                  {/* Beleg-Vorschau Icon basierend auf Dateityp */}
                                  {pos.buchung.belegUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <a 
                                      href={pos.buchung.belegUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-green-100 rounded transition-colors"
                                      title="Bild-Vorschau öffnen"
                                    >
                                      <Image className="w-4 h-4 text-green-600" />
                                    </a>
                                  ) : (
                                    <a 
                                      href={pos.buchung.belegUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                                      title="PDF öffnen"
                                    >
                                      <File className="w-4 h-4 text-blue-600" />
                                    </a>
                                  )}
                                  {/* Download-Link */}
                                  <a 
                                    href={pos.buchung.belegUrl} 
                                    download
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Beleg herunterladen"
                                  >
                                    <Download className="w-4 h-4 text-gray-600" />
                                  </a>
                                </div>
                              ) : pos.finanzamtDokument?.dateiUrl ? (
                                <a 
                                  href={pos.finanzamtDokument.dateiUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-teal-100 rounded transition-colors inline-flex"
                                  title="Finanzamt-Dokument öffnen"
                                >
                                  <FileText className="w-4 h-4 text-teal-600" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Buchungen oder Finanzamt-Dokumente zugeordnet</p>
                )}
              </div>
              
              {/* Beleg-Galerie für Buchungen mit Belegen */}
              {uebergabeDetail.positionen?.some((pos: any) => pos.buchung?.belegUrl) && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800 font-medium text-sm mb-3">
                    <Image className="w-4 h-4" />
                    Beleg-Vorschau ({uebergabeDetail.positionen.filter((pos: any) => pos.buchung?.belegUrl).length} Belege)
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {uebergabeDetail.positionen
                      .filter((pos: any) => pos.buchung?.belegUrl)
                      .map((pos: any) => (
                        <a 
                          key={pos.id}
                          href={pos.buchung.belegUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative bg-white rounded-lg border border-green-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {pos.buchung.belegUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img 
                              src={pos.buchung.belegUrl} 
                              alt={`Beleg ${pos.buchung.belegnummer}`}
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center bg-gray-50">
                              <FileText className="w-10 h-10 text-red-500" />
                            </div>
                          )}
                          <div className="p-2 text-xs">
                            <p className="font-medium truncate">{pos.buchung.belegnummer}</p>
                            <p className="text-muted-foreground truncate">{pos.buchung.geschaeftspartner}</p>
                          </div>
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-full p-1 shadow">
                              <ExternalLink className="w-3 h-3 text-gray-600" />
                            </div>
                          </div>
                        </a>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Finanzamt-Dokumente separat anzeigen */}
              {uebergabeDetail.positionen?.some((pos: any) => pos.finanzamtDokument) && (
                <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 text-teal-800 font-medium text-sm mb-2">
                    <FileText className="w-4 h-4" />
                    Verknüpfte Finanzamt-Dokumente
                  </div>
                  <div className="space-y-2">
                    {uebergabeDetail.positionen
                      .filter((pos: any) => pos.finanzamtDokument)
                      .map((pos: any) => (
                        <div key={pos.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                          <div>
                            <span className="font-medium">{pos.finanzamtDokument.betreff}</span>
                            {pos.finanzamtDokument.aktenzeichen && (
                              <span className="text-muted-foreground ml-2">({pos.finanzamtDokument.aktenzeichen})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{pos.finanzamtDokument.dokumentTyp}</Badge>
                            {pos.finanzamtDokument.steuerart && (
                              <Badge variant="secondary">{pos.finanzamtDokument.steuerart}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedUebergabe && deleteMutation.mutate({ id: selectedUebergabe })}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
