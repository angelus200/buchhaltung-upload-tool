import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Building2, Car, Monitor, Wrench, Factory, Package, Plus, RefreshCw, Calculator, Trash2, Pencil, Loader2, AlertCircle, TrendingDown, Euro, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { exportAnlagenspiegelPDF } from '@/lib/pdf-export';
import { exportAnlagenspiegelExcel } from '@/lib/excel-export';

const KATEGORIEN = [
  { value: 'alle', label: 'Alle', icon: Package },
  { value: 'Grundstücke und Gebäude', label: 'Gebäude', icon: Building2 },
  { value: 'Technische Anlagen und Maschinen', label: 'Maschinen', icon: Factory },
  { value: 'Fahrzeuge', label: 'Fahrzeuge', icon: Car },
  { value: 'Computer', label: 'EDV', icon: Monitor },
  { value: 'Andere Anlagen, Betriebs- und Geschäftsausstattung', label: 'BGA', icon: Wrench },
  { value: 'Sonstiges Anlagevermögen', label: 'Sonstiges', icon: Package },
];

const MONATE = [
  { value: 1, label: 'Januar' }, { value: 2, label: 'Februar' }, { value: 3, label: 'März' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Dezember' },
];

const formatCurrency = (v: number | string) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(parseFloat(String(v)) || 0);
const formatDate = (d: Date | string) => new Date(d).toLocaleDateString('de-DE');
const formatPercent = (v: string | number) => `${(parseFloat(String(v)) || 0).toFixed(2)}%`;

export default function Anlagevermoegen() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [kategorie, setKategorie] = useState('alle');
  const [showCreate, setShowCreate] = useState(false);
  const [showReconstruct, setShowReconstruct] = useState(false);
  const [showAfa, setShowAfa] = useState(false);
  const [editAnlage, setEditAnlage] = useState<any>(null);
  const [afaJahr, setAfaJahr] = useState(new Date().getFullYear());
  const [selectedForReconstruct, setSelectedForReconstruct] = useState<string[]>([]);
  const [selectedForAfa, setSelectedForAfa] = useState<number[]>([]);
  const [form, setForm] = useState({
    kontonummer: '',
    bezeichnung: '',
    kategorie: 'Andere Anlagen, Betriebs- und Geschäftsausstattung',
    anschaffungsdatum: new Date().toISOString().split('T')[0],
    anschaffungskosten: '',
    nutzungsdauer: 5,
    abschreibungsmethode: 'linear' as 'linear' | 'degressiv' | 'keine',
    sachkonto: '',
    standort: '',
    inventarnummer: '',
    notizen: '',
  });

  const unternehmenQuery = trpc.unternehmen.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const anlagenQuery = trpc.jahresabschluss.anlagevermoegen.list.useQuery(
    { unternehmenId: selectedUnternehmen || 0 },
    { enabled: !!selectedUnternehmen }
  );

  const reconstructQuery = trpc.jahresabschluss.anlagevermoegen.rekonstruktion.analysieren.useQuery(
    { unternehmenId: selectedUnternehmen || 0 },
    { enabled: false }
  );

  const afaQuery = trpc.jahresabschluss.afaAutomatisierung.berechnen.useQuery(
    { unternehmenId: selectedUnternehmen || 0, jahr: afaJahr },
    { enabled: false }
  );

  const reconstructMutation = trpc.jahresabschluss.anlagevermoegen.rekonstruktion.importieren.useMutation({
    onSuccess: (d) => {
      toast.success(d.message);
      setShowReconstruct(false);
      setSelectedForReconstruct([]);
      anlagenQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const afaMutation = trpc.jahresabschluss.afaAutomatisierung.erstellen.useMutation({
    onSuccess: (d) => {
      toast.success(d.message);
      setShowAfa(false);
      setSelectedForAfa([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const createMutation = trpc.jahresabschluss.anlagevermoegen.create.useMutation({
    onSuccess: () => {
      toast.success('Anlagegut erstellt');
      setShowCreate(false);
      resetForm();
      anlagenQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.jahresabschluss.anlagevermoegen.update.useMutation({
    onSuccess: () => {
      toast.success('Anlagegut aktualisiert');
      setEditAnlage(null);
      resetForm();
      anlagenQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.jahresabschluss.anlagevermoegen.delete.useMutation({
    onSuccess: () => {
      toast.success('Anlagegut gelöscht');
      anlagenQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (unternehmenQuery.data && unternehmenQuery.data.length > 0 && !selectedUnternehmen) {
      setSelectedUnternehmen(unternehmenQuery.data[0].unternehmen.id);
    }
  }, [unternehmenQuery.data, selectedUnternehmen]);

  const resetForm = () =>
    setForm({
      kontonummer: '',
      bezeichnung: '',
      kategorie: 'Andere Anlagen, Betriebs- und Geschäftsausstattung',
      anschaffungsdatum: new Date().toISOString().split('T')[0],
      anschaffungskosten: '',
      nutzungsdauer: 5,
      abschreibungsmethode: 'linear',
      sachkonto: '',
      standort: '',
      inventarnummer: '',
      notizen: '',
    });

  const openEdit = (a: any) => {
    setEditAnlage(a);
    setForm({
      kontonummer: a.kontonummer || '',
      bezeichnung: a.bezeichnung || '',
      kategorie: a.kategorie || 'Andere Anlagen, Betriebs- und Geschäftsausstattung',
      anschaffungsdatum: a.anschaffungsdatum ? new Date(a.anschaffungsdatum).toISOString().split('T')[0] : '',
      anschaffungskosten: a.anschaffungskosten || '',
      nutzungsdauer: a.nutzungsdauer || 5,
      abschreibungsmethode: a.abschreibungsmethode || 'linear',
      sachkonto: a.sachkonto || '',
      standort: a.standort || '',
      inventarnummer: a.inventarnummer || '',
      notizen: a.notizen || '',
    });
  };

  const handleCreate = () =>
    selectedUnternehmen &&
    createMutation.mutate({
      unternehmenId: selectedUnternehmen,
      ...form,
    });

  const handleUpdate = () =>
    editAnlage &&
    updateMutation.mutate({
      id: editAnlage.id,
      ...form,
    });

  const handleExportPDF = () => {
    if (!selectedUnternehmen || !anlagenQuery.data) {
      toast.error('Keine Daten zum Exportieren vorhanden');
      return;
    }

    try {
      const unternehmenObj = unternehmenQuery.data?.find(
        (u) => u.unternehmen.id === selectedUnternehmen
      );

      exportAnlagenspiegelPDF(anlagenQuery.data, {
        unternehmen: unternehmenObj?.unternehmen.name || 'Unbekannt',
        stichtag: `${new Date().getFullYear()}-12-31`,
      });

      toast.success('Anlagenspiegel-PDF wurde erstellt');
    } catch (error: any) {
      toast.error(`Fehler beim PDF-Export: ${error.message}`);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedUnternehmen || !anlagenQuery.data) {
      toast.error('Keine Daten zum Exportieren vorhanden');
      return;
    }

    try {
      const unternehmenObj = unternehmenQuery.data?.find(
        (u) => u.unternehmen.id === selectedUnternehmen
      );

      await exportAnlagenspiegelExcel(anlagenQuery.data, {
        unternehmen: unternehmenObj?.unternehmen.name || 'Unbekannt',
        stichtag: `${new Date().getFullYear()}-12-31`,
      });

      toast.success('Anlagenspiegel-Excel wurde erstellt');
    } catch (error: any) {
      toast.error(`Fehler beim Excel-Export: ${error.message}`);
    }
  };

  const handleOpenReconstruct = async () => {
    setShowReconstruct(true);
    await reconstructQuery.refetch();
  };

  const handleReconstruct = () => {
    if (!selectedUnternehmen || selectedForReconstruct.length === 0) return;

    const kandidaten = reconstructQuery.data?.kandidaten || [];
    const selected = kandidaten.filter((k: any) => selectedForReconstruct.includes(k.sachkonto));

    reconstructMutation.mutate({
      unternehmenId: selectedUnternehmen,
      anlagen: selected.map((k: any) => k.vorschlag),
    });
  };

  const handleOpenAfa = async () => {
    setShowAfa(true);
    await afaQuery.refetch();
  };

  const handleGenerateAfa = () => {
    if (!selectedUnternehmen || !afaQuery.data) return;

    const buchungen = afaQuery.data.afaBuchungen || [];

    afaMutation.mutate({
      unternehmenId: selectedUnternehmen,
      jahr: afaJahr,
      buchungen,
    });
  };

  const berechneRestbuchwert = (a: any) => {
    const ahk = parseFloat(a.anschaffungskosten) || 0;
    const nd = a.nutzungsdauer || 1;
    const start = new Date(a.anschaffungsdatum);
    const now = new Date();
    const monate = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, ahk - (ahk / nd / 12) * monate);
  };

  const anlagen = anlagenQuery.data || [];
  const filtered = kategorie === 'alle' ? anlagen : anlagen.filter((a) => a.kategorie === kategorie);
  const sumAhk = filtered.reduce((s, a) => s + parseFloat(a.anschaffungskosten || '0'), 0);
  const sumRest = filtered.reduce((s, a) => s + berechneRestbuchwert(a), 0);
  const jahre = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Anlagevermögen" subtitle="Verwaltung, AfA, Rekonstruktion" />

      <main className="container py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Select
            value={String(selectedUnternehmen || '')}
            onValueChange={(v) => setSelectedUnternehmen(Number(v))}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Unternehmen wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmenQuery.data?.map((u) => (
                <SelectItem key={u.unternehmen.id} value={String(u.unternehmen.id)}>
                  {u.unternehmen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleOpenReconstruct} disabled={!selectedUnternehmen}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Rekonstruieren
            </Button>
            <Button variant="outline" onClick={handleOpenAfa} disabled={!selectedUnternehmen}>
              <Calculator className="w-4 h-4 mr-2" />
              AfA buchen
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={!selectedUnternehmen}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={!selectedUnternehmen}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={() => setShowCreate(true)} disabled={!selectedUnternehmen}>
              <Plus className="w-4 h-4 mr-2" />
              Neu
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Anlagegüter</div>
              <div className="text-3xl font-bold">{filtered.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Euro className="w-4 h-4" />
                AHK
              </div>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(sumAhk)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingDown className="w-4 h-4" />
                Restbuchwert
              </div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(sumRest)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Kum. AfA</div>
              <div className="text-3xl font-bold text-orange-600">{formatCurrency(sumAhk - sumRest)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={kategorie} onValueChange={setKategorie}>
          <TabsList>
            {KATEGORIEN.map((k) => (
              <TabsTrigger key={k.value} value={k.value}>
                <k.icon className="w-4 h-4 mr-1" />
                {k.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={kategorie} className="mt-4">
            {anlagenQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Anlagegüter</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bezeichnung</TableHead>
                      <TableHead>Inv.Nr.</TableHead>
                      <TableHead>Anschaffung</TableHead>
                      <TableHead className="text-right">AHK</TableHead>
                      <TableHead>ND</TableHead>
                      <TableHead className="text-right">Restbuchwert</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => {
                      const rest = berechneRestbuchwert(a);
                      const ahk = parseFloat(a.anschaffungskosten || '0') || 0;
                      const pct = ahk > 0 ? ((ahk - rest) / ahk) * 100 : 0;
                      const Icon = KATEGORIEN.find((k) => k.value === a.kategorie)?.icon || Package;
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{a.bezeichnung}</div>
                                {a.standort && (
                                  <div className="text-sm text-muted-foreground">{a.standort}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{a.inventarnummer || '-'}</code>
                          </TableCell>
                          <TableCell>{a.anschaffungsdatum ? formatDate(a.anschaffungsdatum) : '-'}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(ahk)}</TableCell>
                          <TableCell>{a.nutzungsdauer}J</TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            {formatCurrency(rest)}
                          </TableCell>
                          <TableCell className="w-28">
                            <Progress value={pct} className="h-2" />
                            <div className="text-xs text-muted-foreground">{pct.toFixed(0)}%</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => confirm('Löschen?') && deleteMutation.mutate({ id: a.id })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Rekonstruktion Dialog */}
        <Dialog open={showReconstruct} onOpenChange={setShowReconstruct}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                <RefreshCw className="w-5 h-5 inline mr-2" />
                Aus Buchungen rekonstruieren
              </DialogTitle>
              <DialogDescription>
                Analysiert Buchungen mit Sachkonten 0000-0999 und erstellt Anlagegüter.
              </DialogDescription>
            </DialogHeader>

            {reconstructQuery.isFetching ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : reconstructQuery.data ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {reconstructQuery.data.zuRekonstruieren} von {reconstructQuery.data.gesamt} Sachkonten können
                    rekonstruiert werden. {reconstructQuery.data.bereitsErfasst} wurden bereits erfasst.
                  </AlertDescription>
                </Alert>

                {reconstructQuery.data.kandidaten.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedForReconstruct.length === reconstructQuery.data.kandidaten.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedForReconstruct(reconstructQuery.data!.kandidaten.map((k: any) => k.sachkonto));
                              } else {
                                setSelectedForReconstruct([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Sachkonto</TableHead>
                        <TableHead>Vorschlag</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Buchungen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reconstructQuery.data.kandidaten.map((k: any) => (
                        <TableRow key={k.sachkonto}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedForReconstruct.includes(k.sachkonto)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForReconstruct([...selectedForReconstruct, k.sachkonto]);
                                } else {
                                  setSelectedForReconstruct(selectedForReconstruct.filter((id) => id !== k.sachkonto));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <code className="font-mono text-sm">{k.sachkonto}</code>
                            <div className="text-sm text-muted-foreground">{k.geschaeftspartner}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{k.vorschlag.bezeichnung}</div>
                            <Badge variant="outline" className="text-xs">
                              {k.vorschlag.kategorie}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">{formatCurrency(k.gesamtbetrag)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{k.buchungen.length} Buchungen</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReconstruct(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleReconstruct}
                disabled={selectedForReconstruct.length === 0 || reconstructMutation.isPending}
              >
                {reconstructMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {selectedForReconstruct.length} Anlagen importieren
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AfA Dialog */}
        <Dialog open={showAfa} onOpenChange={setShowAfa}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                <Calculator className="w-5 h-5 inline mr-2" />
                AfA-Buchungen generieren
              </DialogTitle>
              <DialogDescription>Erstellt Abschreibungsbuchungen für aktive Anlagen.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Jahr</Label>
                <Select value={afaJahr.toString()} onValueChange={(v) => setAfaJahr(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jahre.map((j) => (
                      <SelectItem key={j} value={j.toString()}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {afaQuery.isFetching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : afaQuery.data ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {afaQuery.data.anzahlAfaBuchungen} AfA-Buchungen für {afaQuery.data.anzahlAnlagen} Anlagen.
                      Gesamt: {formatCurrency(afaQuery.data.gesamtAfaBetrag)}
                    </AlertDescription>
                  </Alert>

                  {afaQuery.data.afaBuchungen.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Anlage</TableHead>
                          <TableHead>Sachkonto</TableHead>
                          <TableHead>Gegenkonto</TableHead>
                          <TableHead className="text-right">AfA-Betrag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {afaQuery.data.afaBuchungen.map((b: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>{b.anlageBezeichnung}</TableCell>
                            <TableCell>
                              <code className="text-xs">{b.sachkonto}</code>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs">{b.gegenkonto}</code>
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(b.betrag)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAfa(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleGenerateAfa} disabled={!afaQuery.data || afaMutation.isPending}>
                {afaMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Buchungen erstellen
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Dialog */}
        <Dialog
          open={showCreate || !!editAnlage}
          onOpenChange={(o) => {
            if (!o) {
              setShowCreate(false);
              setEditAnlage(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editAnlage ? 'Anlagegut bearbeiten' : 'Neues Anlagegut'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bezeichnung *</Label>
                <Input value={form.bezeichnung} onChange={(e) => setForm({ ...form, bezeichnung: e.target.value })} />
              </div>
              <div>
                <Label>Inventarnummer</Label>
                <Input
                  value={form.inventarnummer}
                  onChange={(e) => setForm({ ...form, inventarnummer: e.target.value })}
                />
              </div>
              <div>
                <Label>Kategorie</Label>
                <Select value={form.kategorie} onValueChange={(v) => setForm({ ...form, kategorie: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORIEN.filter((k) => k.value !== 'alle').map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Standort</Label>
                <Input value={form.standort} onChange={(e) => setForm({ ...form, standort: e.target.value })} />
              </div>
              <div>
                <Label>Kontonummer</Label>
                <Input value={form.kontonummer} onChange={(e) => setForm({ ...form, kontonummer: e.target.value })} />
              </div>
              <div>
                <Label>Sachkonto</Label>
                <Input value={form.sachkonto} onChange={(e) => setForm({ ...form, sachkonto: e.target.value })} />
              </div>
              <div>
                <Label>Anschaffungsdatum *</Label>
                <Input
                  type="date"
                  value={form.anschaffungsdatum}
                  onChange={(e) => setForm({ ...form, anschaffungsdatum: e.target.value })}
                />
              </div>
              <div>
                <Label>AHK (€) *</Label>
                <Input
                  type="number"
                  value={form.anschaffungskosten}
                  onChange={(e) => setForm({ ...form, anschaffungskosten: e.target.value })}
                />
              </div>
              <div>
                <Label>Nutzungsdauer (Jahre)</Label>
                <Input
                  type="number"
                  value={form.nutzungsdauer}
                  onChange={(e) => setForm({ ...form, nutzungsdauer: parseInt(e.target.value) || 5 })}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  AfA: {(100 / form.nutzungsdauer).toFixed(2)}%
                </div>
              </div>
              <div>
                <Label>Abschreibungsmethode</Label>
                <Select
                  value={form.abschreibungsmethode}
                  onValueChange={(v: any) => setForm({ ...form, abschreibungsmethode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="degressiv">Degressiv</SelectItem>
                    <SelectItem value="keine">Keine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Notizen</Label>
                <Input value={form.notizen} onChange={(e) => setForm({ ...form, notizen: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setEditAnlage(null);
                  resetForm();
                }}
              >
                Abbrechen
              </Button>
              <Button onClick={editAnlage ? handleUpdate : handleCreate} disabled={!form.bezeichnung || !form.anschaffungskosten}>
                {editAnlage ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
