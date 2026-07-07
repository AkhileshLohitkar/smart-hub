import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect } from "react";
import { initPostHog, trackEvent, identifyUser } from "@/lib/posthog";
import { useUser } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Home from "@/pages/Home";
import WorksheetView from "@/pages/WorksheetView";
import History from "@/pages/History";
import ContentUpload from "@/pages/ContentUpload";
import BrainFlexPuzzle from "@/pages/BrainFlexPuzzle";
import BrainFlexPage from "@/pages/BrainFlexPage";
import TestPrep from "@/pages/TestPrep";
import QuestionPaperStudio from "@/pages/QuestionPaperStudio";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import PaymentRecover from "@/pages/PaymentRecover";
import AboutUs from "@/pages/AboutUs";
import TermsAndConditions from "@/pages/TermsAndConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import ContactUs from "@/pages/ContactUs";
import Admin from "@/pages/Admin";
import Pricing from "@/pages/Pricing";
import FaqPage from "@/pages/FaqPage";
import AnswerKeyPage from "@/pages/AnswerKeyPage";
import Footer from "@/components/Footer";

function PostHogInitializer() {
  const { data: user } = useUser();

  useEffect(() => {
    initPostHog();
    trackEvent("App_Open");
  }, []);

  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        name: user.name,
      });
    }
  }, [user]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/new-worksheet" component={Home} />
      <Route path="/dashboard">
        <Redirect to="/new-worksheet" />
      </Route>
      <Route path="/worksheet/:id" component={WorksheetView} />
      <Route path="/history" component={History} />
      <Route path="/notes" component={ContentUpload} />
      <Route path="/my-notes" component={ContentUpload} />
      <Route path="/brain-flex/:id" component={BrainFlexPage} />
      <Route path="/brain-flex" component={BrainFlexPuzzle} />
      <Route path="/test-prep" component={TestPrep} />
      <Route path="/question-paper-studio" component={QuestionPaperStudio} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route path="/payment/recover" component={PaymentRecover} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/answer-key/:id" component={AnswerKeyPage} />
      <Route path="/about" component={AboutUs} />
      <Route path="/terms" component={TermsAndConditions} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PostHogInitializer />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Router />
            </div>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
