import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Euro,
  Hash,
  FileSpreadsheet,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";

interface Buchung {
  id: string;
  belegdatum: string;
  belegnummer: string;
  kreditor: string;
  kreditorKonto: string;
  aufwandskonto: string;
  nettobetrag: string;
  steuersatz: string;
  bruttobetrag: string;
  buchungstext: string;
  belegDatei: File | null;
  status: "pending" | "complete" | "error";
}

const KONTENRAHMEN_SKR03 = {
  aufwand: [
    { konto: "4120", bezeichnung: "Miete" },
    { konto: "4200", bezeichnung: "Telefon" },
    { konto: "4210", bezeichnung: "Internet" },
    { konto: "4240", bezeichnung: "Gas, Strom, Wasser" },
    { konto: "4260", bezeichnung: "Instandhaltung" },
    { konto: "4500", bezeichnung: "Fahrzeugkosten" },
    { konto: "4600", bezeichnung: "Werbekosten" },
    { konto: "4650", bezeichnung: "Bewirtungskosten" },
    { konto: "4900", bezeichnung: "Sonstige Aufwendungen" },
    { konto: "4930", bezeichnung: "Bürobedarf" },
    { konto: "4940", bezeichnung: "Zeitschriften, Bücher" },
    { konto: "4950", bezeichnung: "Rechts- und Beratungskosten" },
  ],
  steuer: [
    { satz: "19", bezeichnung: "19% Vorsteuer" },
    { satz: "7", bezeichnung: "7% Vorsteuer" },
    { satz: "0", bezeichnung: "Steuerfrei" },
  ]
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatCurrency(value: string): string {
  const num = parseFloat(value.replace(",", "."));
  if (isNaN(num)) return "";
  return num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateBrutto(netto: string, steuersatz: string): string {
  const nettoNum = parseFloat(netto.replace(",", "."));
  const steuerNum = parseFloat(steuersatz);
  if (isNaN(nettoNum) || isNaN(steuerNum)) return "";
  const brutto = nettoNum * (1 + steuerNum / 100);
  return brutto.toFixed(2).replace(".", ",");
}

function generateDATEVExport(buchungen: Buchung[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 17) + "000";
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}${String(month).padStart(2, "0")}01`;
  const endDate = `${year}${String(month).padStart(2, "0")}${new Date(year, month, 0).getDate()}`;
  
  // Header
  const header = `"EXTF";700;21;"Buchungsstapel";13;${timestamp};;"MA";"";"";1001;10001;${year}0101;4;${startDate};${endDate};"Buchungsstapel";"MA";1;0;0;"EUR";;"";;;"03";;;"";""`;
  
  // Column headers
  const columns = `Umsatz;Soll/Haben-Kz;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto (ohne BU-Schluessel);BU-Schluessel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext;Postensperre;Diverse Adressnummer;Geschaeftspartnerbank;Sachverhalt;Zinssperre;Beleglink`;
  
  // Data rows
  const rows = buchungen
    .filter(b => b.status === "complete")
    .map(b => {
      const brutto = b.bruttobetrag.replace(",", ".");
      const datum = b.belegdatum.split("-").slice(1).reverse().join("").slice(0, 4);
      return `${brutto};"S";"EUR";;;;"${b.aufwandskonto}";"${b.kreditorKonto}";"";"${datum}";"${b.belegnummer}";"";;${b.buchungstext};0;;;;;""`;
    });
  
  return [header, columns, ...rows].join("\n");
}

export default function Home() {
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const createEmptyBuchung = useCallback((): Buchung => ({
    id: generateId(),
    belegdatum: new Date().toISOString().split("T")[0],
    belegnummer: "",
    kreditor: "",
    kreditorKonto: "70000",
    aufwandskonto: "",
    nettobetrag: "",
    steuersatz: "19",
    bruttobetrag: "",
    buchungstext: "",
    belegDatei: null,
    status: "pending"
  }), []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => 
      f.type === "application/pdf" || 
      f.type.startsWith("image/")
    );
    
    if (validFiles.length > 0) {
      const newBuchungen = validFiles.map(file => ({
        ...createEmptyBuchung(),
        belegDatei: file,
        belegnummer: file.name.replace(/\.[^/.]+$/, "").slice(0, 20)
      }));
      setBuchungen(prev => [...prev, ...newBuchungen]);
      toast.success(`${validFiles.length} Beleg(e) hinzugefügt`);
    } else {
      toast.error("Bitte nur PDF oder Bilddateien hochladen");
    }
  }, [createEmptyBuchung]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newBuchungen = files.map(file => ({
        ...createEmptyBuchung(),
        belegDatei: file,
        belegnummer: file.name.replace(/\.[^/.]+$/, "").slice(0, 20)
      }));
      setBuchungen(prev => [...prev, ...newBuchungen]);
      toast.success(`${files.length} Beleg(e) hinzugefügt`);
    }
  }, [createEmptyBuchung]);

  const addEmptyBuchung = useCallback(() => {
    setBuchungen(prev => [...prev, createEmptyBuchung()]);
  }, [createEmptyBuchung]);

  const removeBuchung = useCallback((id: string) => {
    setBuchungen(prev => prev.filter(b => b.id !== id));
    toast.info("Buchung entfernt");
  }, []);

  const updateBuchung = useCallback((id: string, field: keyof Buchung, value: string | File | null) => {
    setBuchungen(prev => prev.map(b => {
      if (b.id !== id) return b;
      
      const updated = { ...b, [field]: value };
      
      // Auto-calculate brutto when netto or steuersatz changes
      if (field === "nettobetrag" || field === "steuersatz") {
        const netto = field === "nettobetrag" ? value as string : b.nettobetrag;
        const steuer = field === "steuersatz" ? value as string : b.steuersatz;
        updated.bruttobetrag = calculateBrutto(netto, steuer);
      }
      
      // Check if buchung is complete
      const isComplete = 
        updated.belegdatum && 
        updated.belegnummer && 
        updated.kreditor && 
        updated.aufwandskonto && 
        updated.bruttobetrag;
      
      updated.status = isComplete ? "complete" : "pending";
      
      return updated;
    }));
  }, []);

  const handleExport = useCallback(() => {
    const completeBuchungen = buchungen.filter(b => b.status === "complete");
    if (completeBuchungen.length === 0) {
      toast.error("Keine vollständigen Buchungen zum Exportieren");
      return;
    }
    
    const csvContent = generateDATEVExport(buchungen);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const filename = `EXTF_Buchungsstapel_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
    
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${completeBuchungen.length} Buchung(en) exportiert`);
  }, [buchungen]);

  const completeBuchungenCount = buchungen.filter(b => b.status === "complete").length;
  const totalBrutto = buchungen
    .filter(b => b.status === "complete")
    .reduce((sum, b) => sum + parseFloat(b.bruttobetrag.replace(",", ".") || "0"), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Buchhaltung Upload Tool</h1>
                <p className="text-sm text-muted-foreground">Belege erfassen und DATEV-Export erstellen</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Vollständige Buchungen</p>
                <p className="text-lg font-semibold tabular-nums">{completeBuchungenCount} / {buchungen.length}</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Gesamtbetrag (brutto)</p>
                <p className="text-lg font-semibold tabular-nums font-mono">{formatCurrency(totalBrutto.toFixed(2))} €</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Upload Zone */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Belege hochladen
            </CardTitle>
            <CardDescription>
              Ziehen Sie Ihre Belege (PDF, JPG, PNG) hierher oder klicken Sie zum Auswählen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`drop-zone ${dragActive ? "drop-zone-active" : ""} flex flex-col items-center justify-center gap-4 cursor-pointer`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Belege hier ablegen</p>
                <p className="text-sm text-muted-foreground">oder klicken zum Auswählen</p>
              </div>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </CardContent>
        </Card>

        {/* Buchungen Liste */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Buchungen ({buchungen.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addEmptyBuchung}>
                <Plus className="w-4 h-4 mr-2" />
                Manuelle Buchung
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={completeBuchungenCount === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                DATEV Export
              </Button>
              <Link href="/uebersicht">
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Übersicht
                </Button>
              </Link>
            </div>
          </div>

          {buchungen.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Noch keine Buchungen</p>
                <p className="text-sm">Laden Sie Belege hoch oder erstellen Sie eine manuelle Buchung</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {buchungen.map((buchung, index) => (
                <BuchungCard
                  key={buchung.id}
                  buchung={buchung}
                  index={index + 1}
                  onUpdate={updateBuchung}
                  onRemove={removeBuchung}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface BuchungCardProps {
  buchung: Buchung;
  index: number;
  onUpdate: (id: string, field: keyof Buchung, value: string | File | null) => void;
  onRemove: (id: string) => void;
}

function BuchungCard({ buchung, index, onUpdate, onRemove }: BuchungCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className={`transition-all duration-200 ${buchung.status === "complete" ? "border-l-4 border-l-accent" : ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-secondary rounded"
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
            <div className="flex items-center gap-2">
              {buchung.status === "complete" ? (
                <CheckCircle2 className="w-5 h-5 text-accent" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span className="font-semibold">Buchung #{index}</span>
            </div>
            {buchung.belegDatei && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {buchung.belegDatei.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {buchung.bruttobetrag && (
              <span className="font-mono font-semibold tabular-nums">
                {formatCurrency(buchung.bruttobetrag)} €
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(buchung.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Belegdatum */}
            <div className="space-y-2">
              <Label htmlFor={`datum-${buchung.id}`} className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Belegdatum
              </Label>
              <Input
                id={`datum-${buchung.id}`}
                type="date"
                value={buchung.belegdatum}
                onChange={(e) => onUpdate(buchung.id, "belegdatum", e.target.value)}
              />
            </div>

            {/* Belegnummer */}
            <div className="space-y-2">
              <Label htmlFor={`belegnr-${buchung.id}`} className="flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-muted-foreground" />
                Belegnummer
              </Label>
              <Input
                id={`belegnr-${buchung.id}`}
                placeholder="RE-2025-001"
                value={buchung.belegnummer}
                onChange={(e) => onUpdate(buchung.id, "belegnummer", e.target.value)}
              />
            </div>

            {/* Kreditor */}
            <div className="space-y-2">
              <Label htmlFor={`kreditor-${buchung.id}`} className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Kreditor (Lieferant)
              </Label>
              <Input
                id={`kreditor-${buchung.id}`}
                placeholder="Firmenname"
                value={buchung.kreditor}
                onChange={(e) => onUpdate(buchung.id, "kreditor", e.target.value)}
              />
            </div>

            {/* Kreditorenkonto */}
            <div className="space-y-2">
              <Label htmlFor={`kredkonto-${buchung.id}`}>Kreditorenkonto</Label>
              <Input
                id={`kredkonto-${buchung.id}`}
                placeholder="70000"
                value={buchung.kreditorKonto}
                onChange={(e) => onUpdate(buchung.id, "kreditorKonto", e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Aufwandskonto */}
            <div className="space-y-2">
              <Label>Aufwandskonto (SKR 03)</Label>
              <Select
                value={buchung.aufwandskonto}
                onValueChange={(value) => onUpdate(buchung.id, "aufwandskonto", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Konto wählen" />
                </SelectTrigger>
                <SelectContent>
                  {KONTENRAHMEN_SKR03.aufwand.map((k) => (
                    <SelectItem key={k.konto} value={k.konto}>
                      <span className="font-mono">{k.konto}</span> - {k.bezeichnung}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nettobetrag */}
            <div className="space-y-2">
              <Label htmlFor={`netto-${buchung.id}`} className="flex items-center gap-1.5">
                <Euro className="w-4 h-4 text-muted-foreground" />
                Nettobetrag
              </Label>
              <Input
                id={`netto-${buchung.id}`}
                placeholder="0,00"
                value={buchung.nettobetrag}
                onChange={(e) => onUpdate(buchung.id, "nettobetrag", e.target.value)}
                className="amount-input"
              />
            </div>

            {/* Steuersatz */}
            <div className="space-y-2">
              <Label>Steuersatz</Label>
              <Select
                value={buchung.steuersatz}
                onValueChange={(value) => onUpdate(buchung.id, "steuersatz", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KONTENRAHMEN_SKR03.steuer.map((s) => (
                    <SelectItem key={s.satz} value={s.satz}>
                      {s.bezeichnung}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bruttobetrag */}
            <div className="space-y-2">
              <Label htmlFor={`brutto-${buchung.id}`}>Bruttobetrag</Label>
              <Input
                id={`brutto-${buchung.id}`}
                placeholder="0,00"
                value={buchung.bruttobetrag}
                onChange={(e) => onUpdate(buchung.id, "bruttobetrag", e.target.value)}
                className="amount-input bg-secondary"
                readOnly
              />
            </div>

            {/* Buchungstext */}
            <div className="space-y-2 md:col-span-2 lg:col-span-4">
              <Label htmlFor={`text-${buchung.id}`}>Buchungstext</Label>
              <Textarea
                id={`text-${buchung.id}`}
                placeholder="Beschreibung der Buchung..."
                value={buchung.buchungstext}
                onChange={(e) => onUpdate(buchung.id, "buchungstext", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
