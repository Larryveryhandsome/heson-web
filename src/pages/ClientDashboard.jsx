import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Plus, Sparkles, ArrowRight, ClipboardList, User } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

const statusConfig = {
  '待確認': { label: '待確認', bg: 'bg-amber-100 text-amber-700' },
  '已確認': { label: '已確認', bg: 'bg-blue-100 text-blue-700' },
  '已完成': { label: '已完成', bg: 'bg-emerald-100 text-emerald-700' },
  '已取消': { label: '已取消', bg: 'bg-stone-100 text-stone-500' },
};

export default function ClientDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: clientProfile } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['clientBookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ client_id: user?.id }, '-scheduled_date'),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = clientProfile?.[0];
  const upcomingBookings = bookings?.filter(b => b.status !== '已完成' && b.status !== '已取消').slice(0, 3) || [];
  const completedCount = bookings?.filter(b => b.status === '已完成').length || 0;
  const nextBooking = upcomingBookings[0];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f9ff]">
        <div className="animate-spin w-8 h-8 border-2 border-[#131b2e] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9ff] flex font-body">
      <div className="hidden lg:block">
        <Sidebar userRole="client" userName={user?.full_name} />
      </div>
      <MobileNav userRole="client" userName={user?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0 pb-8">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 font-headline mb-1">會員專區</p>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-stone-900">
              您好，{user?.full_name || '貴賓'}
            </h1>
            <p className="text-stone-500 mt-1">歡迎回到 HESON 赫頌家事管理</p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

            {/* Hero dark card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
              className="md:col-span-8 bg-[#131b2e] rounded-3xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">我的方案</span>
                </div>
                <h2 className="text-4xl font-headline font-bold text-white tracking-tight leading-tight mb-2">
                  {profile?.subscription_plan || '尚未訂閱方案'}
                </h2>
                {profile?.remaining_visits !== undefined && (
                  <p className="text-[#7c839b] text-sm mb-6">
                    剩餘服務：<span className="text-white font-semibold">{profile.remaining_visits} 次</span>
                  </p>
                )}
                {nextBooking && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 mb-6 border border-white/10">
                    <p className="text-[10px] text-[#7c839b] font-semibold uppercase tracking-widest mb-1">下次預約</p>
                    <p className="text-white font-headline font-bold text-lg">{nextBooking.service_type}</p>
                    <div className="flex items-center gap-4 mt-2 text-[#7c839b] text-sm">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{nextBooking.scheduled_date}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{nextBooking.time_slot}</span>
                    </div>
                  </div>
                )}
                <Link to={createPageUrl("ClientBooking")}>
                  <button className="flex items-center gap-2 bg-white text-[#131b2e] font-headline font-bold px-6 py-3 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform duration-200 shadow-xl text-sm">
                    <Plus className="w-4 h-4" />
                    立即預約服務
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Quick actions */}
            <div className="md:col-span-4 flex flex-col gap-5">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
                <Link to={createPageUrl("ClientHistory")}>
                  <div className="bg-white rounded-3xl p-6 border border-[#e8eef6] hover:shadow-md transition-shadow cursor-pointer group">
                    <ClipboardList className="w-8 h-8 text-stone-900 mb-4" />
                    <p className="font-headline font-bold text-stone-900 text-lg group-hover:text-amber-600 transition-colors">服務紀錄</p>
                    <p className="text-stone-500 text-sm mt-1">已完成 {completedCount} 次服務</p>
                  </div>
                </Link>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}>
                <Link to={createPageUrl("ClientProfile")}>
                  <div className="bg-[#eef4fc] rounded-3xl p-6 border border-[#e8eef6] hover:shadow-md transition-shadow cursor-pointer group">
                    <User className="w-8 h-8 text-stone-900 mb-4" />
                    <p className="font-headline font-bold text-stone-900 text-lg group-hover:text-amber-600 transition-colors">個人資料</p>
                    <p className="text-stone-500 text-sm mt-1">更新聯絡與居家資訊</p>
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Upcoming bookings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} className="md:col-span-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline font-bold text-xl text-stone-900 flex items-center gap-2">
                  即將到來的預約
                  {upcomingBookings.length > 0 && (
                    <span className="text-xs bg-stone-900 text-white px-2 py-0.5 rounded-full font-bold">{upcomingBookings.length}</span>
                  )}
                </h3>
                <Link to={createPageUrl("ClientHistory")} className="text-xs font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
                  查看全部 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-[#c6c6cd] p-12 text-center">
                  <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 mb-4">目前沒有預約的服務</p>
                  <Link to={createPageUrl("ClientBooking")}>
                    <button className="bg-stone-900 text-white font-headline font-bold px-6 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity">
                      立即預約
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingBookings.map((booking, index) => (
                    <motion.div key={booking.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.08 }}>
                      <div className="bg-white rounded-3xl p-6 border border-[#e8eef6] hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-5">
                          <div className="w-11 h-11 bg-[#eef4fc] rounded-2xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-stone-700" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${statusConfig[booking.status]?.bg || 'bg-stone-100 text-stone-600'}`}>
                            {booking.status}
                          </span>
                        </div>
                        <h4 className="font-headline font-bold text-stone-900 text-lg mb-1">{booking.service_type}</h4>
                        {booking.address && <p className="text-stone-500 text-sm mb-4 truncate">{booking.address}</p>}
                        <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{booking.scheduled_date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{booking.time_slot?.split(' ')[0]}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}