
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Settings, CreditCard, Gift, Award } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';
  
  if (!user && !isTempAdmin) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin() && !isTempAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const adminCards = [
    {
      title: "Course Management",
      description: "Create and manage educational courses and video content",
      icon: BookOpen,
      href: "/admin/courses",
      color: "bg-blue-500"
    },
    {
      title: "Content Management",
      description: "Manage learning materials and resources",
      icon: FileText,
      href: "/admin/content",
      color: "bg-green-500"
    },
    {
      title: "Payment Management",
      description: "View and manage payment transactions",
      icon: CreditCard,
      href: "/admin/payments",
      color: "bg-purple-500"
    },
    {
      title: "Coupon Management",
      description: "Create and manage discount coupons",
      icon: Gift,
      href: "/admin/coupons",
      color: "bg-orange-500"
    },
    {
      title: "Certificate Management",
      description: "Manage course certificates and achievements",
      icon: Award,
      href: "/admin/certificates",
      color: "bg-indigo-500"
    },
    {
      title: "Settings",
      description: "Configure system settings and preferences",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-500"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your educational platform from here
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className={`${card.color} p-2 rounded-lg mr-3`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {card.description}
                </CardDescription>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = card.href}
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Overview of your platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-600">-</h3>
                  <p className="text-sm text-gray-600">Total Courses</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h3 className="text-2xl font-bold text-green-600">-</h3>
                  <p className="text-sm text-gray-600">Active Students</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-2xl font-bold text-purple-600">-</h3>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <h3 className="text-2xl font-bold text-orange-600">-</h3>
                  <p className="text-sm text-gray-600">Certificates Issued</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
