import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthModalProvider } from "./contexts/AuthModalContext";
import { LiveChat } from "./components/LiveChat";
import Home from "./pages/Home";
import AppPage from "./pages/AppPage";
import Onboarding from "./pages/Onboarding";
import ParentDashboard from "./pages/ParentDashboard";
import Success from "./pages/Success";
import Help from "./pages/Help";
function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/app"} component={AppPage} />
      <Route path={"/parent"} component={ParentDashboard} />
      <Route path={"/success"} component={Success} />
      <Route path={"/help"} component={Help} />
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
          <AuthModalProvider>
            <Toaster />
            <LiveChat />
            <Router />
          </AuthModalProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
