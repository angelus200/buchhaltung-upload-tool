import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Hash,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface KontierungsregelnProps {
  unternehmenId: number;
}

export default function Kontierungsregeln({ unternehmenId }: KontierungsregelnProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRegel, setEditingRegel] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; regel: any | null }>({
    open: false,
    regel: null,
  });

  const [formData, setFormData] = useState({
    suchbegriff: "",
    sollKonto: "",
    habenKonto: "",
    ustSatz: "19",
    prioritaet: "0",
    beschreibung: "",
    geschaeftspartner: "",
    aktiv: true,
  });

  // Regeln laden
  const regelnQuery = trpc.kontierungsregeln.list.useQuery(
    { unternehmenId, nurAktive: false },
    { enabled: !!unternehmenId }
  );

  // Statistiken laden
  const statistikQuery = trpc.kontierungsregeln.statistics.useQuery(
    { unternehmenId },
    { enabled: !!unternehmenId }
  );

  // Mutations
  const createMutation = trpc.kontierungsregeln.create.useMutation({
    onSuccess: () => {
      toast.success("Regel erstellt");
      setDialogOpen(false);
      resetForm();
      regelnQuery.refetch();
      statistikQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  const updateMutation = trpc.kontierungsregeln.update.useMutation({
    onSuccess: () => {
      toast.success("Regel aktualisiert");
      setDialogOpen(false);
      setEditingRegel(null);
      resetForm();
      regelnQuery.refetch();
      statistikQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  const deleteMutation = trpc.kontierungsregeln.delete.useMutation({
    onSuccess: () => {
      toast.success("Regel gelöscht");
      setDeleteDialog({ open: false, regel: null });
      regelnQuery.refetch();
      statistikQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  const regeln = regelnQuery.data || [];
  const statistik = statistikQuery.data;

  const resetForm = () => {
    setFormData({
      suchbegriff: "",
      sollKonto: "",
      habenKonto: "",
      ustSatz: "19",
      prioritaet: "0",
      beschreibung: "",
      geschaeftspartner: "",
      aktiv: true,
    });
    setEditingRegel(null);
  };

  const handleOpenDialog = (regel?: any) => {
    if (regel) {
      setEditingRegel(regel);
      setFormData({
        suchbegriff: regel.suchbegriff,
        sollKonto: regel.sollKonto,
        habenKonto: regel.habenKonto,
        ustSatz: regel.ustSatz?.toString() || "19",
        prioritaet: regel.prioritaet?.toString() || "0",
        beschreibung: regel.beschreibung || "",
        geschaeftspartner: regel.geschaeftspartner || "",
        aktiv: regel.aktiv,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      unternehmenId,
      suchbegriff: formData.suchbegriff,
      sollKonto: formData.sollKonto,
      habenKonto: formData.habenKonto,
      ustSatz: parseFloat(formData.ustSatz),
      prioritaet: parseInt(formData.prioritaet),
      beschreibung: formData.beschreibung || undefined,
      geschaeftspartner: formData.geschaeftspartner || undefined,
      aktiv: formData.aktiv,
    };

    if (editingRegel) {
      updateMutation.mutate({ id: editingRegel.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiken */}
      {statistik && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statistik.gesamt}</div>
              <p className="text-xs text-muted-foreground">Regeln gesamt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{statistik.aktiv}</div>
              <p className="text-xs text-muted-foreground">Aktiv</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statistik.gesamtVerwendungen}</div>
              <p className="text-xs text-muted-foreground">Verwendungen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statistik.durchschnittErfolgsrate}%</div>
              <p className="text-xs text-muted-foreground">Erfolgsrate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Kontierungsregeln</h3>
          <p className="text-sm text-muted-foreground">
            Automatische Vorschläge basierend auf Buchungstext
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Neue Regel
        </Button>
      </div>

      {/* Regeln Liste */}
      <div className="space-y-3">
        {regeln.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Regeln</h3>
            <p className="text-sm text-slate-500 mb-4">
              Erstellen Sie Regeln für automatische Kontovorschläge
            </p>
            <Button onClick={() => handleOpenDialog()}>Erste Regel erstellen</Button>
          </Card>
        ) : (
          regeln.map((regel: any) => (
            <Card key={regel.id} className={!regel.aktiv ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        "{regel.suchbegriff}"
                      </Badge>
                      {regel.prioritaet > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Priorität {regel.prioritaet}
                        </Badge>
                      )}
                      {regel.verwendungen > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Hash className="w-3 h-3" />
                          {regel.verwendungen}x
                        </Badge>
                      )}
                      {!regel.aktiv && <Badge variant="secondary">Inaktiv</Badge>}
                    </div>

                    {regel.beschreibung && (
                      <p className="text-sm text-muted-foreground">{regel.beschreibung}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline">Soll: {regel.sollKonto}</Badge>
                      <Badge variant="outline">Haben: {regel.habenKonto}</Badge>
                      <Badge variant="outline">USt: {regel.ustSatz}%</Badge>
                      {regel.geschaeftspartner && <Badge variant="outline">{regel.geschaeftspartner}</Badge>}
                    </div>

                    {regel.verwendungen > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {parseFloat(regel.erfolgsrate || "0") >= 80 ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-orange-500" />
                        )}
                        <span>Erfolgsrate: {parseFloat(regel.erfolgsrate || "0").toFixed(1)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(regel)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDialog({ open: true, regel })}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRegel ? "Regel bearbeiten" : "Neue Regel erstellen"}</DialogTitle>
            <DialogDescription>
              Die Regel wird automatisch angewendet, wenn der Suchbegriff im Buchungstext gefunden wird.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="suchbegriff">Suchbegriff *</Label>
                <Input
                  id="suchbegriff"
                  value={formData.suchbegriff}
                  onChange={(e) => setFormData({ ...formData, suchbegriff: e.target.value })}
                  placeholder="z.B. Telekom, Amazon, Miete"
                />
                <p className="text-xs text-muted-foreground">Case-insensitive Suche im Buchungstext</p>
              </div>

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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioritaet">Priorität</Label>
                <Input
                  id="prioritaet"
                  type="number"
                  value={formData.prioritaet}
                  onChange={(e) => setFormData({ ...formData, prioritaet: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Höhere Zahl = höhere Priorität</p>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="geschaeftspartner">Geschäftspartner (optional)</Label>
                <Input
                  id="geschaeftspartner"
                  value={formData.geschaeftspartner}
                  onChange={(e) => setFormData({ ...formData, geschaeftspartner: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="beschreibung">Beschreibung</Label>
                <Textarea
                  id="beschreibung"
                  value={formData.beschreibung}
                  onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2 col-span-2">
                <Switch
                  id="aktiv"
                  checked={formData.aktiv}
                  onCheckedChange={(checked) => setFormData({ ...formData, aktiv: checked })}
                />
                <Label htmlFor="aktiv">Regel aktiv</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.suchbegriff ||
                !formData.sollKonto ||
                !formData.habenKonto ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : editingRegel ? (
                "Aktualisieren"
              ) : (
                "Erstellen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, regel: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Regel für "{deleteDialog.regel?.suchbegriff}" wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.regel && deleteMutation.mutate({ id: deleteDialog.regel.id })}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
