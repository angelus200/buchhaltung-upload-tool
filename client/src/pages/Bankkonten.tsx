import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Wallet,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface KontoFormProps {
  konto?: any;
  unternehmenId: number;
  suggestedSachkonto?: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function KontoForm({ konto, unternehmenId, suggestedSachkonto, onSave, onCancel }: KontoFormProps) {
  const [formData, setFormData] = useState({
    unternehmenId,
    kontonummer: konto?.kontonummer || "",
    bezeichnung: konto?.bezeichnung || "",
    bankname: konto?.bankname || "",
    iban: konto?.iban || "",
    bic: konto?.bic || "",
    sachkonto: konto?.sachkonto || suggestedSachkonto || "",
    anfangsbestand: konto?.anfangsbestand || "0",
    kontotyp: konto?.kontotyp || "girokonto",
    waehrung: konto?.waehrung || "EUR",
    notizen: konto?.notizen || "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Kontonummer *</Label>
          <Input
            value={formData.kontonummer}
            onChange={(e) => setFormData({ ...formData, kontonummer: e.target.value })}
          />
        </div>
        <div>
          <Label>Sachkonto</Label>
          <Input
            value={formData.sachkonto}
            onChange={(e) => setFormData({ ...formData, sachkonto: e.target.value })}
            placeholder="z.B. 1200, 1800"
          />
        </div>
        <div className="col-span-2">
          <Label>Bezeichnung *</Label>
          <Input
            value={formData.bezeichnung}
            onChange={(e) => setFormData({ ...formData, bezeichnung: e.target.value })}
            placeholder="z.B. Geschäftskonto Sparkasse"
          />
        </div>
        <div>
          <Label>Bankname</Label>
          <Input
            value={formData.bankname}
            onChange={(e) => setFormData({ ...formData, bankname: e.target.value })}
          />
        </div>
        <div>
          <Label>Kontotyp</Label>
          <Select
            value={formData.kontotyp}
            onValueChange={(v) => setFormData({ ...formData, kontotyp: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="girokonto">Girokonto</SelectItem>
              <SelectItem value="sparkonto">Sparkonto</SelectItem>
              <SelectItem value="festgeld">Festgeld</SelectItem>
              <SelectItem value="kreditkarte">Kreditkarte</SelectItem>
              <SelectItem value="sonstig">Sonstig</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>IBAN</Label>
          <Input
            value={formData.iban}
            onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
            placeholder="DE89 3704 0044 0532 0130 00"
          />
        </div>
        <div>
          <Label>BIC</Label>
          <Input
            value={formData.bic}
            onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
            placeholder="COBADEFFXXX"
          />
        </div>
        <div>
          <Label>Anfangsbestand (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.anfangsbestand}
            onChange={(e) => setFormData({ ...formData, anfangsbestand: e.target.value })}
          />
        </div>
        <div>
          <Label>Währung</Label>
          <Select
            value={formData.waehrung}
            onValueChange={(v) => setFormData({ ...formData, waehrung: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Notizen</Label>
        <Textarea
          value={formData.notizen}
          onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={() => onSave(formData)}>
          {konto ? "Speichern" : "Erstellen"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Bankkonten() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKonto, setSelectedKonto] = useState<any>(null);
  const [stichtag, setStichtag] = useState(new Date().toISOString().split("T")[0]);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdKonto, setCreatedKonto] = useState<any>(null);

  // Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const kontenQuery = trpc.jahresabschluss.bankkonten.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0, stichtag },
    { enabled: !!selectedUnternehmen }
  );

  const suggestedSachkontoQuery = trpc.jahresabschluss.bankkonten.suggestNextSachkonto.useQuery(
    { unternehmenId: selectedUnternehmen || 0 },
    { enabled: !!selectedUnternehmen && createDialogOpen }
  );

  // Mutations
  const createMutation = trpc.jahresabschluss.bankkonten.create.useMutation({
    onSuccess: async (result, variables) => {
      // Konto neu laden um alle Details zu haben
      await kontenQuery.refetch();

      // Details des erstellten Kontos speichern
      setCreatedKonto({
        ...variables,
        id: result.id,
      });

      setCreateDialogOpen(false);
      setSuccessDialogOpen(true);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.jahresabschluss.bankkonten.update.useMutation({
    onSuccess: () => {
      toast.success("Bankkonto aktualisiert");
      kontenQuery.refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.jahresabschluss.bankkonten.delete.useMutation({
    onSuccess: () => {
      toast.success("Bankkonto gelöscht");
      kontenQuery.refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Set default Unternehmen
  useEffect(() => {
    if (unternehmenQuery.data && unternehmenQuery.data.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenQuery.data[0].unternehmen.id);
    }
  }, [unternehmenQuery.data, selectedUnternehmen]);

  const konten = kontenQuery.data || [];
  const gesamtsaldo = konten.reduce((sum: number, k: any) => sum + (k.saldo || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Bankkonten" subtitle="Kontenverwaltung und Saldo-Übersicht" />

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

          <div className="flex items-center gap-2">
            <Label className="text-sm">Stichtag:</Label>
            <Input
              type="date"
              value={stichtag}
              onChange={(e) => setStichtag(e.target.value)}
              className="w-48"
            />
          </div>

          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="ml-auto"
            disabled={!selectedUnternehmen}
          >
            <Plus className="w-4 h-4 mr-2" />
            Neues Konto
          </Button>
        </div>

        {/* Gesamtsaldo Karte */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamtsaldo (alle Konten)</p>
                <p className="text-3xl font-bold tabular-nums font-mono flex items-center gap-2">
                  {formatCurrency(gesamtsaldo)} €
                  {gesamtsaldo >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Konten gesamt</p>
                <p className="text-3xl font-bold">{konten.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kontenliste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Bankkonten
            </CardTitle>
            <CardDescription>
              Übersicht aller Bankkonten mit automatischer Saldo-Berechnung
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kontenQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : konten.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Bankkonten erfasst
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>IBAN</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Anfangsbestand</TableHead>
                    <TableHead className="text-right">Buchungen</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {konten.map((k: any) => (
                    <TableRow key={k.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{k.bezeichnung}</div>
                          <div className="text-xs text-muted-foreground">
                            {k.kontonummer}
                            {k.sachkonto && ` • SK: ${k.sachkonto}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{k.bankname || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {k.iban || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{k.kontotyp}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(parseFloat(k.anfangsbestand || "0"))} €
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{k.buchungenAnzahl || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span className={k.saldo >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(k.saldo || 0)} €
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedKonto(k);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedKonto(k);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Bankkonto anlegen</DialogTitle>
          </DialogHeader>
          {selectedUnternehmen && (
            <KontoForm
              unternehmenId={selectedUnternehmen}
              suggestedSachkonto={suggestedSachkontoQuery.data}
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setCreateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog - Vorlage anzeigen */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Wallet className="w-5 h-5" />
              Bankkonto erfolgreich erstellt
            </DialogTitle>
          </DialogHeader>
          {createdKonto && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-green-50/50 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Kontonummer</p>
                    <p className="font-medium">{createdKonto.kontonummer}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sachkonto</p>
                    <p className="font-mono font-bold text-green-700">
                      {createdKonto.sachkonto || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Bezeichnung</p>
                    <p className="font-medium">{createdKonto.bezeichnung}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bankname</p>
                    <p className="font-medium">{createdKonto.bankname || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kontotyp</p>
                    <Badge variant="outline">{createdKonto.kontotyp}</Badge>
                  </div>
                  {createdKonto.iban && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">IBAN</p>
                      <p className="font-mono text-xs">{createdKonto.iban}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Anfangsbestand</p>
                    <p className="font-mono font-bold">
                      {formatCurrency(parseFloat(createdKonto.anfangsbestand || "0"))} €
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Währung</p>
                    <p className="font-medium">{createdKonto.waehrung}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-900">
                  💡 <strong>Hinweis:</strong> Das Sachkonto <strong className="font-mono">{createdKonto.sachkonto}</strong> wurde automatisch aus dem Bereich 1200-1299 vorgeschlagen.
                  Sie können es jederzeit anpassen.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              setSuccessDialogOpen(false);
              setCreatedKonto(null);
              toast.success("Bankkonto wurde erfolgreich angelegt");
            }}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bankkonto bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedKonto && (
            <KontoForm
              konto={selectedKonto}
              unternehmenId={selectedKonto.unternehmenId}
              onSave={(data) => updateMutation.mutate({ id: selectedKonto.id, ...data })}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bankkonto löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{selectedKonto?.bezeichnung}" wirklich löschen? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ id: selectedKonto?.id })}
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
