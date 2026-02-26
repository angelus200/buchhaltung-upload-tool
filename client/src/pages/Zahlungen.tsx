import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Euro,
  FileText,
  Filter,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

type Zahlungsstatus = "offen" | "teilweise_bezahlt" | "bezahlt" | "ueberfaellig";

export default function Zahlungen() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<Zahlungsstatus | "alle">("alle");
  const [selectedBuchung, setSelectedBuchung] = useState<any>(null);
  const [zahlungsDialog, setZahlungsDialog] = useState(false);
  const [zahlungsDaten, setZahlungsDaten] = useState({
    zahlungsstatus: "bezahlt" as Zahlungsstatus,
    bezahltAm: new Date().toISOString().split("T")[0],
    bezahlterBetrag: "",
    zahlungsreferenz: "",
  });

  // Unternehmen laden
  const { data: unternehmenListe } = trpc.unternehmen.list.useQuery();

  // Zahlungsübersicht laden
  const { data: zahlungsStats, refetch: refetchStats } = trpc.buchungen.zahlungsUebersicht.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  // Offene Rechnungen laden
  const { data: offeneRechnungen, refetch: refetchOffene } = trpc.buchungen.offeneRechnungen.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  // Alle Buchungen laden
  const { data: alleBuchungen, refetch: refetchAlle } = trpc.buchungen.list.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  // Zahlungsstatus aktualisieren
  const updateZahlungsstatus = trpc.buchungen.updateZahlungsstatus.useMutation({
    onSuccess: () => {
      toast.success("Zahlungsstatus aktualisiert");
      refetchStats();
      refetchOffene();
      refetchAlle();
      setZahlungsDialog(false);
      setSelectedBuchung(null);
    },
    onError: (error) => {
      toast.error("Fehler: " + error.message);
    },
  });

  // Gefilterte Buchungen
  const gefilterteBuchungen = useMemo(() => {
    if (!alleBuchungen?.buchungen) return [];
    if (filterStatus === "alle") return alleBuchungen.buchungen;
    return alleBuchungen.buchungen.filter((b) => b.zahlungsstatus === filterStatus);
  }, [alleBuchungen, filterStatus]);

  // Zahlungsstatus-Badge
  const getStatusBadge = (status: Zahlungsstatus | null) => {
    switch (status) {
      case "offen":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Offen</Badge>;
      case "teilweise_bezahlt":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><TrendingUp className="w-3 h-3 mr-1" /> Teilweise</Badge>;
      case "bezahlt":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Bezahlt</Badge>;
      case "ueberfaellig":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> Überfällig</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Offen</Badge>;
    }
  };

  // Zahlung erfassen
  const handleZahlungErfassen = (buchung: any) => {
    setSelectedBuchung(buchung);
    setZahlungsDaten({
      zahlungsstatus: "bezahlt",
      bezahltAm: new Date().toISOString().split("T")[0],
      bezahlterBetrag: String(buchung.bruttobetrag),
      zahlungsreferenz: "",
    });
    setZahlungsDialog(true);
  };

  // Zahlung speichern
  const handleZahlungSpeichern = () => {
    if (!selectedBuchung) return;
    updateZahlungsstatus.mutate({
      id: selectedBuchung.id,
      ...zahlungsDaten,
    });
  };

  // Formatierung
  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (num === null || isNaN(num as number)) return "0,00 €";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(num as number);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("de-DE");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Zahlungsübersicht</h1>
            <p className="text-slate-600 mt-1">Verwalten Sie offene und bezahlte Rechnungen</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select
              value={selectedUnternehmen?.toString() || ""}
              onValueChange={(v) => setSelectedUnternehmen(parseInt(v))}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Unternehmen wählen" />
              </SelectTrigger>
              <SelectContent>
                {unternehmenListe?.map((u) => (
                  <SelectItem key={u.unternehmen.id} value={u.unternehmen.id.toString()}>
                    {u.unternehmen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedUnternehmen ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Kein Unternehmen ausgewählt</h2>
              <p className="text-slate-500">Wählen Sie ein Unternehmen aus, um die Zahlungsübersicht anzuzeigen.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Statistik-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Offene Rechnungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{zahlungsStats?.offen || 0}</div>
                  <p className="text-sm text-slate-500 mt-1">Noch nicht bezahlt</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Überfällig
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{zahlungsStats?.ueberfaellig || 0}</div>
                  <p className="text-sm text-slate-500 mt-1">Fälligkeit überschritten</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-teal-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" /> Offener Betrag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{formatCurrency(zahlungsStats?.offenerBetrag || 0)}</div>
                  <p className="text-sm text-slate-500 mt-1">Noch zu zahlen</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Bezahlt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(zahlungsStats?.bezahlterBetrag || 0)}</div>
                  <p className="text-sm text-slate-500 mt-1">{zahlungsStats?.bezahlt || 0} Rechnungen</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter */}
            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <Label className="text-sm font-medium">Status filtern:</Label>
                  <Select
                    value={filterStatus}
                    onValueChange={(v) => setFilterStatus(v as Zahlungsstatus | "alle")}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle anzeigen</SelectItem>
                      <SelectItem value="offen">Offen</SelectItem>
                      <SelectItem value="teilweise_bezahlt">Teilweise bezahlt</SelectItem>
                      <SelectItem value="bezahlt">Bezahlt</SelectItem>
                      <SelectItem value="ueberfaellig">Überfällig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Buchungsliste */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  Rechnungen ({gefilterteBuchungen.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beleg-Nr.</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Geschäftspartner</TableHead>
                      <TableHead>Buchungsart</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead>Fälligkeit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gefilterteBuchungen.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                          Keine Buchungen gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      gefilterteBuchungen.map((buchung) => (
                        <TableRow key={buchung.id}>
                          <TableCell className="font-medium">{buchung.belegnummer}</TableCell>
                          <TableCell>{formatDate(buchung.belegdatum)}</TableCell>
                          <TableCell>{buchung.geschaeftspartner}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {buchung.buchungsart === "aufwand" ? "Aufwand" : 
                               buchung.buchungsart === "ertrag" ? "Ertrag" : 
                               buchung.buchungsart === "anlage" ? "Anlage" : "Sonstig"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(buchung.bruttobetrag)}
                          </TableCell>
                          <TableCell>
                            {buchung.faelligkeitsdatum ? (
                              <span className={new Date(buchung.faelligkeitsdatum) < new Date() && buchung.zahlungsstatus !== "bezahlt" ? "text-red-600 font-medium" : ""}>
                                {formatDate(buchung.faelligkeitsdatum)}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(buchung.zahlungsstatus as Zahlungsstatus)}</TableCell>
                          <TableCell className="text-right">
                            {buchung.zahlungsstatus !== "bezahlt" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleZahlungErfassen(buchung)}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Zahlung
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Zahlungs-Dialog */}
      <Dialog open={zahlungsDialog} onOpenChange={setZahlungsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zahlung erfassen</DialogTitle>
          </DialogHeader>
          
          {selectedBuchung && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Rechnung</p>
                <p className="font-medium">{selectedBuchung.belegnummer} - {selectedBuchung.geschaeftspartner}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(selectedBuchung.bruttobetrag)}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Zahlungsstatus</Label>
                  <Select
                    value={zahlungsDaten.zahlungsstatus}
                    onValueChange={(v) => setZahlungsDaten({ ...zahlungsDaten, zahlungsstatus: v as Zahlungsstatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bezahlt">Vollständig bezahlt</SelectItem>
                      <SelectItem value="teilweise_bezahlt">Teilweise bezahlt</SelectItem>
                      <SelectItem value="offen">Offen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Zahlungsdatum</Label>
                  <Input
                    type="date"
                    value={zahlungsDaten.bezahltAm}
                    onChange={(e) => setZahlungsDaten({ ...zahlungsDaten, bezahltAm: e.target.value })}
                  />
                </div>

                {zahlungsDaten.zahlungsstatus === "teilweise_bezahlt" && (
                  <div>
                    <Label>Bezahlter Betrag</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={zahlungsDaten.bezahlterBetrag}
                      onChange={(e) => setZahlungsDaten({ ...zahlungsDaten, bezahlterBetrag: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                )}

                <div>
                  <Label>Zahlungsreferenz (optional)</Label>
                  <Input
                    value={zahlungsDaten.zahlungsreferenz}
                    onChange={(e) => setZahlungsDaten({ ...zahlungsDaten, zahlungsreferenz: e.target.value })}
                    placeholder="z.B. Überweisungsreferenz"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setZahlungsDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleZahlungSpeichern} disabled={updateZahlungsstatus.isPending}>
              {updateZahlungsstatus.isPending ? "Speichern..." : "Zahlung speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
