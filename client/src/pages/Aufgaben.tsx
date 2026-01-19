import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Edit,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  ListTodo,
  Flag,
  User,
  Building2,
  Loader2,
  Filter,
  ArrowUpDown
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";

// Kategorien
const KATEGORIEN = [
  { value: "finanzamt", label: "Finanzamt", color: "bg-blue-100 text-blue-800" },
  { value: "buchhaltung", label: "Buchhaltung", color: "bg-green-100 text-green-800" },
  { value: "steuern", label: "Steuern", color: "bg-purple-100 text-purple-800" },
  { value: "personal", label: "Personal", color: "bg-amber-100 text-amber-800" },
  { value: "allgemein", label: "Allgemein", color: "bg-gray-100 text-gray-800" },
  { value: "frist", label: "Frist", color: "bg-red-100 text-red-800" },
  { value: "zahlung", label: "Zahlung", color: "bg-teal-100 text-teal-800" },
  { value: "pruefung", label: "Prüfung", color: "bg-orange-100 text-orange-800" },
];

const PRIORITAETEN = [
  { value: "niedrig", label: "Niedrig", color: "text-gray-500", icon: Flag },
  { value: "normal", label: "Normal", color: "text-blue-500", icon: Flag },
  { value: "hoch", label: "Hoch", color: "text-amber-500", icon: Flag },
  { value: "dringend", label: "Dringend", color: "text-red-500", icon: AlertTriangle },
];

const STATUS_OPTIONEN = [
  { value: "offen", label: "Offen", color: "bg-amber-100 text-amber-800" },
  { value: "in_bearbeitung", label: "In Bearbeitung", color: "bg-blue-100 text-blue-800" },
  { value: "wartend", label: "Wartend", color: "bg-purple-100 text-purple-800" },
  { value: "erledigt", label: "Erledigt", color: "bg-green-100 text-green-800" },
  { value: "storniert", label: "Storniert", color: "bg-gray-100 text-gray-800" },
];

interface NeueAufgabeForm {
  titel: string;
  beschreibung: string;
  kategorie: string;
  prioritaet: string;
  faelligkeitsdatum: string;
  notizen: string;
  zugewiesenAn: string;
}

export default function Aufgaben() {
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

  const [filterKategorie, setFilterKategorie] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<string>("offen");
  const [filterPrioritaet, setFilterPrioritaet] = useState<string>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [neueAufgabe, setNeueAufgabe] = useState<NeueAufgabeForm>({
    titel: "",
    beschreibung: "",
    kategorie: "allgemein",
    prioritaet: "normal",
    faelligkeitsdatum: "",
    notizen: "",
    zugewiesenAn: "",
  });

  // Aufgaben laden
  const { data: aufgaben, refetch: refetchAufgaben } = trpc.aufgaben.list.useQuery(
    { 
      unternehmenId: selectedUnternehmenId!,
      kategorie: filterKategorie !== "alle" ? filterKategorie as any : undefined,
      status: filterStatus !== "alle" ? filterStatus as any : undefined,
      prioritaet: filterPrioritaet !== "alle" ? filterPrioritaet as any : undefined,
    },
    { enabled: !!selectedUnternehmenId }
  );

  // Statistiken laden
  const { data: statistiken } = trpc.aufgaben.statistiken.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Benutzer für Zuweisung laden
  const { data: benutzerListe } = trpc.benutzer.listByUnternehmen.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Mutations
  const createMutation = trpc.aufgaben.create.useMutation({
    onSuccess: () => {
      toast.success("Aufgabe erstellt");
      refetchAufgaben();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.aufgaben.update.useMutation({
    onSuccess: () => {
      toast.success("Aufgabe aktualisiert");
      refetchAufgaben();
    },
  });

  const erledigMutation = trpc.aufgaben.erledigen.useMutation({
    onSuccess: () => {
      toast.success("Aufgabe als erledigt markiert");
      refetchAufgaben();
    },
  });

  const deleteMutation = trpc.aufgaben.delete.useMutation({
    onSuccess: () => {
      toast.success("Aufgabe gelöscht");
      refetchAufgaben();
    },
  });

  const exportMutation = trpc.aufgaben.exportCsv.useMutation({
    onSuccess: (data) => {
      // CSV Download
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aufgaben-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success(`${data.count} Aufgaben exportiert`);
    },
  });

  const resetForm = () => {
    setNeueAufgabe({
      titel: "",
      beschreibung: "",
      kategorie: "allgemein",
      prioritaet: "normal",
      faelligkeitsdatum: "",
      notizen: "",
      zugewiesenAn: "",
    });
  };

  const handleCreate = () => {
    if (!selectedUnternehmenId) return;
    if (!neueAufgabe.titel) {
      toast.error("Bitte Titel eingeben");
      return;
    }

    createMutation.mutate({
      unternehmenId: selectedUnternehmenId,
      titel: neueAufgabe.titel,
      beschreibung: neueAufgabe.beschreibung || undefined,
      kategorie: neueAufgabe.kategorie as any,
      prioritaet: neueAufgabe.prioritaet as any,
      faelligkeitsdatum: neueAufgabe.faelligkeitsdatum || undefined,
      notizen: neueAufgabe.notizen || undefined,
      zugewiesenAn: neueAufgabe.zugewiesenAn ? parseInt(neueAufgabe.zugewiesenAn) : undefined,
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, status: status as any });
  };

  const handleErledigen = (id: number) => {
    erledigMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    if (confirm("Aufgabe wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExport = () => {
    if (!selectedUnternehmenId) return;
    exportMutation.mutate({ 
      unternehmenId: selectedUnternehmenId,
      nurOffen: filterStatus === "offen",
    });
  };

  // Gefilterte Aufgaben
  const filteredAufgaben = aufgaben?.filter(a => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return a.titel.toLowerCase().includes(query) || 
             a.beschreibung?.toLowerCase().includes(query);
    }
    return true;
  }) || [];

  // Prüfe ob Fälligkeit überschritten
  const isUeberfaellig = (faelligkeit: Date | string | null, status: string) => {
    if (!faelligkeit || status === "erledigt" || status === "storniert") return false;
    return new Date(faelligkeit) < new Date();
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
              <ListTodo className="w-6 h-6 text-primary" />
              Aufgaben
            </h1>
            <p className="text-muted-foreground">Interne To-Dos und Aufgaben verwalten</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!selectedUnternehmenId}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedUnternehmenId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Aufgabe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Neue Aufgabe</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie eine neue Aufgabe oder To-Do
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Titel *</Label>
                    <Input 
                      placeholder="Was muss erledigt werden?"
                      value={neueAufgabe.titel}
                      onChange={(e) => setNeueAufgabe({...neueAufgabe, titel: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kategorie</Label>
                      <Select 
                        value={neueAufgabe.kategorie} 
                        onValueChange={(v) => setNeueAufgabe({...neueAufgabe, kategorie: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KATEGORIEN.map((k) => (
                            <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priorität</Label>
                      <Select 
                        value={neueAufgabe.prioritaet} 
                        onValueChange={(v) => setNeueAufgabe({...neueAufgabe, prioritaet: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITAETEN.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              <div className="flex items-center gap-2">
                                <p.icon className={`w-4 h-4 ${p.color}`} />
                                {p.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fälligkeitsdatum</Label>
                    <Input 
                      type="date"
                      value={neueAufgabe.faelligkeitsdatum}
                      onChange={(e) => setNeueAufgabe({...neueAufgabe, faelligkeitsdatum: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Zuweisen an</Label>
                    <Select 
                      value={neueAufgabe.zugewiesenAn} 
                      onValueChange={(v) => setNeueAufgabe({...neueAufgabe, zugewiesenAn: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nicht zugewiesen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nicht zugewiesen</SelectItem>
                        {benutzerListe?.map((b) => (
                          <SelectItem key={b.oderId} value={b.oderId.toString()}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {b.name || b.email}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Beschreibung</Label>
                    <Textarea 
                      placeholder="Details zur Aufgabe..."
                      value={neueAufgabe.beschreibung}
                      onChange={(e) => setNeueAufgabe({...neueAufgabe, beschreibung: e.target.value})}
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
                    Erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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
                      <p className="text-sm text-muted-foreground">Offen</p>
                      <p className="text-2xl font-bold text-amber-600">{statistiken?.offen || 0}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Überfällig</p>
                      <p className="text-2xl font-bold text-red-600">{statistiken?.ueberfaellig || 0}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Dringend</p>
                      <p className="text-2xl font-bold text-orange-600">{statistiken?.dringend || 0}</p>
                    </div>
                    <Flag className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Erledigt</p>
                      <p className="text-2xl font-bold text-green-600">{statistiken?.erledigt || 0}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
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
                  
                  <Select value={filterKategorie} onValueChange={setFilterKategorie}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Kategorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Kategorien</SelectItem>
                      {KATEGORIEN.map((k) => (
                        <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Status</SelectItem>
                      {STATUS_OPTIONEN.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterPrioritaet} onValueChange={setFilterPrioritaet}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Priorität" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Prioritäten</SelectItem>
                      {PRIORITAETEN.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Aufgaben-Liste */}
            <div className="space-y-3">
              {filteredAufgaben.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ListTodo className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Keine Aufgaben gefunden</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAufgaben.map((aufgabe) => {
                  const kategorieInfo = KATEGORIEN.find(k => k.value === aufgabe.kategorie);
                  const prioritaetInfo = PRIORITAETEN.find(p => p.value === aufgabe.prioritaet);
                  const statusInfo = STATUS_OPTIONEN.find(s => s.value === aufgabe.status);
                  const ueberfaellig = isUeberfaellig(aufgabe.faelligkeitsdatum, aufgabe.status);
                  const PrioIcon = prioritaetInfo?.icon || Flag;

                  return (
                    <Card 
                      key={aufgabe.id} 
                      className={`transition-all ${
                        aufgabe.status === "erledigt" ? "opacity-60" : ""
                      } ${ueberfaellig ? "border-red-300 bg-red-50/50" : ""}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className="pt-1">
                            <Checkbox 
                              checked={aufgabe.status === "erledigt"}
                              onCheckedChange={() => {
                                if (aufgabe.status !== "erledigt") {
                                  handleErledigen(aufgabe.id);
                                }
                              }}
                              disabled={aufgabe.status === "erledigt"}
                            />
                          </div>

                          {/* Inhalt */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <PrioIcon className={`w-4 h-4 ${prioritaetInfo?.color}`} />
                              <h3 className={`font-medium ${aufgabe.status === "erledigt" ? "line-through" : ""}`}>
                                {aufgabe.titel}
                              </h3>
                              {ueberfaellig && (
                                <Badge variant="destructive" className="text-xs">
                                  Überfällig!
                                </Badge>
                              )}
                            </div>

                            {aufgabe.beschreibung && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {aufgabe.beschreibung}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className={kategorieInfo?.color}>
                                {kategorieInfo?.label}
                              </Badge>
                              
                              {aufgabe.faelligkeitsdatum && (
                                <span className={`text-xs flex items-center gap-1 ${
                                  ueberfaellig ? "text-red-600 font-medium" : "text-muted-foreground"
                                }`}>
                                  <Calendar className="w-3 h-3" />
                                  {new Date(aufgabe.faelligkeitsdatum).toLocaleDateString('de-DE')}
                                </span>
                              )}

                              {/* Zugewiesene Person */}
                              {aufgabe.zugewiesenAn && (
                                <span className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  <User className="w-3 h-3" />
                                  {benutzerListe?.find(b => b.oderId === aufgabe.zugewiesenAn)?.name || 
                                   benutzerListe?.find(b => b.oderId === aufgabe.zugewiesenAn)?.email || 
                                   "Zugewiesen"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Select 
                              value={aufgabe.status} 
                              onValueChange={(v) => handleStatusChange(aufgabe.id, v)}
                            >
                              <SelectTrigger className={`w-[140px] text-xs ${statusInfo?.color}`}>
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
                              onClick={() => handleDelete(aufgabe.id)}
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
