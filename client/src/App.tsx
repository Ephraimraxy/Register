import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/home";
import RegistrationPage from "@/pages/registration";
import TraineeRegistrationPage from "@/pages/trainee-registration";
import ViewTraineesPage from "@/pages/view-trainees";
import SponsorsPage from "@/pages/sponsors";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/registration" component={RegistrationPage} />
      <Route path="/registration/trainee" component={TraineeRegistrationPage} />
      <Route path="/trainees" component={ViewTraineesPage} />
      <Route path="/sponsors" component={SponsorsPage} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
