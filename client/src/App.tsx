import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminBoard from "./pages/AdminBoard";
import Unternehmen from "./pages/Unternehmen";
import Benachrichtigungen from "./pages/Benachrichtigungen";
import Einladung from "./pages/Einladung";
import Benutzerverwaltung from "./pages/Benutzerverwaltung";
import Uebersicht from "./pages/Uebersicht";
import Notizen from "./pages/Notizen";
import Stammdaten from "./pages/Stammdaten";
import Kennzahlen from "./pages/Kennzahlen";

function Router() {
  return (
    <Switch>
      {/* Öffentliche Seiten */}
      <Route path={"/login"} component={Login} />
      
      {/* Dashboard (nach Login) */}
      <Route path={"/dashboard"} component={Dashboard} />
      
      {/* Admin-Board (nur für Administratoren) */}
      <Route path={"/admin"} component={AdminBoard} />
      
      {/* Buchhaltungs-Funktionen */}
      <Route path={"/"} component={Home} />
      <Route path={"/uebersicht"} component={Uebersicht} />
      <Route path={"/kennzahlen"} component={Kennzahlen} />
      <Route path={"/notizen"} component={Notizen} />
      <Route path={"/stammdaten"} component={Stammdaten} />
      <Route path={"/unternehmen"} component={Unternehmen} />
      <Route path={"/benachrichtigungen"} component={Benachrichtigungen} />
      <Route path={"/einladung/:token"} component={Einladung} />
      <Route path={"/benutzerverwaltung"} component={Benutzerverwaltung} />
      
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
