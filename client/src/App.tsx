import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChatAssistant from "./components/ChatAssistant";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminBoard from "./pages/AdminBoard";
import Unternehmen from "./pages/Unternehmen";
import UnternehmenManagement from "./pages/UnternehmenManagement";
import Benachrichtigungen from "./pages/Benachrichtigungen";
import Einladung from "./pages/Einladung";
import Benutzerverwaltung from "./pages/Benutzerverwaltung";
import Uebersicht from "./pages/Uebersicht";
import Notizen from "./pages/Notizen";
import Stammdaten from "./pages/Stammdaten";
import Kennzahlen from "./pages/Kennzahlen";
import Zahlungen from "./pages/Zahlungen";
import Kalender from "./pages/Kalender";
import Finanzamt from "./pages/Finanzamt";
import Aufgaben from "./pages/Aufgaben";
import Steuerberater from "./pages/Steuerberater";
import DatevImport from "./pages/DatevImport";
import Vorlagen from "./pages/Vorlagen";
import Monatsabschluss from "./pages/Monatsabschluss";
import Artikel from "./pages/Artikel";
import Lager from "./pages/Lager";
import Inventur from "./pages/Inventur";
import Anlagevermoegen from "./pages/Anlagevermoegen";
import Bankkonten from "./pages/Bankkonten";
import Finanzkonten from "./pages/Finanzkonten";
import Eroeffnungsbilanz from "./pages/Eroeffnungsbilanz";
import Jahresabschluss from "./pages/Jahresabschluss";
import Hilfe from "./pages/Hilfe";
import SteuerberaterHandbuch from "./pages/SteuerberaterHandbuch";
import MwstAbrechnung from "./pages/MwstAbrechnung";
import Auszuege from "./pages/Auszuege";

function Router() {
  return (
    <Switch>
      {/* Öffentliche Seiten */}
      <Route path={"/login"} component={Login} />
      <Route path={"/steuerberater-handbuch"} component={SteuerberaterHandbuch} />

      {/* Admin-Only Routen (nur für Benutzer mit role === 'admin') */}
      <Route path={"/admin"}>
        <AdminRoute>
          <AdminBoard />
        </AdminRoute>
      </Route>

      {/* Geschützte Routen (für alle authentifizierten Benutzer) */}
      <Route path={"/dashboard"}>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path={"/"}>
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>

      <Route path={"/uebersicht"}>
        <ProtectedRoute>
          <Uebersicht />
        </ProtectedRoute>
      </Route>

      <Route path={"/kennzahlen"}>
        <ProtectedRoute>
          <Kennzahlen />
        </ProtectedRoute>
      </Route>

      <Route path={"/zahlungen"}>
        <ProtectedRoute>
          <Zahlungen />
        </ProtectedRoute>
      </Route>

      <Route path={"/kalender"}>
        <ProtectedRoute>
          <Kalender />
        </ProtectedRoute>
      </Route>

      <Route path={"/notizen"}>
        <ProtectedRoute>
          <Notizen />
        </ProtectedRoute>
      </Route>

      <Route path={"/stammdaten"}>
        <ProtectedRoute>
          <Stammdaten />
        </ProtectedRoute>
      </Route>

      <Route path={"/unternehmen/:id/management"}>
        <ProtectedRoute>
          <UnternehmenManagement />
        </ProtectedRoute>
      </Route>

      <Route path={"/unternehmen"}>
        <ProtectedRoute>
          <Unternehmen />
        </ProtectedRoute>
      </Route>

      <Route path={"/benachrichtigungen"}>
        <ProtectedRoute>
          <Benachrichtigungen />
        </ProtectedRoute>
      </Route>

      <Route path={"/einladung/:token"}>
        <ProtectedRoute>
          <Einladung />
        </ProtectedRoute>
      </Route>

      <Route path={"/benutzerverwaltung"}>
        <ProtectedRoute>
          <Benutzerverwaltung />
        </ProtectedRoute>
      </Route>

      <Route path={"/finanzamt"}>
        <ProtectedRoute>
          <Finanzamt />
        </ProtectedRoute>
      </Route>

      <Route path={"/aufgaben"}>
        <ProtectedRoute>
          <Aufgaben />
        </ProtectedRoute>
      </Route>

      <Route path={"/steuerberater"}>
        <ProtectedRoute>
          <Steuerberater />
        </ProtectedRoute>
      </Route>

      <Route path={"/datev-import"}>
        <ProtectedRoute>
          <DatevImport />
        </ProtectedRoute>
      </Route>

      <Route path={"/vorlagen"}>
        <ProtectedRoute>
          <Vorlagen />
        </ProtectedRoute>
      </Route>

      <Route path={"/monatsabschluss"}>
        <ProtectedRoute>
          <Monatsabschluss />
        </ProtectedRoute>
      </Route>

      <Route path={"/artikel"}>
        <ProtectedRoute>
          <Artikel />
        </ProtectedRoute>
      </Route>

      <Route path={"/lager"}>
        <ProtectedRoute>
          <Lager />
        </ProtectedRoute>
      </Route>

      <Route path={"/inventur"}>
        <ProtectedRoute>
          <Inventur />
        </ProtectedRoute>
      </Route>

      <Route path={"/anlagevermoegen"}>
        <ProtectedRoute>
          <Anlagevermoegen />
        </ProtectedRoute>
      </Route>

      <Route path={"/bankkonten"}>
        <ProtectedRoute>
          <Bankkonten />
        </ProtectedRoute>
      </Route>

      <Route path={"/finanzkonten"}>
        <ProtectedRoute>
          <Finanzkonten />
        </ProtectedRoute>
      </Route>

      <Route path={"/eroeffnungsbilanz"}>
        <ProtectedRoute>
          <Eroeffnungsbilanz />
        </ProtectedRoute>
      </Route>

      <Route path={"/jahresabschluss"}>
        <ProtectedRoute>
          <Jahresabschluss />
        </ProtectedRoute>
      </Route>

      <Route path={"/hilfe"}>
        <ProtectedRoute>
          <Hilfe />
        </ProtectedRoute>
      </Route>

      <Route path={"/mwst-abrechnung"}>
        <ProtectedRoute>
          <MwstAbrechnung />
        </ProtectedRoute>
      </Route>

      <Route path={"/auszuege"}>
        <ProtectedRoute>
          <Auszuege />
        </ProtectedRoute>
      </Route>

      {/* Fallback */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    return saved ? parseInt(saved) : null;
  });

  // Watch for changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("selectedUnternehmenId");
      setSelectedUnternehmenId(saved ? parseInt(saved) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
          <ChatAssistant unternehmenId={selectedUnternehmenId} />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
