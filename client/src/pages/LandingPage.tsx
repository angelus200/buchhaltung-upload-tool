import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Plan = "starter" | "business";
type OnboardingPackage = "basis" | "komplett" | "schulung_einzel" | "schulung_team" | "schulung_intensiv" | null;

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingPackage>(null);
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(`Checkout fehlgeschlagen: ${error.message}`);
      setLoading(false);
    },
  });

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowOnboardingDialog(true);
  };

  const handleCheckout = () => {
    if (!selectedPlan) return;

    setLoading(true);
    createCheckoutMutation.mutate({
      plan: selectedPlan,
      onboarding: selectedOnboarding || undefined,
    });
  };

  const handleSkipOnboarding = () => {
    setSelectedOnboarding(null);
    setShowOnboardingDialog(false);
    handleCheckout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-600" />
            <h1 className="text-2xl font-bold text-gray-900">Buchhaltung-KI</h1>
          </div>
          <p className="text-sm text-gray-600">by Non Dom Group</p>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-4">
          KI-gestützte Buchhaltung für deutsche KMU
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Automatisieren Sie Ihre Buchhaltung mit künstlicher Intelligenz.
          Sparen Sie Zeit und Geld.
        </p>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Wählen Sie Ihren Plan</h3>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <Card className="border-2 hover:border-cyan-500 transition-all">
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>Perfekt für Einzelunternehmer</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">299€</span>
                <span className="text-gray-600">/Monat</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>1 Firma</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>2 Benutzer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>KI-Buchungsvorschläge</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>DATEV-Export</span>
                </li>
              </ul>
              <Button
                onClick={() => handlePlanSelect("starter")}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Jetzt buchen <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card className="border-2 border-cyan-500 hover:border-cyan-600 transition-all relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-600 text-white px-4 py-1 rounded-full text-sm">
              Beliebt
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Business</CardTitle>
              <CardDescription>Für wachsende Unternehmen</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">499€</span>
                <span className="text-gray-600">/Monat</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>5 Firmen</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>5 Benutzer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>Alle Starter-Features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>Prioritäts-Support</span>
                </li>
              </ul>
              <Button
                onClick={() => handlePlanSelect("business")}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Jetzt buchen <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboardingDialog} onOpenChange={setShowOnboardingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Onboarding-Paket hinzufügen?</DialogTitle>
            <DialogDescription>
              Starten Sie mit professioneller Unterstützung. Alle Pakete sind einmalige Zahlungen.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Onboarding Basis */}
            <Card
              className={`cursor-pointer transition-all ${selectedOnboarding === "basis" ? "border-cyan-500 border-2" : ""}`}
              onClick={() => setSelectedOnboarding("basis")}
            >
              <CardHeader>
                <CardTitle className="text-lg">Onboarding Basis - 499€</CardTitle>
                <CardDescription>Grundlegende Einrichtung</CardDescription>
              </CardHeader>
            </Card>

            {/* Onboarding Komplett */}
            <Card
              className={`cursor-pointer transition-all ${selectedOnboarding === "komplett" ? "border-cyan-500 border-2" : ""}`}
              onClick={() => setSelectedOnboarding("komplett")}
            >
              <CardHeader>
                <CardTitle className="text-lg">Onboarding Komplett - 1.499€</CardTitle>
                <CardDescription>Vollständige Einrichtung mit Schulung</CardDescription>
              </CardHeader>
            </Card>

            {/* Schulungen */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-2">Oder Schulung hinzufügen:</h4>
              <div className="space-y-2">
                <Card
                  className={`cursor-pointer transition-all ${selectedOnboarding === "schulung_einzel" ? "border-cyan-500 border-2" : ""}`}
                  onClick={() => setSelectedOnboarding("schulung_einzel")}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Einzelschulung - 149€</CardTitle>
                  </CardHeader>
                </Card>
                <Card
                  className={`cursor-pointer transition-all ${selectedOnboarding === "schulung_team" ? "border-cyan-500 border-2" : ""}`}
                  onClick={() => setSelectedOnboarding("schulung_team")}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Team-Schulung - 349€</CardTitle>
                  </CardHeader>
                </Card>
                <Card
                  className={`cursor-pointer transition-all ${selectedOnboarding === "schulung_intensiv" ? "border-cyan-500 border-2" : ""}`}
                  onClick={() => setSelectedOnboarding("schulung_intensiv")}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Intensiv-Schulung - 799€</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={handleSkipOnboarding} disabled={loading} className="flex-1">
              Ohne Onboarding fortfahren
            </Button>
            <Button
              onClick={() => {
                setShowOnboardingDialog(false);
                handleCheckout();
              }}
              disabled={loading || !selectedOnboarding}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? "Wird geladen..." : "Zur Kasse"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>Marketplace24-7 GmbH, Kantonsstrasse 1, 8807 Freienbach SZ, Schweiz</p>
          <p className="mt-2">Marke: Non Dom Group</p>
        </div>
      </footer>
    </div>
  );
}
