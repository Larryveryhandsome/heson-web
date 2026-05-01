import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Loader2, X, CheckCircle, Check } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";

const CHECKLIST_ITEMS = [
  '地板清潔（拖地/吸塵）',
  '桌面/檯面擦拭',
  '廚房流理台清潔',
  '浴室馬桶清潔',
  '洗手台/浴缸清潔',
  '鏡子擦拭',
  '垃圾清理',
  '窗戶/門框擦拭',
  '床鋪整理',
  '微波爐/電器擦拭',
];

export default function CleanerReport() {
  const [user, setUser] = useState(null);
  const [cleanerProfile, setCleanerProfile] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [checklist, setChecklist] = useState({});
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
      
      const profiles = await base44.entities.CleanerProfile.filter({ user_id: userData.id });
      if (profiles?.[0]) {
        setCleanerProfile(profiles[0]);
      }
    };
    loadUser();
  }, []);

  const { data: bookings } = useQuery({
    queryKey: ['cleanerBookings', cleanerProfile?.id],
    queryFn: () => base44.entities.Booking.filter({
      cleaner_id: cleanerProfile.id,
      status: '已確認'
    }, '-scheduled_date'),
    enabled: !!cleanerProfile?.id,
    initialData: [],
  });

  const handleFileUpload = async (files, type) => {
    setUploading(true);
    const uploadedUrls = [];
    for (const file of files) {
      try {
        const result = await base44.integrations.Core.UploadFile({ file });
        if (result?.file_url) uploadedUrls.push(result.file_url);
      } catch (err) {
        toast.error(`照片上傳失敗：${err.message}`);
      }
    }
    if (type === 'before') {
      setBeforePhotos(prev => [...prev, ...uploadedUrls]);
    } else {
      setAfterPhotos(prev => [...prev, ...uploadedUrls]);
    }
    setUploading(false);
  };

  const removePhoto = (type, index) => {
    if (type === 'before') {
      setBeforePhotos(beforePhotos.filter((_, i) => i !== index));
    } else {
      setAfterPhotos(afterPhotos.filter((_, i) => i !== index));
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Create service report
      await base44.entities.ServiceReport.create({
        booking_id: selectedBookingId,
        cleaner_id: user?.id,
        before_photos: beforePhotos,
        after_photos: afterPhotos,
        cleaner_notes: notes,
        checklist_items: Object.entries(checklist).filter(([,v]) => v).map(([k]) => k),
        service_date: format(new Date(), 'yyyy-MM-dd'),
      });
      
      // Update booking status
      await base44.entities.Booking.update(selectedBookingId, {
        status: '已完成'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleanerBookings'] });
      toast.success("服務回報已提交！");
      setSelectedBookingId('');
      setBeforePhotos([]);
      setAfterPhotos([]);
      setNotes('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedBookingId) {
      toast.error("請選擇服務案件");
      return;
    }
    
    if (beforePhotos.length === 0 || afterPhotos.length === 0) {
      toast.error("請上傳清潔前後照片");
      return;
    }
    
    submitMutation.mutate();
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
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">服務回報</h1>
            <p className="text-stone-500 mt-1">上傳清潔前後照片完成服務回報</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">回報表單</CardTitle>
                <CardDescription>
                  請選擇已完成的服務並上傳照片
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Select Booking */}
                  <div className="space-y-2">
                    <Label>選擇服務案件 *</Label>
                    <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="請選擇案件" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookings?.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {booking.scheduled_date && format(new Date(booking.scheduled_date), 'M/d', { locale: zhTW })} - {booking.client_name} ({booking.time_slot})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Checklist */}
                  <div className="space-y-3">
                    <Label>服務項目確認</Label>
                    <div className="grid grid-cols-2 gap-2 bg-stone-50 rounded-xl p-4">
                      {CHECKLIST_ITEMS.map((item) => (
                        <label key={item} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                          <div
                            onClick={() => setChecklist({...checklist, [item]: !checklist[item]})}
                            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all cursor-pointer ${
                              checklist[item] ? 'bg-amber-500 border-amber-500' : 'border-stone-300 group-hover:border-amber-400'
                            }`}
                          >
                            {checklist[item] && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm transition-colors ${
                            checklist[item] ? 'text-stone-800 line-through opacity-60' : 'text-stone-700'
                          }`}>{item}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-stone-400">
                      {Object.values(checklist).filter(Boolean).length}/{CHECKLIST_ITEMS.length} 項已完成
                    </p>
                  </div>

                  {/* Before Photos */}
                  <div className="space-y-3">
                    <Label>清潔前照片 *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {beforePhotos.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`清潔前 ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto('before', index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                        <Camera className="w-8 h-8 text-stone-400 mb-2" />
                        <span className="text-xs text-stone-500">上傳照片</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileUpload(Array.from(e.target.files), 'before')}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* After Photos */}
                  <div className="space-y-3">
                    <Label>清潔後照片 *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {afterPhotos.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`清潔後 ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto('after', index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all">
                        <Camera className="w-8 h-8 text-stone-400 mb-2" />
                        <span className="text-xs text-stone-500">上傳照片</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileUpload(Array.from(e.target.files), 'after')}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">服務備註（選填）</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="記錄特殊狀況或建議..."
                      className="rounded-xl min-h-[100px]"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending || uploading}
                    className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl text-base"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        提交中...
                      </>
                    ) : uploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        上傳中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        提交回報
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}