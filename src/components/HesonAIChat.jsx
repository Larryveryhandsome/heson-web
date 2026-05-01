import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CalendarExportButton from '@/components/CalendarExportButton';
import { GAS_BOOKING_WEBHOOK as GAS_WEBHOOK } from '@/lib/webhooks';

const WELCOME = '您好！我是小赫 🏠 HESON 的 AI 客服助理，我可以回答問題，也可以幫您直接完成預約！';

const QUICK_QUESTIONS = [
  '我要預約服務',
  '服務費用怎麼算？',
  '服務人員有經過審核嗎？',
  '服務區域有哪些？',
];

const SERVICE_TYPES = ['單次清潔', '基礎月護-4次', '進階月安-8次', '尊榮月恆-12次'];
const TIME_SLOTS = ['上午 08:00-12:00', '下午 13:00-17:00', '晚間 18:00-21:00'];

const TAIWAN_CITIES = [
  '台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣',
  '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市',
  '嘉義縣', '台南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
];

const BOOKING_STEPS = ['service', 'city', 'road', 'housing_type', 'square_footage', 'date', 'time', 'weekdays', 'name', 'phone', 'pets', 'cleaning_tools', 'enhance_areas', 'referral', 'notes', 'confirm'];

const REFERRAL_OPTIONS = ['Facebook', 'Instagram', 'Threads', '朋友推薦', 'LINE', 'Google 搜尋', '其他'];
const HOUSING_TYPES = ['透天', '公寓', '華廈、大樓', '農舍'];
const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
const CLEANING_TOOLS_OPTIONS = ['客戶自備', '我方自帶', '混合'];
const ENHANCE_AREAS = ['廚房', '浴室', '窗戶', '陽台', '地板', '衣櫃內部', '油煙機', '冰箱', '其他'];
const RECURRING_PLANS = ['基礎月護-4次', '進階月安-8次', '尊榮月恆-12次'];

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

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function WeekdaysSelector({ onConfirm }) {
  const [selected, setSelected] = React.useState([]);
  const toggle = (day) => setSelected(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  return (
    <div className="px-3 py-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map(day => (
          <button key={day} onClick={() => toggle(day)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border-2 font-medium transition-all ${selected.includes(day) ? 'border-amber-500 bg-amber-100 text-amber-800' : 'border-stone-300 bg-stone-50 text-stone-700 hover:border-amber-300'}`}>
            {day}
          </button>
        ))}
      </div>
      <button onClick={() => onConfirm(selected.length ? selected : ['不限'])}
        className="w-full text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all">
        確認選擇
      </button>
    </div>
  );
}

function EnhanceAreasSelector({ onConfirm }) {
  const [selected, setSelected] = React.useState([]);
  const toggle = (area) => setSelected(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  return (
    <div className="px-3 py-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ENHANCE_AREAS.map(area => (
          <button key={area} onClick={() => toggle(area)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border-2 font-medium transition-all ${selected.includes(area) ? 'border-amber-500 bg-amber-100 text-amber-800' : 'border-stone-300 bg-stone-50 text-stone-700 hover:border-amber-300'}`}>
            {area}
          </button>
        ))}
      </div>
      <button onClick={() => onConfirm(selected)}
        className="w-full text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all">
        確認選擇
      </button>
    </div>
  );
}

export default function HesonAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [quickShown, setQuickShown] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingStep, setBookingStep] = useState(null);
  const [bookingData, setBookingData] = useState({});
  const bottomRef = useRef(null);
  const dateInputRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, bookingStep]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  const handleQuickClick = (text) => {
    if (text === '我要預約服務') {
      addMessage('user', '我要預約服務');
      addMessage('assistant', '好的！請選擇您需要的服務類型：');
      setBookingStep('service');
      setBookingData({});
    } else {
      sendChat(text);
    }
  };

  const handleBookingStep = (value, label) => {
    const step = bookingStep;
    const newData = { ...bookingData };

    if (step === 'service') {
      newData.service_type = value;
      addMessage('user', value);
      addMessage('assistant', '請選擇服務縣市：');
      setBookingData(newData);
      setBookingStep('city');
    } else if (step === 'city') {
      newData.city = value;
      addMessage('user', value);
      addMessage('assistant', `已選擇 ${value}，請輸入詳細路名與門牌號碼（例：中山北路二段100號）：`);
      setBookingData(newData);
      setBookingStep('road');
    } else if (step === 'housing_type') {
      newData.housing_type = value;
      addMessage('user', value);
      addMessage('assistant', '請問空間大約幾坪？（請輸入數字）');
      setBookingData(newData);
      setBookingStep('square_footage');
    } else if (step === 'date') {
      const [yyyy, mm, dd] = value.split('-');
      const weekday = ['日','一','二','三','四','五','六'][new Date(value).getDay()];
      newData.scheduled_date = value;
      addMessage('user', `${mm}/${dd}（週${weekday}）`);
      addMessage('assistant', '請選擇希望的服務時段：');
      setBookingData(newData);
      setBookingStep('time');
    } else if (step === 'time') {
      newData.time_slot = normalizeTimeSlot(value);
      addMessage('user', value);
      if (RECURRING_PLANS.includes(newData.service_type)) {
        addMessage('assistant', '定期方案請選擇偏好的服務星期（可多選，選好後按確認）：');
        setBookingData(newData);
        setBookingStep('weekdays');
      } else {
        addMessage('assistant', '請問您的姓名是？');
        setBookingData(newData);
        setBookingStep('name');
      }
    } else if (step === 'weekdays') {
      // value is an array joined string from UI confirm action
      newData.weekdays = value;
      addMessage('user', Array.isArray(value) ? value.join(', ') : value);
      addMessage('assistant', '請問您的姓名是？');
      setBookingData(newData);
      setBookingStep('name');
    } else if (step === 'pets') {
      newData.has_pets = value === 'yes';
      addMessage('user', value === 'yes' ? '有寵物' : '沒有寵物');
      addMessage('assistant', '請問現場清潔工具由哪方提供？');
      setBookingData(newData);
      setBookingStep('cleaning_tools');
    } else if (step === 'cleaning_tools') {
      newData.cleaning_tools = value;
      addMessage('user', value);
      addMessage('assistant', '請選擇您最重視的加強清潔區域（可多選，選好後按確認）：');
      setBookingData(newData);
      setBookingStep('enhance_areas');
    } else if (step === 'enhance_areas') {
      newData.enhance_areas = value;
      addMessage('user', Array.isArray(value) ? value.join(', ') : '（已選擇）');
      addMessage('assistant', '您是從哪裡知道赫頌家事管理的？');
      setBookingData(newData);
      setBookingStep('referral');
    } else if (step === 'referral') {
      newData.referral_source = value;
      addMessage('user', value);
      if (value === '朋友推薦') {
        addMessage('assistant', '請留下推薦人姓名（選填，可直接跳過）：');
        setBookingData(newData);
        setBookingStep('referrer');
      } else {
        addMessage('assistant', '有任何特別需求嗎？（直接輸入或按跳過）');
        setBookingData(newData);
        setBookingStep('notes');
      }
    } else if (step === 'referrer') {
      newData.referrer = value;
      addMessage('user', value || '（略過）');
      addMessage('assistant', '有任何特別需求嗎？（直接輸入或按跳過）');
      setBookingData(newData);
      setBookingStep('notes');
    } else if (step === 'notes') {
      newData.notes = value;
      addMessage('user', value || '（無）');
      const weekdayStr = Array.isArray(newData.weekdays) ? newData.weekdays.join(', ') : (newData.weekdays || '');
      const enhanceStr = Array.isArray(newData.enhance_areas) ? newData.enhance_areas.join(', ') : '';
      addMessage('assistant',
        `✅ 請確認您的預約資訊：\n\n` +
        `📋 服務類型：${newData.service_type}\n` +
        `📅 日期：${newData.scheduled_date}\n` +
        `⏰ 時段：${newData.time_slot}\n` +
        `🏠 地址：${newData.address}\n` +
        (newData.housing_type ? `🏘️ 空間型態：${newData.housing_type}\n` : '') +
        (newData.square_footage ? `📐 坪數：${newData.square_footage}\n` : '') +
        `👤 姓名：${newData.client_name}\n` +
        `📞 電話：${newData.phone}\n` +
        `🐾 寵物：${newData.has_pets ? '有' : '沒有'}\n` +
        `🧹 現場掃具：${newData.cleaning_tools || '我方自帶'}\n` +
        (enhanceStr ? `✨ 加強清潔：${enhanceStr}\n` : '') +
        (weekdayStr ? `📆 偏好星期：${weekdayStr}\n` : '') +
        `📣 得知來源：${newData.referral_source}` +
        (newData.referrer ? `\n👥 推薦人：${newData.referrer}` : '') +
        (newData.notes ? `\n📝 特殊需求：${newData.notes}` : '')
      );
      setBookingData(newData);
      setBookingStep('confirm');
    }
  };

  const normalizeTimeSlot = (input) => {
    const lower = input.toLowerCase();
    if (lower.includes('早') || lower.includes('上午') || lower.includes('08')) return '上午 08:00-12:00';
    if (lower.includes('下午') || lower.includes('13')) return '下午 13:00-17:00';
    if (lower.includes('晚') || lower.includes('18')) return '晚間 18:00-21:00';
    return input;
  };

  const handleTextInput = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    if (bookingStep === 'road') {
      const city = bookingData.city || '';
      const fullAddress = text.startsWith(city) ? text : `${city}${text}`;
      const newData = { ...bookingData, address: fullAddress };
      addMessage('user', text);
      addMessage('assistant', '請選擇空間型態：');
      setBookingData(newData);
      setBookingStep('housing_type');
    } else if (bookingStep === 'square_footage') {
      const sqft = parseFloat(text);
      if (isNaN(sqft) || sqft <= 0 || sqft >= 300) {
        addMessage('assistant', '請輸入有效坪數（1～299 之間的數字）');
        return;
      }
      const newData = { ...bookingData, square_footage: text };
      addMessage('user', `${text} 坪`);
      addMessage('assistant', '請選擇希望的服務日期：');
      setBookingData(newData);
      setBookingStep('date');
    } else if (bookingStep === 'name') {
      const newData = { ...bookingData, client_name: text };
      addMessage('user', text);
      addMessage('assistant', '請輸入您的聯絡電話：');
      setBookingData(newData);
      setBookingStep('phone');
    } else if (bookingStep === 'phone') {
      const normalizedPhone = text.replace(/[\s-]/g, '');
      if (!/^09\d{8}$/.test(normalizedPhone)) {
        addMessage('assistant', '請輸入 10 碼手機號碼（09 開頭），例如：0912345678');
        return;
      }
      const newData = { ...bookingData, phone: normalizedPhone };
      addMessage('user', text);
      addMessage('assistant', '家中是否有寵物？');
      setBookingData(newData);
      setBookingStep('pets');
    } else if (bookingStep === 'referrer') {
      handleBookingStep(text || '（略過）');
    } else if (bookingStep === 'notes') {
      handleBookingStep(text);
    } else {
      sendChat(text);
    }
  };

  const getAmount = (serviceType) => {
    if (serviceType === '基礎月護-4次') return 8400;
    if (serviceType === '進階月安-8次') return 16000;
    if (serviceType === '尊榮月恆-12次') return 24600;
    return 2000;
  };

  const confirmBooking = async () => {
    addMessage('user', '確認送出預約');
    setBookingStep(null);
    setLoading(true);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        addMessage('assistant', '❗ 建立預約需要先登入帳號。請點下方按鈕登入後再完成預約。');
        setLoading(false);
        setBookingStep('login_required');
        return;
      }
      const user = await base44.auth.me();
       const booking = await base44.entities.Booking.create({
         client_id: user.id,
         client_name: bookingData.client_name,
         service_type: bookingData.service_type,
         status: '待確認',
         scheduled_date: bookingData.scheduled_date,
         time_slot: bookingData.time_slot,
         address: bookingData.address,
         phone: bookingData.phone,
         notes: '由小赫 AI 協助預約',
       });

       // 送出到 Apps Script webhook（寫入 Google Sheet + LINE 通知）
       try {
         const weekdayStr = Array.isArray(bookingData.weekdays) ? bookingData.weekdays.join(', ') : (bookingData.weekdays || '');
         const enhanceStr = Array.isArray(bookingData.enhance_areas) ? bookingData.enhance_areas.join(', ') : '';
         await fetch(GAS_WEBHOOK, {
           method: 'POST',
           headers: { 'Content-Type': 'text/plain' },
           body: JSON.stringify({
             "_secret": "heson-secret-2026",
             "內部編號": booking.id,
             "姓名": bookingData.client_name || '',
             "聯絡電話": bookingData.phone || '',
             "電子郵件": user.email || '',
             "需要服務地址": bookingData.address || '',
             "服務地區": inferRegion(bookingData.address),
             "空間型態": bookingData.housing_type || '',
             "需求清潔坪數": bookingData.square_footage || '',
             "是否有寵物": bookingData.has_pets ? '有' : '沒有',
             "想要的時長": bookingData.service_type || '',
             "您想申請的服務類型": bookingData.service_type || '',
             "特殊需求": bookingData.notes || '',
             "預計開始日期": bookingData.scheduled_date || '',
             "偏好時段": bookingData.time_slot || '',
             "偏好的星期": weekdayStr,
             "現場掃具": bookingData.cleaning_tools || '我方自帶',
             "加強清潔": enhanceStr,
             "親友推薦人": bookingData.referrer || '',
             "同意條款": "是",
             "得知來源": bookingData.referral_source || ''
           })
         });
       } catch (syncErr) {
         console.warn('Webhook 呼叫失敗，不影響預約:', syncErr);
       }

       addMessage('assistant', '🎉 預約已建立！正在跳轉至付款頁面...');
       const amount = getAmount(bookingData.service_type);
       setTimeout(() => {
         window.location.href = `/PaymentRedirect?booking_id=${booking.id}&amount=${amount}&item_name=${encodeURIComponent(bookingData.service_type)}`;
       }, 1200);
    } catch (e) {
      addMessage('assistant', `抱歉，預約建立失敗（${e.message || '未知錯誤'}），請撥打 0906-991-023 由客服協助。`);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async (text) => {
    if (!text || loading) return;
    const history = messages.filter(m => m.role !== 'system');
    addMessage('user', text);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('hesonAI', {
        message: text,
        history: history.map(m => ({ role: m.role, content: m.content })),
      });
      const reply = res.data?.reply || '抱歉，我暫時無法回答，請撥打 0906-991-023 聯繫客服。';
      addMessage('assistant', reply);
    } catch {
      addMessage('assistant', '抱歉，目前連線異常，請稍後再試或撥打 0906-991-023。');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = () => {
    setBookingStep(null);
    setBookingData({});
    addMessage('assistant', '已取消預約流程，有其他問題歡迎繼續詢問！');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 text-white font-bold text-xl"
        aria-label="開啟小赫 AI 客服"
      >
        {open ? <X className="w-6 h-6" /> : '🤖'}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-200"
            style={{ width: 'min(380px, calc(100vw - 32px))', height: 'min(540px, calc(100vh - 160px))' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 text-lg font-bold">🤖</div>
              <div>
                <p className="text-white font-medium text-sm">小赫 AI 客服</p>
                <p className="text-amber-100 text-xs">HESON 赫頌 · 24hr 智能回覆</p>
              </div>
              {bookingStep && (
                <button onClick={cancelBooking} className="ml-auto mr-1 text-white/70 hover:text-white flex items-center gap-1 text-xs">
                  <ChevronLeft className="w-3 h-3" /> 取消預約
                </button>
              )}
              <button onClick={() => setOpen(false)} className={`${bookingStep ? '' : 'ml-auto'} text-white/70 hover:text-white`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-stone-50 via-white to-stone-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 bg-amber-100 shadow-sm flex items-center justify-center text-sm font-bold">🤖</div>
                  )}
                  <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line transition-all ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-sm shadow-md'
                      : 'bg-white text-stone-700 shadow-sm rounded-bl-sm border border-stone-200'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {messages.length === 1 && !quickShown && !bookingStep && (
                <div className="flex flex-wrap gap-2 pl-9 pb-1">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => { setQuickShown(true); handleQuickClick(q); }}
                      className="text-xs bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-50 transition-colors font-medium shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 bg-amber-100 flex items-center justify-center text-sm font-bold">🤖</div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-stone-200">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  </div>
                </div>
              )}
              {bookingResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    預約已建立！
                  </div>
                  <p className="text-xs text-stone-600 mb-3">服務日期：{bookingResult.scheduled_date} {bookingResult.time_slot}</p>
                  <CalendarExportButton booking={bookingResult} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Interactive Options Area */}
            <div className="flex-shrink-0 border-t border-stone-200 bg-white">
              {bookingStep === 'service' && (
                <div className="px-3 py-2 grid grid-cols-2 gap-2">
                  {SERVICE_TYPES.map(s => (
                    <button
                      key={s}
                      onClick={() => handleBookingStep(s, s)}
                      className="text-xs bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 text-amber-800 px-2 py-2.5 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all font-medium shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {bookingStep === 'city' && (
                <div className="px-3 py-2 max-h-40 overflow-y-auto grid grid-cols-3 gap-1.5">
                  {TAIWAN_CITIES.map(c => (
                    <button
                      key={c}
                      onClick={() => handleBookingStep(c, c)}
                      className="text-xs bg-stone-50 border border-stone-300 text-stone-700 px-2 py-1.5 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-all font-medium"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {bookingStep === 'housing_type' && (
                <div className="px-3 py-2 grid grid-cols-2 gap-2">
                  {HOUSING_TYPES.map(h => (
                    <button key={h} onClick={() => handleBookingStep(h)}
                      className="text-xs bg-stone-50 border border-stone-300 text-stone-700 px-2 py-2.5 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all font-medium">
                      {h}
                    </button>
                  ))}
                </div>
              )}

              {bookingStep === 'date' && (
                <div className="px-3 py-3 flex flex-col gap-2">
                  <p className="text-xs text-stone-500 font-medium">請點選日期：</p>
                  <input
                    ref={dateInputRef}
                    type="date"
                    min={getMinDate()}
                    onChange={e => { if (e.target.value) handleBookingStep(e.target.value, e.target.value); }}
                    className="w-full text-sm border border-amber-400 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white cursor-pointer transition-all font-medium"
                  />
                </div>
              )}

              {bookingStep === 'time' && (
                <div className="px-3 py-2 flex flex-col gap-1.5">
                  {TIME_SLOTS.map(t => (
                    <button
                      key={t}
                      onClick={() => handleBookingStep(t, t)}
                      className="text-xs bg-stone-50 border border-stone-300 text-stone-700 px-3 py-2.5 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all text-left font-medium"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {bookingStep === 'login_required' && (
                <div className="px-3 py-3 flex flex-col gap-2">
                  <button
                    onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                    className="w-full text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-md"
                  >
                    🔐 立即登入以完成預約
                  </button>
                  <button onClick={cancelBooking} className="w-full text-xs text-stone-400 hover:text-stone-600 transition-colors">
                    取消
                  </button>
                </div>
              )}

              {bookingStep === 'weekdays' && (
                <WeekdaysSelector onConfirm={(days) => handleBookingStep(days)} />
              )}

              {bookingStep === 'cleaning_tools' && (
                <div className="px-3 py-2 flex flex-col gap-1.5">
                  {CLEANING_TOOLS_OPTIONS.map(t => (
                    <button key={t} onClick={() => handleBookingStep(t)}
                      className="text-xs bg-stone-50 border border-stone-300 text-stone-700 px-3 py-2.5 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all text-left font-medium">
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {bookingStep === 'enhance_areas' && (
                <EnhanceAreasSelector onConfirm={(areas) => handleBookingStep(areas)} />
              )}

              {bookingStep === 'pets' && (
                <div className="px-3 py-2 flex gap-2">
                  <button
                    onClick={() => handleBookingStep('yes')}
                    className="flex-1 text-sm bg-amber-50 border border-amber-300 text-amber-800 py-2.5 rounded-xl font-medium hover:bg-amber-100 transition-all"
                  >
                    🐾 有寵物
                  </button>
                  <button
                    onClick={() => handleBookingStep('no')}
                    className="flex-1 text-sm bg-stone-50 border border-stone-300 text-stone-700 py-2.5 rounded-xl font-medium hover:bg-stone-100 transition-all"
                  >
                    🚫 沒有寵物
                  </button>
                </div>
              )}

              {bookingStep === 'referral' && (
                <div className="px-3 py-2 grid grid-cols-3 gap-1.5">
                  {REFERRAL_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => handleBookingStep(r)}
                      className="text-xs bg-stone-50 border border-stone-300 text-stone-700 px-2 py-2 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all font-medium"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {bookingStep === 'notes' && (
                <div className="px-3 py-2 flex gap-2">
                  <button onClick={() => handleBookingStep('')}
                    className="flex-1 text-xs bg-stone-50 border border-stone-300 text-stone-500 py-2.5 rounded-xl font-medium hover:bg-stone-100 transition-all">
                    跳過
                  </button>
                </div>
              )}

              {bookingStep === 'confirm' && (
                <div className="px-3 py-2 flex gap-2">
                  <button
                    onClick={confirmBooking}
                    className="flex-1 text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-md"
                  >
                    ✓ 確認並前往付款
                  </button>
                  <button
                    onClick={cancelBooking}
                    className="flex-1 text-sm bg-stone-100 hover:bg-stone-200 text-stone-600 py-2.5 rounded-xl font-medium transition-all"
                  >
                    ✕ 取消
                  </button>
                </div>
              )}

              {(!bookingStep || bookingStep === 'road' || bookingStep === 'square_footage' || bookingStep === 'name' || bookingStep === 'phone' || bookingStep === 'referrer' || bookingStep === 'notes') && (
                <div className="px-3 py-3 flex gap-2 bg-gradient-to-r from-amber-50 to-white border-t border-stone-200">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleTextInput()}
                    placeholder={
                      bookingStep === 'road' ? '例：中山北路二段100號' :
                      bookingStep === 'square_footage' ? '請輸入坪數（數字）' :
                      bookingStep === 'name' ? '請輸入您的姓名' :
                      bookingStep === 'phone' ? '09XX-XXX-XXX' :
                      bookingStep === 'referrer' ? '推薦人姓名（可直接按跳過）' :
                      bookingStep === 'notes' ? '特別需求（可直接按跳過）' :
                      '輸入您的問題...'
                    }
                    className="flex-1 text-sm border border-amber-200 rounded-xl px-4 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white placeholder-stone-400 font-medium"
                  />
                  <button
                    onClick={handleTextInput}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}