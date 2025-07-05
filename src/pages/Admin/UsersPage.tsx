
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import UserTable from '@/components/Admin/UserTable';
import { useAuth } from '@/contexts/ClerkAuthContext';

const UsersPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <DashboardLayout>
      <UserTable />
    </DashboardLayout>
  );
};

export default UsersPage;
