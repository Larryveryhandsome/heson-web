import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, Check, Loader2, MapPin, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const REGION_PATTERNS = [
  '台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '南投',
  '雲林', '嘉義', '台南', '高雄', '屏東', '宜蘭', '花蓮', '台東', '基隆', '澎湖', '金門'
];

function inferRegion(address) {
  if (!address) return '';
  for (const region of REGION_PATTERNS) {
    if (address.includes(region)) return region;
  }
  return '';
}
const timeSlots = [
  { value: "上午 08:00-12:00", label: "上午", sub: "08:00 – 12:00" },
  { value: "下午 13:00-17:00", label: "下午", sub: "13:00 – 17:00" },
  { value: "晚間 18:00-21:00", label: "晚間", sub: "18:00 – 21:00" },
];

export default function ClientBooking() {
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [date, setDate] = useState(null);
  const [formData, setFormData] = useState({ time_slot: '', notes: '' });
  const [referralSource, setReferralSource] = useState('');
  const [referrer, setReferrer] = useState('');
  const [preferredWeekdays, setPreferredWeekdays] = useState([]);
  const [cleaningTools, setCleaningTools] = useState('我方自帶');
  const [enhanceAreas, setEnhanceAreas] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);

  const REFERRAL_OPTIONS = ['Facebook', 'Instagram', 'Threads', '朋友推薦', 'LINE', 'Google 搜尋', '其他'];
  const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

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

  const profile = clientProfile?.[0];
  const isRecurring = profile?.subscription_plan && (
    profile.subscription_plan.includes('月') || profile.subscription_plan.includes('定期')
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !formData.time_slot) { toast.error("請選擇日期與時段"); return; }
    setIsSubmitting(true);

    // 上傳照片
    let photoUrls = [];
    if (photoFiles.length > 0) {
      for (let i = 0; i < photoFiles.length; i++) {
        setUploadStatus(`上傳照片中 ${i + 1}/${photoFiles.length}`);
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFiles[i] });
          photoUrls.push(file_url);
        } catch (uploadErr) {
          console.warn('照片上傳失敗:', uploadErr);
        }
      }
      setUploadStatus('');
    }

    try {
      const bookingData = {
        client_id: user?.id,
        client_name: user?.full_name,
        service_type: profile?.subscription_plan || '單次清潔',
        status: '待確認',
        scheduled_date: format(date, 'yyyy-MM-dd'),
        time_slot: formData.time_slot,
        address: profile?.address || '',
        notes: formData.notes,
      };

      const booking = await base44.entities.Booking.create(bookingData);
      // LINE 群組通知已由伺服器端自動發送

      setIsSuccess(true);
      toast.success("預約成功！");
    } catch (err) {
      toast.error('預約建立失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f9ff]">
        <div className="animate-spin w-8 h-8 border-2 border-[#131b2e] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f6f9ff] flex font-body">
        <div className="hidden lg:block"><Sidebar userRole="client" userName={user?.full_name} /></div>
        <MobileNav userRole="client" userName={user?.full_name} />
        <main className="flex-1 pt-16 lg:pt-0 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8">
            <div className="w-20 h-20 bg-[#131b2e] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-headline font-bold text-stone-900 mb-3">預約成功！</h1>
            <p className="text-stone-500 mb-8">我們將盡快安排家事管理師為您服務</p>
            <button onClick={() => setIsSuccess(false)} className="bg-stone-900 text-white font-headline font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity">
              再次預約
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9ff] flex font-body">
      <div className="hidden lg:block"><Sidebar userRole="client" userName={user?.full_name} /></div>
      <MobileNav userRole="client" userName={user?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 font-headline mb-1">預約服務</p>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-stone-900">新增預約</h1>
            <p className="text-stone-500 mt-1">選擇您希望的服務時間</p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left: Date + Time + Notes */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-7 space-y-5">

              {/* Service Info */}
              {profile?.subscription_plan && (
                <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                  <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2">當前方案</p>
                  <p className="font-headline font-bold text-stone-900 text-xl">{profile.subscription_plan}</p>
                  {profile.address && (
                    <p className="flex items-center gap-1.5 text-stone-500 text-sm mt-2">
                      <MapPin className="w-4 h-4" />{profile.address}
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-4">選擇日期</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center gap-3 bg-[#eef4fc] rounded-2xl px-5 py-4 text-left hover:bg-[#e3e9f1] transition-colors">
                      <CalendarIcon className="w-5 h-5 text-stone-500" />
                      <span className={`font-medium ${date ? 'text-stone-900' : 'text-stone-400'}`}>
                        {date ? format(date, "PPP", { locale: zhTW }) : "請選擇日期"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slots */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-4">選擇時段</p>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, time_slot: slot.value })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        formData.time_slot === slot.value
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-[#e8eef6] bg-[#eef4fc] text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <p className="font-headline font-bold text-sm">{slot.label}</p>
                      <p className={`text-xs mt-0.5 ${formData.time_slot === slot.value ? 'text-stone-300' : 'text-stone-400'}`}>{slot.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 現場掃具 */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">現場清潔工具</p>
                <div className="flex gap-2">
                  {['客戶自備', '我方自帶', '混合'].map(v => (
                    <button key={v} type="button" onClick={() => setCleaningTools(v)}
                      className={`flex-1 py-2.5 rounded-2xl border-2 text-sm font-medium transition-all ${cleaningTools === v ? 'border-stone-900 bg-stone-900 text-white' : 'border-[#e8eef6] bg-[#eef4fc] text-stone-600 hover:border-stone-300'}`}
                    >{v}</button>
                  ))}
                </div>
              </div>

              {/* 加強清潔 */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">加強清潔區域（可複選，選填）</p>
                <div className="flex flex-wrap gap-2">
                  {['廚房', '浴室', '窗戶', '陽台', '地板', '衣櫃內部', '油煙機', '冰箱', '其他'].map(area => (
                    <button key={area} type="button"
                      onClick={() => setEnhanceAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])}
                      className={`px-3 py-1.5 rounded-xl border-2 text-sm transition-all ${enhanceAreas.includes(area) ? 'border-stone-900 bg-stone-900 text-white' : 'border-[#e8eef6] bg-[#eef4fc] text-stone-600 hover:border-stone-300'}`}
                    >{area}</button>
                  ))}
                </div>
              </div>

              {/* 偏好星期（定期方案才顯示） */}
              {isRecurring && (
                <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                  <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">偏好的服務星期（可複選）</p>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map(day => (
                      <button key={day} type="button"
                        onClick={() => setPreferredWeekdays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                        className={`px-3 py-1.5 rounded-xl border-2 text-sm transition-all ${preferredWeekdays.includes(day) ? 'border-stone-900 bg-stone-900 text-white' : 'border-[#e8eef6] bg-[#eef4fc] text-stone-600 hover:border-stone-300'}`}
                      >{day}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* 得知來源 */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">得知來源（選填）</p>
                <div className="flex flex-wrap gap-2">
                  {REFERRAL_OPTIONS.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => { setReferralSource(opt); if (opt !== '朋友推薦') setReferrer(''); }}
                      className={`px-3 py-1.5 rounded-xl border-2 text-sm transition-all ${referralSource === opt ? 'border-stone-900 bg-stone-900 text-white' : 'border-[#e8eef6] bg-[#eef4fc] text-stone-600 hover:border-stone-300'}`}
                    >{opt}</button>
                  ))}
                </div>
                {referralSource === '朋友推薦' && (
                  <input
                    className="mt-3 w-full rounded-2xl border border-[#e8eef6] bg-[#eef4fc] px-4 py-2.5 text-sm focus:outline-none focus:bg-white"
                    placeholder="推薦人姓名（選填）"
                    value={referrer}
                    onChange={e => setReferrer(e.target.value)}
                  />
                )}
              </div>

              {/* 現場照片上傳 */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">現場照片（選填，有助於精準估價）</p>
                <label htmlFor="client-photo-upload" className="flex flex-col items-center gap-2 border-2 border-dashed border-[#e8eef6] rounded-2xl p-4 cursor-pointer hover:border-stone-400 transition-colors bg-[#eef4fc]">
                  <Upload className="w-5 h-5 text-stone-400" />
                  <span className="text-sm text-stone-500">點擊上傳照片（最多 5 張）</span>
                </label>
                <input id="client-photo-upload" type="file" accept="image/*" multiple className="hidden"
                  onChange={e => setPhotoFiles(Array.from(e.target.files || []).slice(0, 5))} />
                {photoFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photoFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-1 bg-stone-100 rounded-lg px-2 py-1 text-xs text-stone-600">
                        <span>{file.name.length > 15 ? file.name.slice(0, 15) + '…' : file.name}</span>
                        <button type="button" onClick={() => setPhotoFiles(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3 text-stone-400 hover:text-stone-700" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-3xl p-6 border border-[#e8eef6]">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">備註（選填）</p>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="有任何特殊需求請在此說明..."
                  className="rounded-2xl border-[#e8eef6] bg-[#eef4fc] min-h-[100px] resize-none focus:bg-white"
                />
              </div>
            </motion.div>

            {/* Right: Confirm Panel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-5 sticky top-8">
              <div className="bg-[#131b2e] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
                <h3 className="text-white font-headline font-bold text-2xl mb-6">確認預約</h3>
                <div className="space-y-4 mb-8">
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-[#7c839b] font-bold uppercase tracking-widest mb-1">服務類型</p>
                    <p className="text-white font-medium">{profile?.subscription_plan || '單次清潔'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-[#7c839b] font-bold uppercase tracking-widest mb-1">日期</p>
                      <p className="text-white font-medium text-sm">{date ? format(date, 'M月d日') : '未選擇'}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-[#7c839b] font-bold uppercase tracking-widest mb-1">時段</p>
                      <p className="text-white font-medium text-sm">{formData.time_slot ? formData.time_slot.split(' ')[0] : '未選擇'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !date || !formData.time_slot}
                  className="w-full bg-white text-[#131b2e] font-headline font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />{uploadStatus || '處理中...'}</> : '確認預約'}
                </button>
                <p className="text-center text-[11px] text-[#7c839b] mt-4">確認後將於 24 小時內與您聯繫</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}