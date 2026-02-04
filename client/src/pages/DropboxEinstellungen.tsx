import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Cloud,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  AlertCircle,
  Zap,
  FileText,
  ExternalLink,
  Info,
} from "lucide-react";

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleString("de-DE");
}

export default function DropboxEinstellungen() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [folderLink, setFolderLink] = useState("");
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();

  const { data: firmenInfo, refetch: refetchFirmenInfo } = trpc.dropbox.getUnternehmenInfo.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  const { data: syncLog = [] } = trpc.dropbox.getSyncLog.useQuery(
    { unternehmenId: selectedUnternehmen!, limit: 50 },
    { enabled: !!selectedUnternehmen && logDialogOpen }
  );

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

  // Update folderLink when firmenInfo changes
  useEffect(() => {
    if (firmenInfo?.dropboxFolderLink) {
      setFolderLink(firmenInfo.dropboxFolderLink);
    } else {
      setFolderLink("");
    }
  }, [firmenInfo]);

  // Mutations
  const setLinkMutation = trpc.dropbox.setFolderLink.useMutation({
    onSuccess: () => {
      toast.success("Dropbox-Ordner gespeichert");
      refetchFirmenInfo();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const removeLinkMutation = trpc.dropbox.removeFolderLink.useMutation({
    onSuccess: () => {
      toast.success("Dropbox-Ordner entfernt");
      setFolderLink("");
      refetchFirmenInfo();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const syncMutation = trpc.dropbox.sync.useMutation({
    onSuccess: (data) => {
      toast.success(`Sync erfolgreich: ${data.neueeDateien} neue Dateien`);
      refetchFirmenInfo();
    },
    onError: (error) => {
      toast.error(`Sync fehlgeschlagen: ${error.message}`);
    },
  });

  const handleSaveLink = () => {
    if (!selectedUnternehmen || !folderLink) return;

    // Validiere URL
    try {
      new URL(folderLink);
      if (!folderLink.includes("dropbox.com")) {
        toast.error("Bitte geben Sie einen gültigen Dropbox-Link ein");
        return;
      }
    } catch {
      toast.error("Bitte geben Sie eine gültige URL ein");
      return;
    }

    setLinkMutation.mutate({
      unternehmenId: selectedUnternehmen,
      folderLink,
    });
  };

  const handleRemoveLink = () => {
    if (!selectedUnternehmen) return;
    if (!confirm("Dropbox-Ordner wirklich entfernen?")) return;

    removeLinkMutation.mutate({
      unternehmenId: selectedUnternehmen,
    });
  };

  const handleSync = () => {
    if (!selectedUnternehmen) return;
    syncMutation.mutate({ unternehmenId: selectedUnternehmen });
  };

  const hasLink = !!firmenInfo?.dropboxFolderLink;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Dropbox-Integration" subtitle="Automatische Beleg-Synchronisierung via Shared Links" />

      <main className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
        </div>

        {selectedUnternehmen && (
          <>
            {/* Info-Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-blue-900">Automatische Beleg-Synchronisierung</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 mb-3">
                  Teilen Sie einen Dropbox-Ordner und fügen Sie den Link hier ein.
                  Die App synchronisiert automatisch neue Dateien und erstellt Buchungsvorschläge.
                </p>
                <div className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>So funktioniert's:</strong>
                    <ol className="list-decimal pl-5 mt-1 space-y-1">
                      <li>Erstellen Sie einen Ordner in Ihrer Dropbox (z.B. "Belege 2024")</li>
                      <li>Rechtsklick auf Ordner → "Freigeben" → "Link erstellen"</li>
                      <li>Kopieren Sie den geteilten Link und fügen Sie ihn unten ein</li>
                      <li>Klicken Sie auf "Synchronisieren" um neue Belege abzurufen</li>
                      <li>Für jeden Beleg wird automatisch ein Buchungsvorschlag erstellt</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Konfiguration */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Dropbox-Ordner konfigurieren
                </CardTitle>
                <CardDescription>
                  Fügen Sie den Link zu Ihrem geteilten Dropbox-Ordner ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="folder-link">Geteilter Ordner-Link</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="folder-link"
                      value={folderLink}
                      onChange={(e) => setFolderLink(e.target.value)}
                      placeholder="https://www.dropbox.com/sh/xyz123..."
                      disabled={setLinkMutation.isPending}
                    />
                    <Button
                      onClick={handleSaveLink}
                      disabled={!folderLink || setLinkMutation.isPending}
                    >
                      {setLinkMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Speichern"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Beispiel: https://www.dropbox.com/sh/abc123xyz/...
                  </p>
                </div>

                {hasLink && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">Dropbox-Ordner verbunden</p>
                        <p className="text-sm text-green-700 mt-1 break-all">
                          {firmenInfo.dropboxFolderLink}
                        </p>
                        {firmenInfo.dropboxLastSync && (
                          <p className="text-xs text-green-600 mt-1">
                            Letzter Sync: {formatDate(firmenInfo.dropboxLastSync)}
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSync}
                            disabled={syncMutation.isPending}
                          >
                            {syncMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Jetzt synchronisieren
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogDialogOpen(true)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Sync-Protokoll
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLink}
                            className="text-red-600 hover:text-red-700"
                            disabled={removeLinkMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Entfernen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2 text-sm">
                    <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-yellow-800">Hinweis:</strong>
                      <p className="text-yellow-700 mt-1">
                        Für Production muss die Environment Variable <code className="bg-yellow-100 px-1 rounded">DROPBOX_APP_TOKEN</code> gesetzt werden.
                        Dieser Token wird benötigt, um auf geteilte Ordner zuzugreifen.
                      </p>
                      <p className="text-yellow-700 mt-2">
                        <strong>So erstellen Sie einen App Token:</strong>
                      </p>
                      <ol className="list-decimal pl-5 mt-1 space-y-1 text-yellow-700">
                        <li>Gehen Sie zu <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener" className="underline">dropbox.com/developers/apps</a></li>
                        <li>Erstellen Sie eine neue App (Scoped Access, Full Dropbox)</li>
                        <li>Unter "Settings" → "Generated access token" → Token generieren</li>
                        <li>Token als DROPBOX_APP_TOKEN in Railway Environment Variables einfügen</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Sync-Log Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sync-Protokoll</DialogTitle>
            <DialogDescription>Letzte 50 synchronisierte Dateien</DialogDescription>
          </DialogHeader>

          {syncLog.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Noch keine Dateien synchronisiert.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datei</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Synchronisiert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLog.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{log.fileName}</p>
                          <p className="text-xs text-muted-foreground">{log.dropboxPath}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.status === "analyzed" && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Analysiert
                        </Badge>
                      )}
                      {log.status === "uploaded" && (
                        <Badge className="bg-blue-100 text-blue-800">Hochgeladen</Badge>
                      )}
                      {log.status === "sync" && <Badge variant="outline">Sync</Badge>}
                      {log.status === "fehler" && (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Fehler
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(log.syncedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
