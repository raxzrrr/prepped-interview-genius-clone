
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ClerkAuthProvider } from "@/contexts/ClerkAuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";

// Public Pages
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import PricingPage from "@/pages/PricingPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import LoginPage from "@/pages/AuthPages/LoginPage";
import RegisterPage from "@/pages/AuthPages/RegisterPage";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";

// Student Pages
import Dashboard from "@/pages/Student/Dashboard";
import InterviewsPage from "@/pages/Student/InterviewsPage";
import CustomInterviewsPage from "@/pages/Student/CustomInterviewsPage";
import LearningPage from "@/pages/Student/LearningPage";
import JobsPage from "@/pages/Student/JobsPage";
import InterviewResourcesPage from "@/pages/Student/InterviewResourcesPage";
import CertificatesPage from "@/pages/Student/CertificatesPage";
import SettingsPage from "@/pages/Student/SettingsPage";


// Admin Pages
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import UserManagementPage from "@/pages/Admin/UserManagementPage";
import CourseManagementPage from "@/pages/Admin/CourseManagementPage";
import AdminPaymentsPage from "@/pages/Admin/AdminPaymentsPage";
import AdminCertificatesPage from "@/pages/Admin/AdminCertificatesPage";
import AdminSettingsPage from "@/pages/Admin/AdminSettingsPage";
import AdminInterviewResourcesPage from "@/pages/Admin/InterviewResourcesPage";

const queryClient = new QueryClient();

// Use the Clerk publishable key from database
const clerkPubKey = "pk_test_ZmFzdC1wZWxpY2FuLTQ4LmNsZXJrLmFjY291bnRzLmRldiQ";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ClerkAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Student Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/interviews" element={<ProtectedRoute><InterviewsPage /></ProtectedRoute>} />
              <Route path="/custom-interviews" element={<ProtectedRoute><CustomInterviewsPage /></ProtectedRoute>} />
              <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
              <Route path="/interview-resources" element={<ProtectedRoute><InterviewResourcesPage /></ProtectedRoute>} />
              <Route path="/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/user-management" element={<ProtectedRoute requiredRole="admin"><UserManagementPage /></ProtectedRoute>} />
              <Route path="/admin/courses" element={<ProtectedRoute requiredRole="admin"><CourseManagementPage /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><AdminPaymentsPage /></ProtectedRoute>} />
              <Route path="/admin/certificates" element={<ProtectedRoute requiredRole="admin"><AdminCertificatesPage /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettingsPage /></ProtectedRoute>} />
              <Route path="/admin/interview-resources" element={<ProtectedRoute requiredRole="admin"><AdminInterviewResourcesPage /></ProtectedRoute>} />
              
              {/* Catch-all / 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClerkAuthProvider>
    </ClerkProvider>
  </QueryClientProvider>
);

export default App;
