import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, ClipboardList, TrendingUp, Clock, CheckCircle, Table } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: bookings } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
    initialData: [],
  });

  const { data: cleaners } = useQuery({
    queryKey: ['allCleaners'],
    queryFn: () => base44.entities.CleanerProfile.list(),
    initialData: [],
  });

  const { data: clients } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.ClientProfile.list(),
    initialData: [],
  });

  const pendingBookings = bookings?.filter(b => b.status === '待確認') || [];
  const confirmedBookings = bookings?.filter(b => b.status === '已確認') || [];
  const completedBookings = bookings?.filter(b => b.status === '已完成') || [];
  const activeCleaners = cleaners?.filter(c => c.is_active) || [];

  const stats = [
    { title: "待處理預約", value: pendingBookings.length, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { title: "進行中預約", value: confirmedBookings.length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "已完成服務", value: completedBookings.length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { title: "活躍管理師", value: activeCleaners.length, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case '待確認': return 'bg-yellow-100 text-yellow-700';
      case '已確認': return 'bg-blue-100 text-blue-700';
      case '已完成': return 'bg-green-100 text-green-700';
      case '已取消': return 'bg-stone-100 text-stone-500';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block">
        <Sidebar userRole="admin" userName={user?.full_name} />
      </div>
      <MobileNav userRole="admin" userName={user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">管理後台</h1>
            <p className="text-stone-500 mt-1">總覽系統狀態與近期活動</p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">{stat.title}</p>
                        <p className="text-3xl font-semibold text-stone-800 mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Bookings */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">最新預約</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings?.slice(0, 5).length === 0 ? (
                    <p className="text-stone-400 text-center py-8">暫無預約</p>
                  ) : (
                    <div className="space-y-4">
                      {bookings?.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                          <div>
                            <p className="font-medium text-stone-800">{booking.client_name || '未知客戶'}</p>
                            <p className="text-sm text-stone-500">
                              {booking.scheduled_date && format(new Date(booking.scheduled_date), 'M/d', { locale: zhTW })} · {booking.time_slot}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column */}
            <motion.div
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {/* Pending Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">待處理事項</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link to={createPageUrl("AdminDispatch")}>
                      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <span className="text-stone-700">待派單預約</span>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700">
                          {pendingBookings.length}
                        </Badge>
                      </div>
                    </Link>
                    <Link to={createPageUrl("AdminCleaners")}>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span className="text-stone-700">待審核管理師</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">
                          {cleaners?.filter(c => !c.is_active).length || 0}
                        </Badge>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Internal Tools */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">內部工具</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to="/InternalSpreadsheet">
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Table className="w-5 h-5 text-amber-600" />
                        <span className="text-stone-700">內部試算表 + AI 助理</span>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">前往</Badge>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}