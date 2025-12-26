import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { 
  FileText, 
  Upload,
  BarChart3,
  Building2,
  FileSpreadsheet,
  Bell,
  Settings,
  LogOut,
  User,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Euro,
  Calendar,
  ChevronRight,
  Shield
} from "lucide-react";

interface Unternehmen {
  id: number;
  name: string;
  kontenrahmen: string;
  rechtsform: string | null;
}

export default function Dashboard() {
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [unternehmenListe, setUnternehmenListe] = useState<Unternehmen[]>([]);

  // TRPC Queries
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect wenn nicht eingeloggt
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // Unternehmen laden
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const aktuellesUnternehmen = unternehmenListe.find(u => u.id === selectedUnternehmen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Einheitlicher Header */}
      <AppHeader title="Dashboard" subtitle={`Willkommen zurück, ${user.name || user.email}`} />

      <main className="container py-8">
        {unternehmenListe.length === 0 ? (
          /* Kein Unternehmen zugeordnet */
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">Kein Unternehmen zugeordnet</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Sie wurden noch keinem Unternehmen zugeordnet. Als Administrator können Sie im Admin-Board 
              ein neues Unternehmen erstellen. Andernfalls wenden Sie sich an Ihren Administrator.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/admin">
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Shield className="w-4 h-4 mr-2" />
                  Zum Admin-Board
                </Button>
              </Link>
              <Link href="/unternehmen">
                <Button variant="outline">
                  <Building2 className="w-4 h-4 mr-2" />
                  Unternehmen verwalten
                </Button>
              </Link>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Aktuelles Unternehmen Info */}
            {aktuellesUnternehmen && (
              <Card className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-5 h-5" />
                        <span className="text-teal-100">Aktuelles Unternehmen</span>
                      </div>
                      <h2 className="text-2xl font-bold">{aktuellesUnternehmen.name}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {aktuellesUnternehmen.kontenrahmen}
                        </Badge>
                        {aktuellesUnternehmen.rechtsform && (
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {aktuellesUnternehmen.rechtsform}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Link href="/">
                      <Button variant="secondary" className="bg-white text-teal-700 hover:bg-teal-50">
                        Zur Buchhaltung
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schnellzugriff */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Schnellzugriff</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
                        <Upload className="w-6 h-6 text-teal-600" />
                      </div>
                      <h4 className="font-semibold text-slate-900">Beleg hochladen</h4>
                      <p className="text-sm text-slate-500 mt-1">Neue Belege erfassen</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <Plus className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-slate-900">Manuelle Buchung</h4>
                      <p className="text-sm text-slate-500 mt-1">Buchungssatz erstellen</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/uebersicht">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-slate-900">Übersicht</h4>
                      <p className="text-sm text-slate-500 mt-1">Monatsberichte ansehen</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                        <FileSpreadsheet className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-slate-900">DATEV Export</h4>
                      <p className="text-sm text-slate-500 mt-1">Daten exportieren</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Weitere Funktionen */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Weitere Funktionen</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link href="/stammdaten">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <span className="font-medium">Stammdaten</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/notizen">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="font-medium">Notizen & Verträge</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/benachrichtigungen">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-slate-400" />
                        <span className="font-medium">Benachrichtigungen</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Statistik-Karten */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Übersicht aktueller Monat</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Buchungen</p>
                        <p className="text-2xl font-bold text-slate-900">0</p>
                      </div>
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Ausgaben</p>
                        <p className="text-2xl font-bold text-slate-900">0,00 €</p>
                      </div>
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Einnahmen</p>
                        <p className="text-2xl font-bold text-slate-900">0,00 €</p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Offene Belege</p>
                        <p className="text-2xl font-bold text-slate-900">0</p>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
