
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { supabaseConfigured } from "@/integrations/supabase/client";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Index from "./pages/Index";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import Roadmap from "./pages/Roadmap";
import Dashboard from "./pages/Dashboard";
import Discuss from "./pages/Discuss";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Payment from "./pages/Payment";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Guidelines from "./pages/Guidelines";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Navbar />
              {!supabaseConfigured && (
                <div className="border-b border-amber-500/30 bg-amber-500/10 text-amber-700">
                  <div className="mx-auto max-w-7xl px-4 py-2 text-sm sm:px-6 lg:px-8">
                    Supabase is not configured. Set VITE_SUPABASE_URL and
                    VITE_SUPABASE_PUBLISHABLE_KEY to enable authentication and data features.
                  </div>
                </div>
              )}
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/problems" element={<Problems />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/problem/:id" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/discuss" element={<Discuss />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/help" element={<Help />} />
                <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/guidelines" element={<Guidelines />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
