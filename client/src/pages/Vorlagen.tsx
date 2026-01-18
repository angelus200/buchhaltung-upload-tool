import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  BookTemplate,
  Loader2,
  Home,
  CreditCard,
  Shield,
  Phone,
  Wifi,
  Zap,
  Car,
  Package,
  TrendingDown,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const KATEGORIE_CONFIG = {
  miete: { label: "Miete", icon: Home, farbe: "#3b82f6" },
  gehalt: { label: "Gehalt", icon: CreditCard, farbe: "#10b981" },
  versicherung: { label: "Versicherung", icon: Shield, farbe: "#8b5cf6" },
  telefon: { label: "Telefon", icon: Phone, farbe: "#f59e0b" },
  internet: { label: "Internet", icon: Wifi, farbe: "#06b6d4" },
  energie: { label: "Energie", icon: Zap, farbe: "#eab308" },
  fahrzeug: { label: "Fahrzeug", icon: Car, farbe: "#ef4444" },
  büromaterial: { label: "Büromaterial", icon: Package, farbe: "#6366f1" },
  abschreibung: { label: "Abschreibung", icon: TrendingDown, farbe: "#ec4899" },
  sonstig: { label: "Sonstige", icon: MoreHorizontal, farbe: "#64748b" },
} as const;

type Kategorie = keyof typeof KATEGORIE_CONFIG;

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0,00";
  return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Vorlagen() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [kategorieFilter, setKategorieFilter] = useState<Kategorie | "alle">("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVorlage, setEditingVorlage] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; vorlage: any | null }>({
    open: false,
    vorlage: null,
  });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    beschreibung: "",
    sollKonto: "",
    habenKonto: "",
    betrag: "",
    buchungstext: "",
    ustSatz: "19",
    kategorie: "sonstig" as Kategorie,
    geschaeftspartner: "",
    farbe: "",
  });

  // Unternehmen laden
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Vorlagen laden
  const vorlagenQuery = trpc.buchungsvorlagen.list.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      kategorie: kategorieFilter === "alle" ? undefined : kategorieFilter,
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Mutations
  const createMutation = trpc.buchungsvorlagen.create.useMutation({
    onSuccess: () => {
      toast.success("Vorlage erstellt");
      setDialogOpen(false);
      resetForm();
      vorlagenQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler beim Erstellen", { description: error.message });
    },
  });

  const updateMutation = trpc.buchungsvorlagen.update.useMutation({
    onSuccess: () => {
      toast.success("Vorlage aktualisiert");
      setDialogOpen(false);
      setEditingVorlage(null);
      resetForm();
      vorlagenQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler beim Aktualisieren", { description: error.message });
    },
  });

  const deleteMutation = trpc.buchungsvorlagen.delete.useMutation({
    onSuccess: () => {
      toast.success("Vorlage gelöscht");
      setDeleteDialog({ open: false, vorlage: null });
      vorlagenQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler beim Löschen", { description: error.message });
    },
  });

  const duplicateMutation = trpc.buchungsvorlagen.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Vorlage dupliziert");
      vorlagenQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler beim Duplizieren", { description: error.message });
    },
  });

  // Auto-select erstes Unternehmen
  const unternehmenListe = useMemo(() => {
    if (!unternehmenQuery.data) return [];
    return unternehmenQuery.data.map((u) => ({
      id: u.unternehmen.id,
      name: u.unternehmen.name,
    }));
  }, [unternehmenQuery.data]);

  useMemo(() => {
    if (unternehmenListe.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenListe[0].id);
    }
  }, [unternehmenListe, selectedUnternehmen]);

  const vorlagen = vorlagenQuery.data || [];

  const resetForm = () => {
    setFormData({
      name: "",
      beschreibung: "",
      sollKonto: "",
      habenKonto: "",
      betrag: "",
      buchungstext: "",
      ustSatz: "19",
      kategorie: "sonstig",
      geschaeftspartner: "",
      farbe: "",
    });
    setEditingVorlage(null);
  };

  const handleOpenDialog = (vorlage?: any) => {
    if (vorlage) {
      setEditingVorlage(vorlage);
      setFormData({
        name: vorlage.name,
        beschreibung: vorlage.beschreibung || "",
        sollKonto: vorlage.sollKonto,
        habenKonto: vorlage.habenKonto,
        betrag: vorlage.betrag ? vorlage.betrag.toString() : "",
        buchungstext: vorlage.buchungstext,
        ustSatz: vorlage.ustSatz ? vorlage.ustSatz.toString() : "19",
        kategorie: vorlage.kategorie,
        geschaeftspartner: vorlage.geschaeftspartner || "",
        farbe: vorlage.farbe || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedUnternehmen) return;

    const data = {
      unternehmenId: selectedUnternehmen,
      name: formData.name,
      beschreibung: formData.beschreibung || undefined,
      sollKonto: formData.sollKonto,
      habenKonto: formData.habenKonto,
      betrag: formData.betrag ? parseFloat(formData.betrag) : undefined,
      buchungstext: formData.buchungstext,
      ustSatz: parseFloat(formData.ustSatz),
      kategorie: formData.kategorie,
      geschaeftspartner: formData.geschaeftspartner || undefined,
      farbe: formData.farbe || undefined,
    };

    if (editingVorlage) {
      updateMutation.mutate({ id: editingVorlage.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (vorlage: any) => {
    setDeleteDialog({ open: true, vorlage });
  };

  const confirmDelete = () => {
    if (deleteDialog.vorlage) {
      deleteMutation.mutate({ id: deleteDialog.vorlage.id });
    }
  };

  const handleDuplicate = (vorlage: any) => {
    duplicateMutation.mutate({ id: vorlage.id });
  };

  // Gruppiere Vorlagen nach Kategorie
  const gruppiertVorlagen = useMemo(() => {
    const gruppen: Record<string, any[]> = {};
    vorlagen.forEach((v) => {
      if (!gruppen[v.kategorie]) {
        gruppen[v.kategorie] = [];
      }
      gruppen[v.kategorie].push(v);
    });
    return gruppen;
  }, [vorlagen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AppHeader title="Buchungsvorlagen" subtitle="Vorlagen für wiederkehrende Buchungen verwalten" />

      <main className="container py-8">
        {/* Filter & Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm border">
          <Select
            value={selectedUnternehmen?.toString() || ""}
            onValueChange={(v) => setSelectedUnternehmen(parseInt(v))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Unternehmen wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmenListe.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={kategorieFilter} onValueChange={(v: any) => setKategorieFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Kategorien</SelectItem>
              {Object.entries(KATEGORIE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Neue Vorlage
            </Button>
          </div>
        </div>

        {!selectedUnternehmen ? (
          <Card className="p-12 text-center">
            <BookTemplate className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Kein Unternehmen ausgewählt</h2>
            <p className="text-slate-500">Bitte wählen Sie ein Unternehmen aus.</p>
          </Card>
        ) : vorlagen.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Noch keine Vorlagen</h2>
            <p className="text-slate-500 mb-4">
              Erstellen Sie Vorlagen für wiederkehrende Buchungen und sparen Sie Zeit.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Vorlage erstellen
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(gruppiertVorlagen).map(([kategorie, vorlagenListe]) => {
              const config = KATEGORIE_CONFIG[kategorie as Kategorie];
              const Icon = config.icon;

              return (
                <Card key={kategorie}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config.farbe}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.farbe }} />
                      </div>
                      {config.label}
                      <Badge variant="secondary" className="ml-2">
                        {vorlagenListe.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vorlagenListe.map((vorlage) => (
                        <div
                          key={vorlage.id}
                          className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{vorlage.name}</h3>
                                {vorlage.betrag && (
                                  <Badge variant="outline" className="font-mono">
                                    {formatCurrency(parseFloat(vorlage.betrag))} €
                                  </Badge>
                                )}
                              </div>
                              {vorlage.beschreibung && (
                                <p className="text-sm text-slate-600 mb-2">{vorlage.beschreibung}</p>
                              )}
                              <div className="flex flex-wrap gap-2 text-sm">
                                <Badge variant="secondary">Soll: {vorlage.sollKonto}</Badge>
                                <Badge variant="secondary">Haben: {vorlage.habenKonto}</Badge>
                                <Badge variant="secondary">USt: {vorlage.ustSatz}%</Badge>
                                {vorlage.geschaeftspartner && (
                                  <Badge variant="outline">{vorlage.geschaeftspartner}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 mt-2 italic">{vorlage.buchungstext}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(vorlage)}
                                title="Bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDuplicate(vorlage)}
                                title="Duplizieren"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(vorlage)}
                                title="Löschen"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVorlage ? "Vorlage bearbeiten" : "Neue Vorlage erstellen"}</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine Vorlage für wiederkehrende Buchungen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Büromiete Januar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kategorie">Kategorie *</Label>
                  <Select
                    value={formData.kategorie}
                    onValueChange={(v: Kategorie) => setFormData({ ...formData, kategorie: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(KATEGORIE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beschreibung">Beschreibung</Label>
                <Textarea
                  id="beschreibung"
                  value={formData.beschreibung}
                  onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                  placeholder="Optionale Beschreibung"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sollKonto">Soll-Konto *</Label>
                  <Input
                    id="sollKonto"
                    value={formData.sollKonto}
                    onChange={(e) => setFormData({ ...formData, sollKonto: e.target.value })}
                    placeholder="z.B. 4910"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="habenKonto">Haben-Konto *</Label>
                  <Input
                    id="habenKonto"
                    value={formData.habenKonto}
                    onChange={(e) => setFormData({ ...formData, habenKonto: e.target.value })}
                    placeholder="z.B. 1200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ustSatz">USt-Satz (%)</Label>
                  <Input
                    id="ustSatz"
                    type="number"
                    value={formData.ustSatz}
                    onChange={(e) => setFormData({ ...formData, ustSatz: e.target.value })}
                    placeholder="19"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="betrag">Betrag (€)</Label>
                  <Input
                    id="betrag"
                    type="number"
                    step="0.01"
                    value={formData.betrag}
                    onChange={(e) => setFormData({ ...formData, betrag: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geschaeftspartner">Geschäftspartner</Label>
                  <Input
                    id="geschaeftspartner"
                    value={formData.geschaeftspartner}
                    onChange={(e) => setFormData({ ...formData, geschaeftspartner: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buchungstext">Buchungstext *</Label>
                <Input
                  id="buchungstext"
                  value={formData.buchungstext}
                  onChange={(e) => setFormData({ ...formData, buchungstext: e.target.value })}
                  placeholder="z.B. Miete Büro Januar 2026"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.name ||
                  !formData.sollKonto ||
                  !formData.habenKonto ||
                  !formData.buchungstext ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : editingVorlage ? (
                  "Aktualisieren"
                ) : (
                  "Erstellen"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, vorlage: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie die Vorlage "{deleteDialog.vorlage?.name}" wirklich löschen? Diese Aktion kann nicht
                rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Löschen...
                  </>
                ) : (
                  "Löschen"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
