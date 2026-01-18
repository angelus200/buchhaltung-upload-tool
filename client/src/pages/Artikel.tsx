import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// Kategorie-Labels
const KATEGORIE_LABELS: Record<string, string> = {
  rohstoff: "Rohstoff",
  halbfertig: "Halbfertige Erzeugnisse",
  fertigware: "Fertigware",
  handelsware: "Handelsware",
  verbrauchsmaterial: "Verbrauchsmaterial",
};

// Einheit-Labels
const EINHEIT_LABELS: Record<string, string> = {
  stueck: "Stück",
  kg: "kg",
  liter: "Liter",
  meter: "Meter",
  karton: "Karton",
};

export default function Artikel() {
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArtikel, setEditingArtikel] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [kategorieFilter, setKategorieFilter] = useState<string>("all");
  const [aktivFilter, setAktivFilter] = useState<string>("true");

  // Form state
  const [formData, setFormData] = useState({
    artikelnummer: "",
    bezeichnung: "",
    beschreibung: "",
    kategorie: "handelsware" as const,
    einheit: "stueck" as const,
    einkaufspreis: "",
    verkaufspreis: "",
    mindestbestand: "",
    zielbestand: "",
    lieferantId: undefined as number | undefined,
    sachkontoId: undefined as number | undefined,
    aktiv: true,
  });

  // Load selected Unternehmen from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    if (saved) {
      setSelectedUnternehmenId(parseInt(saved));
    }
  }, []);

  // tRPC queries
  const artikelQuery = trpc.inventur.artikel.list.useQuery(
    {
      unternehmenId: selectedUnternehmenId!,
      kategorie: kategorieFilter !== "all" ? (kategorieFilter as any) : undefined,
      aktiv: aktivFilter === "all" ? undefined : aktivFilter === "true",
    },
    { enabled: !!selectedUnternehmenId }
  );

  const kreditorenQuery = trpc.stammdaten.kreditoren.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // tRPC mutations
  const createMutation = trpc.inventur.artikel.create.useMutation({
    onSuccess: () => {
      toast.success("Artikel erfolgreich erstellt");
      artikelQuery.refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });

  const updateMutation = trpc.inventur.artikel.update.useMutation({
    onSuccess: () => {
      toast.success("Artikel erfolgreich aktualisiert");
      artikelQuery.refetch();
      setIsEditDialogOpen(false);
      setEditingArtikel(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });

  const deleteMutation = trpc.inventur.artikel.delete.useMutation({
    onSuccess: () => {
      toast.success("Artikel erfolgreich deaktiviert");
      artikelQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      artikelnummer: "",
      bezeichnung: "",
      beschreibung: "",
      kategorie: "handelsware",
      einheit: "stueck",
      einkaufspreis: "",
      verkaufspreis: "",
      mindestbestand: "",
      zielbestand: "",
      lieferantId: undefined,
      sachkontoId: undefined,
      aktiv: true,
    });
  };

  const handleCreate = () => {
    if (!selectedUnternehmenId) {
      toast.error("Bitte wählen Sie ein Unternehmen aus");
      return;
    }

    createMutation.mutate({
      unternehmenId: selectedUnternehmenId,
      ...formData,
    });
  };

  const handleUpdate = () => {
    if (!editingArtikel) return;

    updateMutation.mutate({
      id: editingArtikel.id,
      ...formData,
    });
  };

  const handleEdit = (artikel: any) => {
    setEditingArtikel(artikel);
    setFormData({
      artikelnummer: artikel.artikelnummer || "",
      bezeichnung: artikel.bezeichnung || "",
      beschreibung: artikel.beschreibung || "",
      kategorie: artikel.kategorie,
      einheit: artikel.einheit,
      einkaufspreis: artikel.einkaufspreis || "",
      verkaufspreis: artikel.verkaufspreis || "",
      mindestbestand: artikel.mindestbestand || "",
      zielbestand: artikel.zielbestand || "",
      lieferantId: artikel.lieferantId || undefined,
      sachkontoId: artikel.sachkontoId || undefined,
      aktiv: artikel.aktiv,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diesen Artikel wirklich deaktivieren?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredArtikeln = (artikelQuery.data || []).filter((artikel) => {
    const matchesSearch =
      searchQuery === "" ||
      artikel.artikelnummer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artikel.bezeichnung.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (!selectedUnternehmenId) {
    return (
      <>
        <AppHeader />
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Kein Unternehmen ausgewählt
              </CardTitle>
              <CardDescription>
                Bitte wählen Sie ein Unternehmen aus, um die Artikelverwaltung zu verwenden.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Artikelverwaltung
                </CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre Produktstammdaten für die Lagerverwaltung
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Neuer Artikel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter und Suche */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Artikel suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={kategorieFilter} onValueChange={setKategorieFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  <SelectItem value="rohstoff">Rohstoff</SelectItem>
                  <SelectItem value="halbfertig">Halbfertig</SelectItem>
                  <SelectItem value="fertigware">Fertigware</SelectItem>
                  <SelectItem value="handelsware">Handelsware</SelectItem>
                  <SelectItem value="verbrauchsmaterial">Verbrauchsmaterial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={aktivFilter} onValueChange={setAktivFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="true">Aktiv</SelectItem>
                  <SelectItem value="false">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Artikel-Tabelle */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artikelnummer</TableHead>
                  <TableHead>Bezeichnung</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead className="text-right">Einkaufspreis</TableHead>
                  <TableHead className="text-right">Verkaufspreis</TableHead>
                  <TableHead className="text-right">Mindestbestand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artikelQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Lade Artikel...
                    </TableCell>
                  </TableRow>
                ) : filteredArtikeln.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Keine Artikel gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArtikeln.map((artikel) => (
                    <TableRow key={artikel.id}>
                      <TableCell className="font-mono">{artikel.artikelnummer}</TableCell>
                      <TableCell>{artikel.bezeichnung}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {KATEGORIE_LABELS[artikel.kategorie] || artikel.kategorie}
                        </Badge>
                      </TableCell>
                      <TableCell>{EINHEIT_LABELS[artikel.einheit] || artikel.einheit}</TableCell>
                      <TableCell className="text-right">
                        {artikel.einkaufspreis
                          ? `${parseFloat(artikel.einkaufspreis).toFixed(2)} €`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {artikel.verkaufspreis
                          ? `${parseFloat(artikel.verkaufspreis).toFixed(2)} €`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {artikel.mindestbestand
                          ? parseFloat(artikel.mindestbestand).toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {artikel.aktiv ? (
                          <Badge variant="default" className="bg-green-500">
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(artikel)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(artikel.id)}
                            disabled={!artikel.aktiv}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuer Artikel</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Artikel für die Lagerverwaltung
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="artikelnummer">Artikelnummer *</Label>
              <Input
                id="artikelnummer"
                value={formData.artikelnummer}
                onChange={(e) => setFormData({ ...formData, artikelnummer: e.target.value })}
                placeholder="z.B. ART-001"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="bezeichnung">Bezeichnung *</Label>
              <Input
                id="bezeichnung"
                value={formData.bezeichnung}
                onChange={(e) => setFormData({ ...formData, bezeichnung: e.target.value })}
                placeholder="Artikelbezeichnung"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                value={formData.beschreibung}
                onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                placeholder="Optionale Beschreibung"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="kategorie">Kategorie *</Label>
              <Select
                value={formData.kategorie}
                onValueChange={(value: any) => setFormData({ ...formData, kategorie: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rohstoff">Rohstoff</SelectItem>
                  <SelectItem value="halbfertig">Halbfertig</SelectItem>
                  <SelectItem value="fertigware">Fertigware</SelectItem>
                  <SelectItem value="handelsware">Handelsware</SelectItem>
                  <SelectItem value="verbrauchsmaterial">Verbrauchsmaterial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="einheit">Einheit *</Label>
              <Select
                value={formData.einheit}
                onValueChange={(value: any) => setFormData({ ...formData, einheit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stueck">Stück</SelectItem>
                  <SelectItem value="kg">Kilogramm</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="meter">Meter</SelectItem>
                  <SelectItem value="karton">Karton</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="einkaufspreis">Einkaufspreis (€)</Label>
              <Input
                id="einkaufspreis"
                type="number"
                step="0.01"
                value={formData.einkaufspreis}
                onChange={(e) => setFormData({ ...formData, einkaufspreis: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="verkaufspreis">Verkaufspreis (€)</Label>
              <Input
                id="verkaufspreis"
                type="number"
                step="0.01"
                value={formData.verkaufspreis}
                onChange={(e) => setFormData({ ...formData, verkaufspreis: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="mindestbestand">Mindestbestand</Label>
              <Input
                id="mindestbestand"
                type="number"
                step="0.01"
                value={formData.mindestbestand}
                onChange={(e) => setFormData({ ...formData, mindestbestand: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="zielbestand">Zielbestand</Label>
              <Input
                id="zielbestand"
                type="number"
                step="0.01"
                value={formData.zielbestand}
                onChange={(e) => setFormData({ ...formData, zielbestand: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.artikelnummer || !formData.bezeichnung}
            >
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Artikel bearbeiten</DialogTitle>
            <DialogDescription>Artikeldaten anpassen</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="edit-artikelnummer">Artikelnummer *</Label>
              <Input
                id="edit-artikelnummer"
                value={formData.artikelnummer}
                onChange={(e) => setFormData({ ...formData, artikelnummer: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-bezeichnung">Bezeichnung *</Label>
              <Input
                id="edit-bezeichnung"
                value={formData.bezeichnung}
                onChange={(e) => setFormData({ ...formData, bezeichnung: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-beschreibung">Beschreibung</Label>
              <Textarea
                id="edit-beschreibung"
                value={formData.beschreibung}
                onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-kategorie">Kategorie *</Label>
              <Select
                value={formData.kategorie}
                onValueChange={(value: any) => setFormData({ ...formData, kategorie: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rohstoff">Rohstoff</SelectItem>
                  <SelectItem value="halbfertig">Halbfertig</SelectItem>
                  <SelectItem value="fertigware">Fertigware</SelectItem>
                  <SelectItem value="handelsware">Handelsware</SelectItem>
                  <SelectItem value="verbrauchsmaterial">Verbrauchsmaterial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-einheit">Einheit *</Label>
              <Select
                value={formData.einheit}
                onValueChange={(value: any) => setFormData({ ...formData, einheit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stueck">Stück</SelectItem>
                  <SelectItem value="kg">Kilogramm</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="meter">Meter</SelectItem>
                  <SelectItem value="karton">Karton</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-einkaufspreis">Einkaufspreis (€)</Label>
              <Input
                id="edit-einkaufspreis"
                type="number"
                step="0.01"
                value={formData.einkaufspreis}
                onChange={(e) => setFormData({ ...formData, einkaufspreis: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-verkaufspreis">Verkaufspreis (€)</Label>
              <Input
                id="edit-verkaufspreis"
                type="number"
                step="0.01"
                value={formData.verkaufspreis}
                onChange={(e) => setFormData({ ...formData, verkaufspreis: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-mindestbestand">Mindestbestand</Label>
              <Input
                id="edit-mindestbestand"
                type="number"
                step="0.01"
                value={formData.mindestbestand}
                onChange={(e) => setFormData({ ...formData, mindestbestand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-zielbestand">Zielbestand</Label>
              <Input
                id="edit-zielbestand"
                type="number"
                step="0.01"
                value={formData.zielbestand}
                onChange={(e) => setFormData({ ...formData, zielbestand: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.artikelnummer || !formData.bezeichnung}
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
