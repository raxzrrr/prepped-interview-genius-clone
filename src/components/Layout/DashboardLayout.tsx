
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
  Users,
  FileVideo,
  Tag,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, profile, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    // This will be handled by Clerk's SignOutButton
    navigate('/login');
  };

  if (!user) {
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
    { icon: Users, label: 'Manage Users', href: '/admin/users' },
    { icon: FileVideo, label: 'Manage Content', href: '/admin/content' },
    { icon: Tag, label: 'Coupon Codes', href: '/admin/coupons' },
    { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
    { icon: Award, label: 'Certificates', href: '/admin/certificates' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  const navItems = isAdmin() ? adminNavItems : studentNavItems;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 z-10 bg-brand-darkBlue text-white">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
          <Link to="/" className="text-xl font-bold">
            Interview Genius
          </Link>
        </div>
        
        <div className="flex flex-col flex-grow p-4 overflow-y-auto">
          <div className="mb-8">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
              Main
            </div>
            <nav className="space-y-1">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                    location.pathname === item.href
                      ? "bg-brand-purple text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto">
            <div className="px-4 py-2 mb-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-400">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 md:ml-64 overflow-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 md:hidden">
          <Link to="/" className="text-xl font-bold">
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
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
