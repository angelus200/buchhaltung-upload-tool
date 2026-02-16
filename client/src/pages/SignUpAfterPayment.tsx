import { useEffect } from "react";
import { SignUp } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";

export default function SignUpAfterPayment() {
  const [, setLocation] = useLocation();

  // Session ID aus URL holen
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      // Kein Session ID → zurück zur Landing Page
      setLocation("/");
    }
  }, [sessionId, setLocation]);

  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-cyan-600" />
            <h1 className="text-3xl font-bold text-gray-900">Buchhaltung-KI</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zahlung erfolgreich!</h2>
          <p className="text-gray-600">Erstellen Sie jetzt Ihren Account</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Success Info */}
          <Card className="bg-cyan-50 border-cyan-200">
            <CardHeader>
              <CardTitle className="text-cyan-900">✓ Zahlung bestätigt</CardTitle>
              <CardDescription className="text-cyan-700">
                Ihr Abonnement wurde erfolgreich aktiviert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-cyan-900">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>Monatliches Abo aktiv</span>
                </li>
                <li className="flex items-center gap-2 text-cyan-900">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>Sofortiger Zugriff</span>
                </li>
                <li className="flex items-center gap-2 text-cyan-900">
                  <Check className="w-5 h-5 text-cyan-600" />
                  <span>Jederzeit kündbar</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Clerk Sign Up */}
          <div className="flex items-center justify-center">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/login"
              afterSignUpUrl={`/app/setup?session_id=${sessionId}`}
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none",
                },
              }}
            />
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Nach der Registrierung werden Sie automatisch zur App weitergeleitet</p>
        </div>
      </div>
    </div>
  );
}
