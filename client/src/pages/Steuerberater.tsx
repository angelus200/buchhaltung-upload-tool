import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  Send, 
  FileText, 
  Calendar, 
  Euro, 
  Plus, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Trash2,
  Eye,
  Upload,
  Mail,
  Cloud,
  Building,
  Package,
  Filter,
  BarChart3,
  RefreshCw
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";

// Übergabearten
const UEBERGABEARTEN = [
  { value: "datev_export", label: "DATEV-Export", icon: Download },
  { value: "email", label: "Per E-Mail", icon: Mail },
  { value: "portal", label: "Steuerberater-Portal", icon: Cloud },
  { value: "persoenlich", label: "Persönliche Übergabe", icon: Building },
  { value: "post", label: "Per Post", icon: Package },
  { value: "cloud", label: "Cloud-Speicher", icon: Cloud },
  { value: "sonstig", label: "Sonstige", icon: FileText },
];

// Status-Optionen
const STATUS_OPTIONEN = [
  { value: "vorbereitet", label: "Vorbereitet", color: "bg-gray-100 text-gray-800" },
  { value: "uebergeben", label: "Übergeben", color: "bg-blue-100 text-blue-800" },
  { value: "bestaetigt", label: "Bestätigt", color: "bg-green-100 text-green-800" },
  { value: "rueckfrage", label: "Rückfrage", color: "bg-amber-100 text-amber-800" },
  { value: "abgeschlossen", label: "Abgeschlossen", color: "bg-emerald-100 text-emerald-800" },
];

export default function Steuerberater() {
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUebergabe, setSelectedUebergabe] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  // Formular-State
  const [neueUebergabe, setNeueUebergabe] = useState({
    bezeichnung: "",
    beschreibung: "",
    uebergabeart: "datev_export" as const,
    zeitraumVon: "",
    zeitraumBis: "",
    uebergabedatum: new Date().toISOString().split("T")[0],
  });

  // Unternehmen aus LocalStorage laden
  useEffect(() => {
    const stored = localStorage.getItem("selectedUnternehmenId");
    if (stored) {
      setSelectedUnternehmenId(parseInt(stored));
    }
  }, []);

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();
  const { data: uebergaben, refetch: refetchUebergaben } = trpc.steuerberater.list.useQuery(
    { unternehmenId: selectedUnternehmenId!, status: filterStatus || undefined },
    { enabled: !!selectedUnternehmenId }
  );
  const { data: statistiken } = trpc.steuerberater.statistiken.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );
  const { data: uebergabeDetail } = trpc.steuerberater.getById.useQuery(
    { id: selectedUebergabe! },
    { enabled: !!selectedUebergabe }
  );

  // Mutations
  const createMutation = trpc.steuerberater.create.useMutation({
    onSuccess: () => {
      refetchUebergaben();
      setDialogOpen(false);
      resetForm();
    },
  });
  const updateMutation = trpc.steuerberater.update.useMutation({
    onSuccess: () => {
      refetchUebergaben();
    },
  });
  const deleteMutation = trpc.steuerberater.delete.useMutation({
    onSuccess: () => {
      refetchUebergaben();
      setDetailDialogOpen(false);
    },
  });

  const resetForm = () => {
    setNeueUebergabe({
      bezeichnung: "",
      beschreibung: "",
      uebergabeart: "datev_export",
      zeitraumVon: "",
      zeitraumBis: "",
      uebergabedatum: new Date().toISOString().split("T")[0],
    });
  };

  const handleCreate = () => {
    if (!selectedUnternehmenId || !neueUebergabe.bezeichnung) return;
    
    createMutation.mutate({
      unternehmenId: selectedUnternehmenId,
      bezeichnung: neueUebergabe.bezeichnung,
      beschreibung: neueUebergabe.beschreibung || undefined,
      uebergabeart: neueUebergabe.uebergabeart,
      zeitraumVon: neueUebergabe.zeitraumVon || undefined,
      zeitraumBis: neueUebergabe.zeitraumBis || undefined,
      uebergabedatum: neueUebergabe.uebergabedatum,
    });
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateMutation.mutate({
      id,
      status: newStatus as "vorbereitet" | "uebergeben" | "bestaetigt" | "rueckfrage" | "abgeschlossen",
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("de-DE");
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return "0,00 €";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(parseFloat(amount.toString()));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header mit Unternehmen-Auswahl */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send className="w-6 h-6 text-primary" />
              Steuerberater-Übergaben
            </h1>
            <p className="text-muted-foreground">
              Dokumentation der Datenübergaben an den Steuerberater
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={selectedUnternehmenId?.toString() || ""}
              onValueChange={(v) => {
                setSelectedUnternehmenId(parseInt(v));
                localStorage.setItem("selectedUnternehmenId", v);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Unternehmen auswählen" />
              </SelectTrigger>
              <SelectContent>
                {unternehmen?.map((u) => (
                  <SelectItem key={u.unternehmen.id} value={u.unternehmen.id.toString()}>
                    {u.unternehmen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedUnternehmenId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Übergabe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Neue Übergabe erfassen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Bezeichnung *</Label>
                    <Input
                      value={neueUebergabe.bezeichnung}
                      onChange={(e) => setNeueUebergabe({ ...neueUebergabe, bezeichnung: e.target.value })}
                      placeholder="z.B. Monatsabschluss Januar 2025"
                    />
                  </div>
                  
                  <div>
                    <Label>Übergabeart</Label>
                    <Select
                      value={neueUebergabe.uebergabeart}
                      onValueChange={(v) => setNeueUebergabe({ ...neueUebergabe, uebergabeart: v as typeof neueUebergabe.uebergabeart })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UEBERGABEARTEN.map((art) => (
                          <SelectItem key={art.value} value={art.value}>
                            {art.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Zeitraum von</Label>
                      <Input
                        type="date"
                        value={neueUebergabe.zeitraumVon}
                        onChange={(e) => setNeueUebergabe({ ...neueUebergabe, zeitraumVon: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Zeitraum bis</Label>
                      <Input
                        type="date"
                        value={neueUebergabe.zeitraumBis}
                        onChange={(e) => setNeueUebergabe({ ...neueUebergabe, zeitraumBis: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Übergabedatum *</Label>
                    <Input
                      type="date"
                      value={neueUebergabe.uebergabedatum}
                      onChange={(e) => setNeueUebergabe({ ...neueUebergabe, uebergabedatum: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label>Beschreibung / Notizen</Label>
                    <Textarea
                      value={neueUebergabe.beschreibung}
                      onChange={(e) => setNeueUebergabe({ ...neueUebergabe, beschreibung: e.target.value })}
                      placeholder="Optionale Notizen zur Übergabe..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleCreate} disabled={!neueUebergabe.bezeichnung || createMutation.isPending}>
                    {createMutation.isPending ? "Wird erstellt..." : "Übergabe erstellen"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!selectedUnternehmenId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Bitte wählen Sie ein Unternehmen aus, um die Steuerberater-Übergaben zu verwalten.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Statistiken */}
            {statistiken && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Gesamt</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.gesamt}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">Vorbereitet</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.vorbereitet}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Übergeben</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.uebergeben}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-muted-foreground">Rückfragen</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.rueckfragen}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-muted-foreground">Abgeschlossen</span>
                    </div>
                    <p className="text-2xl font-bold">{statistiken.abgeschlossen}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Gesamtbetrag</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(statistiken.gesamtBetrag)}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Status</SelectItem>
                    {STATUS_OPTIONEN.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchUebergaben()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Aktualisieren
              </Button>
            </div>

            {/* Übergaben-Liste */}
            <div className="space-y-4">
              {!uebergaben || uebergaben.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Noch keine Übergaben erfasst. Erstellen Sie eine neue Übergabe.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                uebergaben.map((uebergabe) => {
                  const artInfo = UEBERGABEARTEN.find(a => a.value === uebergabe.uebergabeart);
                  const statusInfo = STATUS_OPTIONEN.find(s => s.value === uebergabe.status);
                  const ArtIcon = artInfo?.icon || FileText;
                  
                  return (
                    <Card key={uebergabe.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <ArtIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{uebergabe.bezeichnung}</span>
                                <Badge className={statusInfo?.color}>
                                  {statusInfo?.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(uebergabe.uebergabedatum)}
                                </span>
                                {uebergabe.zeitraumVon && uebergabe.zeitraumBis && (
                                  <span>
                                    Zeitraum: {formatDate(uebergabe.zeitraumVon)} - {formatDate(uebergabe.zeitraumBis)}
                                  </span>
                                )}
                                <span>{artInfo?.label}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {uebergabe.anzahlBuchungen || 0} Buchungen
                              </div>
                              <div className="font-semibold">
                                {formatCurrency(uebergabe.gesamtbetrag)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Select
                                value={uebergabe.status}
                                onValueChange={(v) => handleStatusChange(uebergabe.id, v)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONEN.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUebergabe(uebergabe.id);
                                  setDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {uebergabe.rueckfragen && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-800 font-medium text-sm mb-1">
                              <AlertTriangle className="w-4 h-4" />
                              Rückfrage vom Steuerberater
                            </div>
                            <p className="text-sm text-amber-700">{uebergabe.rueckfragen}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* Detail-Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Übergabe-Details</DialogTitle>
          </DialogHeader>
          {uebergabeDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Bezeichnung</Label>
                  <p className="font-medium">{uebergabeDetail.bezeichnung}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={STATUS_OPTIONEN.find(s => s.value === uebergabeDetail.status)?.color}>
                    {STATUS_OPTIONEN.find(s => s.value === uebergabeDetail.status)?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Übergabedatum</Label>
                  <p>{formatDate(uebergabeDetail.uebergabedatum)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Übergabeart</Label>
                  <p>{UEBERGABEARTEN.find(a => a.value === uebergabeDetail.uebergabeart)?.label}</p>
                </div>
                {uebergabeDetail.zeitraumVon && (
                  <div>
                    <Label className="text-muted-foreground">Zeitraum</Label>
                    <p>{formatDate(uebergabeDetail.zeitraumVon)} - {formatDate(uebergabeDetail.zeitraumBis)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Gesamtbetrag</Label>
                  <p className="font-semibold">{formatCurrency(uebergabeDetail.gesamtbetrag)}</p>
                </div>
              </div>
              
              {uebergabeDetail.beschreibung && (
                <div>
                  <Label className="text-muted-foreground">Beschreibung</Label>
                  <p className="text-sm">{uebergabeDetail.beschreibung}</p>
                </div>
              )}
              
              {/* Positionen */}
              <div>
                <Label className="text-muted-foreground mb-2 block">
                  Enthaltene Buchungen ({uebergabeDetail.positionen?.length || 0})
                </Label>
                {uebergabeDetail.positionen && uebergabeDetail.positionen.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Datum</th>
                          <th className="text-left p-2">Beleg-Nr.</th>
                          <th className="text-left p-2">Partner</th>
                          <th className="text-right p-2">Betrag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uebergabeDetail.positionen.map((pos) => (
                          <tr key={pos.id} className="border-t">
                            <td className="p-2">{pos.buchung ? formatDate(pos.buchung.belegdatum) : "-"}</td>
                            <td className="p-2">{pos.buchung?.belegnummer || "-"}</td>
                            <td className="p-2">{pos.buchung?.geschaeftspartner || pos.beschreibung || "-"}</td>
                            <td className="p-2 text-right">{formatCurrency(pos.betrag)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Buchungen zugeordnet</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedUebergabe && deleteMutation.mutate({ id: selectedUebergabe })}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
