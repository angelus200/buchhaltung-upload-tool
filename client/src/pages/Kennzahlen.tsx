import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  PieChartIcon,
  BarChart3,
  Wallet,
  Receipt,
  Calculator,
} from "lucide-react";

// Farben für Charts
const COLORS = ["#0d9488", "#0891b2", "#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#eab308", "#22c55e"];

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M €`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k €`;
  }
  return `${value.toFixed(0)} €`;
}

interface KennzahlenKarteProps {
  titel: string;
  wert: number;
  icon: React.ReactNode;
  trend?: number;
  beschreibung?: string;
  farbe?: string;
}

function KennzahlenKarte({ titel, wert, icon, trend, beschreibung, farbe = "teal" }: KennzahlenKarteProps) {
  const isPositive = wert >= 0;
  const trendIsPositive = trend && trend >= 0;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{titel}</p>
            <p className={`text-3xl font-bold tabular-nums ${isPositive ? "text-foreground" : "text-red-600"}`}>
              {formatCurrency(wert)} €
            </p>
            {beschreibung && (
              <p className="text-xs text-muted-foreground">{beschreibung}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${trendIsPositive ? "text-green-600" : "text-red-600"}`}>
                {trendIsPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>{Math.abs(trend).toFixed(1)}% zum Vormonat</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl bg-${farbe}-100 flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${farbe}-500 to-${farbe}-400`} />
    </Card>
  );
}

export default function Kennzahlen() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [selectedJahr, setSelectedJahr] = useState(new Date().getFullYear());
  const [selectedMonat, setSelectedMonat] = useState<number | undefined>(undefined);

  // Unternehmen laden
  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Kennzahlen laden
  const kennzahlenQuery = trpc.dashboard.kennzahlen.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      jahr: selectedJahr,
      monat: selectedMonat,
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Monatliche Entwicklung
  const entwicklungQuery = trpc.dashboard.monatlicheEntwicklung.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      jahr: selectedJahr,
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Aufwandsverteilung
  const aufwandsverteilungQuery = trpc.dashboard.aufwandsverteilung.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      jahr: selectedJahr,
      monat: selectedMonat,
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Ertragsverteilung
  const ertragsverteilungQuery = trpc.dashboard.ertragsverteilung.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      jahr: selectedJahr,
      monat: selectedMonat,
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Top Kreditoren
  const topKreditorenQuery = trpc.dashboard.topGeschaeftspartner.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      jahr: selectedJahr,
      typ: "kreditor",
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Top Debitoren
  const topDebitorenQuery = trpc.dashboard.topGeschaeftspartner.useQuery(
    {
      unternehmenId: selectedUnternehmen || 0,
      jahr: selectedJahr,
      typ: "debitor",
    },
    {
      enabled: !!selectedUnternehmen,
    }
  );

  // Erstes Unternehmen auswählen
  const unternehmenListe = useMemo(() => {
    if (!unternehmenQuery.data) return [];
    return unternehmenQuery.data.map((u) => ({
      id: u.unternehmen.id,
      name: u.unternehmen.name,
    }));
  }, [unternehmenQuery.data]);

  // Auto-Select erstes Unternehmen
  useMemo(() => {
    if (unternehmenListe.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenListe[0].id);
    }
  }, [unternehmenListe, selectedUnternehmen]);

  const kennzahlen = kennzahlenQuery.data || {
    einnahmen: 0,
    ausgaben: 0,
    gewinn: 0,
    buchungenAnzahl: 0,
    vorsteuer: 0,
    umsatzsteuer: 0,
    zahllast: 0,
  };

  const entwicklung = entwicklungQuery.data || [];
  const aufwandsverteilung = aufwandsverteilungQuery.data || [];
  const ertragsverteilung = ertragsverteilungQuery.data || [];
  const topKreditoren = topKreditorenQuery.data || [];
  const topDebitoren = topDebitorenQuery.data || [];

  // Gewinn/Verlust Daten für Chart
  const gewinnVerlustDaten = entwicklung.map((m) => ({
    ...m,
    gewinnFarbe: m.gewinn >= 0 ? "#22c55e" : "#ef4444",
  }));

  const MONATE = [
    { value: "all", label: "Gesamtes Jahr" },
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

  const JAHRE = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AppHeader title="Kennzahlen & Auswertungen" subtitle="Finanzübersicht und Gewinn-/Verlustrechnung" />

      <main className="container py-8">
        {/* Filter-Leiste */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm border">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
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
          </div>

          <Separator orientation="vertical" className="h-8" />

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

          <Select
            value={selectedMonat?.toString() || "all"}
            onValueChange={(v) => setSelectedMonat(v === "all" ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[150px]">
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
        </div>

        {!selectedUnternehmen ? (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Kein Unternehmen ausgewählt</h2>
            <p className="text-slate-500">Bitte wählen Sie ein Unternehmen aus, um die Kennzahlen anzuzeigen.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Hauptkennzahlen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-700">Einnahmen</p>
                      <p className="text-3xl font-bold tabular-nums text-green-800">
                        {formatCurrency(kennzahlen.einnahmen)} €
                      </p>
                      <p className="text-xs text-green-600">Erträge (netto)</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-200 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-700">Ausgaben</p>
                      <p className="text-3xl font-bold tabular-nums text-red-800">
                        {formatCurrency(kennzahlen.ausgaben)} €
                      </p>
                      <p className="text-xs text-red-600">Aufwendungen (netto)</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-200 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`relative overflow-hidden ${kennzahlen.gewinn >= 0 ? "bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200" : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className={`text-sm font-medium ${kennzahlen.gewinn >= 0 ? "text-teal-700" : "text-orange-700"}`}>
                        {kennzahlen.gewinn >= 0 ? "Gewinn" : "Verlust"}
                      </p>
                      <p className={`text-3xl font-bold tabular-nums ${kennzahlen.gewinn >= 0 ? "text-teal-800" : "text-orange-800"}`}>
                        {formatCurrency(Math.abs(kennzahlen.gewinn))} €
                      </p>
                      <p className={`text-xs ${kennzahlen.gewinn >= 0 ? "text-teal-600" : "text-orange-600"}`}>
                        Einnahmen - Ausgaben
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${kennzahlen.gewinn >= 0 ? "bg-teal-200" : "bg-orange-200"} flex items-center justify-center`}>
                      <Euro className={`w-6 h-6 ${kennzahlen.gewinn >= 0 ? "text-teal-700" : "text-orange-700"}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-purple-700">Buchungen</p>
                      <p className="text-3xl font-bold tabular-nums text-purple-800">
                        {kennzahlen.buchungenAnzahl}
                      </p>
                      <p className="text-xs text-purple-600">Im Zeitraum</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Steuer-Übersicht */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vorsteuer</p>
                      <p className="text-xl font-bold tabular-nums">{formatCurrency(kennzahlen.vorsteuer)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Umsatzsteuer</p>
                      <p className="text-xl font-bold tabular-nums">{formatCurrency(kennzahlen.umsatzsteuer)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={kennzahlen.zahllast >= 0 ? "" : "border-green-200"}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${kennzahlen.zahllast >= 0 ? "bg-red-100" : "bg-green-100"} flex items-center justify-center`}>
                      <Calculator className={`w-5 h-5 ${kennzahlen.zahllast >= 0 ? "text-red-600" : "text-green-600"}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {kennzahlen.zahllast >= 0 ? "Zahllast" : "Vorsteuerüberhang"}
                      </p>
                      <p className={`text-xl font-bold tabular-nums ${kennzahlen.zahllast >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(Math.abs(kennzahlen.zahllast))} €
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="entwicklung" className="space-y-6">
              <TabsList className="bg-white border shadow-sm">
                <TabsTrigger value="entwicklung" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Monatliche Entwicklung
                </TabsTrigger>
                <TabsTrigger value="guv" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Gewinn/Verlust
                </TabsTrigger>
                <TabsTrigger value="verteilung" className="gap-2">
                  <PieChartIcon className="w-4 h-4" />
                  Kostenverteilung
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entwicklung">
                <Card>
                  <CardHeader>
                    <CardTitle>Einnahmen und Ausgaben {selectedJahr}</CardTitle>
                    <CardDescription>Monatliche Übersicht der Geschäftsentwicklung</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={entwicklung} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="monatName" tick={{ fill: "#6b7280" }} />
                          <YAxis tick={{ fill: "#6b7280" }} tickFormatter={formatCompactCurrency} />
                          <Tooltip
                            formatter={(value: number) => [`${formatCurrency(value)} €`]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                          />
                          <Legend />
                          <Bar dataKey="einnahmen" name="Einnahmen" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="ausgaben" name="Ausgaben" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="guv">
                <Card>
                  <CardHeader>
                    <CardTitle>Gewinn- und Verlustentwicklung {selectedJahr}</CardTitle>
                    <CardDescription>Monatlicher Gewinn oder Verlust im Jahresverlauf</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={entwicklung} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="gewinnGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="monatName" tick={{ fill: "#6b7280" }} />
                          <YAxis tick={{ fill: "#6b7280" }} tickFormatter={formatCompactCurrency} />
                          <Tooltip
                            formatter={(value: number) => [`${formatCurrency(value)} €`]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="gewinn"
                            name="Gewinn/Verlust"
                            stroke="#0d9488"
                            fill="url(#gewinnGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="verteilung">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Aufwandsverteilung</CardTitle>
                      <CardDescription>Top 10 Aufwandskonten nach Betrag</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {aufwandsverteilung.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={aufwandsverteilung}
                                dataKey="summe"
                                nameKey="sachkonto"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ sachkonto, percent }) =>
                                  `${sachkonto} (${(percent * 100).toFixed(0)}%)`
                                }
                              >
                                {aufwandsverteilung.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => [`${formatCurrency(value)} €`]}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Keine Aufwandsbuchungen vorhanden
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ertragsverteilung</CardTitle>
                      <CardDescription>Top 10 Ertragskonten nach Betrag</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ertragsverteilung.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={ertragsverteilung}
                                dataKey="summe"
                                nameKey="sachkonto"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ sachkonto, percent }) =>
                                  `${sachkonto} (${(percent * 100).toFixed(0)}%)`
                                }
                              >
                                {ertragsverteilung.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => [`${formatCurrency(value)} €`]}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          Keine Ertragsbuchungen vorhanden
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Top Geschäftspartner */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    Top Lieferanten (Kreditoren)
                  </CardTitle>
                  <CardDescription>Höchste Ausgaben nach Geschäftspartner</CardDescription>
                </CardHeader>
                <CardContent>
                  {topKreditoren.length > 0 ? (
                    <div className="space-y-4">
                      {topKreditoren.map((k, i) => (
                        <div key={k.name} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{k.name}</p>
                            <p className="text-sm text-muted-foreground">{k.anzahl} Buchungen</p>
                          </div>
                          <p className="font-mono font-semibold text-red-600 tabular-nums">
                            {formatCurrency(k.summe)} €
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Keine Kreditoren-Buchungen vorhanden</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Top Kunden (Debitoren)
                  </CardTitle>
                  <CardDescription>Höchste Einnahmen nach Geschäftspartner</CardDescription>
                </CardHeader>
                <CardContent>
                  {topDebitoren.length > 0 ? (
                    <div className="space-y-4">
                      {topDebitoren.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{d.name}</p>
                            <p className="text-sm text-muted-foreground">{d.anzahl} Buchungen</p>
                          </div>
                          <p className="font-mono font-semibold text-green-600 tabular-nums">
                            {formatCurrency(d.summe)} €
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Keine Debitoren-Buchungen vorhanden</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
