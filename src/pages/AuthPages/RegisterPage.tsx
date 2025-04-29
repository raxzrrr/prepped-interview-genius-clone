
import React from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import RegisterForm from '@/components/Auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    if (isAdmin()) {
      return <Navigate to="/admin" />;
    } else if (isStudent()) {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return (
    <MainLayout>
      <div className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            <RegisterForm />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
