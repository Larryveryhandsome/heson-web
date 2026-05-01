import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CleanerSchedule() {
  const [user, setUser] = useState(null);
  const [cleanerProfile, setCleanerProfile] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
      
      const profiles = await base44.entities.CleanerProfile.filter({ user_id: userData.id });
      if (profiles?.[0]) {
        setCleanerProfile(profiles[0]);
      }
    };
    loadUser();
  }, []);

  const { data: bookings } = useQuery({
    queryKey: ['cleanerBookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ cleaner_id: user?.id }, '-scheduled_date'),
    enabled: !!user?.id,
    initialData: [],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBookingsForDate = (date) => {
    return bookings?.filter(b => 
      b.scheduled_date && isSameDay(new Date(b.scheduled_date), date)
    ) || [];
  };

  const selectedDateBookings = getBookingsForDate(selectedDate);

  const getStatusColor = (status) => {
    switch (status) {
      case '待確認': return 'bg-yellow-100 text-yellow-700';
      case '已確認': return 'bg-blue-100 text-blue-700';
      case '已完成': return 'bg-green-100 text-green-700';
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
        <Sidebar userRole="cleaner" userName={cleanerProfile?.nickname || user?.full_name} />
      </div>
      <MobileNav userRole="cleaner" userName={cleanerProfile?.nickname || user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">我的行程</h1>
            <p className="text-stone-500 mt-1">查看您的服務排程</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(currentMonth, 'yyyy年 M月', { locale: zhTW })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-stone-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for offset */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    
                    {daysInMonth.map((day) => {
                      const dayBookings = getBookingsForDate(day);
                      const isSelected = isSameDay(day, selectedDate);
                      const hasBookings = dayBookings.length > 0;
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative ${
                            isSelected
                              ? 'bg-amber-500 text-white'
                              : isToday(day)
                              ? 'bg-stone-100 text-stone-800'
                              : 'hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          {format(day, 'd')}
                          {hasBookings && (
                            <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                              isSelected ? 'bg-white' : 'bg-amber-500'
                            }`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Selected Date Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    {format(selectedDate, 'M月d日 EEEE', { locale: zhTW })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateBookings.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>當日無排程</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-stone-50 rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-stone-600">
                              <Clock className="w-4 h-4 text-stone-400" />
                              {booking.time_slot}
                            </div>
                            {booking.address && (
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <MapPin className="w-4 h-4 text-stone-400" />
                                {booking.address}
                              </div>
                            )}
                            {booking.client_name && (
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <User className="w-4 h-4 text-stone-400" />
                                {booking.client_name}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}