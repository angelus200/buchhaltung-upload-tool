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
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { 
  Shield, 
  Users, 
  Building2,
  UserPlus,
  Settings,
  History,
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
  Calendar,
  LogOut,
  Lock,
  Unlock,
  BarChart3,
  Plus,
  Search
} from "lucide-react";

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

interface Benutzer {
  id: number;
  oderId: number;
  name: string | null;
  email: string | null;
  rolle: "admin" | "buchhalter" | "viewer";
  createdAt: Date;
  lastSignedIn: Date;
}

interface Unternehmen {
  id: number;
  name: string;
  kontenrahmen: string;
  rechtsform: string | null;
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

// Aktions-Labels für das Protokoll
const AKTIONS_LABELS: Record<string, { label: string; icon: React.ReactNode; farbe: string }> = {
  buchung_erstellt: { label: "Buchung erstellt", icon: <FileText className="w-4 h-4" />, farbe: "text-green-600" },
  buchung_bearbeitet: { label: "Buchung bearbeitet", icon: <Edit className="w-4 h-4" />, farbe: "text-blue-600" },
  buchung_geloescht: { label: "Buchung gelöscht", icon: <Trash2 className="w-4 h-4" />, farbe: "text-red-600" },
  benutzer_hinzugefuegt: { label: "Benutzer hinzugefügt", icon: <UserPlus className="w-4 h-4" />, farbe: "text-green-600" },
  benutzer_entfernt: { label: "Benutzer entfernt", icon: <Trash2 className="w-4 h-4" />, farbe: "text-red-600" },
  rolle_geaendert: { label: "Rolle geändert", icon: <Shield className="w-4 h-4" />, farbe: "text-orange-600" },
  login: { label: "Anmeldung", icon: <User className="w-4 h-4" />, farbe: "text-gray-600" },
};

export default function AdminBoard() {
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [unternehmenListe, setUnternehmenListe] = useState<Unternehmen[]>([]);
  const [benutzer, setBenutzer] = useState<Benutzer[]>([]);
  const [aktivitaeten, setAktivitaeten] = useState<Aktivitaet[]>([]);
  const [neueEmail, setNeueEmail] = useState("");
  const [neueRolle, setNeueRolle] = useState<"admin" | "buchhalter" | "viewer">("buchhalter");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBenutzer, setSelectedBenutzer] = useState<Benutzer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [istAdmin, setIstAdmin] = useState(false);

  // TRPC Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const benutzerQuery = trpc.benutzer.listByUnternehmen.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen && isAuthenticated }
  );

  const protokollQuery = trpc.protokoll.list.useQuery(
    { unternehmenId: selectedUnternehmen!, limit: 100 },
    { enabled: !!selectedUnternehmen && isAuthenticated }
  );

  const meineBerechtigungenQuery = trpc.benutzer.meineBerechtigungen.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen && isAuthenticated }
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

  // Redirect wenn nicht eingeloggt
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // Daten laden
  useEffect(() => {
    if (unternehmenQuery.data) {
      const liste = unternehmenQuery.data.map((u) => ({
        id: u.unternehmen.id,
        name: u.unternehmen.name,
        kontenrahmen: u.unternehmen.kontenrahmen,
        rechtsform: u.unternehmen.rechtsform,
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
      setIstAdmin(meineBerechtigungenQuery.data.rolle === "admin");
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

  const filteredBenutzer = benutzer.filter(b => 
    (b.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     b.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Prüfen ob Admin
  if (selectedUnternehmen && !istAdmin && meineBerechtigungenQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Zugriff verweigert</h2>
            <p className="text-slate-500 mb-6">
              Sie haben keine Administrator-Berechtigung für dieses Unternehmen.
            </p>
            <Link href="/dashboard">
              <Button>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Zurück zum Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">Admin Board</h1>
                  <p className="text-sm text-slate-400">Benutzer & Berechtigungen verwalten</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Unternehmensauswahl */}
              {unternehmenListe.length > 0 && (
                <Select
                  value={selectedUnternehmen?.toString() || ""}
                  onValueChange={(value) => setSelectedUnternehmen(parseInt(value))}
                >
                  <SelectTrigger className="w-64 bg-slate-700 border-slate-600 text-white">
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
              )}

              {/* Benutzer-Info */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white">{user.name || user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-slate-300 hover:text-white">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {!selectedUnternehmen || unternehmenListe.length === 0 ? (
          <Card className="p-12 text-center bg-slate-800 border-slate-700">
            <Building2 className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Kein Unternehmen ausgewählt</h3>
            <p className="text-slate-400">
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
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Linke Spalte: Statistiken */}
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Statistiken
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-teal-400" />
                      <span className="text-slate-300">Benutzer gesamt</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{benutzer.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-red-400" />
                      <span className="text-slate-300">Administratoren</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {benutzer.filter(b => b.rolle === "admin").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="text-slate-300">Buchhalter</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {benutzer.filter(b => b.rolle === "buchhalter").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-gray-400" />
                      <span className="text-slate-300">Nur Lesen</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {benutzer.filter(b => b.rolle === "viewer").length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Rollen-Übersicht */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Rollen-Übersicht
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ROLLEN.map((rolle) => (
                    <div key={rolle.id} className="p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={rolle.farbe}>{rolle.name}</Badge>
                      </div>
                      <p className="text-sm text-slate-400">{rolle.beschreibung}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Mittlere Spalte: Benutzerliste */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Benutzer verwalten</CardTitle>
                    <CardDescription className="text-slate-400">
                      Fügen Sie Benutzer hinzu und verwalten Sie deren Berechtigungen
                    </CardDescription>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-teal-600 hover:bg-teal-700">
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
                </CardHeader>
                <CardContent>
                  {/* Suchfeld */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Benutzer suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  {filteredBenutzer.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Users className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                      <p>Keine Benutzer gefunden</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBenutzer.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-300" />
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {b.name || "Unbekannt"}
                              </div>
                              <div className="text-sm text-slate-400 flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {b.email || "Keine E-Mail"}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3" />
                                Letzter Login: {formatDate(b.lastSignedIn)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getRolleBadge(b.rolle)}
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-300 hover:text-white"
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
                                className="text-red-400 hover:text-red-300"
                                onClick={() => handleRemoveBenutzer(b)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Aktivitätsprotokoll */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Letzte Aktivitäten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aktivitaeten.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <History className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                      <p>Noch keine Aktivitäten</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {aktivitaeten.slice(0, 10).map((a) => {
                        const aktionConfig = AKTIONS_LABELS[a.aktion] || {
                          label: a.aktion,
                          icon: <FileText className="w-4 h-4" />,
                          farbe: "text-gray-400",
                        };
                        return (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg"
                          >
                            <div className={`mt-1 ${aktionConfig.farbe}`}>
                              {aktionConfig.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm">
                                  {aktionConfig.label}
                                </span>
                              </div>
                              {a.entitaetName && (
                                <p className="text-sm text-slate-400 truncate">{a.entitaetName}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span>{a.user?.name || a.user?.email || "System"}</span>
                                <span>•</span>
                                <span>{formatDate(a.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

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
    </div>
  );
}
