import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Sparkles, Zap, Search } from "lucide-react";
import { toast } from "sonner";

interface QuickBookingDialogProps {
  unternehmenId: number;
  onVorlageSelected: (vorlage: any) => void;
}

export default function QuickBookingDialog({ unternehmenId, onVorlageSelected }: QuickBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState("");

  // Vorlagen laden
  const vorlagenQuery = trpc.buchungsvorlagen.list.useQuery(
    { unternehmenId },
    { enabled: open && !!unternehmenId }
  );

  const vorlagen = vorlagenQuery.data || [];

  // Filter Vorlagen
  const gefilterteVorlagen = suchbegriff
    ? vorlagen.filter(
        (v) =>
          v.name.toLowerCase().includes(suchbegriff.toLowerCase()) ||
          v.buchungstext.toLowerCase().includes(suchbegriff.toLowerCase()) ||
          v.geschaeftspartner?.toLowerCase().includes(suchbegriff.toLowerCase())
      )
    : vorlagen;

  const handleVorlageClick = (vorlage: any) => {
    onVorlageSelected(vorlage);
    setOpen(false);
    setSuchbegriff("");
    toast.success("Vorlage angewendet", {
      description: `${vorlage.name} wurde in die Buchungsmaske übernommen`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="w-4 h-4" />
          Quick-Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Buchungsvorlage wählen
          </DialogTitle>
          <DialogDescription>
            Wählen Sie eine Vorlage, um die Buchungsmaske automatisch auszufüllen
          </DialogDescription>
        </DialogHeader>

        {/* Suchfeld */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Vorlage suchen..."
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vorlagen Liste */}
        <ScrollArea className="h-[400px] pr-4">
          {gefilterteVorlagen.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="font-semibold mb-2">
                {suchbegriff ? "Keine Vorlagen gefunden" : "Noch keine Vorlagen"}
              </h3>
              <p className="text-sm text-slate-500">
                {suchbegriff
                  ? "Passen Sie Ihre Suche an"
                  : "Erstellen Sie Vorlagen unter 'Vorlagen' im Menü"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {gefilterteVorlagen.map((vorlage) => (
                <button
                  key={vorlage.id}
                  onClick={() => handleVorlageClick(vorlage)}
                  className="w-full p-4 text-left border rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{vorlage.name}</h4>
                      {vorlage.beschreibung && (
                        <p className="text-sm text-slate-600 mt-1">{vorlage.beschreibung}</p>
                      )}
                    </div>
                    {vorlage.betrag && (
                      <Badge variant="outline" className="ml-2 font-mono">
                        {parseFloat(vorlage.betrag).toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        €
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">Soll: {vorlage.sollKonto}</Badge>
                    <Badge variant="secondary">Haben: {vorlage.habenKonto}</Badge>
                    <Badge variant="secondary">USt: {vorlage.ustSatz}%</Badge>
                    <Badge variant="outline" className="capitalize">
                      {vorlage.kategorie}
                    </Badge>
                    {vorlage.geschaeftspartner && (
                      <Badge variant="outline">{vorlage.geschaeftspartner}</Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-2 italic">{vorlage.buchungstext}</p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
