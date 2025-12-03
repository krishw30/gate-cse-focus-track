import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import AddRevision from "./pages/AddRevision";
import Analysis from "./pages/Analysis";
import DetailView from "./pages/DetailView";
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LogMockTest from "./pages/LogMockTest"; // <-- Import the new page
import MockAnalysis from "./pages/MockAnalysis"; // <-- NEW: add route for mock analysis

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background">
      {location.pathname !== "/log-mock-test" && <Navigation />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/add-revision" element={<AddRevision />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/analysis/detail" element={<DetailView />} />
        <Route path="/log-mock-test" element={<LogMockTest />} />
        <Route path="/mock-analysis" element={<MockAnalysis />} />
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
