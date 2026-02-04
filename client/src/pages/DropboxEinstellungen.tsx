import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
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
  FolderOpen,
  AlertCircle,
  Zap,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

function formatDate(dateStr: string | Date): string {
  const date = new Date(dateStr);
  return date.toLocaleString("de-DE");
}

const STATUS_CONFIG = {
  aktiv: { label: "Aktiv", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  fehler: { label: "Fehler", color: "bg-red-100 text-red-800", icon: XCircle },
  pausiert: { label: "Pausiert", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
};

export default function DropboxEinstellungen() {
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [watchFolder, setWatchFolder] = useState("/Belege");
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);

  // Queries
  const { data: unternehmen } = trpc.unternehmen.list.useQuery();

  const { data: connections = [], refetch: refetchConnections } = trpc.dropbox.listConnections.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen }
  );

  const { data: authUrl } = trpc.dropbox.getAuthUrl.useQuery(
    { unternehmenId: selectedUnternehmen! },
    { enabled: !!selectedUnternehmen && connectDialogOpen }
  );

  const { data: syncLog = [] } = trpc.dropbox.getSyncLog.useQuery(
    { connectionId: selectedConnectionId!, limit: 50 },
    { enabled: !!selectedConnectionId && logDialogOpen }
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

  // Mutations
  const syncMutation = trpc.dropbox.sync.useMutation({
    onSuccess: (data) => {
      toast.success(`Sync erfolgreich: ${data.neueeDateien} neue Dateien`);
      refetchConnections();
    },
    onError: (error) => {
      toast.error(`Sync fehlgeschlagen: ${error.message}`);
    },
  });

  const deleteMutation = trpc.dropbox.deleteConnection.useMutation({
    onSuccess: () => {
      toast.success("Verbindung gelöscht");
      refetchConnections();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleConnect = () => {
    if (!authUrl) return;
    window.open(authUrl.authUrl, "_blank");
    toast.info("Autorisieren Sie Dropbox im neuen Fenster");
  };

  const handleShowLog = (connectionId: number) => {
    setSelectedConnectionId(connectionId);
    setLogDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Dropbox-Integration" subtitle="Automatische Beleg-Synchronisierung" />

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

          {selectedUnternehmen && (
            <Button onClick={() => setConnectDialogOpen(true)}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Dropbox verbinden
            </Button>
          )}
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
                  Verbinden Sie Ihren Dropbox-Account und legen Sie Belege in einem bestimmten Ordner ab.
                  Die App synchronisiert automatisch neue Dateien und erstellt Buchungsvorschläge.
                </p>
                <div className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <strong>So funktioniert's:</strong>
                    <ol className="list-decimal pl-5 mt-1 space-y-1">
                      <li>Dropbox verbinden und Ordner auswählen (z.B. "/Belege")</li>
                      <li>Belege in den Ordner hochladen (PDF, JPG, PNG)</li>
                      <li>Die App synchronisiert automatisch alle 15 Minuten</li>
                      <li>Für jeden Beleg wird ein Buchungsvorschlag erstellt</li>
                      <li>Vorschläge prüfen und akzeptieren unter "Vorschläge"</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verbindungen */}
            {connections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Cloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Noch keine Dropbox-Verbindung eingerichtet.</p>
                  <Button onClick={() => setConnectDialogOpen(true)}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Jetzt verbinden
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {connections.map((connection) => {
                  const statusConfig = STATUS_CONFIG[connection.syncStatus];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={connection.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Cloud className="w-5 h-5 text-blue-600" />
                              <div>
                                <h3 className="font-semibold">{connection.accountEmail}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Account-ID: {connection.accountId}
                                </p>
                              </div>
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Überwachter Ordner</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-mono text-sm">{connection.watchFolder}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Letzter Sync</p>
                                <p className="font-medium text-sm">
                                  {connection.lastSync ? formatDate(connection.lastSync) : "Noch nie"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Neue Dateien</p>
                                <p className="font-medium text-sm">{connection.dateienNeu || 0}</p>
                              </div>
                            </div>

                            {connection.syncFehler && (
                              <div className="bg-red-50 p-3 rounded-lg mb-4">
                                <div className="flex items-start gap-2 text-sm text-red-800">
                                  <AlertCircle className="w-4 h-4 mt-0.5" />
                                  <div>
                                    <strong>Fehler:</strong>
                                    <p>{connection.syncFehler}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => syncMutation.mutate({ connectionId: connection.id })}
                                disabled={syncMutation.isPending}
                              >
                                {syncMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Jetzt synchronisieren
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleShowLog(connection.id)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Sync-Log
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Verbindung wirklich trennen?")) {
                                    deleteMutation.mutate({ id: connection.id });
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Trennen
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Verbinden-Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dropbox verbinden</DialogTitle>
            <DialogDescription>
              Verbinden Sie Ihren Dropbox-Account für die automatische Beleg-Synchronisierung
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Überwachter Ordner</Label>
              <Input
                value={watchFolder}
                onChange={(e) => setWatchFolder(e.target.value)}
                placeholder="/Belege"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pfad zum Dropbox-Ordner, der überwacht werden soll
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <strong className="text-yellow-800">Hinweis:</strong>
                  <p className="text-yellow-700 mt-1">
                    Die Dropbox-Integration benötigt eine konfigurierte Dropbox-App.
                    Für Production müssen DROPBOX_CLIENT_ID und DROPBOX_CLIENT_SECRET
                    als Environment Variables gesetzt werden.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConnect} disabled={!authUrl}>
              <Cloud className="w-4 h-4 mr-2" />
              Mit Dropbox verbinden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        <Badge className="bg-green-100 text-green-800">Analysiert</Badge>
                      )}
                      {log.status === "uploaded" && (
                        <Badge className="bg-blue-100 text-blue-800">Hochgeladen</Badge>
                      )}
                      {log.status === "sync" && <Badge variant="outline">Sync</Badge>}
                      {log.status === "fehler" && (
                        <Badge className="bg-red-100 text-red-800">Fehler</Badge>
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
