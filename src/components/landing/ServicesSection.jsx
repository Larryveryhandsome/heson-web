import React, { useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { Star, MapPin, Tag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Service cases will be fetched from database

const categories = [
  { name: "居家清潔", sub: "鐘點・定期・大掃除", emoji: "🏠", hot: true },
  { name: "家電清洗", sub: "冷氣・洗衣機・油煙機", emoji: "❄️", hot: false },
  { name: "整理收納", sub: "整理師・空間規劃", emoji: "📦", hot: false },
  { name: "商業清潔", sub: "辦公室・商業空間", emoji: "🏢", hot: false },
  { name: "布面清洗", sub: "沙發・床墊・窗簾", emoji: "🛋️", hot: false },
  { name: "裝潢後清潔", sub: "新屋・工程後清潔", emoji: "🔨", hot: false },
];

// Marquee ticker
function MarqueeTicker() {
  const navigate = useNavigate();
  const trackRef = useRef(null);

  return (
    <div className="overflow-hidden bg-white border-y border-stone-100 py-4 relative">
      {/* gradient fades */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      <div
        ref={trackRef}
        className="flex gap-8 animate-marquee whitespace-nowrap"
        style={{ animationDuration: '20s' }}
      >
        {[...categories, ...categories].map((cat, i) => (
          <button
            key={i}
            onClick={() => navigate(`/ServiceInquiry?service=${encodeURIComponent(cat.name)}`)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-stone-50 hover:bg-amber-50 hover:text-amber-700 text-stone-700 text-sm font-medium transition-colors border border-stone-100 hover:border-amber-200 shrink-0"
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default function ServicesSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-stone-50">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">服務分類</span>
          <h2 className="text-3xl font-light text-stone-800 mt-3">
            選擇最適合的 <span className="font-medium">服務方案</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <button
                onClick={() => navigate(`/ServiceInquiry?service=${encodeURIComponent(cat.name)}`)}
                className="w-full bg-white rounded-2xl p-5 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-stone-100 relative"
              >
                <div className="text-3xl mb-3">{cat.emoji}</div>
                <p className="font-medium text-stone-800 text-sm">{cat.name}</p>
                <p className="text-xs text-stone-400 mt-1">{cat.sub}</p>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}