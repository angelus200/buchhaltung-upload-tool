import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  CreditCard,
  Car,
  Building2,
  TrendingUp,
  Calendar,
  Euro,
  FileText,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE");
}

const TYP_CONFIG = {
  kredit: {
    label: "Kredit",
    icon: CreditCard,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  leasing: {
    label: "Leasing",
    icon: Car,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  mietkauf: {
    label: "Mietkauf",
    icon: Building2,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  factoring: {
    label: "Factoring",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
};

const STATUS_CONFIG = {
  aktiv: { label: "Aktiv", color: "bg-green-100 text-green-800" },
  abgeschlossen: { label: "Abgeschlossen", color: "bg-gray-100 text-gray-800" },
  gekuendigt: { label: "Gekündigt", color: "bg-red-100 text-red-800" },
};

export default function Finanzierungen() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedFinanzierung, setSelectedFinanzierung] = useState<number | null>(null);

  // Filter
  const [filterTyp, setFilterTyp] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<string>("aktiv");

  // Formular-State
  const [formData, setFormData] = useState({
    typ: "kredit" as "kredit" | "leasing" | "mietkauf" | "factoring",
    bezeichnung: "",
    vertragsnummer: "",
    kreditgeber: "",
    gesamtbetrag: "",
    zinssatz: "",
    vertragsBeginn: "",
    vertragsEnde: "",
    ratenBetrag: "",
    ratenTyp: "monatlich" as "monatlich" | "quartal" | "halbjaehrlich" | "jaehrlich",
    ratenTag: 1,
    objektBezeichnung: "",
    notizen: "",
  });

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();

  const { data: finanzierungen, refetch: refetchFinanzierungen } = trpc.finanzierungen.list.useQuery(
    {
      unternehmenId: selectedUnternehmen!,
      typ: filterTyp !== "alle" ? (filterTyp as any) : undefined,
      status: filterStatus !== "alle" ? (filterStatus as any) : undefined,
    },
    { enabled: !!selectedUnternehmen }
  );

  const { data: stats } = trpc.finanzierungen.stats.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  const { data: detail } = trpc.finanzierungen.getById.useQuery(
    { id: selectedFinanzierung! },
    { enabled: !!selectedFinanzierung }
  );

  // Auto-select Unternehmen
  useEffect(() => {
    if (unternehmen && unternehmen.length > 0 && !selectedUnternehmen) {
      const savedId = localStorage.getItem("selectedUnternehmenId");
      if (savedId) {
        const id = parseInt(savedId);
        const exists = unternehmen.find((u) => u.unternehmen.id === id);
        if (exists) {
          setSelectedUnternehmen(id);
          return;
        }
      }
      setSelectedUnternehmen(unternehmen[0].unternehmen.id);
    }
  }, [unternehmen, selectedUnternehmen]);

  // Mutations
  const createMutation = trpc.finanzierungen.create.useMutation({
    onSuccess: () => {
      toast.success("Finanzierung erfolgreich angelegt");
      refetchFinanzierungen();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.finanzierungen.delete.useMutation({
    onSuccess: () => {
      toast.success("Finanzierung gelöscht");
      refetchFinanzierungen();
      setDetailDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const generateZahlungsplanMutation = trpc.finanzierungen.generateZahlungsplan.useMutation({
    onSuccess: (data) => {
      toast.success(`Zahlungsplan erstellt: ${data.anzahl} Raten`);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      typ: "kredit",
      bezeichnung: "",
      vertragsnummer: "",
      kreditgeber: "",
      gesamtbetrag: "",
      zinssatz: "",
      vertragsBeginn: "",
      vertragsEnde: "",
      ratenBetrag: "",
      ratenTyp: "monatlich",
      ratenTag: 1,
      objektBezeichnung: "",
      notizen: "",
    });
  };

  const handleSubmit = () => {
    if (!selectedUnternehmen) {
      toast.error("Bitte wählen Sie ein Unternehmen");
      return;
    }

    if (!formData.bezeichnung || !formData.kreditgeber || !formData.gesamtbetrag || !formData.ratenBetrag) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createMutation.mutate({
      unternehmenId: selectedUnternehmen,
      ...formData,
    });
  };

  // Ladezustand
  if (!unternehmen) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Kredite & Leasing" subtitle="Finanzierungsverwaltung" />
        <main className="container py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  // Keine Unternehmen
  if (unternehmen.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Kredite & Leasing" subtitle="Finanzierungsverwaltung" />
        <main className="container py-8">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Kein Unternehmen vorhanden</h2>
            <p className="text-muted-foreground">
              Sie müssen zuerst ein Unternehmen erstellen, um Finanzierungen zu verwalten.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Kredite & Leasing" subtitle="Finanzierungsverwaltung" />

      <main className="container py-8 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <Select value={String(selectedUnternehmen || "")} onValueChange={(v) => setSelectedUnternehmen(Number(v))}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Unternehmen wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmen?.map((u) => (
                <SelectItem key={u.unternehmen.id} value={String(u.unternehmen.id)}>
                  {u.unternehmen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setDialogOpen(true)} disabled={!selectedUnternehmen} className="ml-auto">
            <Plus className="w-4 h-4 mr-2" />
            Neu anlegen
          </Button>
        </div>

        {/* Statistiken */}
        {selectedUnternehmen && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monatliche Belastung</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.monatlicheBelastung)} €</p>
                  </div>
                  <Euro className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamtverbindlichkeiten</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.gesamtVerbindlichkeiten)} €</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktive Verträge</p>
                    <p className="text-2xl font-bold">{stats.aktiveVertraege}</p>
                  </div>
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        {selectedUnternehmen && (
          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Typ</Label>
                  <Select value={filterTyp} onValueChange={setFilterTyp}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle</SelectItem>
                      <SelectItem value="kredit">Kredit</SelectItem>
                      <SelectItem value="leasing">Leasing</SelectItem>
                      <SelectItem value="mietkauf">Mietkauf</SelectItem>
                      <SelectItem value="factoring">Factoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle</SelectItem>
                      <SelectItem value="aktiv">Aktiv</SelectItem>
                      <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                      <SelectItem value="gekuendigt">Gekündigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Finanzierungen-Liste */}
        {selectedUnternehmen && finanzierungen && (
          <div className="space-y-4">
            {finanzierungen.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Finanzierungen vorhanden</h3>
                <p className="text-muted-foreground mb-4">
                  Legen Sie Ihren ersten Kredit oder Leasingvertrag an.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Erste Finanzierung anlegen
                </Button>
              </Card>
            ) : (
              finanzierungen.map((finanzierung) => {
                const typConfig = TYP_CONFIG[finanzierung.typ];
                const Icon = typConfig.icon;

                return (
                  <Card
                    key={finanzierung.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedFinanzierung(finanzierung.id);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-lg ${typConfig.bgColor}`}>
                            <Icon className={`w-6 h-6 ${typConfig.color}`} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{finanzierung.bezeichnung}</h3>
                              <Badge className={STATUS_CONFIG[finanzierung.status].color}>
                                {STATUS_CONFIG[finanzierung.status].label}
                              </Badge>
                              <Badge variant="outline">{typConfig.label}</Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">{finanzierung.kreditgeber}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Gesamtbetrag</p>
                                <p className="font-medium">{formatCurrency(finanzierung.gesamtbetrag)} €</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Restschuld</p>
                                <p className="font-medium">{formatCurrency(finanzierung.restschuld || 0)} €</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Rate</p>
                                <p className="font-medium">{formatCurrency(finanzierung.ratenBetrag)} €</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Vertragsende</p>
                                <p className="font-medium">{formatDate(finanzierung.vertragsEnde)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Dialog: Neue Finanzierung */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Finanzierung anlegen</DialogTitle>
            <DialogDescription>
              Erfassen Sie einen neuen Kredit- oder Leasingvertrag
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Typ */}
            <div>
              <Label>Typ *</Label>
              <Select
                value={formData.typ}
                onValueChange={(value: any) => setFormData({ ...formData, typ: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kredit">Kredit</SelectItem>
                  <SelectItem value="leasing">Leasing</SelectItem>
                  <SelectItem value="mietkauf">Mietkauf</SelectItem>
                  <SelectItem value="factoring">Factoring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vertragsdaten */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bezeichnung *</Label>
                <Input
                  value={formData.bezeichnung}
                  onChange={(e) => setFormData({ ...formData, bezeichnung: e.target.value })}
                  placeholder="z.B. Sparkassen-Darlehen"
                />
              </div>
              <div>
                <Label>Vertragsnummer</Label>
                <Input
                  value={formData.vertragsnummer}
                  onChange={(e) => setFormData({ ...formData, vertragsnummer: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Kreditgeber / Leasinggeber *</Label>
              <Input
                value={formData.kreditgeber}
                onChange={(e) => setFormData({ ...formData, kreditgeber: e.target.value })}
                placeholder="z.B. Sparkasse Musterstadt"
              />
            </div>

            {/* Konditionen */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gesamtbetrag (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.gesamtbetrag}
                  onChange={(e) => setFormData({ ...formData, gesamtbetrag: e.target.value })}
                />
              </div>
              <div>
                <Label>Zinssatz (% p.a.)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.zinssatz}
                  onChange={(e) => setFormData({ ...formData, zinssatz: e.target.value })}
                />
              </div>
            </div>

            {/* Laufzeit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vertragsbeginn *</Label>
                <Input
                  type="date"
                  value={formData.vertragsBeginn}
                  onChange={(e) => setFormData({ ...formData, vertragsBeginn: e.target.value })}
                />
              </div>
              <div>
                <Label>Vertragsende *</Label>
                <Input
                  type="date"
                  value={formData.vertragsEnde}
                  onChange={(e) => setFormData({ ...formData, vertragsEnde: e.target.value })}
                />
              </div>
            </div>

            {/* Raten */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Ratenbetrag (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.ratenBetrag}
                  onChange={(e) => setFormData({ ...formData, ratenBetrag: e.target.value })}
                />
              </div>
              <div>
                <Label>Zahlweise</Label>
                <Select
                  value={formData.ratenTyp}
                  onValueChange={(value: any) => setFormData({ ...formData, ratenTyp: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monatlich">Monatlich</SelectItem>
                    <SelectItem value="quartal">Quartal</SelectItem>
                    <SelectItem value="halbjaehrlich">Halbjährlich</SelectItem>
                    <SelectItem value="jaehrlich">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fällig am Tag</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.ratenTag}
                  onChange={(e) => setFormData({ ...formData, ratenTag: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Objekt (bei Leasing) */}
            {(formData.typ === "leasing" || formData.typ === "mietkauf") && (
              <div>
                <Label>Finanzierungsobjekt</Label>
                <Input
                  value={formData.objektBezeichnung}
                  onChange={(e) => setFormData({ ...formData, objektBezeichnung: e.target.value })}
                  placeholder="z.B. BMW X3, Büroausstattung"
                />
              </div>
            )}

            {/* Notizen */}
            <div>
              <Label>Notizen</Label>
              <Textarea
                value={formData.notizen}
                onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detail-Ansicht */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.finanzierung.bezeichnung}</DialogTitle>
                <DialogDescription>{detail.finanzierung.kreditgeber}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Übersicht */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Typ</p>
                    <p className="font-medium">{TYP_CONFIG[detail.finanzierung.typ].label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={STATUS_CONFIG[detail.finanzierung.status].color}>
                      {STATUS_CONFIG[detail.finanzierung.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamtbetrag</p>
                    <p className="font-medium">{formatCurrency(detail.finanzierung.gesamtbetrag)} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Restschuld</p>
                    <p className="font-medium">{formatCurrency(detail.finanzierung.restschuld || 0)} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Laufzeit</p>
                    <p className="font-medium">
                      {formatDate(detail.finanzierung.vertragsBeginn)} - {formatDate(detail.finanzierung.vertragsEnde)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ratenbetrag</p>
                    <p className="font-medium">{formatCurrency(detail.finanzierung.ratenBetrag)} €</p>
                  </div>
                </div>

                {/* Zahlungsplan */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Zahlungsplan</h3>
                    <Button
                      size="sm"
                      onClick={() => generateZahlungsplanMutation.mutate({ finanzierungId: detail.finanzierung.id })}
                      disabled={generateZahlungsplanMutation.isPending}
                    >
                      {generateZahlungsplanMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Plan generieren
                    </Button>
                  </div>

                  {detail.zahlungen.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Noch keine Zahlungen vorhanden. Klicken Sie auf "Plan generieren".</p>
                  ) : (
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fälligkeit</TableHead>
                            <TableHead>Betrag</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.zahlungen.slice(0, 12).map((zahlung) => (
                            <TableRow key={zahlung.id}>
                              <TableCell>{formatDate(zahlung.faelligkeit)}</TableCell>
                              <TableCell>{formatCurrency(zahlung.betrag)} €</TableCell>
                              <TableCell>
                                <Badge variant={zahlung.status === "bezahlt" ? "default" : "outline"}>
                                  {zahlung.status === "bezahlt" ? "Bezahlt" : "Offen"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Finanzierung wirklich löschen?")) {
                      deleteMutation.mutate({ id: detail.finanzierung.id });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </Button>
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Schließen
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
