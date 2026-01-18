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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Eye,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const STATUS_LABELS: Record<string, string> = {
  geplant: "Geplant",
  in_arbeit: "In Arbeit",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
};

const STATUS_COLORS: Record<string, string> = {
  geplant: "bg-blue-500",
  in_arbeit: "bg-yellow-500",
  abgeschlossen: "bg-green-500",
  storniert: "bg-gray-400",
};

const EINHEIT_LABELS: Record<string, string> = {
  stueck: "Stk",
  kg: "kg",
  liter: "L",
  meter: "m",
  karton: "Ktn",
};

export default function Inventur() {
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPositionenDialogOpen, setIsPositionenDialogOpen] = useState(false);
  const [selectedInventur, setSelectedInventur] = useState<any>(null);

  // Form state
  const [bezeichnung, setBezeichnung] = useState("");
  const [stichtag, setStichtag] = useState("");
  const [lagerortId, setLagerortId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    if (saved) {
      setSelectedUnternehmenId(parseInt(saved));
    }
  }, []);

  // tRPC queries
  const inventurenQuery = trpc.inventur.inventur.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  const lagerorteQuery = trpc.inventur.lager.getLagerorte.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  const positionenQuery = trpc.inventur.inventur.getPositionen.useQuery(
    { inventurId: selectedInventur?.id || 0 },
    { enabled: !!selectedInventur }
  );

  // tRPC mutations
  const createMutation = trpc.inventur.inventur.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Inventur erstellt mit ${data.anzahlPositionen} Positionen`);
      inventurenQuery.refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const zaehlenMutation = trpc.inventur.inventur.zaehlen.useMutation({
    onSuccess: (data) => {
      toast.success(`Zählung gespeichert. Differenz: ${data.differenz}`);
      positionenQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const abschliessenMutation = trpc.inventur.inventur.abschliessen.useMutation({
    onSuccess: (data) => {
      toast.success(`Inventur abgeschlossen. ${data.anzahlKorrekturen} Korrekturen erstellt`);
      inventurenQuery.refetch();
      positionenQuery.refetch();
      setIsPositionenDialogOpen(false);
      setSelectedInventur(null);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setBezeichnung("");
    setStichtag("");
    setLagerortId(null);
  };

  const handleCreate = () => {
    if (!selectedUnternehmenId) return;

    createMutation.mutate({
      unternehmenId: selectedUnternehmenId,
      bezeichnung,
      stichtag,
      lagerortId: lagerortId || undefined,
      erstelltVon: 1, // TODO: Get from auth context
    });
  };

  const handleZaehlen = (position: any, istMenge: string, kommentar: string) => {
    zaehlenMutation.mutate({
      positionId: position.position.id,
      istMenge,
      kommentar: kommentar || undefined,
      gezaehltVon: 1, // TODO: Get from auth context
    });
  };

  const handleAbschliessen = () => {
    if (!selectedInventur) return;

    if (!confirm("Möchten Sie diese Inventur wirklich abschließen? Dies erstellt automatisch Korrekturbewegungen für alle Differenzen.")) {
      return;
    }

    abschliessenMutation.mutate({
      inventurId: selectedInventur.id,
      abgeschlossenVon: 1, // TODO: Get from auth context
    });
  };

  const openPositionenDialog = (inventur: any) => {
    setSelectedInventur(inventur);
    setIsPositionenDialogOpen(true);
  };

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
                Bitte wählen Sie ein Unternehmen aus, um die Inventurverwaltung zu verwenden.
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
                  <ClipboardList className="w-5 h-5" />
                  Inventurverwaltung
                </CardTitle>
                <CardDescription>
                  Erstellen und verwalten Sie Inventurzählungen
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Neue Inventur
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bezeichnung</TableHead>
                  <TableHead>Stichtag</TableHead>
                  <TableHead>Lagerort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventurenQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Lade Inventuren...
                    </TableCell>
                  </TableRow>
                ) : !inventurenQuery.data || inventurenQuery.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Noch keine Inventuren vorhanden
                    </TableCell>
                  </TableRow>
                ) : (
                  inventurenQuery.data.map((inventur) => (
                    <TableRow key={inventur.id}>
                      <TableCell className="font-medium">{inventur.bezeichnung}</TableCell>
                      <TableCell>
                        {new Date(inventur.stichtag).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell>
                        {inventur.lagerortId
                          ? lagerorteQuery.data?.find((l) => l.id === inventur.lagerortId)
                              ?.name || "Unbekannt"
                          : "Alle Lagerorte"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[inventur.status]}>
                          {STATUS_LABELS[inventur.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(inventur.createdAt).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPositionenDialog(inventur)}
                            title="Positionen anzeigen"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {inventur.status === "in_arbeit" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInventur(inventur);
                                handleAbschliessen();
                              }}
                              title="Inventur abschließen"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Inventur erstellen</DialogTitle>
            <DialogDescription>
              Die Inventur wird automatisch mit allen aktuellen Beständen gefüllt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bezeichnung">Bezeichnung *</Label>
              <Input
                id="bezeichnung"
                value={bezeichnung}
                onChange={(e) => setBezeichnung(e.target.value)}
                placeholder="z.B. Jahresinventur 2025"
              />
            </div>
            <div>
              <Label htmlFor="stichtag">Stichtag *</Label>
              <Input
                id="stichtag"
                type="date"
                value={stichtag}
                onChange={(e) => setStichtag(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lagerort">Lagerort (optional)</Label>
              <Select
                value={lagerortId?.toString() || "all"}
                onValueChange={(value) => setLagerortId(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle Lagerorte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Lagerorte</SelectItem>
                  {lagerorteQuery.data?.map((lagerort) => (
                    <SelectItem key={lagerort.id} value={lagerort.id.toString()}>
                      {lagerort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={!bezeichnung || !stichtag}>
              Inventur erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Positionen Dialog */}
      <Dialog open={isPositionenDialogOpen} onOpenChange={setIsPositionenDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedInventur?.bezeichnung}</DialogTitle>
                <DialogDescription>
                  Stichtag: {new Date(selectedInventur?.stichtag || "").toLocaleDateString("de-DE")}
                  {" | "}
                  Status: {STATUS_LABELS[selectedInventur?.status || ""]}
                </DialogDescription>
              </div>
              {selectedInventur?.status === "in_arbeit" && (
                <Button onClick={handleAbschliessen} variant="default">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Inventur abschließen
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Artikelnummer</TableHead>
                  <TableHead>Lagerort</TableHead>
                  <TableHead className="text-right">Soll-Menge</TableHead>
                  <TableHead className="text-right">Ist-Menge</TableHead>
                  <TableHead className="text-right">Differenz</TableHead>
                  <TableHead>Gezählt am</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positionenQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Lade Positionen...
                    </TableCell>
                  </TableRow>
                ) : !positionenQuery.data || positionenQuery.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Keine Positionen gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  positionenQuery.data.map((position: any) => (
                    <InventurPositionRow
                      key={position.position.id}
                      position={position}
                      onZaehlen={handleZaehlen}
                      disabled={selectedInventur?.status === "abgeschlossen"}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Separate component for each inventory position row
function InventurPositionRow({
  position,
  onZaehlen,
  disabled,
}: {
  position: any;
  onZaehlen: (position: any, istMenge: string, kommentar: string) => void;
  disabled: boolean;
}) {
  const [istMenge, setIstMenge] = useState(position.position.istMenge || "");
  const [kommentar, setKommentar] = useState(position.position.kommentar || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onZaehlen(position, istMenge, kommentar);
    setIsEditing(false);
  };

  const differenz =
    istMenge && position.position.sollMenge
      ? parseFloat(istMenge) - parseFloat(position.position.sollMenge)
      : null;

  const hasDifferenz = differenz !== null && Math.abs(differenz) > 0.001;

  return (
    <TableRow className={hasDifferenz && differenz < 0 ? "bg-red-50" : hasDifferenz ? "bg-yellow-50" : ""}>
      <TableCell>{position.artikel.bezeichnung}</TableCell>
      <TableCell className="font-mono text-sm">{position.artikel.artikelnummer}</TableCell>
      <TableCell>{position.lagerort.name}</TableCell>
      <TableCell className="text-right font-mono">
        {parseFloat(position.position.sollMenge).toFixed(2)}{" "}
        {EINHEIT_LABELS[position.artikel.einheit]}
      </TableCell>
      <TableCell className="text-right font-mono">
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            value={istMenge}
            onChange={(e) => setIstMenge(e.target.value)}
            className="w-24 h-8 text-right"
            autoFocus
          />
        ) : position.position.istMenge ? (
          `${parseFloat(position.position.istMenge).toFixed(2)} ${
            EINHEIT_LABELS[position.artikel.einheit]
          }`
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-right font-mono">
        {differenz !== null ? (
          <span className={differenz < 0 ? "text-red-600 font-bold" : differenz > 0 ? "text-yellow-600 font-bold" : ""}>
            {differenz > 0 ? "+" : ""}
            {differenz.toFixed(2)} {EINHEIT_LABELS[position.artikel.einheit]}
          </span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-sm">
        {position.position.gezaehltAm
          ? new Date(position.position.gezaehltAm).toLocaleDateString("de-DE")
          : "-"}
      </TableCell>
      <TableCell className="text-right">
        {isEditing ? (
          <div className="flex gap-1 justify-end">
            <Button size="sm" onClick={handleSave} disabled={!istMenge}>
              <CheckCircle2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Abbrechen
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
          >
            Zählen
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
