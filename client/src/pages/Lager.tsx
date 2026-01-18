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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import {
  Package,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  ArrowRightLeft,
  AlertTriangle,
  History,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const EINHEIT_LABELS: Record<string, string> = {
  stueck: "Stk",
  kg: "kg",
  liter: "L",
  meter: "m",
  karton: "Ktn",
};

export default function Lager() {
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(null);
  const [selectedLagerortId, setSelectedLagerortId] = useState<number | null>(null);
  const [isEingangDialogOpen, setIsEingangDialogOpen] = useState(false);
  const [isAusgangDialogOpen, setIsAusgangDialogOpen] = useState(false);
  const [isKorrekturDialogOpen, setIsKorrekturDialogOpen] = useState(false);
  const [isUmbuchungDialogOpen, setIsUmbuchungDialogOpen] = useState(false);
  const [selectedArtikel, setSelectedArtikel] = useState<any>(null);
  const [nurNiedrig, setNurNiedrig] = useState(false);

  // Form states
  const [eingangMenge, setEingangMenge] = useState("");
  const [ausgangMenge, setAusgangMenge] = useState("");
  const [korrekturMenge, setKorrekturMenge] = useState("");
  const [umbuchungMenge, setUmbuchungMenge] = useState("");
  const [umbuchungZielLagerortId, setUmbuchungZielLagerortId] = useState<number | null>(null);
  const [notiz, setNotiz] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    if (saved) {
      setSelectedUnternehmenId(parseInt(saved));
    }
  }, []);

  // tRPC queries
  const bestaendeQuery = trpc.inventur.lager.getBestaende.useQuery(
    {
      unternehmenId: selectedUnternehmenId!,
      lagerortId: selectedLagerortId || undefined,
      nurNiedrig: nurNiedrig,
    },
    { enabled: !!selectedUnternehmenId }
  );

  const lagerorteQuery = trpc.inventur.lager.getLagerorte.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  const bewegungenQuery = trpc.inventur.lager.getBewegungen.useQuery(
    {
      unternehmenId: selectedUnternehmenId!,
      limit: 50,
    },
    { enabled: !!selectedUnternehmenId }
  );

  // tRPC mutations
  const eingangMutation = trpc.inventur.lager.eingang.useMutation({
    onSuccess: (data) => {
      toast.success(`Wareneingang gebucht. Neuer Bestand: ${data.neuerBestand}`);
      bestaendeQuery.refetch();
      bewegungenQuery.refetch();
      setIsEingangDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const ausgangMutation = trpc.inventur.lager.ausgang.useMutation({
    onSuccess: (data) => {
      toast.success(`Warenausgang gebucht. Neuer Bestand: ${data.neuerBestand}`);
      bestaendeQuery.refetch();
      bewegungenQuery.refetch();
      setIsAusgangDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const korrekturMutation = trpc.inventur.lager.korrektur.useMutation({
    onSuccess: (data) => {
      toast.success(`Bestandskorrektur durchgeführt. Neuer Bestand: ${data.neuerBestand}`);
      bestaendeQuery.refetch();
      bewegungenQuery.refetch();
      setIsKorrekturDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const umbuchungMutation = trpc.inventur.lager.umbuchung.useMutation({
    onSuccess: () => {
      toast.success("Umbuchung erfolgreich durchgeführt");
      bestaendeQuery.refetch();
      bewegungenQuery.refetch();
      setIsUmbuchungDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setEingangMenge("");
    setAusgangMenge("");
    setKorrekturMenge("");
    setUmbuchungMenge("");
    setUmbuchungZielLagerortId(null);
    setNotiz("");
    setSelectedArtikel(null);
  };

  const handleEingang = () => {
    if (!selectedArtikel || !selectedUnternehmenId) return;

    eingangMutation.mutate({
      artikelId: selectedArtikel.artikel.id,
      lagerortId: selectedArtikel.lagerort.id,
      menge: eingangMenge,
      notiz: notiz || undefined,
      erstelltVon: 1, // TODO: Get from auth context
    });
  };

  const handleAusgang = () => {
    if (!selectedArtikel || !selectedUnternehmenId) return;

    ausgangMutation.mutate({
      artikelId: selectedArtikel.artikel.id,
      lagerortId: selectedArtikel.lagerort.id,
      menge: ausgangMenge,
      notiz: notiz || undefined,
      erstelltVon: 1, // TODO: Get from auth context
    });
  };

  const handleKorrektur = () => {
    if (!selectedArtikel || !selectedUnternehmenId) return;

    korrekturMutation.mutate({
      artikelId: selectedArtikel.artikel.id,
      lagerortId: selectedArtikel.lagerort.id,
      neueMenge: korrekturMenge,
      notiz: notiz || undefined,
      erstelltVon: 1, // TODO: Get from auth context
    });
  };

  const handleUmbuchung = () => {
    if (!selectedArtikel || !umbuchungZielLagerortId) return;

    umbuchungMutation.mutate({
      artikelId: selectedArtikel.artikel.id,
      vonLagerortId: selectedArtikel.lagerort.id,
      zuLagerortId: umbuchungZielLagerortId,
      menge: umbuchungMenge,
      notiz: notiz || undefined,
      erstelltVon: 1, // TODO: Get from auth context
    });
  };

  const openEingangDialog = (bestand: any) => {
    setSelectedArtikel(bestand);
    setIsEingangDialogOpen(true);
  };

  const openAusgangDialog = (bestand: any) => {
    setSelectedArtikel(bestand);
    setIsAusgangDialogOpen(true);
  };

  const openKorrekturDialog = (bestand: any) => {
    setSelectedArtikel(bestand);
    setKorrekturMenge(bestand.bestand.menge || "0");
    setIsKorrekturDialogOpen(true);
  };

  const openUmbuchungDialog = (bestand: any) => {
    setSelectedArtikel(bestand);
    setIsUmbuchungDialogOpen(true);
  };

  const isNiedrig = (bestand: any) => {
    const menge = parseFloat(bestand.bestand.menge || "0");
    const mindest = parseFloat(bestand.artikel.mindestbestand || "0");
    return mindest > 0 && menge < mindest;
  };

  const bewegungsartLabel: Record<string, string> = {
    eingang: "Eingang",
    ausgang: "Ausgang",
    korrektur: "Korrektur",
    umbuchung: "Umbuchung",
    inventur: "Inventur",
  };

  const bewegungsartIcon: Record<string, any> = {
    eingang: TrendingUp,
    ausgang: TrendingDown,
    korrektur: RefreshCw,
    umbuchung: ArrowRightLeft,
    inventur: Package,
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
                Bitte wählen Sie ein Unternehmen aus, um die Lagerbestandsübersicht zu verwenden.
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
        <Tabs defaultValue="bestaende" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bestaende">Lagerbestände</TabsTrigger>
            <TabsTrigger value="bewegungen">Bewegungshistorie</TabsTrigger>
          </TabsList>

          {/* Lagerbestände Tab */}
          <TabsContent value="bestaende" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Lagerbestandsübersicht
                    </CardTitle>
                    <CardDescription>
                      Aktuelle Bestände aller Artikel mit Warnungen bei niedrigen Beständen
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filter */}
                <div className="flex gap-4 mb-4">
                  <Select
                    value={selectedLagerortId?.toString() || "all"}
                    onValueChange={(value) =>
                      setSelectedLagerortId(value === "all" ? null : parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-[250px]">
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
                  <Button
                    variant={nurNiedrig ? "default" : "outline"}
                    onClick={() => setNurNiedrig(!nurNiedrig)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Nur niedrige Bestände
                  </Button>
                </div>

                {/* Bestands-Tabelle */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artikel</TableHead>
                      <TableHead>Artikelnummer</TableHead>
                      <TableHead>Lagerort</TableHead>
                      <TableHead className="text-right">Bestand</TableHead>
                      <TableHead className="text-right">Mindestbestand</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bestaendeQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Lade Bestände...
                        </TableCell>
                      </TableRow>
                    ) : !bestaendeQuery.data || bestaendeQuery.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Keine Bestände gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      bestaendeQuery.data.map((bestand: any) => {
                        const niedrig = isNiedrig(bestand);
                        return (
                          <TableRow key={`${bestand.bestand.artikelId}-${bestand.bestand.lagerortId}`}>
                            <TableCell className="font-medium">
                              {bestand.artikel.bezeichnung}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {bestand.artikel.artikelnummer}
                            </TableCell>
                            <TableCell>{bestand.lagerort.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {parseFloat(bestand.bestand.menge || "0").toFixed(2)}{" "}
                              {EINHEIT_LABELS[bestand.artikel.einheit]}
                            </TableCell>
                            <TableCell className="text-right text-sm text-gray-500">
                              {bestand.artikel.mindestbestand
                                ? `${parseFloat(bestand.artikel.mindestbestand).toFixed(2)} ${
                                    EINHEIT_LABELS[bestand.artikel.einheit]
                                  }`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {niedrig ? (
                                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3" />
                                  Niedrig
                                </Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-500">
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEingangDialog(bestand)}
                                  title="Eingang"
                                >
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openAusgangDialog(bestand)}
                                  title="Ausgang"
                                >
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openKorrekturDialog(bestand)}
                                  title="Korrektur"
                                >
                                  <RefreshCw className="w-4 h-4 text-orange-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openUmbuchungDialog(bestand)}
                                  title="Umbuchung"
                                >
                                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bewegungshistorie Tab */}
          <TabsContent value="bewegungen" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Bewegungshistorie
                </CardTitle>
                <CardDescription>Letzte 50 Lagerbewegungen</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Art</TableHead>
                      <TableHead>Artikel</TableHead>
                      <TableHead>Lagerort</TableHead>
                      <TableHead className="text-right">Menge</TableHead>
                      <TableHead>Notiz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bewegungenQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Lade Bewegungen...
                        </TableCell>
                      </TableRow>
                    ) : !bewegungenQuery.data || bewegungenQuery.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Keine Bewegungen vorhanden
                        </TableCell>
                      </TableRow>
                    ) : (
                      bewegungenQuery.data.map((bewegung: any) => {
                        const Icon = bewegungsartIcon[bewegung.bewegung.bewegungsart];
                        return (
                          <TableRow key={bewegung.bewegung.id}>
                            <TableCell>
                              {new Date(bewegung.bewegung.createdAt).toLocaleDateString("de-DE")}{" "}
                              {new Date(bewegung.bewegung.createdAt).toLocaleTimeString("de-DE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <Icon className="w-3 h-3" />
                                {bewegungsartLabel[bewegung.bewegung.bewegungsart]}
                              </Badge>
                            </TableCell>
                            <TableCell>{bewegung.artikel.bezeichnung}</TableCell>
                            <TableCell>{bewegung.lagerort.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {parseFloat(bewegung.bewegung.menge).toFixed(2)}{" "}
                              {EINHEIT_LABELS[bewegung.artikel.einheit]}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {bewegung.bewegung.notiz || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Eingang Dialog */}
      <Dialog open={isEingangDialogOpen} onOpenChange={setIsEingangDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Wareneingang
            </DialogTitle>
            <DialogDescription>
              {selectedArtikel?.artikel.bezeichnung} ({selectedArtikel?.lagerort.name})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="eingang-menge">Menge *</Label>
              <Input
                id="eingang-menge"
                type="number"
                step="0.01"
                value={eingangMenge}
                onChange={(e) => setEingangMenge(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="eingang-notiz">Notiz</Label>
              <Textarea
                id="eingang-notiz"
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
                placeholder="Optionale Notiz zur Buchung"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEingangDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEingang} disabled={!eingangMenge || parseFloat(eingangMenge) <= 0}>
              Eingang buchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ausgang Dialog */}
      <Dialog open={isAusgangDialogOpen} onOpenChange={setIsAusgangDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Warenausgang
            </DialogTitle>
            <DialogDescription>
              {selectedArtikel?.artikel.bezeichnung} ({selectedArtikel?.lagerort.name})
              <br />
              Aktueller Bestand: {parseFloat(selectedArtikel?.bestand.menge || "0").toFixed(2)}{" "}
              {EINHEIT_LABELS[selectedArtikel?.artikel.einheit]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ausgang-menge">Menge *</Label>
              <Input
                id="ausgang-menge"
                type="number"
                step="0.01"
                value={ausgangMenge}
                onChange={(e) => setAusgangMenge(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="ausgang-notiz">Notiz</Label>
              <Textarea
                id="ausgang-notiz"
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
                placeholder="Optionale Notiz zur Buchung"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAusgangDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleAusgang}
              disabled={!ausgangMenge || parseFloat(ausgangMenge) <= 0}
            >
              Ausgang buchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Korrektur Dialog */}
      <Dialog open={isKorrekturDialogOpen} onOpenChange={setIsKorrekturDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              Bestandskorrektur
            </DialogTitle>
            <DialogDescription>
              {selectedArtikel?.artikel.bezeichnung} ({selectedArtikel?.lagerort.name})
              <br />
              Aktueller Bestand: {parseFloat(selectedArtikel?.bestand.menge || "0").toFixed(2)}{" "}
              {EINHEIT_LABELS[selectedArtikel?.artikel.einheit]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="korrektur-menge">Neuer Bestand *</Label>
              <Input
                id="korrektur-menge"
                type="number"
                step="0.01"
                value={korrekturMenge}
                onChange={(e) => setKorrekturMenge(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="korrektur-notiz">Grund für Korrektur *</Label>
              <Textarea
                id="korrektur-notiz"
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
                placeholder="Bitte Grund für die Korrektur angeben"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKorrekturDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleKorrektur} disabled={!korrekturMenge || !notiz}>
              Korrektur durchführen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Umbuchung Dialog */}
      <Dialog open={isUmbuchungDialogOpen} onOpenChange={setIsUmbuchungDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              Umbuchung zwischen Lagerorten
            </DialogTitle>
            <DialogDescription>
              {selectedArtikel?.artikel.bezeichnung}
              <br />
              Von: {selectedArtikel?.lagerort.name} (Bestand:{" "}
              {parseFloat(selectedArtikel?.bestand.menge || "0").toFixed(2)}{" "}
              {EINHEIT_LABELS[selectedArtikel?.artikel.einheit]})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="umbuchung-ziel">Ziel-Lagerort *</Label>
              <Select
                value={umbuchungZielLagerortId?.toString()}
                onValueChange={(value) => setUmbuchungZielLagerortId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lagerort wählen" />
                </SelectTrigger>
                <SelectContent>
                  {lagerorteQuery.data
                    ?.filter((l) => l.id !== selectedArtikel?.lagerort.id)
                    .map((lagerort) => (
                      <SelectItem key={lagerort.id} value={lagerort.id.toString()}>
                        {lagerort.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="umbuchung-menge">Menge *</Label>
              <Input
                id="umbuchung-menge"
                type="number"
                step="0.01"
                value={umbuchungMenge}
                onChange={(e) => setUmbuchungMenge(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="umbuchung-notiz">Notiz</Label>
              <Textarea
                id="umbuchung-notiz"
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
                placeholder="Optionale Notiz zur Umbuchung"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUmbuchungDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleUmbuchung}
              disabled={
                !umbuchungMenge || parseFloat(umbuchungMenge) <= 0 || !umbuchungZielLagerortId
              }
            >
              Umbuchung durchführen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
