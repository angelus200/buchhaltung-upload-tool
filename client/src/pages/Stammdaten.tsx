import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Plus,
  Trash2,
  Edit2,
  Save,
  Building2,
  Users,
  Landmark,
  Car,
  Briefcase,
  CreditCard,
  FolderTree,
  FileText,
  Search,
  Factory,
  UserCircle,
  PiggyBank
} from "lucide-react";

// Typen für alle Stammdaten
interface Stammdatum {
  id: string;
  typ: string;
  name: string;
  kontonummer: string;
  details: Record<string, string>;
  notizen: string;
  erstelltAm: string;
  aktualisiertAm: string;
}

// Konfiguration für alle Stammdaten-Typen
const STAMMDATEN_TYPEN = [
  { 
    value: "kreditor", 
    label: "Kreditoren", 
    labelSingular: "Kreditor",
    icon: Building2, 
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    kontobereich: "70000-79999",
    felder: [
      { key: "firma", label: "Firma/Name", required: true },
      { key: "ansprechpartner", label: "Ansprechpartner" },
      { key: "strasse", label: "Straße" },
      { key: "plz", label: "PLZ" },
      { key: "ort", label: "Ort" },
      { key: "telefon", label: "Telefon" },
      { key: "email", label: "E-Mail" },
      { key: "ustid", label: "USt-IdNr." },
      { key: "iban", label: "IBAN" },
      { key: "zahlungsziel", label: "Zahlungsziel (Tage)" },
    ]
  },
  { 
    value: "debitor", 
    label: "Debitoren", 
    labelSingular: "Debitor",
    icon: Users, 
    color: "text-green-600",
    bgColor: "bg-green-100",
    kontobereich: "10000-19999",
    felder: [
      { key: "firma", label: "Firma/Name", required: true },
      { key: "ansprechpartner", label: "Ansprechpartner" },
      { key: "strasse", label: "Straße" },
      { key: "plz", label: "PLZ" },
      { key: "ort", label: "Ort" },
      { key: "telefon", label: "Telefon" },
      { key: "email", label: "E-Mail" },
      { key: "ustid", label: "USt-IdNr." },
      { key: "kreditlimit", label: "Kreditlimit (€)" },
      { key: "zahlungsziel", label: "Zahlungsziel (Tage)" },
    ]
  },
  { 
    value: "beteiligung", 
    label: "Beteiligungen", 
    labelSingular: "Beteiligung",
    icon: Factory, 
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    kontobereich: "0600-0699",
    felder: [
      { key: "firma", label: "Unternehmensname", required: true },
      { key: "rechtsform", label: "Rechtsform" },
      { key: "anteil", label: "Anteil (%)" },
      { key: "nennwert", label: "Nennwert (€)" },
      { key: "buchwert", label: "Buchwert (€)" },
      { key: "erwerbsdatum", label: "Erwerbsdatum" },
      { key: "handelsregister", label: "Handelsregister" },
      { key: "sitz", label: "Sitz der Gesellschaft" },
    ]
  },
  { 
    value: "anlagevermoegen", 
    label: "Anlagevermögen", 
    labelSingular: "Anlagegut",
    icon: Car, 
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    kontobereich: "0100-0899",
    felder: [
      { key: "bezeichnung", label: "Bezeichnung", required: true },
      { key: "kategorie", label: "Kategorie (Gebäude/Maschine/Fahrzeug/etc.)" },
      { key: "anschaffungsdatum", label: "Anschaffungsdatum" },
      { key: "anschaffungskosten", label: "Anschaffungskosten (€)" },
      { key: "nutzungsdauer", label: "Nutzungsdauer (Jahre)" },
      { key: "abschreibungsmethode", label: "Abschreibungsmethode" },
      { key: "restwert", label: "Aktueller Restwert (€)" },
      { key: "standort", label: "Standort" },
      { key: "inventarnummer", label: "Inventarnummer" },
      { key: "seriennummer", label: "Seriennummer" },
    ]
  },
  { 
    value: "gesellschafter", 
    label: "Gesellschafter", 
    labelSingular: "Gesellschafter",
    icon: UserCircle, 
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    kontobereich: "0800-0899",
    felder: [
      { key: "name", label: "Name", required: true },
      { key: "typ", label: "Typ (natürliche/juristische Person)" },
      { key: "anteil", label: "Anteil (%)" },
      { key: "einlage", label: "Einlage (€)" },
      { key: "strasse", label: "Straße" },
      { key: "plz", label: "PLZ" },
      { key: "ort", label: "Ort" },
      { key: "steuernummer", label: "Steuernummer" },
      { key: "eintrittsdatum", label: "Eintrittsdatum" },
    ]
  },
  { 
    value: "bankkonto", 
    label: "Bankkonten", 
    labelSingular: "Bankkonto",
    icon: Landmark, 
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    kontobereich: "1200-1299",
    felder: [
      { key: "bankname", label: "Bankname", required: true },
      { key: "iban", label: "IBAN", required: true },
      { key: "bic", label: "BIC" },
      { key: "kontoinhaber", label: "Kontoinhaber" },
      { key: "waehrung", label: "Währung" },
      { key: "kontotyp", label: "Kontotyp (Giro/Festgeld/etc.)" },
      { key: "kreditlinie", label: "Kreditlinie (€)" },
    ]
  },
  { 
    value: "kostenstelle", 
    label: "Kostenstellen", 
    labelSingular: "Kostenstelle",
    icon: FolderTree, 
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    kontobereich: "KST",
    felder: [
      { key: "bezeichnung", label: "Bezeichnung", required: true },
      { key: "nummer", label: "Kostenstellennummer" },
      { key: "verantwortlicher", label: "Verantwortlicher" },
      { key: "abteilung", label: "Abteilung" },
      { key: "budget", label: "Jahresbudget (€)" },
      { key: "uebergeordnet", label: "Übergeordnete Kostenstelle" },
    ]
  },
  { 
    value: "vertrag", 
    label: "Verträge", 
    labelSingular: "Vertrag",
    icon: FileText, 
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    kontobereich: "-",
    felder: [
      { key: "bezeichnung", label: "Vertragsbezeichnung", required: true },
      { key: "vertragsart", label: "Vertragsart (Miet/Leasing/Wartung/etc.)" },
      { key: "vertragspartner", label: "Vertragspartner" },
      { key: "vertragsnummer", label: "Vertragsnummer" },
      { key: "beginn", label: "Vertragsbeginn" },
      { key: "ende", label: "Vertragsende" },
      { key: "kuendigungsfrist", label: "Kündigungsfrist" },
      { key: "betrag", label: "Monatlicher Betrag (€)" },
      { key: "zahlungsrhythmus", label: "Zahlungsrhythmus" },
      { key: "buchungskonto", label: "Buchungskonto" },
    ]
  },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Lokaler Speicher
function loadStammdaten(): Stammdatum[] {
  try {
    const saved = localStorage.getItem("buchhaltung_stammdaten");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveStammdaten(data: Stammdatum[]): void {
  localStorage.setItem("buchhaltung_stammdaten", JSON.stringify(data));
}

export default function Stammdaten() {
  const [stammdaten, setStammdaten] = useState<Stammdatum[]>([]);
  const [activeTab, setActiveTab] = useState("kreditor");
  const [suchbegriff, setSuchbegriff] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Stammdatum | null>(null);

  // Formular-State
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formKontonummer, setFormKontonummer] = useState("");
  const [formNotizen, setFormNotizen] = useState("");

  useEffect(() => {
    setStammdaten(loadStammdaten());
  }, []);

  const activeTypConfig = STAMMDATEN_TYPEN.find(t => t.value === activeTab)!;

  const resetForm = useCallback(() => {
    setFormData({});
    setFormKontonummer("");
    setFormNotizen("");
    setEditItem(null);
  }, []);

  const openNewDialog = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((item: Stammdatum) => {
    setEditItem(item);
    setFormData(item.details);
    setFormKontonummer(item.kontonummer);
    setFormNotizen(item.notizen);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    const requiredFields = activeTypConfig.felder.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !formData[f.key]?.trim());
    
    if (missingFields.length > 0) {
      toast.error(`Bitte füllen Sie aus: ${missingFields.map(f => f.label).join(", ")}`);
      return;
    }

    const now = new Date().toISOString();
    const name = formData[activeTypConfig.felder[0].key] || "Unbenannt";
    
    if (editItem) {
      const updated = stammdaten.map(s => 
        s.id === editItem.id 
          ? { ...s, name, kontonummer: formKontonummer, details: formData, notizen: formNotizen, aktualisiertAm: now }
          : s
      );
      setStammdaten(updated);
      saveStammdaten(updated);
      toast.success(`${activeTypConfig.labelSingular} aktualisiert`);
    } else {
      const neuesItem: Stammdatum = {
        id: generateId(),
        typ: activeTab,
        name,
        kontonummer: formKontonummer,
        details: formData,
        notizen: formNotizen,
        erstelltAm: now,
        aktualisiertAm: now,
      };
      const updated = [neuesItem, ...stammdaten];
      setStammdaten(updated);
      saveStammdaten(updated);
      toast.success(`${activeTypConfig.labelSingular} erstellt`);
    }

    setDialogOpen(false);
    resetForm();
  }, [activeTab, activeTypConfig, formData, formKontonummer, formNotizen, editItem, stammdaten, resetForm]);

  const handleDelete = useCallback((id: string) => {
    const updated = stammdaten.filter(s => s.id !== id);
    setStammdaten(updated);
    saveStammdaten(updated);
    toast.info(`${activeTypConfig.labelSingular} gelöscht`);
  }, [stammdaten, activeTypConfig]);

  // Gefilterte Daten für aktiven Tab
  const gefilterteDaten = stammdaten.filter(s => {
    if (s.typ !== activeTab) return false;
    if (!suchbegriff) return true;
    
    const searchLower = suchbegriff.toLowerCase();
    return s.name.toLowerCase().includes(searchLower) ||
           s.kontonummer.toLowerCase().includes(searchLower) ||
           Object.values(s.details).some(v => v.toLowerCase().includes(searchLower));
  });

  const Icon = activeTypConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Stammdaten</h1>
                  <p className="text-sm text-muted-foreground">Kreditoren, Debitoren, Anlagen & mehr</p>
                </div>
              </div>
            </div>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {activeTypConfig.labelSingular} anlegen
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Tabs für Stammdaten-Typen */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50">
              {STAMMDATEN_TYPEN.map((typ) => {
                const TabIcon = typ.icon;
                const count = stammdaten.filter(s => s.typ === typ.value).length;
                return (
                  <TabsTrigger 
                    key={typ.value} 
                    value={typ.value}
                    className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background"
                  >
                    <TabIcon className={`w-4 h-4 ${typ.color}`} />
                    <span className="hidden sm:inline">{typ.label}</span>
                    {count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Suchfeld */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`${activeTypConfig.label} durchsuchen...`}
                  value={suchbegriff}
                  onChange={(e) => setSuchbegriff(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Inhalt für jeden Tab */}
          {STAMMDATEN_TYPEN.map((typ) => (
            <TabsContent key={typ.value} value={typ.value} className="mt-0">
              {gefilterteDaten.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-muted-foreground">
                    <Icon className={`w-12 h-12 mx-auto mb-4 opacity-50 ${typ.color}`} />
                    <p className="font-medium">Keine {typ.label} vorhanden</p>
                    <p className="text-sm">Legen Sie einen neuen {typ.labelSingular} an</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gefilterteDaten.map((item) => {
                    const ItemIcon = typ.icon;
                    return (
                      <Card key={item.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${typ.bgColor} flex items-center justify-center`}>
                                <ItemIcon className={`w-5 h-5 ${typ.color}`} />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                                {item.kontonummer && (
                                  <CardDescription className="font-mono text-xs">
                                    Konto: {item.kontonummer}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {typ.felder.slice(1, 4).map((feld) => {
                              const value = item.details[feld.key];
                              if (!value) return null;
                              return (
                                <div key={feld.key} className="flex justify-between">
                                  <span className="text-muted-foreground">{feld.label}:</span>
                                  <span className="font-medium truncate ml-2 max-w-[150px]">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                          {item.notizen && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.notizen}
                              </p>
                            </>
                          )}
                        </CardContent>
                        <div className="px-6 pb-4">
                          <div className="text-xs text-muted-foreground">
                            Erstellt: {formatDate(item.erstelltAm)}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Dialog für Neu/Bearbeiten */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${activeTypConfig.color}`} />
                {editItem ? `${activeTypConfig.labelSingular} bearbeiten` : `Neuen ${activeTypConfig.labelSingular} anlegen`}
              </DialogTitle>
              <DialogDescription>
                Kontobereich: {activeTypConfig.kontobereich}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Kontonummer */}
              <div className="space-y-2">
                <Label htmlFor="kontonummer">Kontonummer</Label>
                <Input
                  id="kontonummer"
                  placeholder={activeTypConfig.kontobereich}
                  value={formKontonummer}
                  onChange={(e) => setFormKontonummer(e.target.value)}
                  className="font-mono"
                />
              </div>

              <Separator />

              {/* Dynamische Felder basierend auf Typ */}
              <div className="grid grid-cols-2 gap-4">
                {activeTypConfig.felder.map((feld) => (
                  <div key={feld.key} className={feld.key === "notizen" ? "col-span-2" : ""}>
                    <Label htmlFor={feld.key}>
                      {feld.label}
                      {feld.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={feld.key}
                      value={formData[feld.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [feld.key]: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Notizen */}
              <div className="space-y-2">
                <Label htmlFor="notizen">Notizen / Anmerkungen</Label>
                <Textarea
                  id="notizen"
                  placeholder="Zusätzliche Informationen..."
                  value={formNotizen}
                  onChange={(e) => setFormNotizen(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
