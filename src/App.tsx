
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Public Pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/AuthPages/LoginPage";
import RegisterPage from "@/pages/AuthPages/RegisterPage";
import NotFound from "@/pages/NotFound";

// Student Pages
import Dashboard from "@/pages/Student/Dashboard";
import InterviewsPage from "@/pages/Student/InterviewsPage";
import LearningPage from "@/pages/Student/LearningPage";
import ReportsPage from "@/pages/Student/ReportsPage";
import CertificatesPage from "@/pages/Student/CertificatesPage";
import SettingsPage from "@/pages/Student/SettingsPage";

// Admin Pages
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import UsersPage from "@/pages/Admin/UsersPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Student Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interviews" element={<InterviewsPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/content" element={<AdminContentPage />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            
            {/* Catch-all / 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
