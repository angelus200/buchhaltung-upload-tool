import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Download,
  FileText,
  Calendar,
  Euro,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Pencil,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";

const MONATE = [
  { value: "1", label: "Januar" },
  { value: "2", label: "Februar" },
  { value: "3", label: "März" },
  { value: "4", label: "April" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Dezember" },
];

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE");
}

interface EditBuchungFormProps {
  buchung: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function EditBuchungForm({ buchung, onSave, onCancel }: EditBuchungFormProps) {
  const [formData, setFormData] = useState({
    belegdatum: new Date(buchung.belegdatum).toISOString().split("T")[0],
    belegnummer: buchung.belegnummer || "",
    geschaeftspartner: buchung.geschaeftspartner || "",
    sachkonto: buchung.sachkonto || "",
    nettobetrag: buchung.nettobetrag || "0",
    steuersatz: buchung.steuersatz || "0",
    bruttobetrag: buchung.bruttobetrag || "0",
    buchungstext: buchung.buchungstext || "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Belegdatum</Label>
          <Input
            type="date"
            value={formData.belegdatum}
            onChange={(e) =>
              setFormData({ ...formData, belegdatum: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Belegnummer</Label>
          <Input
            value={formData.belegnummer}
            onChange={(e) =>
              setFormData({ ...formData, belegnummer: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Geschäftspartner</Label>
          <Input
            value={formData.geschaeftspartner}
            onChange={(e) =>
              setFormData({ ...formData, geschaeftspartner: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Sachkonto</Label>
          <Input
            value={formData.sachkonto}
            onChange={(e) =>
              setFormData({ ...formData, sachkonto: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Nettobetrag</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.nettobetrag}
            onChange={(e) =>
              setFormData({ ...formData, nettobetrag: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Steuersatz (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.steuersatz}
            onChange={(e) =>
              setFormData({ ...formData, steuersatz: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Bruttobetrag</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.bruttobetrag}
            onChange={(e) =>
              setFormData({ ...formData, bruttobetrag: e.target.value })
            }
          />
        </div>
      </div>
      <div>
        <Label>Buchungstext</Label>
        <Textarea
          value={formData.buchungstext}
          onChange={(e) =>
            setFormData({ ...formData, buchungstext: e.target.value })
          }
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={() => onSave(formData)}>Speichern</Button>
      </DialogFooter>
    </div>
  );
}

interface CreateBuchungFormProps {
  unternehmenId: number;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function CreateBuchungForm({ unternehmenId, onSave, onCancel }: CreateBuchungFormProps) {
  const [formData, setFormData] = useState({
    unternehmenId,
    buchungsart: "aufwand" as const,
    belegdatum: new Date().toISOString().split("T")[0],
    belegnummer: "",
    geschaeftspartnerTyp: "kreditor" as const,
    geschaeftspartner: "",
    geschaeftspartnerKonto: "",
    sachkonto: "",
    nettobetrag: "0",
    steuersatz: "19",
    bruttobetrag: "0",
    buchungstext: "",
  });

  // Auto-calculate bruttobetrag
  useEffect(() => {
    const netto = parseFloat(formData.nettobetrag) || 0;
    const steuer = parseFloat(formData.steuersatz) || 0;
    const brutto = netto * (1 + steuer / 100);
    setFormData((prev) => ({ ...prev, bruttobetrag: brutto.toFixed(2) }));
  }, [formData.nettobetrag, formData.steuersatz]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Buchungsart</Label>
          <Select
            value={formData.buchungsart}
            onValueChange={(v: any) =>
              setFormData({ ...formData, buchungsart: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aufwand">Aufwand</SelectItem>
              <SelectItem value="ertrag">Ertrag</SelectItem>
              <SelectItem value="anlage">Anlage</SelectItem>
              <SelectItem value="sonstig">Sonstig</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Geschäftspartner-Typ</Label>
          <Select
            value={formData.geschaeftspartnerTyp}
            onValueChange={(v: any) =>
              setFormData({ ...formData, geschaeftspartnerTyp: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kreditor">Kreditor</SelectItem>
              <SelectItem value="debitor">Debitor</SelectItem>
              <SelectItem value="gesellschafter">Gesellschafter</SelectItem>
              <SelectItem value="sonstig">Sonstig</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Belegdatum</Label>
          <Input
            type="date"
            value={formData.belegdatum}
            onChange={(e) =>
              setFormData({ ...formData, belegdatum: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Belegnummer</Label>
          <Input
            value={formData.belegnummer}
            onChange={(e) =>
              setFormData({ ...formData, belegnummer: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Geschäftspartner</Label>
          <Input
            value={formData.geschaeftspartner}
            onChange={(e) =>
              setFormData({ ...formData, geschaeftspartner: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Geschäftspartner-Konto</Label>
          <Input
            value={formData.geschaeftspartnerKonto}
            onChange={(e) =>
              setFormData({
                ...formData,
                geschaeftspartnerKonto: e.target.value,
              })
            }
          />
        </div>
        <div>
          <Label>Sachkonto</Label>
          <Input
            value={formData.sachkonto}
            onChange={(e) =>
              setFormData({ ...formData, sachkonto: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Nettobetrag</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.nettobetrag}
            onChange={(e) =>
              setFormData({ ...formData, nettobetrag: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Steuersatz (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.steuersatz}
            onChange={(e) =>
              setFormData({ ...formData, steuersatz: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Bruttobetrag (autom.)</Label>
          <Input type="text" value={formData.bruttobetrag} disabled />
        </div>
      </div>
      <div>
        <Label>Buchungstext</Label>
        <Textarea
          value={formData.buchungstext}
          onChange={(e) =>
            setFormData({ ...formData, buchungstext: e.target.value })
          }
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={() => onSave(formData)}>Erstellen</Button>
      </DialogFooter>
    </div>
  );
}

export default function Uebersicht() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterSachkonto, setFilterSachkonto] = useState("");
  const [filterImportRef, setFilterImportRef] = useState("");
  const [filterGeschaeftspartner, setFilterGeschaeftspartner] = useState("");
  const [showOnlyGuV, setShowOnlyGuV] = useState(false);

  // Modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBuchung, setSelectedBuchung] = useState<any>(null);

  // tRPC Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const buchungenQuery = trpc.buchungen.list.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      monat: selectedMonth,
      jahr: selectedYear,
      sachkonto: filterSachkonto || undefined,
      importReferenz: filterImportRef || undefined,
      geschaeftspartnerKonto: filterGeschaeftspartner || undefined,
    },
    { enabled: !!selectedUnternehmen }
  );

  const statsQuery = trpc.buchungen.stats.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      monat: selectedMonth,
      jahr: selectedYear,
      importReferenz: filterImportRef || undefined,
    },
    { enabled: !!selectedUnternehmen }
  );

  // Mutations
  const updateMutation = trpc.buchungen.update.useMutation({
    onSuccess: () => {
      toast.success("Buchung aktualisiert");
      buchungenQuery.refetch();
      statsQuery.refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.buchungen.delete.useMutation({
    onSuccess: () => {
      toast.success("Buchung gelöscht");
      buchungenQuery.refetch();
      statsQuery.refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const createMutation = trpc.buchungen.create.useMutation({
    onSuccess: () => {
      toast.success("Buchung erstellt");
      buchungenQuery.refetch();
      statsQuery.refetch();
      setCreateDialogOpen(false);
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

  const buchungen = buchungenQuery.data || [];
  const stats = statsQuery.data || {
    count: 0,
    netto: 0,
    steuer: 0,
    brutto: 0,
    guvCount: 0,
    guvNetto: 0,
    guvSteuer: 0,
    guvBrutto: 0,
  };

  // Filtere Buchungen für GuV-Ansicht (SKR04 6-stellig)
  // WICHTIG: Muss identisch zur Backend-Logik in server/buchhaltung.ts sein!
  const displayBuchungen = useMemo(() => {
    if (!showOnlyGuV) return buchungen;

    return buchungen.filter((b: any) => {
      const sachkonto = b.sachkonto || "";
      const sollKonto = b.sollKonto || "";
      const habenKonto = b.habenKonto || "";

      // Erträge (Klasse 4): habenKonto ODER sachkonto in 400000-499999
      const istErtrag =
        (habenKonto >= "400000" && habenKonto < "500000") ||
        (sachkonto >= "400000" && sachkonto < "500000");

      // Aufwand (Klassen 5-7): sollKonto ODER sachkonto in 500000-799999
      const istAufwand =
        (sollKonto >= "500000" && sollKonto < "800000") ||
        (sachkonto >= "500000" && sachkonto < "800000");

      return istErtrag || istAufwand;
    });
  }, [buchungen, showOnlyGuV]);

  const monatName =
    MONATE.find((m) => m.value === String(selectedMonth))?.label || "";

  // Statistik-Werte basierend auf Toggle-State
  const displayStats = showOnlyGuV
    ? {
        count: stats.guvCount,
        netto: stats.guvNetto,
        steuer: stats.guvSteuer,
        brutto: stats.guvBrutto,
      }
    : {
        count: stats.count,
        netto: stats.netto,
        steuer: stats.steuer,
        brutto: stats.brutto,
      };

  // Gruppierungen nach Konto und Kreditor (basiert auf gefilterten Buchungen)
  const nachKonto = useMemo(() => {
    const grouped: Record<string, { bezeichnung: string; summe: number }> = {};
    displayBuchungen.forEach((b: any) => {
      if (!grouped[b.sachkonto]) {
        grouped[b.sachkonto] = { bezeichnung: b.sachkonto, summe: 0 };
      }
      grouped[b.sachkonto].summe += parseFloat(b.bruttobetrag || "0");
    });
    return Object.entries(grouped).sort((a, b) => b[1].summe - a[1].summe);
  }, [displayBuchungen]);

  const nachGeschaeftspartner = useMemo(() => {
    const grouped: Record<string, number> = {};
    displayBuchungen.forEach((b: any) => {
      const partner = b.geschaeftspartner || "Unbekannt";
      if (!grouped[partner]) {
        grouped[partner] = 0;
      }
      grouped[partner] += parseFloat(b.bruttobetrag || "0");
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [displayBuchungen]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Monatsübersicht"
        subtitle="Buchungen und Auswertungen"
      />

      <main className="container py-8">
        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {/* Unternehmen Selector */}
          <Select
            value={String(selectedUnternehmen || "")}
            onValueChange={(v) => setSelectedUnternehmen(Number(v))}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Unternehmen wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmenQuery.data?.map((u) => (
                <SelectItem
                  key={u.unternehmen.id}
                  value={String(u.unternehmen.id)}
                >
                  {u.unternehmen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Monat */}
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONATE.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Jahr */}
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
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

          {/* Import Referenz */}
          <Input
            placeholder="Import-Referenz"
            value={filterImportRef}
            onChange={(e) => setFilterImportRef(e.target.value)}
            className="w-60"
          />

          {/* Sachkonto Filter */}
          <Input
            placeholder="Sachkonto"
            value={filterSachkonto}
            onChange={(e) => setFilterSachkonto(e.target.value)}
            className="w-32"
          />

          {/* Geschäftspartner Filter */}
          <Input
            placeholder="Geschäftspartner-Konto"
            value={filterGeschaeftspartner}
            onChange={(e) => setFilterGeschaeftspartner(e.target.value)}
            className="w-48"
          />

          {/* Neue Buchung Button */}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="ml-auto"
            disabled={!selectedUnternehmen}
          >
            <Plus className="w-4 h-4 mr-2" />
            Neue Buchung
          </Button>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Buchungen{showOnlyGuV ? " (nur GuV)" : ""}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {displayStats.count}
                  </p>
                  {!showOnlyGuV && stats.guvCount !== stats.count && (
                    <p className="text-xs text-muted-foreground mt-1">
                      davon GuV: {stats.guvCount}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Euro className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Nettobetrag{showOnlyGuV ? " (nur GuV)" : ""}
                  </p>
                  <p className="text-2xl font-bold tabular-nums font-mono">
                    {formatCurrency(displayStats.netto)} €
                  </p>
                  {!showOnlyGuV && stats.guvNetto !== stats.netto && (
                    <p className="text-xs text-muted-foreground mt-1">
                      davon GuV: {formatCurrency(stats.guvNetto)} €
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Vorsteuer{showOnlyGuV ? " (nur GuV)" : ""}
                  </p>
                  <p className="text-2xl font-bold tabular-nums font-mono">
                    {formatCurrency(displayStats.steuer)} €
                  </p>
                  {!showOnlyGuV && stats.guvSteuer !== stats.steuer && (
                    <p className="text-xs text-muted-foreground mt-1">
                      davon GuV: {formatCurrency(stats.guvSteuer)} €
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Euro className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Bruttobetrag{showOnlyGuV ? " (nur GuV)" : ""}
                  </p>
                  <p className="text-2xl font-bold tabular-nums font-mono">
                    {formatCurrency(displayStats.brutto)} €
                  </p>
                  {!showOnlyGuV && stats.guvBrutto !== stats.brutto && (
                    <p className="text-xs text-muted-foreground mt-1">
                      davon GuV: {formatCurrency(stats.guvBrutto)} €
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Buchungsliste */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Buchungen {monatName} {selectedYear}
                </CardTitle>
                <CardDescription>
                  Alle erfassten Buchungen im ausgewählten Zeitraum
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* GuV-Filter Toggle */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="guv-filter"
                    checked={showOnlyGuV}
                    onCheckedChange={(checked) => setShowOnlyGuV(checked as boolean)}
                  />
                  <Label
                    htmlFor="guv-filter"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Nur GuV-relevante Konten anzeigen (Klassen 4-7)
                  </Label>
                  {showOnlyGuV && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {displayBuchungen.length} von {buchungen.length} Buchungen
                    </span>
                  )}
                </div>

                {buchungenQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : displayBuchungen.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {showOnlyGuV && buchungen.length > 0
                      ? "Keine GuV-relevanten Buchungen gefunden"
                      : "Keine Buchungen gefunden"}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Belegnr.</TableHead>
                        <TableHead>Geschäftspartner</TableHead>
                        <TableHead>Konto</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                        <TableHead className="w-[100px]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayBuchungen.map((b: any) => (
                        <TableRow key={b.id}>
                          <TableCell>{formatDate(b.belegdatum)}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {b.belegnummer}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {b.geschaeftspartner}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {b.sachkonto}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(parseFloat(b.bruttobetrag))} €
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBuchung(b);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBuchung(b);
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
          </div>

          {/* Auswertungen */}
          <div className="space-y-6">
            {/* Nach Sachkonto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Nach Sachkonto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nachKonto.slice(0, 5).map(([konto, data]) => (
                    <div key={konto} className="flex items-center justify-between">
                      <span className="font-mono text-sm">{konto}</span>
                      <span className="font-mono tabular-nums font-medium text-sm">
                        {formatCurrency(data.summe)} €
                      </span>
                    </div>
                  ))}
                  {nachKonto.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Keine Daten verfügbar
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Nach Geschäftspartner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nach Geschäftspartner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nachGeschaeftspartner.slice(0, 5).map(([partner, summe]) => (
                    <div key={partner} className="flex items-center justify-between">
                      <span className="text-sm truncate max-w-[150px]">
                        {partner}
                      </span>
                      <span className="font-mono tabular-nums font-medium text-sm">
                        {formatCurrency(summe)} €
                      </span>
                    </div>
                  ))}
                  {nachGeschaeftspartner.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Keine Daten verfügbar
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buchung bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedBuchung && (
            <EditBuchungForm
              buchung={selectedBuchung}
              onSave={(data) =>
                updateMutation.mutate({ id: selectedBuchung.id, ...data })
              }
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buchung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Buchung "{selectedBuchung?.belegnummer}" wirklich
              löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ id: selectedBuchung?.id })}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Buchung anlegen</DialogTitle>
          </DialogHeader>
          {selectedUnternehmen && (
            <CreateBuchungForm
              unternehmenId={selectedUnternehmen}
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setCreateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
