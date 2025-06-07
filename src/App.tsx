import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ClerkAuthProvider } from "@/contexts/ClerkAuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";

// Public Pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/AuthPages/LoginPage";
import RegisterPage from "@/pages/AuthPages/RegisterPage";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";

// Student Pages
import Dashboard from "@/pages/Student/Dashboard";
import InterviewsPage from "@/pages/Student/InterviewsPage";
import CustomInterviewsPage from "@/pages/Student/CustomInterviewsPage";
import LearningPage from "@/pages/Student/LearningPage";
import ReportsPage from "@/pages/Student/ReportsPage";
import CertificatesPage from "@/pages/Student/CertificatesPage";
import SettingsPage from "@/pages/Student/SettingsPage";
import ReportDetailPage from './pages/Student/ReportDetailPage';

// Admin Pages
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import UsersPage from "@/pages/Admin/UsersPage";
import AdminContentPage from "@/pages/Admin/AdminContentPage";
import AdminCouponsPage from "@/pages/Admin/AdminCouponsPage";
import AdminPaymentsPage from "@/pages/Admin/AdminPaymentsPage";
import AdminCertificatesPage from "@/pages/Admin/AdminCertificatesPage";
import AdminSettingsPage from "@/pages/Admin/AdminSettingsPage";

const queryClient = new QueryClient();
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

const App = () => (
  <ClerkProvider publishableKey={clerkPubKey}>
    <QueryClientProvider client={queryClient}>
      <ClerkAuthProvider>
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
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/interviews" element={<ProtectedRoute><InterviewsPage /></ProtectedRoute>} />
              <Route path="/custom-interviews" element={<ProtectedRoute><CustomInterviewsPage /></ProtectedRoute>} />
              <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
              <Route path="/reports/:id" element={<ProtectedRoute><ReportDetailPage /></ProtectedRoute>} />
              <Route path="/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
              <Route path="/admin/content" element={<ProtectedRoute><AdminContentPage /></ProtectedRoute>} />
              <Route path="/admin/coupons" element={<ProtectedRoute><AdminCouponsPage /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute><AdminPaymentsPage /></ProtectedRoute>} />
              <Route path="/admin/certificates" element={<ProtectedRoute><AdminCertificatesPage /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><AdminSettingsPage /></ProtectedRoute>} />
              
              {/* Catch-all / 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClerkAuthProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
