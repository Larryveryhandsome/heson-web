import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, CheckCircle, ThumbsUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";

export default function CleanerJobs() {
  const [user, setUser] = useState(null);
  const [cleanerProfile, setCleanerProfile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Load cleaner profile
      const profiles = await base44.entities.CleanerProfile.filter({ user_id: userData.id });
      if (profiles?.[0]) {
        setCleanerProfile(profiles[0]);
      }
    };
    loadUser();
  }, []);

  // 指派給我的案件
  const { data: myBookings } = useQuery({
    queryKey: ['myAssignedBookings', user?.id],
    queryFn: () => cleanerProfile
      ? base44.entities.Booking.filter({ cleaner_id: cleanerProfile.id, status: '已確認' }, '-scheduled_date')
      : [],
    enabled: !!cleanerProfile,
    initialData: [],
  });

  const confirmJobMutation = useMutation({
    mutationFn: async (bookingId) => {
      // 確認上工 = 建立出勤記錄
      await base44.entities.Attendance.create({
        cleaner_id: cleanerProfile?.id || user?.id,
        cleaner_name: cleanerProfile?.nickname || user?.full_name,
        date: myBookings.find(b => b.id === bookingId)?.scheduled_date,
        status: '出勤',
        booking_id: bookingId,
        notes: '管理師已確認上工',
      });
      return bookingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssignedBookings'] });
      toast.success('已確認上工！謝謝您的確認。');
    },
  });

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
            <h1 className="text-2xl font-medium text-stone-800">我的派單任務</h1>
            <p className="text-stone-500 mt-1">管理員已指派給您的案件，請確認上工</p>
          </div>

          {/* Jobs List */}
          {!myBookings || myBookings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">目前沒有指派給您的案件</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myBookings.map((job, index) => {
                const confirmed = job.confirmed_by_cleaner;
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className={`hover:shadow-md transition-shadow ${confirmed ? 'border-green-200' : 'border-amber-200'}`}>
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className="bg-blue-100 text-blue-700">{job.service_type}</Badge>
                              {confirmed && <Badge className="bg-green-100 text-green-700">已確認上工</Badge>}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <Calendar className="w-4 h-4 text-stone-400" />
                                {job.scheduled_date && format(new Date(job.scheduled_date), 'PPP', { locale: zhTW })}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <Clock className="w-4 h-4 text-stone-400" />
                                {job.time_slot}
                              </div>
                              {job.address && (
                                <div className="flex items-center gap-2 text-sm text-stone-600 col-span-2">
                                  <MapPin className="w-4 h-4 text-stone-400" />
                                  {job.address}
                                </div>
                              )}
                              {job.client_name && (
                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                  <User className="w-4 h-4 text-stone-400" />
                                  客戶：{job.client_name}
                                </div>
                              )}
                            </div>
                            {job.notes && (
                              <p className="text-sm text-stone-500 mt-3 bg-stone-50 p-3 rounded-lg">備註：{job.notes}</p>
                            )}
                          </div>
                          
                          {confirmed ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                              <CheckCircle className="w-5 h-5" />
                              已確認
                            </div>
                          ) : (
                            <Button
                              onClick={() => confirmJobMutation.mutate(job.id)}
                              disabled={confirmJobMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                            >
                              {confirmJobMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <><ThumbsUp className="w-4 h-4 mr-2" />確認上工</>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}