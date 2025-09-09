import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AddRevision from "./pages/AddRevision";
import Analysis from "./pages/Analysis";
import FLMTAnalysis from "./pages/FLMTAnalysis";
import AddFLMT from "./pages/AddFLMT";
import DetailView from "./pages/DetailView";
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/add-revision" element={<AddRevision />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/flmt-analysis" element={<FLMTAnalysis />} />
        <Route path="/add-flmt" element={<AddFLMT />} />
        <Route path="/analysis/detail" element={<DetailView />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
