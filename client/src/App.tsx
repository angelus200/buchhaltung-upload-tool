import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Unternehmen from "./pages/Unternehmen";
import Benachrichtigungen from "./pages/Benachrichtigungen";
import Benutzerverwaltung from "./pages/Benutzerverwaltung";
import Uebersicht from "./pages/Uebersicht";
import Notizen from "./pages/Notizen";
import Stammdaten from "./pages/Stammdaten";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/uebersicht"} component={Uebersicht} />
      <Route path={"/notizen"} component={Notizen} />
      <Route path={"/stammdaten"} component={Stammdaten} />
      <Route path={"/unternehmen"} component={Unternehmen} />
      <Route path={"/benachrichtigungen"} component={Benachrichtigungen} />
      <Route path={"/benutzerverwaltung"} component={Benutzerverwaltung} />
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
