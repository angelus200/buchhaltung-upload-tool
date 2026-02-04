import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Calculator,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";

export default function UStVoranmeldung() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [jahr, setJahr] = useState(new Date().getFullYear());
  const [zeitraum, setZeitraum] = useState("01");
  const [testmodus, setTestmodus] = useState(true);
  const [kennzahlenData, setKennzahlenData] = useState<any>(null);

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();

  // Filter nur deutsche Firmen
  const deutscheFirmen = unternehmen?.filter((u) => u.unternehmen.landCode === "DE");

  // Auto-select Unternehmen
  useEffect(() => {
    if (deutscheFirmen && deutscheFirmen.length > 0 && !selectedUnternehmen) {
      const savedId = localStorage.getItem("selectedUnternehmenId");
      if (savedId) {
        const id = parseInt(savedId);
        const exists = deutscheFirmen.find((u) => u.unternehmen.id === id);
        if (exists) {
          setSelectedUnternehmen(id);
          return;
        }
      }
      setSelectedUnternehmen(deutscheFirmen[0].unternehmen.id);
    }
  }, [deutscheFirmen, selectedUnternehmen]);

  // Mutations
  const berechnenQuery = trpc.elster.berechneUStVA.useQuery(
    {
      unternehmenId: selectedUnternehmen!,
      jahr,
      zeitraum,
    },
    {
      enabled: false,
    }
  );

  const xmlMutation = trpc.elster.generiereXML.useMutation({
    onSuccess: (data) => {
      // Download XML
      const blob = new Blob([data.xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("XML-Datei heruntergeladen");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleBerechnen = async () => {
    if (!selectedUnternehmen) return;

    try {
      const result = await berechnenQuery.refetch();
      if (result.data) {
        setKennzahlenData(result.data);
        toast.success("Kennzahlen erfolgreich berechnet");
      }
    } catch (error: any) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const handleXMLDownload = () => {
    if (!selectedUnternehmen) return;

    xmlMutation.mutate({
      unternehmenId: selectedUnternehmen,
      jahr,
      zeitraum,
      testmodus,
    });
  };

  // Jahre für Dropdown (aktuelles Jahr - 5 bis aktuelles Jahr + 1)
  const jahre = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Zeiträume
  const monate = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: new Date(2024, i).toLocaleString("de-DE", { month: "long" }),
  }));

  const quartale = [
    { value: "Q1", label: "Q1 (Jan-Mär)" },
    { value: "Q2", label: "Q2 (Apr-Jun)" },
    { value: "Q3", label: "Q3 (Jul-Sep)" },
    { value: "Q4", label: "Q4 (Okt-Dez)" },
  ];

  const kz = kennzahlenData?.kennzahlen;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        title="USt-Voranmeldung"
        subtitle="ELSTER-XML für deutsche Firmen generieren"
      />

      <main className="container py-6 max-w-5xl">
        {/* Firma-Auswahl */}
        <div className="mb-6">
          <Label>Firma (nur deutsche Firmen)</Label>
          <Select
            value={selectedUnternehmen?.toString() || ""}
            onValueChange={(value) => {
              setSelectedUnternehmen(parseInt(value));
              localStorage.setItem("selectedUnternehmenId", value);
              setKennzahlenData(null); // Reset Kennzahlen
            }}
          >
            <SelectTrigger className="w-96 mt-1">
              <SelectValue placeholder="Firma wählen" />
            </SelectTrigger>
            <SelectContent>
              {deutscheFirmen?.map((u) => (
                <SelectItem key={u.unternehmen.id} value={u.unternehmen.id.toString()}>
                  {u.unternehmen.name} (Steuernr: {u.unternehmen.steuernummer || "fehlt"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!deutscheFirmen || deutscheFirmen.length === 0 ? (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Keine deutschen Firmen gefunden. Die USt-Voranmeldung ist nur für Firmen mit Land = Deutschland verfügbar.
            </AlertDescription>
          </Alert>
        ) : selectedUnternehmen ? (
          <>
            {/* Info-Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-blue-900">ELSTER USt-Voranmeldung</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 mb-2">
                  Diese Funktion berechnet die USt-Voranmeldung aus Ihren SKR04-Buchungen und generiert
                  eine ELSTER-XML-Datei, die Sie manuell in ELSTER hochladen können.
                </p>
                <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
                  <li>KZ 81: Umsätze 19% (Konten 4000, 4100, 4110, 4120, 4200)</li>
                  <li>KZ 86: Umsätze 7% (Konten 4300, 4310, 4320)</li>
                  <li>KZ 66: Vorsteuer (Konten 1400, 1401, 1405, 1406, 1576)</li>
                  <li>KZ 35: Steuerfreie Umsätze (Konten 4125, 4126)</li>
                  <li>KZ 83: Vorauszahlung = (USt 19% + USt 7%) - Vorsteuer</li>
                </ul>
              </CardContent>
            </Card>

            {/* Formular */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Zeitraum auswählen
                </CardTitle>
                <CardDescription>
                  Wählen Sie Jahr und Zeitraum für die USt-Voranmeldung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jahr">Jahr</Label>
                    <Select value={jahr.toString()} onValueChange={(v) => setJahr(parseInt(v))}>
                      <SelectTrigger id="jahr" className="mt-1">
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

                  <div>
                    <Label htmlFor="zeitraum">Zeitraum</Label>
                    <Select value={zeitraum} onValueChange={setZeitraum}>
                      <SelectTrigger id="zeitraum" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <optgroup label="Monate">
                          {monate.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </optgroup>
                        <optgroup label="Quartale">
                          {quartale.map((q) => (
                            <SelectItem key={q.value} value={q.value}>
                              {q.label}
                            </SelectItem>
                          ))}
                        </optgroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border">
                  <Switch
                    id="testmodus"
                    checked={testmodus}
                    onCheckedChange={setTestmodus}
                  />
                  <div>
                    <Label htmlFor="testmodus" className="cursor-pointer">
                      Testmodus
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Im Testmodus kann die XML-Datei in ELSTER zur Prüfung hochgeladen werden, ohne dass eine Abgabe erfolgt.
                    </p>
                  </div>
                </div>

                <Button onClick={handleBerechnen} className="w-full" disabled={berechnenQuery.isFetching}>
                  {berechnenQuery.isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Berechne...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Kennzahlen berechnen
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Kennzahlen-Tabelle */}
            {kennzahlenData && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Berechnete Kennzahlen
                      </CardTitle>
                      <CardDescription>
                        {kennzahlenData.firma.name} - {jahr}/{zeitraum}
                      </CardDescription>
                    </div>
                    <Button onClick={handleXMLDownload} disabled={xmlMutation.isPending}>
                      {xmlMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generiere...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          XML herunterladen
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kennzahl</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead className="text-right">Betrag (EUR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">KZ 81</TableCell>
                        <TableCell>Umsätze 19% (netto)</TableCell>
                        <TableCell className="text-right font-mono">
                          {kz.kz81.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-slate-50">
                        <TableCell className="font-medium pl-8">→ USt 19%</TableCell>
                        <TableCell className="text-muted-foreground">Umsatzsteuer</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {kz.kz81Steuer.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium">KZ 86</TableCell>
                        <TableCell>Umsätze 7% (netto)</TableCell>
                        <TableCell className="text-right font-mono">
                          {kz.kz86.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-slate-50">
                        <TableCell className="font-medium pl-8">→ USt 7%</TableCell>
                        <TableCell className="text-muted-foreground">Umsatzsteuer</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {kz.kz86Steuer.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>

                      {kz.kz35 > 0 && (
                        <TableRow>
                          <TableCell className="font-medium">KZ 35</TableCell>
                          <TableCell>Steuerfreie Umsätze</TableCell>
                          <TableCell className="text-right font-mono">
                            {kz.kz35.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      )}

                      {kz.kz21 > 0 && (
                        <TableRow>
                          <TableCell className="font-medium">KZ 21</TableCell>
                          <TableCell>EU-Lieferungen (steuerfrei)</TableCell>
                          <TableCell className="text-right font-mono">
                            {kz.kz21.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      )}

                      <TableRow>
                        <TableCell className="font-medium">KZ 66</TableCell>
                        <TableCell>Abziehbare Vorsteuer</TableCell>
                        <TableCell className="text-right font-mono">
                          {kz.kz66.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>

                      <TableRow className="border-t-2 bg-slate-100">
                        <TableCell className="font-bold">KZ 83</TableCell>
                        <TableCell className="font-bold">
                          {kz.kz83 >= 0 ? "Vorauszahlung" : "Erstattung"}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold text-lg ${
                          kz.kz83 >= 0 ? "text-red-600" : "text-green-600"
                        }`}>
                          {kz.kz83.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {kz.kz83 >= 0 ? (
                        <>Sie müssen <strong>{kz.kz83.toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR</strong> an das Finanzamt zahlen.</>
                      ) : (
                        <>Sie erhalten <strong>{Math.abs(kz.kz83).toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR</strong> vom Finanzamt erstattet.</>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Anleitung */}
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">
                  <FileText className="w-5 h-5 inline mr-2" />
                  So verwenden Sie die XML-Datei
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Klicken Sie auf "XML herunterladen" um die Datei zu speichern</li>
                  <li>Gehen Sie zu <a href="https://www.elster.de" target="_blank" rel="noopener" className="text-blue-600 underline">www.elster.de</a></li>
                  <li>Melden Sie sich mit Ihrem ELSTER-Zertifikat an</li>
                  <li>Wählen Sie "Formulare & Leistungen" → "Umsatzsteuer-Voranmeldung"</li>
                  <li>Klicken Sie auf "Datei hochladen" und wählen Sie die heruntergeladene XML-Datei</li>
                  <li>Prüfen Sie die Daten und bestätigen Sie die Abgabe</li>
                </ol>
                <p className="mt-3 text-xs text-slate-600">
                  <strong>Hinweis:</strong> Im Testmodus wird die Voranmeldung nur zur Prüfung übermittelt, aber nicht abgegeben.
                  Deaktivieren Sie den Testmodus für die echte Abgabe.
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
