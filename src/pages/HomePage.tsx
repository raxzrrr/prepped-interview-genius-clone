
import React from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import Hero from '@/components/Home/Hero';
import Features from '@/components/Home/Features';
import Testimonials from '@/components/Home/Testimonials';
import PricingSection from '@/components/Home/PricingSection';
import GetStarted from '@/components/Home/GetStarted';

const HomePage: React.FC = () => {
  const { isAuthenticated, loading, profile } = useAuth();
  
  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-t-brand-purple border-r-transparent border-b-brand-purple border-l-transparent animate-spin"></div>
        <span className="ml-3 text-gray-700">Loading...</span>
      </div>
    );
  }
  
  // If user is authenticated, redirect to appropriate dashboard
  if (isAuthenticated && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  
  // Show homepage for non-authenticated users
  return (
    <MainLayout>
      <Hero />
      <Features />
      <Testimonials />
      <PricingSection />
      <GetStarted />
    </MainLayout>
  );
};

export default HomePage;
