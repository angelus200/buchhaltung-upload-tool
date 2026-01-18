import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
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

function Router() {
  return (
    <Switch>
      {/* Öffentliche Seiten */}
      <Route path={"/login"} component={Login} />

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

      {/* Fallback */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
