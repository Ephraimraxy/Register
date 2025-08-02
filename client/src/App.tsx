import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import HomePage from "@/pages/home";
import RegistrationPage from "@/pages/registration";
import TraineeRegistrationPage from "@/pages/trainee-registration";
import ViewTraineesPage from "@/pages/view-trainees-new";
import VerificationLoginPage from "@/pages/verification-login";
import SponsorsPage from "@/pages/sponsors";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ResortManagementPage from "@/pages/resort-management";
import EvaluationSetupPage from "@/pages/evaluation-setup";
import EvaluationResultsPage from "@/pages/evaluation-results";
import StaffIdGenerationPage from "@/pages/staff-id-generation";
import ResourcePersonIdGenerationPage from "@/pages/resource-person-id-generation";
import StaffRegistrationPage from "@/pages/staff-registration";
import ResourcePersonRegistrationPage from "@/pages/resource-person-registration";
import ThemeDemoPage from "@/pages/theme-demo";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/registration" component={RegistrationPage} />
      <Route path="/registration/trainee" component={TraineeRegistrationPage} />
      <Route path="/trainees" component={ViewTraineesPage} />
      <Route path="/sponsors" component={SponsorsPage} />
      <Route path="/resort-management" component={ResortManagementPage} />
      <Route path="/evaluation-setup" component={EvaluationSetupPage} />
      <Route path="/evaluation-results" component={EvaluationResultsPage} />
      <Route path="/staff-id-generation" component={StaffIdGenerationPage} />
      <Route path="/resource-person-id-generation" component={ResourcePersonIdGenerationPage} />
      <Route path="/staff-registration" component={StaffRegistrationPage} />
      <Route path="/resource-person-registration" component={ResourcePersonRegistrationPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/verification-login" component={VerificationLoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/theme-demo" component={ThemeDemoPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
