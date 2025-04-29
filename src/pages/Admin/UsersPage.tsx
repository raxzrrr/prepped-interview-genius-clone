
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import UserTable from '@/components/Admin/UserTable';
import { useAuth } from '@/contexts/AuthContext';

const UsersPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  // Redirect if not logged in or not an admin
  if (!user || !isAdmin()) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
      <UserTable />
    </DashboardLayout>
  );
};

export default UsersPage;
