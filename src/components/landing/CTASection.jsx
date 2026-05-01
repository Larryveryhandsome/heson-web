import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { requireAuth } from "@/utils/requireAuth";

export default function CTASection() {
  const navigate = useNavigate();

  const handleBooking = async () => {
    const { base44 } = await import('@/api/base44Client');
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(window.location.origin + '/BookingForm');
      return;
    }
    navigate('/BookingForm');
  };

  return (
    <section className="py-24 bg-stone-800 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-stone-600/20 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight">
            讓生活回歸
            <span className="block font-medium text-amber-400 mt-2">美好本質</span>
          </h2>
          <p className="text-stone-300 mt-4 text-base">媒體報導 &amp; 品牌認證</p>
          <div className="flex flex-wrap justify-center gap-3 mt-3 mb-4">
            {['消費者報導', '工商時報', '數位時代', 'ISO 9001 認證', '消保會推薦'].map(m => (
              <span key={m} className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/20">{m}</span>
            ))}
          </div>
          
          <p className="text-stone-400 text-lg mt-6 max-w-xl mx-auto">
            立即預約免費試掃，讓 HESON 專業團隊為您服務
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Button 
                size="lg"
                onClick={handleBooking}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                立即預約試掃
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            <a href="https://lin.ee/xKVxq7Y" target="_blank" rel="noopener noreferrer">
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/60 bg-white/15 text-white hover:bg-white/25 px-8 py-6 text-base rounded-full font-medium"
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                LINE 聯繫我們
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}