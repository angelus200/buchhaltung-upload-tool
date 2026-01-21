import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface PositionFormProps {
  position?: any;
  unternehmenId: number;
  jahr: number;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function PositionForm({ position, unternehmenId, jahr, onSave, onCancel }: PositionFormProps) {
  const [formData, setFormData] = useState({
    unternehmenId,
    jahr,
    sachkonto: position?.sachkonto || "",
    kontobezeichnung: position?.kontobezeichnung || "",
    sollbetrag: position?.sollbetrag || "0",
    habenbetrag: position?.habenbetrag || "0",
    notizen: position?.notizen || "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Sachkonto *</Label>
          <Input
            value={formData.sachkonto}
            onChange={(e) => setFormData({ ...formData, sachkonto: e.target.value })}
          />
        </div>
        <div>
          <Label>Kontobezeichnung</Label>
          <Input
            value={formData.kontobezeichnung}
            onChange={(e) => setFormData({ ...formData, kontobezeichnung: e.target.value })}
          />
        </div>
        <div>
          <Label>Soll-Betrag (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.sollbetrag}
            onChange={(e) => setFormData({ ...formData, sollbetrag: e.target.value })}
          />
        </div>
        <div>
          <Label>Haben-Betrag (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.habenbetrag}
            onChange={(e) => setFormData({ ...formData, habenbetrag: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Notizen</Label>
        <Input
          value={formData.notizen}
          onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={() => onSave(formData)}>
          {position ? "Speichern" : "Erstellen"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Eroeffnungsbilanz() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [selectedJahr, setSelectedJahr] = useState(new Date().getFullYear());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [importData, setImportData] = useState<string>("");

  // Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const positionenQuery = trpc.jahresabschluss.eroeffnungsbilanz.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0, jahr: selectedJahr },
    { enabled: !!selectedUnternehmen }
  );

  const summenQuery = trpc.jahresabschluss.eroeffnungsbilanz.summen.useQuery(
    { unternehmenId: selectedUnternehmen || 0, jahr: selectedJahr },
    { enabled: !!selectedUnternehmen }
  );

  // Mutations
  const createMutation = trpc.jahresabschluss.eroeffnungsbilanz.create.useMutation({
    onSuccess: () => {
      toast.success("Position erstellt");
      positionenQuery.refetch();
      summenQuery.refetch();
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.jahresabschluss.eroeffnungsbilanz.update.useMutation({
    onSuccess: () => {
      toast.success("Position aktualisiert");
      positionenQuery.refetch();
      summenQuery.refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.jahresabschluss.eroeffnungsbilanz.delete.useMutation({
    onSuccess: () => {
      toast.success("Position gelöscht");
      positionenQuery.refetch();
      summenQuery.refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const bulkImportMutation = trpc.jahresabschluss.eroeffnungsbilanz.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} Positionen importiert`);
      positionenQuery.refetch();
      summenQuery.refetch();
      setImportDialogOpen(false);
      setImportData("");
    },
    onError: (error) => {
      toast.error(`Import-Fehler: ${error.message}`);
    },
  });

  // Set default Unternehmen
  useEffect(() => {
    if (unternehmenQuery.data && unternehmenQuery.data.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenQuery.data[0].unternehmen.id);
    }
  }, [unternehmenQuery.data, selectedUnternehmen]);

  const positionen = positionenQuery.data || [];
  const summen = summenQuery.data || {
    sollSumme: 0,
    habenSumme: 0,
    differenz: 0,
    ausgeglichen: false,
  };

  const handleImport = () => {
    if (!importData.trim()) {
      toast.error("Keine Daten zum Importieren");
      return;
    }

    try {
      // Parse CSV (Format: sachkonto;kontobezeichnung;sollbetrag;habenbetrag)
      const lines = importData.trim().split("\n");
      const positions = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [sachkonto, kontobezeichnung, sollbetrag, habenbetrag] = line
            .split(";")
            .map((s) => s.trim());
          return {
            sachkonto,
            kontobezeichnung: kontobezeichnung || "",
            sollbetrag: sollbetrag || "0",
            habenbetrag: habenbetrag || "0",
          };
        });

      if (positions.length === 0) {
        toast.error("Keine gültigen Daten gefunden");
        return;
      }

      bulkImportMutation.mutate({
        unternehmenId: selectedUnternehmen!,
        jahr: selectedJahr,
        positionen: positions,
        importQuelle: "datev",
      });
    } catch (error: any) {
      toast.error(`Fehler beim Parsen: ${error.message}`);
    }
  };

  const exportCSV = () => {
    if (positionen.length === 0) {
      toast.error("Keine Daten zum Exportieren");
      return;
    }

    const csv = [
      "Sachkonto;Kontobezeichnung;Soll-Betrag;Haben-Betrag;Notizen",
      ...positionen.map((p: any) =>
        [
          p.sachkonto,
          p.kontobezeichnung || "",
          formatCurrency(parseFloat(p.sollbetrag || "0")),
          formatCurrency(parseFloat(p.habenbetrag || "0")),
          p.notizen || "",
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Eroeffnungsbilanz_${selectedJahr}.csv`;
    link.click();
    toast.success("Export erfolgreich");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Eröffnungsbilanz"
        subtitle="Anfangsbestände für das Wirtschaftsjahr"
      />

      <main className="container py-8">
        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <Select
            value={String(selectedUnternehmen || "")}
            onValueChange={(v) => setSelectedUnternehmen(Number(v))}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Unternehmen wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmenQuery.data?.map((u) => (
                <SelectItem key={u.unternehmen.id} value={String(u.unternehmen.id)}>
                  {u.unternehmen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedJahr)} onValueChange={(v) => setSelectedJahr(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setImportDialogOpen(true)} disabled={!selectedUnternehmen}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>

          <Button variant="outline" onClick={exportCSV} disabled={positionen.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="ml-auto"
            disabled={!selectedUnternehmen}
          >
            <Plus className="w-4 h-4 mr-2" />
            Neue Position
          </Button>
        </div>

        {/* Bilanz-Status Karte */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Soll-Summe</p>
                <p className="text-2xl font-bold tabular-nums font-mono">
                  {formatCurrency(summen.sollSumme)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Haben-Summe</p>
                <p className="text-2xl font-bold tabular-nums font-mono">
                  {formatCurrency(summen.habenSumme)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Differenz</p>
                <p
                  className={`text-2xl font-bold tabular-nums font-mono ${
                    summen.ausgeglichen ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(Math.abs(summen.differenz))} €
                </p>
              </div>
              <div className="flex items-center justify-end">
                {summen.ausgeglichen ? (
                  <Badge variant="default" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Ausgeglichen
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Nicht ausgeglichen
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Positionenliste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Eröffnungsbilanz {selectedJahr}
            </CardTitle>
            <CardDescription>
              Anfangsbestände aller Sachkonten zum Jahresbeginn
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positionenQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : positionen.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Positionen erfasst
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sachkonto</TableHead>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead className="text-right">Soll</TableHead>
                    <TableHead className="text-right">Haben</TableHead>
                    <TableHead>Notizen</TableHead>
                    <TableHead className="w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positionen.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-medium">{p.sachkonto}</TableCell>
                      <TableCell>{p.kontobezeichnung || "-"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(p.sollbetrag || "0") > 0
                          ? `${formatCurrency(parseFloat(p.sollbetrag))} €`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(p.habenbetrag || "0") > 0
                          ? `${formatCurrency(parseFloat(p.habenbetrag))} €`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.notizen || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPosition(p);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPosition(p);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Position anlegen</DialogTitle>
          </DialogHeader>
          {selectedUnternehmen && (
            <PositionForm
              unternehmenId={selectedUnternehmen}
              jahr={selectedJahr}
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setCreateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Position bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedPosition && (
            <PositionForm
              position={selectedPosition}
              unternehmenId={selectedPosition.unternehmenId}
              jahr={selectedPosition.jahr}
              onSave={(data) => updateMutation.mutate({ id: selectedPosition.id, ...data })}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Position löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Position "{selectedPosition?.sachkonto}" wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ id: selectedPosition?.id })}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Eröffnungsbilanz importieren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>CSV-Daten (Format: sachkonto;bezeichnung;soll;haben)</Label>
              <textarea
                className="w-full h-64 p-2 border rounded font-mono text-sm"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="1000;Kasse;5000.00;0.00&#10;1200;Bank;25000.00;0.00&#10;1800;Bankkonto 2;10000.00;0.00"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Beispiel: 1000;Kasse;5000.00;0.00
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importData.trim() || bulkImportMutation.isPending}
            >
              {bulkImportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importiere...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
