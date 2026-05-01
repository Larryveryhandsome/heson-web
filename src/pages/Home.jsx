import React from 'react';
import Navbar from "@/components/landing/Navbar";
import HesonAIChat from "@/components/HesonAIChat";
import HeroSection from "@/components/landing/HeroSection";
import ThemeActivities from "@/components/landing/ThemeActivities";
import ServicesSection from "@/components/landing/ServicesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <ThemeActivities />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <HesonAIChat />
    </div>
  );
}