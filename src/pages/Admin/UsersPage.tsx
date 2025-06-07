
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import UserTable from '@/components/Admin/UserTable';
import { useAuth } from '@/contexts/ClerkAuthContext';

const UsersPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';
  
  if (!user && !isTempAdmin) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin() && !isTempAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <DashboardLayout>
      <UserTable />
    </DashboardLayout>
  );
};

export default UsersPage;
