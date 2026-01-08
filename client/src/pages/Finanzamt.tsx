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
    });
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
  const filteredDokumente = dokumente?.filter(d => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return d.betreff.toLowerCase().includes(query) || 
             d.aktenzeichen?.toLowerCase().includes(query) ||
             d.beschreibung?.toLowerCase().includes(query);
    }
    return true;
  }) || [];

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
              ) : (
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
      </main>
    </div>
  );
}
