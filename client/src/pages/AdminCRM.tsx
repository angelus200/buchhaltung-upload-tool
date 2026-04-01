// client/src/pages/AdminCRM.tsx
// CRM Sprint A: Admin-Übersicht für Lead-Management

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ─── Typen ───────────────────────────────────────────────────────────────────

type Lead = {
  id: number;
  firmenName: string;
  ansprechpartner: string | null;
  email: string;
  telefon: string | null;
  webseite: string | null;
  land: 'DE' | 'AT' | 'CH';
  branche: string | null;
  firmenGroesse: string | null;
  quelle: string;
  status: 'neu' | 'kontaktiert' | 'demo_geplant' | 'demo_durchgefuehrt' | 'angebot_gesendet' | 'gewonnen' | 'verloren';
  interessiertAnPlan: string | null;
  notizen: string | null;
  naechsteAktion: string | null;
  naechsteAktionDatum: string | null;
  konvertiertAmDatum: string | null;
  konvertiertZuTenantId: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  neu: 'Neu',
  kontaktiert: 'Kontaktiert',
  demo_geplant: 'Demo geplant',
  demo_durchgefuehrt: 'Demo durch',
  angebot_gesendet: 'Angebot',
  gewonnen: 'Gewonnen',
  verloren: 'Verloren',
};

const STATUS_COLORS: Record<string, string> = {
  neu: 'bg-blue-100 text-blue-800',
  kontaktiert: 'bg-yellow-100 text-yellow-800',
  demo_geplant: 'bg-purple-100 text-purple-800',
  demo_durchgefuehrt: 'bg-orange-100 text-orange-800',
  angebot_gesendet: 'bg-cyan-100 text-cyan-800',
  gewonnen: 'bg-green-100 text-green-800',
  verloren: 'bg-red-100 text-red-800',
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  business: 'Business',
  individuell: 'Individuell',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-800'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatDate(d: string | Date | null) {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Detail-Dialog ────────────────────────────────────────────────────────────

function LeadDialog({
  lead,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [notizen, setNotizen] = useState(lead.notizen ?? '');
  const [naechsteAktion, setNaechsteAktion] = useState(lead.naechsteAktion ?? '');
  const [naechsteAktionDatum, setNaechsteAktionDatum] = useState(lead.naechsteAktionDatum ?? '');
  const [status, setStatus] = useState(lead.status);

  const updateMutation = trpc.crm.updateLead.useMutation({
    onSuccess: () => {
      toast.success('Lead gespeichert');
      onUpdated();
      onClose();
    },
    onError: (err) => toast.error(`Fehler: ${err.message}`),
  });

  const deleteMutation = trpc.crm.deleteLead.useMutation({
    onSuccess: () => {
      toast.success('Lead gelöscht');
      onUpdated();
      onClose();
    },
    onError: (err) => toast.error(`Fehler: ${err.message}`),
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: lead.id,
      status,
      notizen,
      naechsteAktion,
      naechsteAktionDatum,
    });
  };

  const handleDelete = () => {
    if (!confirm(`Lead "${lead.firmenName}" wirklich löschen?`)) return;
    deleteMutation.mutate({ id: lead.id });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead.firmenName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Kontaktdaten */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">E-Mail</span><div className="font-medium">{lead.email}</div></div>
            <div><span className="text-slate-400">Telefon</span><div className="font-medium">{lead.telefon ?? '–'}</div></div>
            <div><span className="text-slate-400">Ansprechpartner</span><div className="font-medium">{lead.ansprechpartner ?? '–'}</div></div>
            <div><span className="text-slate-400">Land</span><div className="font-medium">{lead.land}</div></div>
            <div><span className="text-slate-400">Plan-Interesse</span><div className="font-medium">{lead.interessiertAnPlan ? PLAN_LABELS[lead.interessiertAnPlan] : '–'}</div></div>
            <div><span className="text-slate-400">Quelle</span><div className="font-medium">{lead.quelle}</div></div>
            <div><span className="text-slate-400">Erstellt</span><div className="font-medium">{formatDate(lead.createdAt)}</div></div>
          </div>

          <hr className="border-slate-100" />

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as Lead['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nächste Aktion */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nächste Aktion</label>
            <Input
              value={naechsteAktion}
              onChange={e => setNaechsteAktion(e.target.value)}
              placeholder="z.B. Demo-Call buchen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Datum nächste Aktion</label>
            <Input
              type="date"
              value={naechsteAktionDatum}
              onChange={e => setNaechsteAktionDatum(e.target.value)}
            />
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notizen</label>
            <textarea
              value={notizen}
              onChange={e => setNotizen(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
              placeholder="Gesprächsnotizen, Anforderungen..."
            />
          </div>

          {/* Aktionen */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Löschen
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Speichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function AdminCRM() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState('alle');
  const [filterLand, setFilterLand] = useState('alle');
  const [suche, setSuche] = useState('');

  const { data: stats, refetch: refetchStats } = trpc.crm.getStats.useQuery();
  const { data: leadsData, refetch: refetchLeads } = trpc.crm.listLeads.useQuery(
    { status: filterStatus === 'alle' ? undefined : filterStatus, land: filterLand === 'alle' ? undefined : filterLand, suche: suche || undefined },
    { keepPreviousData: true } as never,
  );

  const updateStatusMutation = trpc.crm.updateLead.useMutation({
    onSuccess: () => { void refetchLeads(); void refetchStats(); },
    onError: (err) => toast.error(`Fehler: ${err.message}`),
  });

  const handleRefresh = () => {
    void refetchLeads();
    void refetchStats();
  };

  const leads = (leadsData ?? []) as Lead[];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">CRM — Lead-Verwaltung</h1>
          <p className="text-slate-500 mt-1">Alle Anfragen von der Landing Page und anderen Quellen</p>
        </div>

        {/* Stats-Kacheln */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            {[
              { label: 'Gesamt', value: stats.gesamt, color: 'text-slate-900' },
              { label: 'Neu', value: stats.neu, color: 'text-blue-600' },
              { label: 'Kontaktiert', value: stats.kontaktiert, color: 'text-yellow-600' },
              { label: 'Demo', value: stats.demoGeplant + stats.demoDurchgefuehrt, color: 'text-purple-600' },
              { label: 'Angebot', value: stats.angebotGesendet, color: 'text-cyan-600' },
              { label: 'Gewonnen', value: stats.gewonnen, color: 'text-green-600' },
              { label: 'Verloren', value: stats.verloren, color: 'text-red-600' },
              {
                label: 'Win-Rate',
                value: stats.gesamt > 0 ? `${Math.round((stats.gewonnen / stats.gesamt) * 100)}%` : '–',
                color: 'text-emerald-600',
              },
            ].map((s) => (
              <Card key={s.label} className="text-center">
                <CardHeader className="pb-1 pt-4 px-3">
                  <CardTitle className={`text-2xl font-bold ${s.color}`}>{s.value}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-3">
                  <p className="text-xs text-slate-400">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filter-Leiste */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            placeholder="Suche Firma, E-Mail, Ansprechpartner..."
            value={suche}
            onChange={e => setSuche(e.target.value)}
            className="w-64"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Alle Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLand} onValueChange={setFilterLand}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Alle Länder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Länder</SelectItem>
              <SelectItem value="DE">Deutschland</SelectItem>
              <SelectItem value="AT">Österreich</SelectItem>
              <SelectItem value="CH">Schweiz</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} size="sm">
            Aktualisieren
          </Button>
        </div>

        {/* Tabelle */}
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Ansprechpartner</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Land</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-400 py-12">
                    Keine Leads gefunden
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell className="font-medium text-slate-900">{lead.firmenName}</TableCell>
                    <TableCell className="text-slate-500">{lead.ansprechpartner ?? '–'}</TableCell>
                    <TableCell className="text-slate-500">{lead.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.land}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {lead.interessiertAnPlan ? PLAN_LABELS[lead.interessiertAnPlan] : '–'}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Select
                        value={lead.status}
                        onValueChange={(v) =>
                          updateStatusMutation.mutate({ id: lead.id, status: v as Lead['status'] })
                        }
                      >
                        <SelectTrigger className="h-8 w-36 text-xs border-0 shadow-none px-0">
                          <SelectValue>
                            <StatusBadge status={lead.status} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">{formatDate(lead.createdAt)}</TableCell>
                    <TableCell className="text-slate-300">›</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Anzahl */}
        <p className="text-xs text-slate-400 mt-3">{leads.length} Lead{leads.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Detail-Dialog */}
      {selectedLead && (
        <LeadDialog
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={handleRefresh}
        />
      )}
    </div>
  );
}
