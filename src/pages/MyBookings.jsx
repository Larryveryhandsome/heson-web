import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, User, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig = {
  '待確認': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  '已確認': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
  '已完成': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
  '已取消': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
};

export default function MyBookings() {
  const [user, setUser] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    checkAuth();
  }, []);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['myBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Booking.filter({ client_id: user.id });
    },
    enabled: !!user,
  });

  const handleCancelBooking = async (bookingId) => {
    setCancelingId(bookingId);
    try {
      await base44.entities.Booking.update(bookingId, { status: '已取消' });
      toast.success('預約已取消');
      refetch();
    } catch (error) {
      toast.error('取消失敗：' + error.message);
    } finally {
      setCancelingId(null);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      await base44.entities.Booking.delete(bookingId);
      toast.success('預約已刪除');
      refetch();
    } catch (error) {
      toast.error('刪除失敗：' + error.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.scheduled_date) - new Date(a.scheduled_date)
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <MobileNav userRole={user?.role} userName={user?.full_name} />
      
      <div className="flex min-h-[calc(100vh-80px)] pt-16 lg:pt-0">
        <div className="hidden lg:block">
          <Sidebar userRole={user?.role} userName={user?.full_name} />
        </div>
        
        <main className="flex-1">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-light text-stone-800 mb-2 break-words">我的預約</h1>
              <p className="text-sm md:text-base text-stone-500">查詢與管理您的服務預約</p>
            </div>

            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
              </div>
            )}

            {!isLoading && bookings.length === 0 && (
              <Card className="border-stone-200">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-600 mb-4">您還沒有任何預約</p>
                  <a href="/BookingForm">
                    <Button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full">
                      立即預約
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}

            {!isLoading && bookings.length > 0 && (
              <div className="space-y-4">
                {sortedBookings.map((booking) => {
                  const config = statusConfig[booking.status] || statusConfig['待確認'];
                  return (
                    <Card key={booking.id} className={`border-2 ${config.border} ${config.bg}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <h3 className="text-lg font-medium text-stone-800">
                                 {booking.service_type}
                               </h3>
                               <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.badge} ${config.text}`}>
                                 {booking.status}
                               </span>
                             </div>
                           </div>
                           <div className="flex gap-2">
                             {booking.status === '待確認' && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleCancelBooking(booking.id)}
                                 disabled={cancelingId === booking.id}
                                 className="rounded-lg"
                               >
                                 {cancelingId === booking.id ? '取消中...' : '取消'}
                               </Button>
                             )}
                             <Button
                               variant="destructive"
                               size="sm"
                               onClick={() => setDeleteConfirmId(booking.id)}
                               className="rounded-lg"
                             >
                               <Trash2 className="w-4 h-4 mr-1" />
                               刪除
                             </Button>
                           </div>
                         </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-stone-500">服務日期</p>
                              <p className="font-medium text-stone-800">
                                {format(new Date(booking.scheduled_date), 'PPP', { locale: zhTW })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-stone-500">時段</p>
                              <p className="font-medium text-stone-800">{booking.time_slot}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 md:col-span-2">
                            <MapPin className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-stone-500">服務地址</p>
                              <p className="font-medium text-stone-800">{booking.address}</p>
                            </div>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="flex items-start gap-3 pt-4 border-t border-stone-200">
                            <AlertCircle className="w-5 h-5 text-stone-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-stone-500">備註</p>
                              <p className="text-sm text-stone-700">{booking.notes}</p>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                          <span>預約編號：{booking.id.slice(0, 8)}</span>
                          <span>建立時間：{format(new Date(booking.created_date), 'yyyy-MM-dd', { locale: zhTW })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除預約？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法撤銷，預約將永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteBooking(deleteConfirmId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}