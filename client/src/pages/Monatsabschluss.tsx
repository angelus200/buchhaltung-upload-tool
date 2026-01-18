import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import {
  Calendar,
  Check,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
  Building2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const STATUS_CONFIG = {
  offen: {
    label: "Offen",
    icon: AlertCircle,
    farbe: "bg-slate-100 text-slate-700",
    badge: "bg-slate-100 text-slate-700",
  },
  in_arbeit: {
    label: "In Arbeit",
    icon: Clock,
    farbe: "bg-blue-100 text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
  geprueft: {
    label: "Geprüft",
    icon: CheckCircle2,
    farbe: "bg-purple-100 text-purple-700",
    badge: "bg-purple-100 text-purple-700",
  },
  abgeschlossen: {
    label: "Abgeschlossen",
    icon: Lock,
    farbe: "bg-green-100 text-green-700",
    badge: "bg-green-500 text-white",
  },
  korrektur: {
    label: "Korrektur",
    icon: XCircle,
    farbe: "bg-orange-100 text-orange-700",
    badge: "bg-orange-100 text-orange-700",
  },
};

const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

type MonatsStatus = "offen" | "in_arbeit" | "geprueft" | "abgeschlossen" | "korrektur";

export default function Monatsabschluss() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [selectedJahr, setSelectedJahr] = useState(new Date().getFullYear());
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; monat: number | null }>({
    open: false,
    monat: null,
  });
  const [notizen, setNotizen] = useState("");

  // Unternehmen laden
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Jahresübersicht laden
  const jahresQuery = trpc.monatsabschluss.jahresUebersicht.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      jahr: selectedJahr,
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Monatsabschluss-Detail laden
  const detailQuery = trpc.monatsabschluss.getById.useQuery(
    {
      id: detailDialog.monat || 0,
    },
    {
      enabled: !!detailDialog.monat && detailDialog.open,
    }
  );

  // Mutations
  const getOrCreateMutation = trpc.monatsabschluss.getOrCreate.useMutation({
    onSuccess: (data: any) => {
      setDetailDialog({ open: true, monat: data.id });
      setNotizen(data.notizen || "");
      jahresQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  const updateStatusMutation = trpc.monatsabschluss.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status aktualisiert");
      detailQuery.refetch();
      jahresQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  const toggleItemMutation = trpc.monatsabschluss.toggleItem.useMutation({
    onSuccess: () => {
      detailQuery.refetch();
      jahresQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  // Auto-select erstes Unternehmen
  const unternehmenListe = useMemo(() => {
    if (!unternehmenQuery.data) return [];
    return unternehmenQuery.data.map((u) => ({
      id: u.unternehmen.id,
      name: u.unternehmen.name,
    }));
  }, [unternehmenQuery.data]);

  useMemo(() => {
    if (unternehmenListe.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenListe[0].id);
    }
  }, [unternehmenListe, selectedUnternehmen]);

  const jahresUebersicht = jahresQuery.data;
  const detail = detailQuery.data;

  const JAHRE = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleOpenMonat = (monat: number) => {
    if (!selectedUnternehmen) return;

    const monatDaten = jahresUebersicht?.monate.find((m: any) => m.monat === monat);

    if (monatDaten?.id) {
      // Monat existiert bereits
      setDetailDialog({ open: true, monat: monatDaten.id });
      setNotizen("");
    } else {
      // Monat erstellen
      getOrCreateMutation.mutate({
        unternehmenId: selectedUnternehmen,
        jahr: selectedJahr,
        monat,
      });
    }
  };

  const handleToggleItem = (itemId: number, erledigt: boolean) => {
    toggleItemMutation.mutate({ itemId, erledigt });
  };

  const handleUpdateStatus = (status: MonatsStatus) => {
    if (!detail) return;

    updateStatusMutation.mutate({
      id: detail.id,
      status,
      notizen: notizen || undefined,
    });
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as MonatsStatus] || STATUS_CONFIG.offen;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AppHeader title="Monatsabschluss" subtitle="Monatsabschlüsse verwalten und Perioden sperren" />

      <main className="container py-8">
        {/* Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm border">
          <Building2 className="w-5 h-5 text-slate-500" />
          <Select
            value={selectedUnternehmen?.toString() || ""}
            onValueChange={(v) => setSelectedUnternehmen(parseInt(v))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Unternehmen wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmenListe.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedJahr.toString()} onValueChange={(v) => setSelectedJahr(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JAHRE.map((j) => (
                <SelectItem key={j} value={j.toString()}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {jahresUebersicht && (
            <div className="ml-auto flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <span>Offen: {jahresUebersicht.statistik.offene}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>In Arbeit: {jahresUebersicht.statistik.inArbeit}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Abgeschlossen: {jahresUebersicht.statistik.abgeschlossene}</span>
              </div>
            </div>
          )}
        </div>

        {!selectedUnternehmen ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Kein Unternehmen ausgewählt</h2>
            <p className="text-slate-500">Bitte wählen Sie ein Unternehmen aus.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MONATE.map((monatName, index) => {
              const monat = index + 1;
              const monatDaten = jahresUebersicht?.monate.find((m: any) => m.monat === monat);
              const status = monatDaten?.status || "offen";
              const config = getStatusConfig(status);
              const Icon = config.icon;

              return (
                <Card
                  key={monat}
                  className={`cursor-pointer hover:shadow-lg transition-all ${config.farbe} border-2`}
                  onClick={() => handleOpenMonat(monat)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{monatName}</CardTitle>
                      <Icon className="w-5 h-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge className={config.badge}>{config.label}</Badge>
                      {monatDaten?.gesperrt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Lock className="w-4 h-4" />
                          <span>Gesperrt</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, monat: null })}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {detail ? `Monatsabschluss ${MONATE[detail.monat - 1]} ${detail.jahr}` : "Lädt..."}
              </DialogTitle>
              <DialogDescription>
                {detail?.gesperrt
                  ? "Dieser Monat ist abgeschlossen und gesperrt."
                  : "Verwalten Sie die Checkliste für den Monatsabschluss."}
              </DialogDescription>
            </DialogHeader>

            {detailQuery.isPending || getOrCreateMutation.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : detail ? (
              <div className="space-y-6">
                {/* Status & Fortschritt */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Status & Fortschritt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusConfig(detail.status).badge}>
                        {getStatusConfig(detail.status).label}
                      </Badge>
                      {detail.gesperrt && (
                        <Badge variant="destructive" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Gesperrt
                        </Badge>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Fortschritt</span>
                        <span className="font-semibold">{detail.fortschritt}%</span>
                      </div>
                      <Progress value={detail.fortschritt} />
                    </div>

                    {!detail.gesperrt && (
                      <div className="flex gap-2 flex-wrap">
                        {detail.status !== "in_arbeit" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus("in_arbeit")}
                            disabled={updateStatusMutation.isPending}
                          >
                            In Arbeit
                          </Button>
                        )}
                        {detail.status !== "geprueft" && detail.kannAbgeschlossenWerden && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus("geprueft")}
                            disabled={updateStatusMutation.isPending}
                          >
                            Als geprüft markieren
                          </Button>
                        )}
                        {detail.kannAbgeschlossenWerden && detail.status !== "abgeschlossen" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus("abgeschlossen")}
                            disabled={updateStatusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Abschließen & Sperren
                          </Button>
                        )}
                      </div>
                    )}

                    {detail.gesperrt && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus("korrektur")}
                        disabled={updateStatusMutation.isPending}
                        className="text-orange-600"
                      >
                        <Unlock className="w-4 h-4 mr-2" />
                        Für Korrektur öffnen
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Checkliste */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Checkliste</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detail.checklist?.map((item: any) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            item.erledigt ? "bg-green-50 border-green-200" : "bg-slate-50"
                          }`}
                        >
                          <Checkbox
                            id={`item-${item.id}`}
                            checked={item.erledigt}
                            onCheckedChange={(checked) => handleToggleItem(item.id, checked as boolean)}
                            disabled={detail.gesperrt && detail.status === "abgeschlossen"}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`item-${item.id}`}
                              className={`cursor-pointer ${item.erledigt ? "line-through text-slate-500" : ""}`}
                            >
                              {item.beschreibung}
                              {item.pflicht && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {item.erledigtAm && (
                              <p className="text-xs text-slate-500 mt-1">
                                Erledigt am {format(new Date(item.erledigtAm), "dd.MM.yyyy HH:mm", { locale: de })}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.kategorie}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {!detail.kannAbgeschlossenWerden && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          Alle Pflichtaufgaben müssen erledigt sein, bevor der Monat abgeschlossen werden kann.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notizen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Notizen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={notizen}
                      onChange={(e) => setNotizen(e.target.value)}
                      placeholder="Notizen zum Monatsabschluss..."
                      rows={4}
                      disabled={detail.gesperrt && detail.status === "abgeschlossen"}
                    />
                    {notizen !== (detail.notizen || "") && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: detail.id,
                            status: detail.status as MonatsStatus,
                            notizen,
                          })
                        }
                      >
                        Notizen speichern
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Info wenn abgeschlossen */}
                {detail.abgeschlossenAm && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 text-sm text-green-800">
                        <CheckCircle2 className="w-5 h-5" />
                        <div>
                          <p className="font-semibold">Abgeschlossen</p>
                          <p>
                            Am {format(new Date(detail.abgeschlossenAm), "dd.MM.yyyy HH:mm", { locale: de })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
