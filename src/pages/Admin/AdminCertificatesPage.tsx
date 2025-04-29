
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminCertificatesPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  // Redirect if not logged in or not an admin
  if (!user || !isAdmin()) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="mt-2 text-gray-600">
            Create and manage certification templates
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Certificate Templates</CardTitle>
            <CardDescription>Design and manage certification templates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              This feature is coming soon. You'll be able to create and manage certificate templates here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminCertificatesPage;
