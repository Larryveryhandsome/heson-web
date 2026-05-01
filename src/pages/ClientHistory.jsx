import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Camera, User, Star } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

const statusStyles = {
  '待確認': 'bg-amber-100 text-amber-700',
  '已確認': 'bg-blue-100 text-blue-700',
  '已完成': 'bg-emerald-100 text-emerald-700',
  '已取消': 'bg-stone-100 text-stone-500',
};

export default function ClientHistory() {
  const [user, setUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [ratingDialog, setRatingDialog] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: bookings } = useQuery({
    queryKey: ['clientBookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ client_id: user?.id }, '-scheduled_date'),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: reports } = useQuery({
    queryKey: ['serviceReports', user?.id],
    queryFn: () => base44.entities.ServiceReport.filter({ client_id: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['serviceReviews', user?.id],
    queryFn: () => base44.entities.ServiceReview.filter({ client_id: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ bookingId, cleanerId, cleanerName }) => {
      await base44.entities.ServiceReview.create({
        booking_id: bookingId,
        client_id: user?.id,
        cleaner_id: cleanerId,
        cleaner_name: cleanerName,
        rating: ratingValue,
        comment: ratingComment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceReviews'] });
      toast.success('感謝您的評價！');
      setRatingDialog(null);
      setRatingValue(5);
      setRatingComment('');
    },
  });

  const getReport = (id) => reports?.find(r => r.booking_id === id);
  const getReview = (id) => reviews?.find(r => r.booking_id === id);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f9ff]">
        <div className="animate-spin w-8 h-8 border-2 border-[#131b2e] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9ff] flex font-body">
      <div className="hidden lg:block"><Sidebar userRole="client" userName={user?.full_name} /></div>
      <MobileNav userRole="client" userName={user?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 font-headline mb-1">歷史記錄</p>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-stone-900">服務紀錄</h1>
            <p className="text-stone-500 mt-1">查看歷史服務與清潔前後對比</p>
          </motion.div>

          {bookings?.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#c6c6cd] p-16 text-center">
              <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">目前沒有服務紀錄</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings?.map((booking, index) => {
                const report = getReport(booking.id);
                const review = getReview(booking.id);
                return (
                  <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                    <div className="bg-white rounded-3xl p-6 border border-[#e8eef6] hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-11 h-11 bg-[#eef4fc] rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-stone-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${statusStyles[booking.status] || 'bg-stone-100 text-stone-600'}`}>
                                {booking.status}
                              </span>
                              <span className="font-headline font-bold text-stone-900">{booking.service_type}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-medium">
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{booking.scheduled_date}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{booking.time_slot}</span>
                              {booking.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{booking.address}</span>}
                              {booking.cleaner_name && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{booking.cleaner_name}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {report && booking.status === '已完成' && (
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="flex items-center gap-2 px-4 py-2 bg-[#eef4fc] rounded-full text-sm font-semibold text-stone-700 hover:bg-[#e3e9f1] transition-colors"
                            >
                              <Camera className="w-4 h-4" />查看照片
                            </button>
                          )}
                          {booking.status === '已完成' && !review && (
                            <button
                              onClick={() => setRatingDialog({ bookingId: booking.id, cleanerId: booking.cleaner_id, cleanerName: booking.cleaner_name })}
                              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                              <Star className="w-4 h-4" />評價服務
                            </button>
                          )}
                          {booking.status === '已完成' && review && (
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Photo Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline font-bold">
              <Camera className="w-5 h-5" />清潔前後對比
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {['before', 'after'].map((type) => (
                  <div key={type}>
                    <h3 className="text-sm font-semibold text-stone-500 mb-3">{type === 'before' ? '清潔前' : '清潔後'}</h3>
                    <div className="space-y-3">
                      {selectedReport[`${type}_photos`]?.length > 0 ? (
                        selectedReport[`${type}_photos`].map((photo, idx) => (
                          <img key={idx} src={photo} alt={`${idx + 1}`} className="w-full rounded-2xl object-cover" />
                        ))
                      ) : (
                        <div className="bg-[#eef4fc] rounded-2xl h-48 flex items-center justify-center text-stone-400 text-sm">暫無照片</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedReport.checklist_items?.length > 0 && (
                <div className="bg-[#eef4fc] rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-stone-600 mb-2">服務項目（{selectedReport.checklist_items.length} 項）</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.checklist_items.map(item => (
                      <span key={item} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✓ {item}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedReport.cleaner_notes && (
                <div className="bg-[#eef4fc] rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-stone-600 mb-2">管理師留言</h3>
                  <p className="text-stone-700">{selectedReport.cleaner_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={!!ratingDialog} onOpenChange={() => setRatingDialog(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />服務評價
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {ratingDialog?.cleanerName && <p className="text-sm text-stone-500">管理師：{ratingDialog.cleanerName}</p>}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-stone-700">整體評分</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRatingValue(s)}>
                    <Star className={`w-8 h-8 transition-colors ${s <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-stone-200 hover:text-amber-300'}`} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-400">{['', '很差', '差', '普通', '好', '非常好！'][ratingValue]}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-stone-700">留言（選填）</p>
              <textarea
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder="分享您的服務體驗..."
                className="w-full bg-[#eef4fc] border-0 rounded-2xl p-4 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <button
              className="w-full bg-stone-900 text-white font-headline font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate(ratingDialog)}
            >
              {reviewMutation.isPending ? '提交中...' : '送出評價'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}