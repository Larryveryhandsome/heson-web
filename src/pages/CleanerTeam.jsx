import React from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Star, Shield, Wrench, Car } from "lucide-react";

export default function CleanerTeam() {
  const { data: cleaners = [], isLoading } = useQuery({
    queryKey: ['activeCleaners'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }),
  });

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-6">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-stone-600 font-medium">每位夥伴均通過身分驗證與良民證審核</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-800 mb-4">
              認識我們的<span className="font-medium">專業夥伴</span>
            </h1>
            <p className="text-stone-500 max-w-xl mx-auto">
              HESON 每位管理師都經過嚴格篩選與訓練，值得您信賴的居家清潔夥伴。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : cleaners.length === 0 ? (
            <p className="text-center text-stone-400 py-20">目前尚無公開的夥伴資料</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cleaners.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="bg-stone-50 rounded-2xl overflow-hidden border border-stone-100 hover:shadow-md transition-shadow"
                >
                  {/* Photo */}
                  <div className="h-48 bg-gradient-to-br from-amber-100 to-stone-200 flex items-center justify-center overflow-hidden">
                    {c.profile_photo ? (
                      <img src={c.profile_photo} alt={c.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center text-4xl">
                          🧹
                        </div>
                        <span className="text-sm">{c.nickname}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-stone-800 text-lg">{c.nickname}</h3>
                      {c.police_record_verified && (
                        <Badge className="bg-green-100 text-green-700 text-xs px-2">
                          <Shield className="w-3 h-3 mr-1" />已驗證
                        </Badge>
                      )}
                    </div>

                    {c.experience_years > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 text-sm mb-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{c.experience_years} 年經驗</span>
                      </div>
                    )}

                    {c.service_areas?.length > 0 && (
                      <div className="flex items-start gap-1 text-stone-500 text-xs mb-3">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{c.service_areas.join('、')}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {c.pet_acceptance && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">🐾 接受寵物</span>
                      )}
                      {c.has_own_tools && (
                        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Wrench className="w-3 h-3" />自備工具
                        </span>
                      )}
                      {c.transportation && (
                        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Car className="w-3 h-3" />{c.transportation}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-stone-500 mb-4">找到喜歡的夥伴了嗎？</p>
            <Link to={createPageUrl("BookingForm")}>
              <button className="bg-stone-800 hover:bg-stone-900 text-white px-8 py-3 rounded-full font-medium transition-colors">
                立即預約服務
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}