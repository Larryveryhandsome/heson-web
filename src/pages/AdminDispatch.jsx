import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, User, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function AdminDispatch() {
  const [user, setUser] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedCleaner, setSelectedCleaner] = useState('');
  const queryClient = useQueryClient();

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
    queryKey: ['pendingBookings'],
    queryFn: async () => {
      const all = await base44.entities.Booking.list('-created_date');
      return all.filter(b => b.status === '待確認' || (b.status === '已確認' && !b.cleaner_id));
    },
    initialData: [],
  });

  const { data: cleaners } = useQuery({
    queryKey: ['activeCleaners'],
    queryFn: async () => {
      const all = await base44.entities.CleanerProfile.list();
      return all.filter(c => c.is_active);
    },
    initialData: [],
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ bookingId, cleanerId }) =>
      base44.functions.invoke('dispatchCleaner', { bookingId, cleanerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingBookings'] });
      toast.success('派單成功！通知 Email 已發送給管理師');
      setSelectedBooking(null);
      setSelectedCleaner('');
    },
    onError: (err) => {
      toast.error('派單失敗：' + (err?.message || '請稍後再試'));
    },
  });

  const handleDispatch = () => {
    if (!selectedCleaner) {
      toast.error("請選擇管理師");
      return;
    }
    dispatchMutation.mutate({
      bookingId: selectedBooking.id,
      cleanerId: selectedCleaner
    });
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
            <h1 className="text-2xl font-medium text-stone-800">派單管理</h1>
            <p className="text-stone-500 mt-1">為待確認的預約指派家事管理師</p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">待派單預約</p>
                    <p className="text-3xl font-semibold text-yellow-600 mt-1">{bookings?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">可用管理師</p>
                    <p className="text-3xl font-semibold text-green-600 mt-1">{cleaners?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

           {/* Pending Bookings */}
          {bookings?.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-stone-600 font-medium">太棒了！</p>
                <p className="text-stone-500">目前沒有待派單的預約</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings?.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-yellow-100 text-yellow-700">
                          {booking.status}
                        </Badge>
                        <span className="text-xs text-stone-400">{booking.service_type}</span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <User className="w-4 h-4 text-stone-400" />
                          <span className="font-medium">{booking.client_name || '未知客戶'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Calendar className="w-4 h-4 text-stone-400" />
                          {booking.scheduled_date && format(new Date(booking.scheduled_date), 'M/d (EEE)', { locale: zhTW })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Clock className="w-4 h-4 text-stone-400" />
                          {booking.time_slot}
                        </div>
                        {booking.address && (
                          <div className="flex items-start gap-2 text-sm text-stone-600">
                            <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{booking.address}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => setSelectedBooking(booking)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                      >
                        指派管理師
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dispatch Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>指派家事管理師</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="font-medium text-stone-800">{selectedBooking.client_name}</p>
                <p className="text-sm text-stone-500 mt-1">
                  {selectedBooking.scheduled_date && format(new Date(selectedBooking.scheduled_date), 'M月d日 (EEE)', { locale: zhTW })} · {selectedBooking.time_slot}
                </p>
                <p className="text-sm text-stone-500 mt-1">{selectedBooking.address}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">選擇管理師</label>
                <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="請選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    {cleaners?.map((cleaner) => (
                      <SelectItem key={cleaner.id} value={cleaner.id}>
                        <div className="flex items-center gap-2">
                          <span>{cleaner.nickname}</span>
                          <span className="text-xs text-stone-400">
                            ({cleaner.service_areas?.join(', ')})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>
              取消
            </Button>
            <Button 
              onClick={handleDispatch}
              disabled={dispatchMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {dispatchMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中...
                </>
              ) : (
                "確認派單"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}