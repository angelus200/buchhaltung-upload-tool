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
  Calculator,
  Download,
  Loader2,
  Building,
} from "lucide-react";

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE");
}

interface AnlageFormProps {
  anlage?: any;
  unternehmenId: number;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function AnlageForm({ anlage, unternehmenId, onSave, onCancel }: AnlageFormProps) {
  const [formData, setFormData] = useState({
    unternehmenId,
    kontonummer: anlage?.kontonummer || "",
    bezeichnung: anlage?.bezeichnung || "",
    kategorie: anlage?.kategorie || "",
    anschaffungsdatum: anlage?.anschaffungsdatum
      ? new Date(anlage.anschaffungsdatum).toISOString().split("T")[0]
      : "",
    anschaffungskosten: anlage?.anschaffungskosten || "",
    nutzungsdauer: anlage?.nutzungsdauer || "",
    abschreibungsmethode: anlage?.abschreibungsmethode || "linear",
    restwert: anlage?.restwert || "0",
    sachkonto: anlage?.sachkonto || "",
    standort: anlage?.standort || "",
    inventarnummer: anlage?.inventarnummer || "",
    seriennummer: anlage?.seriennummer || "",
    notizen: anlage?.notizen || "",
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
            placeholder="z.B. 0300"
          />
        </div>
        <div className="col-span-2">
          <Label>Bezeichnung *</Label>
          <Input
            value={formData.bezeichnung}
            onChange={(e) => setFormData({ ...formData, bezeichnung: e.target.value })}
          />
        </div>
        <div>
          <Label>Kategorie</Label>
          <Input
            value={formData.kategorie}
            onChange={(e) => setFormData({ ...formData, kategorie: e.target.value })}
            placeholder="z.B. Fahrzeuge, Büroausstattung"
          />
        </div>
        <div>
          <Label>Anschaffungsdatum</Label>
          <Input
            type="date"
            value={formData.anschaffungsdatum}
            onChange={(e) =>
              setFormData({ ...formData, anschaffungsdatum: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Anschaffungskosten (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.anschaffungskosten}
            onChange={(e) =>
              setFormData({ ...formData, anschaffungskosten: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Nutzungsdauer (Jahre)</Label>
          <Input
            type="number"
            value={formData.nutzungsdauer}
            onChange={(e) =>
              setFormData({ ...formData, nutzungsdauer: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Abschreibungsmethode</Label>
          <Select
            value={formData.abschreibungsmethode}
            onValueChange={(v) =>
              setFormData({ ...formData, abschreibungsmethode: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="degressiv">Degressiv</SelectItem>
              <SelectItem value="keine">Keine AfA</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Restwert (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.restwert}
            onChange={(e) => setFormData({ ...formData, restwert: e.target.value })}
          />
        </div>
        <div>
          <Label>Standort</Label>
          <Input
            value={formData.standort}
            onChange={(e) => setFormData({ ...formData, standort: e.target.value })}
          />
        </div>
        <div>
          <Label>Inventarnummer</Label>
          <Input
            value={formData.inventarnummer}
            onChange={(e) =>
              setFormData({ ...formData, inventarnummer: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Seriennummer</Label>
          <Input
            value={formData.seriennummer}
            onChange={(e) =>
              setFormData({ ...formData, seriennummer: e.target.value })
            }
          />
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
          {anlage ? "Speichern" : "Erstellen"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Anlagevermoegen() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [afaDialogOpen, setAfaDialogOpen] = useState(false);
  const [selectedAnlage, setSelectedAnlage] = useState<any>(null);
  const [afaData, setAfaData] = useState<any>(null);
  const [showAnlagenspiegel, setShowAnlagenspiegel] = useState(false);
  const [spiegelJahr, setSpiegelJahr] = useState(new Date().getFullYear());

  // Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const anlagenQuery = trpc.jahresabschluss.anlagevermoegen.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0 },
    { enabled: !!selectedUnternehmen }
  );

  const anlagenspiegelQuery = trpc.jahresabschluss.anlagevermoegen.anlagenspiegel.useQuery(
    { unternehmenId: selectedUnternehmen || 0, jahr: spiegelJahr },
    { enabled: !!selectedUnternehmen && showAnlagenspiegel }
  );

  // Mutations
  const createMutation = trpc.jahresabschluss.anlagevermoegen.create.useMutation({
    onSuccess: () => {
      toast.success("Anlagegut erstellt");
      anlagenQuery.refetch();
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.jahresabschluss.anlagevermoegen.update.useMutation({
    onSuccess: () => {
      toast.success("Anlagegut aktualisiert");
      anlagenQuery.refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.jahresabschluss.anlagevermoegen.delete.useMutation({
    onSuccess: () => {
      toast.success("Anlagegut gelöscht");
      anlagenQuery.refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const berechneAfaMutation = trpc.jahresabschluss.anlagevermoegen.berechneAfa.useQuery(
    {
      id: selectedAnlage?.id || 0,
      stichtag: new Date().toISOString().split("T")[0],
    },
    {
      enabled: false,
    }
  );

  // Set default Unternehmen
  useEffect(() => {
    if (unternehmenQuery.data && unternehmenQuery.data.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenQuery.data[0].unternehmen.id);
    }
  }, [unternehmenQuery.data, selectedUnternehmen]);

  const anlagen = anlagenQuery.data || [];
  const anlagenspiegel = anlagenspiegelQuery.data || [];

  const handleAfaBerechnung = async (anlage: any) => {
    setSelectedAnlage(anlage);
    const result = await berechneAfaMutation.refetch();
    setAfaData(result.data);
    setAfaDialogOpen(true);
  };

  const exportAnlagenspiegel = () => {
    if (anlagenspiegel.length === 0) {
      toast.error("Keine Daten zum Exportieren");
      return;
    }

    const csv = [
      "Kontonummer;Bezeichnung;Kategorie;Anschaffungsdatum;Anschaffungskosten;Nutzungsdauer;Methode;Jahres-AfA;Abgeschrieben;Restwert",
      ...anlagenspiegel.map((a: any) =>
        [
          a.kontonummer,
          a.bezeichnung,
          a.kategorie || "",
          formatDate(a.anschaffungsdatum),
          formatCurrency(a.anschaffungskosten),
          a.nutzungsdauer || "",
          a.abschreibungsmethode || "",
          formatCurrency(a.jahresAfa),
          formatCurrency(a.abgeschrieben),
          formatCurrency(a.restwert),
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Anlagenspiegel_${spiegelJahr}.csv`;
    link.click();
    toast.success("Anlagenspiegel exportiert");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Anlagevermögen" subtitle="Verwaltung und AfA-Berechnung" />

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

          <Button
            variant={showAnlagenspiegel ? "default" : "outline"}
            onClick={() => setShowAnlagenspiegel(!showAnlagenspiegel)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Anlagenspiegel
          </Button>

          {showAnlagenspiegel && (
            <>
              <Select value={String(spiegelJahr)} onValueChange={(v) => setSpiegelJahr(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportAnlagenspiegel}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </>
          )}

          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="ml-auto"
            disabled={!selectedUnternehmen}
          >
            <Plus className="w-4 h-4 mr-2" />
            Neues Anlagegut
          </Button>
        </div>

        {/* Anlagenliste / Anlagenspiegel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              {showAnlagenspiegel ? `Anlagenspiegel ${spiegelJahr}` : "Anlagevermögen"}
            </CardTitle>
            <CardDescription>
              {showAnlagenspiegel
                ? "Übersicht aller Anlagegüter mit AfA-Berechnung"
                : "Alle erfassten Anlagegüter"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {anlagenQuery.isLoading || (showAnlagenspiegel && anlagenspiegelQuery.isLoading) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : showAnlagenspiegel ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Anschaffung</TableHead>
                    <TableHead className="text-right">AK</TableHead>
                    <TableHead className="text-center">ND</TableHead>
                    <TableHead className="text-right">Jahres-AfA</TableHead>
                    <TableHead className="text-right">Abgeschrieben</TableHead>
                    <TableHead className="text-right">Restwert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anlagenspiegel.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{a.bezeichnung}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.kontonummer}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{a.kategorie || "-"}</TableCell>
                      <TableCell>{formatDate(a.anschaffungsdatum)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(a.anschaffungskosten)} €
                      </TableCell>
                      <TableCell className="text-center">
                        {a.nutzungsdauer ? `${a.nutzungsdauer}J` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(a.jahresAfa)} €
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(a.abgeschrieben)} €
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(a.restwert)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : anlagen.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Anlagegüter erfasst
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Anschaffung</TableHead>
                    <TableHead className="text-right">AK</TableHead>
                    <TableHead>Methode</TableHead>
                    <TableHead className="w-[150px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anlagen.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{a.bezeichnung}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.kontonummer}
                            {a.inventarnummer && ` • Inv: ${a.inventarnummer}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{a.kategorie || "-"}</TableCell>
                      <TableCell>{formatDate(a.anschaffungsdatum)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {a.anschaffungskosten ? `${formatCurrency(parseFloat(a.anschaffungskosten))} €` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.abschreibungsmethode === "keine" ? "secondary" : "default"}>
                          {a.abschreibungsmethode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAfaBerechnung(a)}
                            disabled={
                              !a.anschaffungsdatum ||
                              !a.anschaffungskosten ||
                              !a.nutzungsdauer ||
                              a.abschreibungsmethode === "keine"
                            }
                          >
                            <Calculator className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAnlage(a);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAnlage(a);
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Anlagegut anlegen</DialogTitle>
          </DialogHeader>
          {selectedUnternehmen && (
            <AnlageForm
              unternehmenId={selectedUnternehmen}
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setCreateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Anlagegut bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedAnlage && (
            <AnlageForm
              anlage={selectedAnlage}
              unternehmenId={selectedAnlage.unternehmenId}
              onSave={(data) => updateMutation.mutate({ id: selectedAnlage.id, ...data })}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anlagegut löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{selectedAnlage?.bezeichnung}" wirklich löschen? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ id: selectedAnlage?.id })}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AfA Dialog */}
      <Dialog open={afaDialogOpen} onOpenChange={setAfaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AfA-Berechnung: {selectedAnlage?.bezeichnung}</DialogTitle>
          </DialogHeader>
          {afaData && !afaData.error ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Methode</Label>
                  <p className="font-medium capitalize">{afaData.methode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Anschaffungskosten</Label>
                  <p className="font-medium">{formatCurrency(afaData.anschaffungskosten)} €</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nutzungsdauer</Label>
                  <p className="font-medium">{afaData.nutzungsdauer} Jahre</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jahres-AfA</Label>
                  <p className="font-medium">{formatCurrency(afaData.jahresAfa)} €</p>
                </div>
                {afaData.monatlicheAfa && (
                  <div>
                    <Label className="text-muted-foreground">Monatliche AfA</Label>
                    <p className="font-medium">{formatCurrency(afaData.monatlicheAfa)} €</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Monate abgeschrieben</Label>
                  <p className="font-medium">{afaData.monateAbgeschrieben}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gesamt abgeschrieben</Label>
                  <p className="font-medium">{formatCurrency(afaData.abgeschrieben)} €</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Aktueller Restwert</Label>
                  <p className="font-medium text-lg">{formatCurrency(afaData.restwert)} €</p>
                </div>
              </div>
              {afaData.vollAbgeschrieben && (
                <Badge variant="secondary" className="w-full justify-center">
                  Vollständig abgeschrieben
                </Badge>
              )}
            </div>
          ) : afaData?.error ? (
            <p className="text-red-500">{afaData.error}</p>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setAfaDialogOpen(false)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
