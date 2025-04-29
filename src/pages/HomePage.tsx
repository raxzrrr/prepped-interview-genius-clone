
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Hero from '@/components/Home/Hero';
import Features from '@/components/Home/Features';
import Testimonials from '@/components/Home/Testimonials';
import PricingSection from '@/components/Home/PricingSection';
import GetStarted from '@/components/Home/GetStarted';

const HomePage: React.FC = () => {
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
