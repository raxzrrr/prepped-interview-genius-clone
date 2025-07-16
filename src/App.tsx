
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { SimpleAuthProvider } from "@/contexts/SimpleAuthContext";
import SimpleProtectedRoute from "@/components/Auth/SimpleProtectedRoute";

// Public Pages
import HomePage from "@/pages/HomePage";
import SimpleLoginPage from "@/pages/AuthPages/SimpleLoginPage";
import SimpleRegisterPage from "@/pages/AuthPages/SimpleRegisterPage";
import NotFound from "@/pages/NotFound";

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
import UserManagementPage from "@/pages/Admin/UserManagementPage";
import CourseManagementPage from "@/pages/Admin/CourseManagementPage";
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
      <BrowserRouter>
        <SimpleAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<SimpleLoginPage />} />
              <Route path="/register" element={<SimpleRegisterPage />} />
              
              {/* Student Routes */}
              <Route path="/dashboard" element={<SimpleProtectedRoute><Dashboard /></SimpleProtectedRoute>} />
              <Route path="/interviews" element={<SimpleProtectedRoute><InterviewsPage /></SimpleProtectedRoute>} />
              <Route path="/custom-interviews" element={<SimpleProtectedRoute><CustomInterviewsPage /></SimpleProtectedRoute>} />
              <Route path="/learning" element={<SimpleProtectedRoute><LearningPage /></SimpleProtectedRoute>} />
              <Route path="/reports" element={<SimpleProtectedRoute><ReportsPage /></SimpleProtectedRoute>} />
              <Route path="/reports/:id" element={<SimpleProtectedRoute><ReportDetailPage /></SimpleProtectedRoute>} />
              <Route path="/certificates" element={<SimpleProtectedRoute><CertificatesPage /></SimpleProtectedRoute>} />
              <Route path="/settings" element={<SimpleProtectedRoute><SettingsPage /></SimpleProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<SimpleProtectedRoute requiredRole="admin"><AdminDashboard /></SimpleProtectedRoute>} />
              <Route path="/admin/user-management" element={<SimpleProtectedRoute requiredRole="admin"><UserManagementPage /></SimpleProtectedRoute>} />
              <Route path="/admin/courses" element={<SimpleProtectedRoute requiredRole="admin"><CourseManagementPage /></SimpleProtectedRoute>} />
              <Route path="/admin/content" element={<SimpleProtectedRoute requiredRole="admin"><AdminContentPage /></SimpleProtectedRoute>} />
              <Route path="/admin/coupons" element={<SimpleProtectedRoute requiredRole="admin"><AdminCouponsPage /></SimpleProtectedRoute>} />
              <Route path="/admin/payments" element={<SimpleProtectedRoute requiredRole="admin"><AdminPaymentsPage /></SimpleProtectedRoute>} />
              <Route path="/admin/certificates" element={<SimpleProtectedRoute requiredRole="admin"><AdminCertificatesPage /></SimpleProtectedRoute>} />
              <Route path="/admin/settings" element={<SimpleProtectedRoute requiredRole="admin"><AdminSettingsPage /></SimpleProtectedRoute>} />
              
              {/* Catch-all / 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </SimpleAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
