import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Edit,
  Trash2,
  CreditCard,
  Building,
  TrendingUp,
  Wallet,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

// Type icons mapping
const typeIcons = {
  bank: Building,
  kreditkarte: CreditCard,
  broker: TrendingUp,
  kasse: Wallet,
  paypal: CreditCard,
  stripe: CreditCard,
  sonstiges: Wallet,
};

const typeLabels = {
  bank: "Bankkonto",
  kreditkarte: "Kreditkarte",
  broker: "Broker/Depot",
  kasse: "Kasse",
  paypal: "PayPal",
  stripe: "Stripe",
  sonstiges: "Sonstiges",
};

interface FinanzkontoForm {
  id?: number;
  sachkontoId?: number;
  typ: "bank" | "kreditkarte" | "broker" | "kasse" | "paypal" | "stripe" | "sonstiges";
  name: string;
  kontonummer: string;
  iban: string;
  bic: string;
  bankName: string;
  kontoinhaber: string;
  kreditkartenNummer: string;
  kreditlimit: string;
  abrechnungstag: number | null;
  depotNummer: string;
  brokerName: string;
  email: string;
  waehrung: string;
  aktiv: boolean;
  notizen: string;
}

const emptyForm: FinanzkontoForm = {
  typ: "bank",
  name: "",
  kontonummer: "",
  iban: "",
  bic: "",
  bankName: "",
  kontoinhaber: "",
  kreditkartenNummer: "",
  kreditlimit: "",
  abrechnungstag: null,
  depotNummer: "",
  brokerName: "",
  email: "",
  waehrung: "EUR",
  aktiv: true,
  notizen: "",
};

export default function Finanzkonten() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FinanzkontoForm>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedForMigration, setSelectedForMigration] = useState<number[]>([]);

  // Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const finanzkontenQuery = trpc.finanzkonten.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0, nurAktive: false },
    { enabled: !!selectedUnternehmen }
  );

  const migrationQuery = trpc.finanzkonten.autoMigration.berechnen.useQuery(
    { unternehmenId: selectedUnternehmen || 0 },
    { enabled: false }
  );

  // Mutations
  const createMutation = trpc.finanzkonten.create.useMutation({
    onSuccess: () => {
      toast.success("Finanzkonto erfolgreich erstellt");
      setDialogOpen(false);
      setFormData(emptyForm);
      finanzkontenQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });

  const updateMutation = trpc.finanzkonten.update.useMutation({
    onSuccess: () => {
      toast.success("Finanzkonto erfolgreich aktualisiert");
      setDialogOpen(false);
      setFormData(emptyForm);
      setIsEditing(false);
      finanzkontenQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });

  const deleteMutation = trpc.finanzkonten.delete.useMutation({
    onSuccess: () => {
      toast.success("Finanzkonto erfolgreich deaktiviert");
      finanzkontenQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  const migrationMutation = trpc.finanzkonten.autoMigration.migrieren.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setMigrationDialogOpen(false);
      setSelectedForMigration([]);
      finanzkontenQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Fehler bei Migration: ${error.message}`);
    },
  });

  // Set default Unternehmen
  useEffect(() => {
    if (unternehmenQuery.data && unternehmenQuery.data.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenQuery.data[0].unternehmen.id);
    }
  }, [unternehmenQuery.data, selectedUnternehmen]);

  const finanzkonten = finanzkontenQuery.data || [];

  const handleCreate = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEdit = (finanzkonto: any) => {
    setFormData({
      id: finanzkonto.finanzkonto.id,
      sachkontoId: finanzkonto.finanzkonto.sachkontoId || undefined,
      typ: finanzkonto.finanzkonto.typ,
      name: finanzkonto.finanzkonto.name,
      kontonummer: finanzkonto.finanzkonto.kontonummer || "",
      iban: finanzkonto.finanzkonto.iban || "",
      bic: finanzkonto.finanzkonto.bic || "",
      bankName: finanzkonto.finanzkonto.bankName || "",
      kreditkartenNummer: finanzkonto.finanzkonto.kreditkartenNummer || "",
      kreditlimit: finanzkonto.finanzkonto.kreditlimit || "",
      abrechnungstag: finanzkonto.finanzkonto.abrechnungstag || null,
      depotNummer: finanzkonto.finanzkonto.depotNummer || "",
      brokerName: finanzkonto.finanzkonto.brokerName || "",
      email: finanzkonto.finanzkonto.email || "",
      waehrung: finanzkonto.finanzkonto.waehrung,
      aktiv: finanzkonto.finanzkonto.aktiv,
      notizen: finanzkonto.finanzkonto.notizen || "",
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!selectedUnternehmen) {
      toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
      return;
    }
    if (confirm("Möchten Sie dieses Finanzkonto wirklich deaktivieren?")) {
      deleteMutation.mutate({ id, unternehmenId: selectedUnternehmen });
    }
  };

  const handleSubmit = () => {
    if (!selectedUnternehmen) return;

    if (isEditing && formData.id) {
      updateMutation.mutate({
        id: formData.id,
        unternehmenId: selectedUnternehmen, // 🔒 ADDED for security check
        ...formData,
        abrechnungstag: formData.abrechnungstag || undefined,
      });
    } else {
      createMutation.mutate({
        unternehmenId: selectedUnternehmen,
        ...formData,
        abrechnungstag: formData.abrechnungstag || undefined,
      });
    }
  };

  const handleOpenMigration = async () => {
    setMigrationDialogOpen(true);
    const result = await migrationQuery.refetch();
  };

  const handleMigrate = () => {
    if (!selectedUnternehmen || selectedForMigration.length === 0) return;

    migrationMutation.mutate({
      unternehmenId: selectedUnternehmen,
      sachkontoIds: selectedForMigration,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Finanzkonten" subtitle="Bankkonten, Kreditkarten, Broker und mehr" />

      <main className="container py-8 max-w-7xl">
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

          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleOpenMigration} disabled={!selectedUnternehmen}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Auto-Migration
            </Button>
            <Button onClick={handleCreate} disabled={!selectedUnternehmen}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Finanzkonto
            </Button>
          </div>
        </div>

        {finanzkontenQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !selectedUnternehmen ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Kein Unternehmen ausgewählt</p>
              <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
            </div>
          </Card>
        ) : finanzkonten.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Noch keine Finanzkonten erfasst</p>
              <p className="text-sm mb-4">
                Erstellen Sie Ihr erstes Finanzkonto oder verwenden Sie die Auto-Migration
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleOpenMigration}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Auto-Migration starten
                </Button>
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Finanzkonto erstellen
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Finanzkonten ({finanzkonten.length})</CardTitle>
              <CardDescription>Verwalten Sie alle Finanzkonten Ihres Unternehmens</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Sachkonto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finanzkonten.map((item) => {
                    const Icon = typeIcons[item.finanzkonto.typ as keyof typeof typeIcons];
                    return (
                      <TableRow key={item.finanzkonto.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">
                              {typeLabels[item.finanzkonto.typ as keyof typeof typeLabels]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.finanzkonto.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.finanzkonto.iban && <div>IBAN: {item.finanzkonto.iban}</div>}
                          {item.finanzkonto.kontonummer && (
                            <div>Konto: {item.finanzkonto.kontonummer}</div>
                          )}
                          {item.finanzkonto.bankName && <div>{item.finanzkonto.bankName}</div>}
                        </TableCell>
                        <TableCell>
                          {item.sachkonto ? (
                            <span className="text-sm font-mono">
                              {item.sachkonto.kontonummer} - {item.sachkonto.bezeichnung}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.finanzkonto.aktiv ? "default" : "secondary"}>
                            {item.finanzkonto.aktiv ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.finanzkonto.id)}
                              disabled={!item.finanzkonto.aktiv}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Finanzkonto bearbeiten" : "Neues Finanzkonto"}
              </DialogTitle>
              <DialogDescription>
                Erfassen Sie alle relevanten Informationen zum Finanzkonto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Typ */}
              <div>
                <Label>Typ *</Label>
                <Select
                  value={formData.typ}
                  onValueChange={(v: any) => setFormData({ ...formData, typ: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bankkonto</SelectItem>
                    <SelectItem value="kreditkarte">Kreditkarte</SelectItem>
                    <SelectItem value="broker">Broker/Depot</SelectItem>
                    <SelectItem value="kasse">Kasse</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Geschäftskonto Sparkasse"
                />
              </div>

              {/* Bank-spezifische Felder */}
              {formData.typ === "bank" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bankname</Label>
                      <Input
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="Sparkasse"
                      />
                    </div>
                    <div>
                      <Label>Kontonummer</Label>
                      <Input
                        value={formData.kontonummer}
                        onChange={(e) => setFormData({ ...formData, kontonummer: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Kontoinhaber</Label>
                    <Input
                      value={formData.kontoinhaber}
                      onChange={(e) => setFormData({ ...formData, kontoinhaber: e.target.value })}
                      placeholder="Max Mustermann GmbH"
                    />
                  </div>
                </>
              )}

              {/* Kreditkarten-spezifische Felder */}
              {formData.typ === "kreditkarte" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Kartennummer (letzte 4 Ziffern)</Label>
                      <Input
                        value={formData.kreditkartenNummer}
                        onChange={(e) =>
                          setFormData({ ...formData, kreditkartenNummer: e.target.value })
                        }
                        placeholder="**** 1234"
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <Label>Kreditlimit (€)</Label>
                      <Input
                        type="number"
                        value={formData.kreditlimit}
                        onChange={(e) => setFormData({ ...formData, kreditlimit: e.target.value })}
                        placeholder="5000.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Abrechnungstag (1-31)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.abrechnungstag || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          abrechnungstag: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="15"
                    />
                  </div>
                </>
              )}

              {/* Broker-spezifische Felder */}
              {formData.typ === "broker" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Broker Name</Label>
                      <Input
                        value={formData.brokerName}
                        onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                        placeholder="Trade Republic"
                      />
                    </div>
                    <div>
                      <Label>Depotnummer</Label>
                      <Input
                        value={formData.depotNummer}
                        onChange={(e) => setFormData({ ...formData, depotNummer: e.target.value })}
                        placeholder="DE1234567890"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* PayPal/Stripe E-Mail */}
              {(formData.typ === "paypal" || formData.typ === "stripe") && (
                <div>
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="konto@beispiel.de"
                  />
                </div>
              )}

              {/* Währung */}
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
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notizen */}
              <div>
                <Label>Notizen</Label>
                <Textarea
                  value={formData.notizen}
                  onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
                  placeholder="Zusätzliche Informationen..."
                  rows={3}
                />
              </div>

              {/* Aktiv */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.aktiv}
                  onCheckedChange={(checked) => setFormData({ ...formData, aktiv: checked })}
                />
                <Label>Aktiv</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.name || createMutation.isPending || updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Speichere...
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Migration Dialog */}
        <Dialog open={migrationDialogOpen} onOpenChange={setMigrationDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Auto-Migration von Sachkonten</DialogTitle>
              <DialogDescription>
                Konvertieren Sie automatisch Sachkonten (1200-1800) zu Finanzkonten
              </DialogDescription>
            </DialogHeader>

            {migrationQuery.isFetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : migrationQuery.data ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Migration verfügbar</AlertTitle>
                  <AlertDescription>
                    {migrationQuery.data.zuMigrieren} von {migrationQuery.data.gesamt} Sachkonten
                    können migriert werden. {migrationQuery.data.bereitsmigriert} wurden bereits
                    migriert.
                  </AlertDescription>
                </Alert>

                {migrationQuery.data.kandidaten.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={
                              selectedForMigration.length === migrationQuery.data.kandidaten.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedForMigration(
                                  migrationQuery.data!.kandidaten.map((k) => k.sachkonto.id)
                                );
                              } else {
                                setSelectedForMigration([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Sachkonto</TableHead>
                        <TableHead>Vorschlag</TableHead>
                        <TableHead>Buchungen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrationQuery.data.kandidaten.map((kandidat: any) => (
                        <TableRow key={kandidat.sachkonto.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedForMigration.includes(kandidat.sachkonto.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForMigration([
                                    ...selectedForMigration,
                                    kandidat.sachkonto.id,
                                  ]);
                                } else {
                                  setSelectedForMigration(
                                    selectedForMigration.filter((id) => id !== kandidat.sachkonto.id)
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {kandidat.sachkonto.kontonummer}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {kandidat.sachkonto.bezeichnung}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge>{typeLabels[kandidat.vorschlag.typ as keyof typeof typeLabels]}</Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              {kandidat.vorschlag.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {kandidat.statistik.anzahlBuchungen} Buchungen
                            </div>
                            {kandidat.statistik.letzteBuchung && (
                              <div className="text-xs text-muted-foreground">
                                Letzte:{" "}
                                {new Date(kandidat.statistik.letzteBuchung).toLocaleDateString(
                                  "de-DE"
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>Alle verfügbaren Sachkonten wurden bereits migriert</p>
                  </div>
                )}
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setMigrationDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleMigrate}
                disabled={
                  selectedForMigration.length === 0 || migrationMutation.isPending
                }
              >
                {migrationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Migriere...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {selectedForMigration.length} Sachkonten migrieren
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
