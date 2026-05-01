import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { requireAuth } from "@/utils/requireAuth";

const slides = [
  {
    bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=85",
    badge: "限時優惠",
    title: "新會員首次預約",
    highlight: "享 85 折",
    sub: "宜蘭地區・家事清潔全系列",
    price: "$599 起",
  },
  {
    bg: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=85",
    badge: "限時優惠",
    title: "新會員首次預約",
    highlight: "享 85 折",
    sub: "全台本島・家事清潔全系列",
    price: "$599 起",
  },
  {
    bg: "https://images.unsplash.com/photo-1527515545081-5db817172677?w=1600&q=85",
    badge: "限時優惠",
    title: "新會員首次預約",
    highlight: "享 85 折",
    sub: "商業空間・家事清潔全系列",
    price: "$599 起",
  },
];

const quickLinks = [
  { name: "居家清潔", emoji: "🏠" },
  { name: "家電清洗", emoji: "❄️" },
  { name: "整理收納", emoji: "📦" },
  { name: "商業清潔", emoji: "🏢" },
  { name: "布面清洗", emoji: "🛋️" },
  { name: "裝潢後清潔", emoji: "🔨" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handleBooking = async () => {
    const ok = await requireAuth(navigate, 'BookingForm');
    if (ok) navigate('/BookingForm');
  };

  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[520px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img src={slide.bg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center">
          <div className="container mx-auto px-6 lg:px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
              >
                <span className="inline-block bg-amber-500 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-5">
                  {slide.badge}
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {slide.title}<br />
                  <span className="text-amber-400">{slide.highlight}</span>
                </h1>
                <p className="text-white/80 text-lg mt-4 mb-2">{slide.sub}</p>
                <p className="text-white text-2xl font-semibold mb-8">{slide.price}</p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={handleBooking} className="bg-white text-stone-800 hover:bg-stone-100 rounded-full px-8 py-6 text-base font-medium shadow-xl">
                    開始預約 <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <a href="https://lin.ee/xKVxq7Y" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="border-white/80 bg-white/15 text-white hover:bg-white/25 rounded-full px-8 py-6 text-base font-medium">
                      查看方案
                    </Button>
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${i === current ? 'w-8 h-2 bg-amber-400' : 'w-2 h-2 bg-white/50'}`}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="absolute bottom-0 right-0 hidden md:flex gap-px z-10">
          {[['58,000+', '媒合戶數'], ['56,000+', '真實評價'], ['679+', '認證人員']].map(([num, label]) => (
            <div key={label} className="bg-black/40 backdrop-blur-sm px-6 py-4 text-center">
              <p className="text-white text-xl font-bold">{num}</p>
              <p className="text-white/70 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Service Links */}
      <section className="bg-white border-b border-stone-100 shadow-sm">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-around py-4 overflow-x-auto gap-2">
            {quickLinks.map((q) => (
              <button key={q.name} onClick={handleBooking}
                className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-amber-50 transition-colors min-w-[72px] text-center group">
                <span className="text-2xl">{q.emoji}</span>
                <span className="text-xs text-stone-600 group-hover:text-amber-700 font-medium whitespace-nowrap">{q.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}