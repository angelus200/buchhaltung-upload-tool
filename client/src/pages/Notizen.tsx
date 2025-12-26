import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import { 
  ArrowLeft, 
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Save,
  FileText,
  Building2,
  Calendar,
  Tag,
  StickyNote,
  Search,
  Filter
} from "lucide-react";

interface Notiz {
  id: string;
  titel: string;
  kategorie: string;
  inhalt: string;
  kreditorBezug: string;
  erstelltAm: string;
  aktualisiertAm: string;
}

const KATEGORIEN = [
  { value: "vertrag", label: "Vertrag", icon: FileText },
  { value: "kreditor", label: "Kreditor-Info", icon: Building2 },
  { value: "buchung", label: "Buchungshinweis", icon: Tag },
  { value: "allgemein", label: "Allgemein", icon: StickyNote },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Lokaler Speicher für Notizen
function loadNotizen(): Notiz[] {
  try {
    const saved = localStorage.getItem("buchhaltung_notizen");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveNotizen(notizen: Notiz[]): void {
  localStorage.setItem("buchhaltung_notizen", JSON.stringify(notizen));
}

export default function Notizen() {
  const [notizen, setNotizen] = useState<Notiz[]>([]);
  const [suchbegriff, setSuchbegriff] = useState("");
  const [filterKategorie, setFilterKategorie] = useState<string>("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNotiz, setEditNotiz] = useState<Notiz | null>(null);

  // Formular-State
  const [formTitel, setFormTitel] = useState("");
  const [formKategorie, setFormKategorie] = useState("allgemein");
  const [formInhalt, setFormInhalt] = useState("");
  const [formKreditorBezug, setFormKreditorBezug] = useState("");

  useEffect(() => {
    setNotizen(loadNotizen());
  }, []);

  const resetForm = useCallback(() => {
    setFormTitel("");
    setFormKategorie("allgemein");
    setFormInhalt("");
    setFormKreditorBezug("");
    setEditNotiz(null);
  }, []);

  const openNewDialog = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((notiz: Notiz) => {
    setEditNotiz(notiz);
    setFormTitel(notiz.titel);
    setFormKategorie(notiz.kategorie);
    setFormInhalt(notiz.inhalt);
    setFormKreditorBezug(notiz.kreditorBezug);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formTitel.trim() || !formInhalt.trim()) {
      toast.error("Bitte Titel und Inhalt ausfüllen");
      return;
    }

    const now = new Date().toISOString();
    
    if (editNotiz) {
      // Bearbeiten
      const updated = notizen.map(n => 
        n.id === editNotiz.id 
          ? { ...n, titel: formTitel, kategorie: formKategorie, inhalt: formInhalt, kreditorBezug: formKreditorBezug, aktualisiertAm: now }
          : n
      );
      setNotizen(updated);
      saveNotizen(updated);
      toast.success("Notiz aktualisiert");
    } else {
      // Neu erstellen
      const neueNotiz: Notiz = {
        id: generateId(),
        titel: formTitel,
        kategorie: formKategorie,
        inhalt: formInhalt,
        kreditorBezug: formKreditorBezug,
        erstelltAm: now,
        aktualisiertAm: now,
      };
      const updated = [neueNotiz, ...notizen];
      setNotizen(updated);
      saveNotizen(updated);
      toast.success("Notiz erstellt");
    }

    setDialogOpen(false);
    resetForm();
  }, [formTitel, formKategorie, formInhalt, formKreditorBezug, editNotiz, notizen, resetForm]);

  const handleDelete = useCallback((id: string) => {
    const updated = notizen.filter(n => n.id !== id);
    setNotizen(updated);
    saveNotizen(updated);
    toast.info("Notiz gelöscht");
  }, [notizen]);

  // Gefilterte Notizen
  const gefilterteNotizen = notizen.filter(n => {
    const matchSuche = suchbegriff === "" || 
      n.titel.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      n.inhalt.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      n.kreditorBezug.toLowerCase().includes(suchbegriff.toLowerCase());
    
    const matchKategorie = filterKategorie === "alle" || n.kategorie === filterKategorie;
    
    return matchSuche && matchKategorie;
  });

  const getKategorieInfo = (value: string) => {
    return KATEGORIEN.find(k => k.value === value) || KATEGORIEN[3];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Einheitlicher Header */}
      <AppHeader title="Notizen & Informationen" subtitle="Verträge, Kreditor-Infos und Anmerkungen" />

      {/* Neue Notiz Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editNotiz ? "Notiz bearbeiten" : "Neue Notiz erstellen"}</DialogTitle>
            <DialogDescription>
              Hinterlegen Sie hier wichtige Informationen für die Buchhaltung.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titel">Titel</Label>
                <Input
                  id="titel"
                  placeholder="z.B. Mietvertrag Büro"
                  value={formTitel}
                  onChange={(e) => setFormTitel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select value={formKategorie} onValueChange={setFormKategorie}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORIEN.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kreditor">Kreditor-Bezug (optional)</Label>
              <Input
                id="kreditor"
                placeholder="z.B. Immobilien AG"
                value={formKreditorBezug}
                onChange={(e) => setFormKreditorBezug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inhalt">Inhalt</Label>
              <Textarea
                id="inhalt"
                placeholder="Detaillierte Informationen, Vertragsbedingungen, Anmerkungen..."
                value={formInhalt}
                onChange={(e) => setFormInhalt(e.target.value)}
                rows={8}
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

      <main className="container py-8">
        {/* Neue Notiz Button */}
        <div className="flex justify-end mb-6">
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Neue Notiz
          </Button>
        </div>
        {/* Filter und Suche */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen in Titel, Inhalt oder Kreditor..."
                  value={suchbegriff}
                  onChange={(e) => setSuchbegriff(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterKategorie} onValueChange={setFilterKategorie}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Kategorien</SelectItem>
                    {KATEGORIEN.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notizen-Liste */}
        {gefilterteNotizen.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Keine Notizen vorhanden</p>
              <p className="text-sm">Erstellen Sie eine neue Notiz, um Informationen zu hinterlegen</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gefilterteNotizen.map((notiz) => {
              const kategorie = getKategorieInfo(notiz.kategorie);
              const KategorieIcon = kategorie.icon;
              
              return (
                <Card key={notiz.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <KategorieIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base line-clamp-1">{notiz.titel}</CardTitle>
                          <CardDescription className="text-xs">{kategorie.label}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(notiz)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(notiz.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {notiz.kreditorBezug && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{notiz.kreditorBezug}</span>
                      </div>
                    )}
                    <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">
                      {notiz.inhalt}
                    </p>
                  </CardContent>
                  <div className="px-6 pb-4">
                    <Separator className="mb-3" />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Aktualisiert: {formatDate(notiz.aktualisiertAm)}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
