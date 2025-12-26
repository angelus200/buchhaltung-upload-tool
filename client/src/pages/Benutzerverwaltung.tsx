import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { 
  Users, 
  UserPlus, 
  Shield, 
  History, 
  Building2,
  ChevronLeft,
  Trash2,
  Edit,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

// Rollen-Konfiguration
const ROLLEN = [
  { 
    id: "admin", 
    name: "Administrator", 
    beschreibung: "Voller Zugriff auf alle Funktionen",
    farbe: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  },
  { 
    id: "buchhalter", 
    name: "Buchhalter", 
    beschreibung: "Kann Buchungen erstellen und bearbeiten",
    farbe: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  { 
    id: "viewer", 
    name: "Nur Lesen", 
    beschreibung: "Kann nur Daten einsehen",
    farbe: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  },
];

// Aktions-Labels für das Protokoll
const AKTIONS_LABELS: Record<string, { label: string; icon: React.ReactNode; farbe: string }> = {
  buchung_erstellt: { label: "Buchung erstellt", icon: <FileText className="w-4 h-4" />, farbe: "text-green-600" },
  buchung_bearbeitet: { label: "Buchung bearbeitet", icon: <Edit className="w-4 h-4" />, farbe: "text-blue-600" },
  buchung_geloescht: { label: "Buchung gelöscht", icon: <Trash2 className="w-4 h-4" />, farbe: "text-red-600" },
  buchung_exportiert: { label: "Buchung exportiert", icon: <CheckCircle2 className="w-4 h-4" />, farbe: "text-purple-600" },
  stammdaten_erstellt: { label: "Stammdaten erstellt", icon: <FileText className="w-4 h-4" />, farbe: "text-green-600" },
  stammdaten_bearbeitet: { label: "Stammdaten bearbeitet", icon: <Edit className="w-4 h-4" />, farbe: "text-blue-600" },
  stammdaten_geloescht: { label: "Stammdaten gelöscht", icon: <Trash2 className="w-4 h-4" />, farbe: "text-red-600" },
  unternehmen_erstellt: { label: "Unternehmen erstellt", icon: <Building2 className="w-4 h-4" />, farbe: "text-green-600" },
  unternehmen_bearbeitet: { label: "Unternehmen bearbeitet", icon: <Edit className="w-4 h-4" />, farbe: "text-blue-600" },
  benutzer_hinzugefuegt: { label: "Benutzer hinzugefügt", icon: <UserPlus className="w-4 h-4" />, farbe: "text-green-600" },
  benutzer_entfernt: { label: "Benutzer entfernt", icon: <Trash2 className="w-4 h-4" />, farbe: "text-red-600" },
  rolle_geaendert: { label: "Rolle geändert", icon: <Shield className="w-4 h-4" />, farbe: "text-orange-600" },
  login: { label: "Anmeldung", icon: <User className="w-4 h-4" />, farbe: "text-gray-600" },
  logout: { label: "Abmeldung", icon: <User className="w-4 h-4" />, farbe: "text-gray-600" },
};

interface Benutzer {
  id: number;
  oderId: number;
  name: string | null;
  email: string | null;
  rolle: "admin" | "buchhalter" | "viewer";
  createdAt: Date;
  lastSignedIn: Date;
}

interface Aktivitaet {
  id: number;
  aktion: string;
  entitaetTyp: string | null;
  entitaetName: string | null;
  details: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface Unternehmen {
  id: number;
  name: string;
  kontenrahmen: string;
}

export default function Benutzerverwaltung() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [benutzer, setBenutzer] = useState<Benutzer[]>([]);
  const [aktivitaeten, setAktivitaeten] = useState<Aktivitaet[]>([]);
  const [unternehmenListe, setUnternehmenListe] = useState<Unternehmen[]>([]);
  const [neueEmail, setNeueEmail] = useState("");
  const [neueRolle, setNeueRolle] = useState<"admin" | "buchhalter" | "viewer">("buchhalter");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBenutzer, setSelectedBenutzer] = useState<Benutzer | null>(null);
  const [meineRolle, setMeineRolle] = useState<string | null>(null);

  // TRPC Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery();
  
  const benutzerQuery = trpc.benutzer.listByUnternehmen.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  const protokollQuery = trpc.protokoll.list.useQuery(
    { unternehmenId: selectedUnternehmen!, limit: 50 },
    { enabled: !!selectedUnternehmen }
  );

  const meineBerechtigungenQuery = trpc.benutzer.meineBerechtigungen.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  // TRPC Mutations
  const addBenutzerMutation = trpc.benutzer.addToUnternehmen.useMutation({
    onSuccess: () => {
      toast.success("Benutzer erfolgreich hinzugefügt");
      setDialogOpen(false);
      setNeueEmail("");
      benutzerQuery.refetch();
      protokollQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateRolleMutation = trpc.benutzer.updateRolle.useMutation({
    onSuccess: () => {
      toast.success("Rolle erfolgreich geändert");
      setEditDialogOpen(false);
      benutzerQuery.refetch();
      protokollQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeBenutzerMutation = trpc.benutzer.removeFromUnternehmen.useMutation({
    onSuccess: () => {
      toast.success("Benutzer erfolgreich entfernt");
      benutzerQuery.refetch();
      protokollQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Daten laden
  useEffect(() => {
    if (unternehmenQuery.data) {
      const liste = unternehmenQuery.data.map((u) => ({
        id: u.unternehmen.id,
        name: u.unternehmen.name,
        kontenrahmen: u.unternehmen.kontenrahmen,
      }));
      setUnternehmenListe(liste);
      if (liste.length > 0 && !selectedUnternehmen) {
        setSelectedUnternehmen(liste[0].id);
      }
    }
  }, [unternehmenQuery.data, selectedUnternehmen]);

  useEffect(() => {
    if (benutzerQuery.data) {
      setBenutzer(benutzerQuery.data as Benutzer[]);
    }
  }, [benutzerQuery.data]);

  useEffect(() => {
    if (protokollQuery.data) {
      setAktivitaeten(protokollQuery.data.items as Aktivitaet[]);
    }
  }, [protokollQuery.data]);

  useEffect(() => {
    if (meineBerechtigungenQuery.data) {
      setMeineRolle(meineBerechtigungenQuery.data.rolle);
    }
  }, [meineBerechtigungenQuery.data]);

  const handleAddBenutzer = () => {
    if (!selectedUnternehmen || !neueEmail) return;
    addBenutzerMutation.mutate({
      unternehmenId: selectedUnternehmen,
      email: neueEmail,
      rolle: neueRolle,
    });
  };

  const handleUpdateRolle = () => {
    if (!selectedUnternehmen || !selectedBenutzer) return;
    updateRolleMutation.mutate({
      zuordnungId: selectedBenutzer.id,
      unternehmenId: selectedUnternehmen,
      rolle: neueRolle,
    });
  };

  const handleRemoveBenutzer = (benutzer: Benutzer) => {
    if (!selectedUnternehmen) return;
    if (confirm(`Möchten Sie ${benutzer.name || benutzer.email} wirklich aus diesem Unternehmen entfernen?`)) {
      removeBenutzerMutation.mutate({
        zuordnungId: benutzer.id,
        unternehmenId: selectedUnternehmen,
      });
    }
  };

  const getRolleBadge = (rolle: string) => {
    const rolleConfig = ROLLEN.find((r) => r.id === rolle);
    return (
      <Badge className={rolleConfig?.farbe || "bg-gray-100"}>
        {rolleConfig?.name || rolle}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const istAdmin = meineRolle === "admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Einheitlicher Header */}
      <AppHeader title="Benutzerverwaltung" subtitle="Benutzer, Rollen und Aktivitätsprotokoll" />

      <main className="container py-8">
        {/* Unternehmensauswahl */}
        <div className="flex justify-end mb-6">
          <Select
            value={selectedUnternehmen?.toString() || ""}
            onValueChange={(value) => setSelectedUnternehmen(parseInt(value))}
          >
            <SelectTrigger className="w-64">
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
        </div>
        {!selectedUnternehmen ? (
          <Card className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Kein Unternehmen ausgewählt</h3>
            <p className="text-slate-500">
              Bitte wählen Sie ein Unternehmen aus oder erstellen Sie zuerst eines.
            </p>
            <Link href="/unternehmen">
              <Button className="mt-4">
                <Building2 className="w-4 h-4 mr-2" />
                Unternehmen verwalten
              </Button>
            </Link>
          </Card>
        ) : (
          <Tabs defaultValue="benutzer" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="benutzer" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Benutzer
              </TabsTrigger>
              <TabsTrigger value="rollen" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Rollen
              </TabsTrigger>
              <TabsTrigger value="protokoll" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Protokoll
              </TabsTrigger>
            </TabsList>

            {/* Benutzer-Tab */}
            <TabsContent value="benutzer">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Benutzer</CardTitle>
                    <CardDescription>
                      Verwalten Sie die Benutzer dieses Unternehmens
                    </CardDescription>
                  </div>
                  {istAdmin && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Benutzer hinzufügen
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Benutzer hinzufügen</DialogTitle>
                          <DialogDescription>
                            Fügen Sie einen registrierten Benutzer zu diesem Unternehmen hinzu.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">E-Mail-Adresse</label>
                            <Input
                              type="email"
                              placeholder="benutzer@beispiel.de"
                              value={neueEmail}
                              onChange={(e) => setNeueEmail(e.target.value)}
                            />
                            <p className="text-xs text-slate-500">
                              Der Benutzer muss sich bereits registriert haben.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rolle</label>
                            <Select
                              value={neueRolle}
                              onValueChange={(value: "admin" | "buchhalter" | "viewer") => setNeueRolle(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLLEN.map((rolle) => (
                                  <SelectItem key={rolle.id} value={rolle.id}>
                                    <div className="flex flex-col">
                                      <span>{rolle.name}</span>
                                      <span className="text-xs text-slate-500">{rolle.beschreibung}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Abbrechen
                          </Button>
                          <Button onClick={handleAddBenutzer} disabled={!neueEmail}>
                            Hinzufügen
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {benutzer.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p>Noch keine Benutzer zugeordnet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {benutzer.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">
                                {b.name || "Unbekannt"}
                              </div>
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {b.email || "Keine E-Mail"}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3" />
                                Letzter Login: {formatDate(b.lastSignedIn)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getRolleBadge(b.rolle)}
                            {istAdmin && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBenutzer(b);
                                    setNeueRolle(b.rolle);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleRemoveBenutzer(b)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rolle bearbeiten Dialog */}
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rolle bearbeiten</DialogTitle>
                    <DialogDescription>
                      Ändern Sie die Rolle von {selectedBenutzer?.name || selectedBenutzer?.email}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Select
                      value={neueRolle}
                      onValueChange={(value: "admin" | "buchhalter" | "viewer") => setNeueRolle(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLLEN.map((rolle) => (
                          <SelectItem key={rolle.id} value={rolle.id}>
                            <div className="flex flex-col">
                              <span>{rolle.name}</span>
                              <span className="text-xs text-slate-500">{rolle.beschreibung}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleUpdateRolle}>
                      Speichern
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Rollen-Tab */}
            <TabsContent value="rollen">
              <Card>
                <CardHeader>
                  <CardTitle>Rollen & Berechtigungen</CardTitle>
                  <CardDescription>
                    Übersicht der verfügbaren Rollen und deren Berechtigungen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {ROLLEN.map((rolle) => (
                      <div key={rolle.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={rolle.farbe}>{rolle.name}</Badge>
                          <span className="text-sm text-slate-500">{rolle.beschreibung}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-slate-700 mb-2">Buchungen</div>
                            <div className="space-y-1">
                              {rolle.id === "admin" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Erstellen</div>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Bearbeiten</div>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Löschen</div>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Exportieren</div>
                                </>
                              )}
                              {rolle.id === "buchhalter" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Erstellen</div>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Bearbeiten</div>
                                  <div className="flex items-center gap-1 text-red-400"><AlertCircle className="w-3 h-3" /> Löschen</div>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Exportieren</div>
                                </>
                              )}
                              {rolle.id === "viewer" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><Eye className="w-3 h-3" /> Nur Lesen</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-700 mb-2">Stammdaten</div>
                            <div className="space-y-1">
                              {rolle.id === "admin" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Voller Zugriff</div>
                                </>
                              )}
                              {rolle.id === "buchhalter" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Erstellen/Bearbeiten</div>
                                </>
                              )}
                              {rolle.id === "viewer" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><Eye className="w-3 h-3" /> Nur Lesen</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-700 mb-2">Unternehmen</div>
                            <div className="space-y-1">
                              {rolle.id === "admin" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Voller Zugriff</div>
                                </>
                              )}
                              {(rolle.id === "buchhalter" || rolle.id === "viewer") && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><Eye className="w-3 h-3" /> Nur Lesen</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-700 mb-2">Benutzer</div>
                            <div className="space-y-1">
                              {rolle.id === "admin" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Verwalten</div>
                                </>
                              )}
                              {rolle.id === "buchhalter" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><Eye className="w-3 h-3" /> Nur Lesen</div>
                                </>
                              )}
                              {rolle.id === "viewer" && (
                                <>
                                  <div className="flex items-center gap-1 text-red-400"><AlertCircle className="w-3 h-3" /> Kein Zugriff</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-700 mb-2">Protokoll</div>
                            <div className="space-y-1">
                              {rolle.id === "admin" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Voller Zugriff</div>
                                </>
                              )}
                              {rolle.id === "buchhalter" && (
                                <>
                                  <div className="flex items-center gap-1 text-green-600"><Eye className="w-3 h-3" /> Nur Lesen</div>
                                </>
                              )}
                              {rolle.id === "viewer" && (
                                <>
                                  <div className="flex items-center gap-1 text-red-400"><AlertCircle className="w-3 h-3" /> Kein Zugriff</div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Protokoll-Tab */}
            <TabsContent value="protokoll">
              <Card>
                <CardHeader>
                  <CardTitle>Aktivitätsprotokoll</CardTitle>
                  <CardDescription>
                    Alle Aktivitäten in diesem Unternehmen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aktivitaeten.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <History className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p>Noch keine Aktivitäten protokolliert</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aktivitaeten.map((a) => {
                        const aktionConfig = AKTIONS_LABELS[a.aktion] || {
                          label: a.aktion,
                          icon: <FileText className="w-4 h-4" />,
                          farbe: "text-gray-600",
                        };
                        return (
                          <div
                            key={a.id}
                            className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg"
                          >
                            <div className={`mt-1 ${aktionConfig.farbe}`}>
                              {aktionConfig.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">
                                  {aktionConfig.label}
                                </span>
                                {a.entitaetName && (
                                  <span className="text-slate-600">
                                    - {a.entitaetName}
                                  </span>
                                )}
                              </div>
                              {a.details && (
                                <p className="text-sm text-slate-500 mt-1">{a.details}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {a.user?.name || a.user?.email || "System"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(a.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
