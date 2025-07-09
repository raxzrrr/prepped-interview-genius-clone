
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  FileText, 
  Award, 
  Settings, 
  LogOut,
  FileVideo,
  Tag,
  CreditCard,
  Sparkles,
  GraduationCap,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, profile, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';

  const handleLogout = async () => {
    try {
      // Clear temporary admin access
      localStorage.removeItem('tempAdmin');
      
      if (user) {
        await logout();
      }
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user && !isTempAdmin) {
    navigate('/login');
    return null;
  }

  const studentNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Video, label: 'Interview Practice', href: '/interviews' },
    { icon: Sparkles, label: 'Custom Interviews', href: '/custom-interviews' },
    { icon: BookOpen, label: 'Learning Hub', href: '/learning' },
    { icon: FileText, label: 'My Reports', href: '/reports' },
    { icon: Award, label: 'Certificates', href: '/certificates' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: UserCog, label: 'User Management', href: '/admin/user-management' },
    { icon: GraduationCap, label: 'Course Management', href: '/admin/courses' },
    { icon: FileVideo, label: 'Manage Content', href: '/admin/content' },
    { icon: Tag, label: 'Coupon Codes', href: '/admin/coupons' },
    { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
    { icon: Award, label: 'Certificates', href: '/admin/certificates' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  const navItems = (isAdmin() || isTempAdmin) ? adminNavItems : studentNavItems;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 z-10 bg-brand-darkBlue text-white">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
          <Link to="/" className="text-xl font-bold text-white hover:text-gray-200 transition-colors">
            Interview Genius
          </Link>
        </div>
        
        <div className="flex flex-col flex-grow p-4 overflow-y-auto">
          <div className="mb-8">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Main
            </div>
            <nav className="space-y-1">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200",
                    location.pathname === item.href
                      ? "bg-brand-purple text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto border-t border-gray-700 pt-4">
            <div className="px-4 py-3 mb-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center text-white font-medium">
                    {isTempAdmin ? 'A' : (profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U')}
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {isTempAdmin ? 'Admin User' : (profile?.full_name || 'User')}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {isTempAdmin ? 'admin@interview.ai' : (user?.primaryEmailAddress?.emailAddress || 'admin@interview.ai')}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="flex items-center w-full px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 md:ml-64 overflow-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm md:hidden">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Interview Genius
          </Link>
          <Button variant="ghost" size="icon" onClick={() => {}}>
            <span className="sr-only">Open menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </header>
        
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
