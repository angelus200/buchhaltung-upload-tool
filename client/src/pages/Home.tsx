import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
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
  BarChart3,
  StickyNote,
  Briefcase,
  Users,
  ArrowRightLeft,
  Bell
} from "lucide-react";
import { Link } from "wouter";

interface Buchung {
  id: string;
  buchungsart: "aufwand" | "ertrag" | "anlage" | "sonstig";
  belegdatum: string;
  belegnummer: string;
  geschaeftspartner: string;
  geschaeftspartnerTyp: "kreditor" | "debitor" | "gesellschafter" | "sonstig";
  geschaeftspartnerKonto: string;
  sachkonto: string;
  kostenstelle: string;
  nettobetrag: string;
  steuersatz: string;
  bruttobetrag: string;
  buchungstext: string;
  belegDatei: File | null;
  status: "pending" | "complete" | "error";
}

// Erweiterter Kontenrahmen SKR03
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
    { konto: "4830", bezeichnung: "Abschreibungen Sachanlagen" },
    { konto: "4900", bezeichnung: "Sonstige Aufwendungen" },
    { konto: "4930", bezeichnung: "Bürobedarf" },
    { konto: "4940", bezeichnung: "Zeitschriften, Bücher" },
    { konto: "4950", bezeichnung: "Rechts- und Beratungskosten" },
  ],
  ertrag: [
    { konto: "8400", bezeichnung: "Erlöse 19% USt" },
    { konto: "8300", bezeichnung: "Erlöse 7% USt" },
    { konto: "8100", bezeichnung: "Steuerfreie Erlöse" },
    { konto: "8200", bezeichnung: "Erlöse Ausland" },
    { konto: "8900", bezeichnung: "Sonstige Erträge" },
    { konto: "2650", bezeichnung: "Zinserträge" },
    { konto: "2700", bezeichnung: "Erträge aus Beteiligungen" },
  ],
  anlage: [
    { konto: "0200", bezeichnung: "Grundstücke" },
    { konto: "0210", bezeichnung: "Gebäude" },
    { konto: "0400", bezeichnung: "Maschinen" },
    { konto: "0420", bezeichnung: "Fahrzeuge" },
    { konto: "0480", bezeichnung: "Betriebs- und Geschäftsausstattung" },
    { konto: "0500", bezeichnung: "Anlagen im Bau" },
    { konto: "0600", bezeichnung: "Beteiligungen" },
    { konto: "0650", bezeichnung: "Wertpapiere des Anlagevermögens" },
  ],
  finanz: [
    { konto: "1200", bezeichnung: "Bank" },
    { konto: "1210", bezeichnung: "Sparkonto" },
    { konto: "1000", bezeichnung: "Kasse" },
    { konto: "1300", bezeichnung: "Wechsel" },
    { konto: "1400", bezeichnung: "Forderungen aus L+L" },
    { konto: "1600", bezeichnung: "Verbindlichkeiten aus L+L" },
  ],
  eigenkapital: [
    { konto: "0800", bezeichnung: "Gezeichnetes Kapital" },
    { konto: "0840", bezeichnung: "Kapitalrücklage" },
    { konto: "0860", bezeichnung: "Gewinnrücklagen" },
    { konto: "0880", bezeichnung: "Gewinnvortrag" },
    { konto: "0890", bezeichnung: "Verlustvortrag" },
    { konto: "2000", bezeichnung: "Privatentnahmen" },
    { konto: "2100", bezeichnung: "Privateinlagen" },
  ],
  steuer: [
    { satz: "19", bezeichnung: "19% USt/VSt" },
    { satz: "7", bezeichnung: "7% USt/VSt" },
    { satz: "0", bezeichnung: "Steuerfrei" },
  ]
};

const BUCHUNGSARTEN = [
  { value: "aufwand", label: "Aufwandsbuchung", icon: Building2, color: "text-red-600" },
  { value: "ertrag", label: "Ertragsbuchung", icon: Euro, color: "text-green-600" },
  { value: "anlage", label: "Anlagenbuchung", icon: FileText, color: "text-blue-600" },
  { value: "sonstig", label: "Sonstige Buchung", icon: ArrowRightLeft, color: "text-gray-600" },
];

const GESCHAEFTSPARTNER_TYPEN = [
  { value: "kreditor", label: "Kreditor (Lieferant)", kontobereich: "70000" },
  { value: "debitor", label: "Debitor (Kunde)", kontobereich: "10000" },
  { value: "gesellschafter", label: "Gesellschafter", kontobereich: "08000" },
  { value: "sonstig", label: "Sonstige", kontobereich: "00000" },
];

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
  
  const header = `"EXTF";700;21;"Buchungsstapel";13;${timestamp};;"MA";"";"";1001;10001;${year}0101;4;${startDate};${endDate};"Buchungsstapel";"MA";1;0;0;"EUR";;"";;;"03";;;"";""`;
  const columns = `Umsatz;Soll/Haben-Kz;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto (ohne BU-Schluessel);BU-Schluessel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext;Postensperre;Diverse Adressnummer;Geschaeftspartnerbank;Sachverhalt;Zinssperre;Beleglink;KOST1`;
  
  const rows = buchungen
    .filter(b => b.status === "complete")
    .map(b => {
      const brutto = b.bruttobetrag.replace(",", ".");
      const datum = b.belegdatum.split("-").slice(1).reverse().join("").slice(0, 4);
      const sollHaben = b.buchungsart === "ertrag" ? "H" : "S";
      return `${brutto};"${sollHaben}";"EUR";;;;"${b.sachkonto}";"${b.geschaeftspartnerKonto}";"";"${datum}";"${b.belegnummer}";"";;${b.buchungstext};0;;;;;"";"${b.kostenstelle}"`;
    });
  
  return [header, columns, ...rows].join("\n");
}

export default function Home() {
  const { user } = useAuth();

  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const createEmptyBuchung = useCallback((): Buchung => ({
    id: generateId(),
    buchungsart: "aufwand",
    belegdatum: new Date().toISOString().split("T")[0],
    belegnummer: `RE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    geschaeftspartner: "",
    geschaeftspartnerTyp: "kreditor",
    geschaeftspartnerKonto: "70000",
    sachkonto: "",
    kostenstelle: "",
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
      
      // Auto-update Kontobereich bei Geschäftspartner-Typ-Änderung
      if (field === "geschaeftspartnerTyp") {
        const typ = GESCHAEFTSPARTNER_TYPEN.find(t => t.value === value);
        if (typ) {
          updated.geschaeftspartnerKonto = typ.kontobereich;
        }
      }
      
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
        updated.geschaeftspartner && 
        updated.sachkonto && 
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

  // Konten basierend auf Buchungsart
  const getKontenForBuchungsart = (art: string) => {
    switch (art) {
      case "aufwand": return KONTENRAHMEN_SKR03.aufwand;
      case "ertrag": return KONTENRAHMEN_SKR03.ertrag;
      case "anlage": return KONTENRAHMEN_SKR03.anlage;
      default: return [...KONTENRAHMEN_SKR03.finanz, ...KONTENRAHMEN_SKR03.eigenkapital];
    }
  };

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
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Belege hier ablegen</p>
              <p className="text-sm text-muted-foreground">oder klicken zum Auswählen</p>
              <input
                id="fileInput"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </CardContent>
        </Card>

        {/* Buchungen */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Buchungen ({buchungen.length})</h2>
            <div className="flex gap-2 flex-wrap">
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
              <Link href="/notizen">
                <Button variant="outline">
                  <StickyNote className="w-4 h-4 mr-2" />
                  Notizen
                </Button>
              </Link>
              <Link href="/stammdaten">
                <Button variant="outline">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Stammdaten
                </Button>
              </Link>
              <Link href="/unternehmen">
                <Button variant="outline">
                  <Building2 className="w-4 h-4 mr-2" />
                  Unternehmen
                </Button>
              </Link>
              <Link href="/benachrichtigungen">
                <Button variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  Benachrichtigungen
                </Button>
              </Link>
              <Link href="/benutzerverwaltung">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Benutzer
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
              {buchungen.map((buchung) => (
                <Card key={buchung.id} className={`transition-all ${buchung.status === "complete" ? "border-green-200 bg-green-50/30" : ""}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className="pt-2">
                        {buchung.status === "complete" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-amber-500" />
                        )}
                      </div>

                      {/* Form Fields */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Buchungsart */}
                        <div className="space-y-2">
                          <Label>Buchungsart</Label>
                          <Select 
                            value={buchung.buchungsart} 
                            onValueChange={(v) => updateBuchung(buchung.id, "buchungsart", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BUCHUNGSARTEN.map((art) => (
                                <SelectItem key={art.value} value={art.value}>
                                  {art.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Belegdatum */}
                        <div className="space-y-2">
                          <Label htmlFor={`datum-${buchung.id}`}>Belegdatum</Label>
                          <Input
                            id={`datum-${buchung.id}`}
                            type="date"
                            value={buchung.belegdatum}
                            onChange={(e) => updateBuchung(buchung.id, "belegdatum", e.target.value)}
                          />
                        </div>

                        {/* Belegnummer */}
                        <div className="space-y-2">
                          <Label htmlFor={`belegnr-${buchung.id}`}>Belegnummer</Label>
                          <Input
                            id={`belegnr-${buchung.id}`}
                            placeholder="RE-2025-001"
                            value={buchung.belegnummer}
                            onChange={(e) => updateBuchung(buchung.id, "belegnummer", e.target.value)}
                          />
                        </div>

                        {/* Geschäftspartner Typ */}
                        <div className="space-y-2">
                          <Label>Partner-Typ</Label>
                          <Select 
                            value={buchung.geschaeftspartnerTyp} 
                            onValueChange={(v) => updateBuchung(buchung.id, "geschaeftspartnerTyp", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GESCHAEFTSPARTNER_TYPEN.map((typ) => (
                                <SelectItem key={typ.value} value={typ.value}>
                                  {typ.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Geschäftspartner Name */}
                        <div className="space-y-2">
                          <Label htmlFor={`partner-${buchung.id}`}>Geschäftspartner</Label>
                          <Input
                            id={`partner-${buchung.id}`}
                            placeholder="Firmenname"
                            value={buchung.geschaeftspartner}
                            onChange={(e) => updateBuchung(buchung.id, "geschaeftspartner", e.target.value)}
                          />
                        </div>

                        {/* Geschäftspartner Konto */}
                        <div className="space-y-2">
                          <Label htmlFor={`partnerkonto-${buchung.id}`}>Personenkonto</Label>
                          <Input
                            id={`partnerkonto-${buchung.id}`}
                            placeholder="70000"
                            value={buchung.geschaeftspartnerKonto}
                            onChange={(e) => updateBuchung(buchung.id, "geschaeftspartnerKonto", e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        {/* Sachkonto */}
                        <div className="space-y-2">
                          <Label>Sachkonto</Label>
                          <Select 
                            value={buchung.sachkonto} 
                            onValueChange={(v) => updateBuchung(buchung.id, "sachkonto", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Konto wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              {getKontenForBuchungsart(buchung.buchungsart).map((k) => (
                                <SelectItem key={k.konto} value={k.konto}>
                                  {k.konto} - {k.bezeichnung}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Kostenstelle */}
                        <div className="space-y-2">
                          <Label htmlFor={`kst-${buchung.id}`}>Kostenstelle</Label>
                          <Input
                            id={`kst-${buchung.id}`}
                            placeholder="Optional"
                            value={buchung.kostenstelle}
                            onChange={(e) => updateBuchung(buchung.id, "kostenstelle", e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        {/* Nettobetrag */}
                        <div className="space-y-2">
                          <Label htmlFor={`netto-${buchung.id}`}>Nettobetrag</Label>
                          <Input
                            id={`netto-${buchung.id}`}
                            placeholder="0,00"
                            value={buchung.nettobetrag}
                            onChange={(e) => updateBuchung(buchung.id, "nettobetrag", e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        {/* Steuersatz */}
                        <div className="space-y-2">
                          <Label>Steuersatz</Label>
                          <Select 
                            value={buchung.steuersatz} 
                            onValueChange={(v) => updateBuchung(buchung.id, "steuersatz", v)}
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
                            onChange={(e) => updateBuchung(buchung.id, "bruttobetrag", e.target.value)}
                            className="font-mono bg-muted/50"
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
                            onChange={(e) => updateBuchung(buchung.id, "buchungstext", e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeBuchung(buchung.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Beleg Info */}
                    {buchung.belegDatei && (
                      <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>{buchung.belegDatei.name}</span>
                        <span className="text-xs">({(buchung.belegDatei.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
