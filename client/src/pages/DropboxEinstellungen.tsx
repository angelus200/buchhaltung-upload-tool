import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Cloud,
  Loader2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function DropboxEinstellungen() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [dropboxLink, setDropboxLink] = useState("");
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    vorschlagId?: number;
    filename?: string;
  } | null>(null);

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();

  // Auto-select Unternehmen
  useEffect(() => {
    if (unternehmen && unternehmen.length > 0 && !selectedUnternehmen) {
      const savedId = localStorage.getItem("selectedUnternehmenId");
      if (savedId) {
        const id = parseInt(savedId);
        const exists = unternehmen.find((u) => u.unternehmen.id === id);
        if (exists) {
          setSelectedUnternehmen(id);
          return;
        }
      }
      setSelectedUnternehmen(unternehmen[0].unternehmen.id);
    }
  }, [unternehmen, selectedUnternehmen]);

  // Mutation
  const processLinkMutation = trpc.dropbox.processLink.useMutation({
    onSuccess: (data) => {
      toast.success(`Beleg erfolgreich verarbeitet: ${data.filename}`);
      setLastResult({
        success: true,
        message: `Buchungsvorschlag wurde erstellt für "${data.filename}"`,
        vorschlagId: data.vorschlagId,
        filename: data.filename,
      });
      setDropboxLink("");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
      setLastResult({
        success: false,
        message: error.message,
      });
    },
  });

  const handleProcess = () => {
    if (!selectedUnternehmen || !dropboxLink) return;

    // Validiere URL
    try {
      const url = new URL(dropboxLink);
      if (!url.hostname.includes("dropbox")) {
        toast.error("Bitte geben Sie einen gültigen Dropbox-Link ein");
        return;
      }
    } catch {
      toast.error("Bitte geben Sie eine gültige URL ein");
      return;
    }

    setLastResult(null);
    processLinkMutation.mutate({
      dropboxLink,
      unternehmenId: selectedUnternehmen,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Dropbox-Integration" subtitle="Belege direkt aus Dropbox verarbeiten" />

      <main className="container py-6 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Select
            value={selectedUnternehmen?.toString() || ""}
            onValueChange={(value) => {
              setSelectedUnternehmen(parseInt(value));
              localStorage.setItem("selectedUnternehmenId", value);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Firma wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmen?.map((u) => (
                <SelectItem key={u.unternehmen.id} value={u.unternehmen.id.toString()}>
                  {u.unternehmen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUnternehmen && (
          <>
            {/* Info-Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-blue-900">Belege aus Dropbox verarbeiten</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 mb-3">
                  Teilen Sie eine Datei in Dropbox, kopieren Sie den Link und fügen Sie ihn hier ein.
                  Die App lädt den Beleg herunter und erstellt automatisch einen Buchungsvorschlag.
                </p>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>So funktioniert's:</strong></p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Öffnen Sie Ihre Dropbox (Web oder App)</li>
                    <li>Rechtsklick auf Beleg → "Freigeben" → "Link erstellen"</li>
                    <li>Kopieren Sie den Link</li>
                    <li>Fügen Sie ihn unten ein und klicken Sie auf "Beleg verarbeiten"</li>
                    <li>Die AI analysiert den Beleg und erstellt einen Buchungsvorschlag</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Haupt-Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Beleg verarbeiten
                </CardTitle>
                <CardDescription>
                  Dropbox-Link einfügen und automatisch analysieren lassen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dropbox-link">Dropbox-Link</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="dropbox-link"
                      value={dropboxLink}
                      onChange={(e) => setDropboxLink(e.target.value)}
                      placeholder="https://www.dropbox.com/scl/fi/..."
                      disabled={processLinkMutation.isPending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && dropboxLink) {
                          handleProcess();
                        }
                      }}
                    />
                    <Button
                      onClick={handleProcess}
                      disabled={!dropboxLink || processLinkMutation.isPending}
                      className="min-w-[140px]"
                    >
                      {processLinkMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verarbeite...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Verarbeiten
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Beispiel: https://www.dropbox.com/scl/fi/abc123/rechnung.pdf?...
                  </p>
                </div>

                {/* Erfolg/Fehler Meldung */}
                {lastResult && (
                  <Alert className={lastResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <div className="flex items-start gap-2">
                      {lastResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription className={lastResult.success ? "text-green-800" : "text-red-800"}>
                          {lastResult.message}
                        </AlertDescription>
                        {lastResult.success && lastResult.vorschlagId && (
                          <Link href="/buchungsvorschlaege">
                            <Button variant="link" className="p-0 h-auto mt-2 text-green-700 hover:text-green-800">
                              <Sparkles className="w-4 h-4 mr-1" />
                              Buchungsvorschlag ansehen
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Alert>
                )}

                <div className="bg-slate-50 p-4 rounded-lg border">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">Hinweise:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                        <li>Funktioniert mit PDF, JPG, PNG, GIF</li>
                        <li>Keine Installation oder API-Token erforderlich</li>
                        <li>Die Datei muss in Dropbox freigegeben sein</li>
                        <li>Der Link kann nach Verarbeitung wieder entfernt werden</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Beispiel Card */}
            <Card className="mt-6 bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Wie sieht ein Dropbox-Link aus?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700 mb-1">Moderne Dropbox-Links:</p>
                  <code className="block bg-white p-2 rounded border text-xs break-all">
                    https://www.dropbox.com/scl/fi/abc123def456/rechnung.pdf?rlkey=xyz&dl=0
                  </code>
                </div>
                <div>
                  <p className="font-medium text-slate-700 mb-1">Klassische Dropbox-Links:</p>
                  <code className="block bg-white p-2 rounded border text-xs break-all">
                    https://www.dropbox.com/s/abc123def456/rechnung.pdf?dl=0
                  </code>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Die App wandelt den Link automatisch in einen Download-Link um (dl=1)
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
