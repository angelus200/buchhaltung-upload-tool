import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, ArrowRight, TrendingDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const EINHEIT_LABELS: Record<string, string> = {
  stueck: "Stk",
  kg: "kg",
  liter: "L",
  meter: "m",
  karton: "Ktn",
};

const KATEGORIE_LABELS: Record<string, string> = {
  rohstoff: "Rohstoff",
  halbfertig: "Halbfertig",
  fertigware: "Fertigware",
  handelsware: "Handelsware",
  verbrauchsmaterial: "Verbrauch",
};

interface NiedrigeBestaendeWidgetProps {
  unternehmenId: number;
}

export default function NiedrigeBestaendeWidget({ unternehmenId }: NiedrigeBestaendeWidgetProps) {
  const niedrigeBestaendeQuery = trpc.dashboard.niedrigeBestaende.useQuery(
    {
      unternehmenId,
      limit: 5,
    },
    {
      enabled: !!unternehmenId,
      refetchInterval: 60000, // Refresh every minute
    }
  );

  const niedrigeBestaende = niedrigeBestaendeQuery.data || [];

  if (niedrigeBestaendeQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Niedrige Lagerbestände
          </CardTitle>
          <CardDescription>Artikel unter Mindestbestand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Lade Daten...</div>
        </CardContent>
      </Card>
    );
  }

  if (niedrigeBestaende.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Lagerbestände OK
          </CardTitle>
          <CardDescription>Alle Artikel ausreichend vorrätig</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-2">Keine kritischen Bestände</p>
            <p className="text-xs text-gray-400">Alle Artikel über Mindestbestand</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const gesamtFehlmenge = niedrigeBestaende.reduce((sum, item) => sum + item.fehlmenge, 0);
  const gesamtWert = niedrigeBestaende.reduce(
    (sum, item) => sum + (item.geschaetzterWert || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Niedrige Lagerbestände
            </CardTitle>
            <CardDescription>
              {niedrigeBestaende.length} Artikel unter Mindestbestand
            </CardDescription>
          </div>
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {niedrigeBestaende.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Zusammenfassung */}
        {gesamtWert > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Geschätzter Bestellwert:</span>
              <span className="font-bold text-red-700">
                {gesamtWert.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          </div>
        )}

        {/* Liste der Artikel */}
        <div className="space-y-3">
          {niedrigeBestaende.map((item) => (
            <div
              key={`${item.artikelId}-${item.lagerort}`}
              className="p-3 border border-red-200 rounded-lg bg-gradient-to-r from-red-50 to-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900">
                      {item.bezeichnung}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {KATEGORIE_LABELS[item.kategorie] || item.kategorie}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{item.artikelnummer}</p>
                  <p className="text-xs text-gray-500">{item.lagerort}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block">Aktuell</span>
                  <span className="font-bold text-red-600 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {item.aktuellerBestand.toFixed(1)} {EINHEIT_LABELS[item.einheit]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Mindest</span>
                  <span className="font-medium">
                    {item.mindestbestand.toFixed(1)} {EINHEIT_LABELS[item.einheit]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Fehlmenge</span>
                  <span className="font-bold text-red-700">
                    {item.fehlmenge.toFixed(1)} {EINHEIT_LABELS[item.einheit]}
                  </span>
                </div>
              </div>

              {item.geschaetzterWert && (
                <div className="mt-2 pt-2 border-t border-red-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Bestellwert (geschätzt):</span>
                    <span className="font-semibold text-red-700">
                      {item.geschaetzterWert.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Alle anzeigen Link */}
        <Link href="/lager">
          <Button variant="outline" className="w-full mt-4" size="sm">
            Alle Bestände anzeigen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
