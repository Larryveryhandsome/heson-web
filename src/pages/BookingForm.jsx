import React, { useState, useEffect } from 'react';
import CancellationPolicy from '@/components/CancellationPolicy';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, Loader2, Sparkles, AlertCircle, Upload, X, ChevronDown, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import AddressMap from "@/components/AddressMap";

// 赫頌直營縣市（有直營人員的地區）
const HESON_DIRECT_CITIES = ['台北市', '新北市', '桃園市', '台中市'];

const TAIWAN_CITIES = [
  '台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣',
  '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市',
  '嘉義縣', '台南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
];

const CITY_DISTRICTS = {
  '台北市': ['中正區','大同區','中山區','松山區','大安區','萬華區','信義區','士林區','北投區','內湖區','南港區','文山區'],
  '新北市': ['板橋區','三重區','中和區','永和區','新莊區','新店區','樹林區','鶯歌區','三峽區','淡水區','汐止區','瑞芳區','土城區','蘆洲區','五股區','泰山區','林口區','深坑區','石碇區','坪林區','三芝區','石門區','八里區','平溪區','雙溪區','貢寮區','金山區','萬里區','烏來區'],
  '基隆市': ['仁愛區','中山區','安樂區','暖暖區','七堵區'],
  '桃園市': ['桃園區','中壢區','大溪區','楊梅區','蘆竹區','大園區','龜山區','八德區','龍潭區','平鎮區','新屋區','觀音區','復興區'],
  '新竹市': ['東區','北區','香山區'],
  '新竹縣': ['竹北市','湖口鄉','新豐鄉','新埤鄉','關西鎮','芎蕉鎮','寶山鄉','北埔鄉','峨眉鄉','尖石鄉','五峰鄉'],
  '苗栗縣': ['苗栗市','通霄鎮','苑裡鎮','竹南鎮','頭份市','三灣鄉','南庄鄉','獅潭鄉','後龍鎮','造橋鄉','頭屋鄉','公館鄉','銅鑼鄉','三義鄉','大湖鄉','泰安鄉'],
  '台中市': ['中區','東區','南區','西區','北區','西屯區','南屯區','北屯區','豐原區','大里區','太平區','清水區','沙鹿區','梧棲區','烏日區','神岡區','大雅區','潭子區','大肚區','龍井區','霧峰區','外埔區','大甲區','后里區','東勢區','石岡區','新社區','和平區'],
  '彰化縣': ['彰化市','員林市','溪湖鎮','和美鎮','伸港鄉','線西鄉','芬園鄉','花壇鄉','大村鄉','永靖鄉','田尾鄉','埤頭鄉','竹塘鄉','社頭鄉','二水鄉','北斗鎮','田中鎮','二林鎮','芎蕉鎮','大城鄉','芳苑鄉'],
  '南投縣': ['南投市','埔里鎮','草屯鎮','竹山鎮','集集鎮','名間鄉','鹿谷鄉','中寮鄉','魚池鄉','國姓鄉','水里鄉','信義鄉','仁愛鄉'],
  '雲林縣': ['斗六市','斗南鎮','虎尾鎮','土庫鎮','褒忠鄉','東勢鄉','臺西鄉','麥寮鄉','口湖鄉','四湖鄉','元長鄉'],
  '嘉義市': ['東區','西區'],
  '嘉義縣': ['太保市','朴子市','布袋鎮','大林鎮','民雄鄉','溪口鄉','中埤鄉','竹山鄉','鹿草鄉','六腳鄉','新港鄉','東石鄉','義竹鄉','阿里山鄉'],
  '台南市': ['中西區','東區','南區','北區','安平區','安南區','永康區','歸仁區','新化區','左鎮區','玉井區','楠西區','南化區','仁德區','關廟區','龍崗區','官田區','麻豆區','佳里區','西港區','七股區','將軍區','北門區','學甲區','柳營區','後壁區','白河區','東山區','下營區','六甲區','大內區'],
  '高雄市': ['楠梓區','左營區','鼓山區','三民區','苓雅區','前金區','新興區','旗津區','鹽埕區','豆陶區','林園區','小港區','阿蓮區','路竹區','岡山區','橋頭區','燕巢區','田寮區','湖內區','茄萣區','永安區','彌陀區','梓官區','旗山區','美濃區','六龜區','內門區','杉林區','甲仙區','桃源區','那瑪夏區'],
  '屏東縣': ['屏東市','潮州鎮','東港鎮','恆春鎮','萬丹鄉','長治鄉','麟洛鄉','竹田鄉','內埔鄉','滿州鄉','霧臺鄉','瑪家鄉','泰武鄉','來義鄉','春日鄉','獅子鄉','車城鄉','牡丹鄉','三地門鄉','高樹鄉','佳冬鄉','新埤鄉','林邊鄉','南州鄉'],
  '宜蘭縣': ['宜蘭市','羅東鎮','蘇澳鎮','頭城鎮','員山鄉','壯圍鄉','五結鄉','礁溪鄉','大同鄉','南澳鄉'],
  '花蓮縣': ['花蓮市','鳳林鎮','玉里鎮','新城鄉','吉安鄉','壽豐鄉','光復鄉','豐濱鄉','瑞穗鄉','萬榮鄉','富里鄉','卓溪鄉'],
  '台東縣': ['台東市','成功鎮','關山鎮','長濱鄉','海端鄉','池上鄉','東河鄉','鹿野鄉','延平鄉','卑南鄉','金峰鄉','達仁鄉','蘭嶼鄉','綠島鄉'],
  '澎湖縣': ['馬公市','湖西鄉','白沙鄉','西嶼鄉','望安鄉','七美鄉'],
  '金門縣': ['金城鎮','金湖鎮','金沙鎮','金寧鄉','烈嶼鄉'],
  '連江縣': ['南竿鄉','北竿鄉','莒光鄉','東引鄉'],
};

// 依縣市決定可用清潔類型
function getCleaningTypes(city) {
  const isDirect = HESON_DIRECT_CITIES.includes(city);
  if (!city) return [];
  if (isDirect) {
    return [
      { value: '定清', label: '定期清潔（小幫手/師傅）', sheet: 'R／定清案件' },
      { value: '輕量', label: '單次輕量清潔（師傅）', sheet: 'L／輕量案件' },
      { value: '大掃除', label: '年度大掃除（廠商/直營）', sheet: 'D／細清案件' },
      { value: '裝潢', label: '裝潢後清潔（廠商/直營）', sheet: 'P／毛坯案件' },
      { value: '民宿', label: '民宿/退租清潔（廠商/直營）', sheet: 'H／民宿清潔' },
    ];
  } else {
    return [
      { value: '輕量', label: '單次輕量清潔（師傅）', sheet: 'L／輕量案件' },
      { value: '大掃除', label: '年度大掃除（廠商）', sheet: 'D／細清案件' },
      { value: '裝潢', label: '裝潢後清潔（廠商）', sheet: 'P／毛坯案件' },
      { value: '民宿', label: '民宿/退租清潔（廠商）', sheet: 'H／民宿清潔' },
    ];
  }
}

// 依清潔類型決定服務方案
function getServicePlans(cleaningType) {
  switch (cleaningType) {
    case '定清':
      return [
        { value: '基礎月護-4次', label: '基礎月護', sub: '每月4次', price: 'NT$ 8,400/月' },
        { value: '進階月安-8次', label: '進階月安', sub: '每月8次', price: 'NT$ 16,000/月' },
        { value: '尊榮月恆-12次', label: '尊榮月恆', sub: '每月12次', price: 'NT$ 24,600/月' },
      ];
    case '輕量':
      return [
        { value: '單次輕量清潔', label: '單次清潔', sub: '3-4小時', price: '依坪數報價，約 NT$ 1,800起' },
      ];
    case '大掃除':
      return [
        { value: '年度大掃除-標準', label: '標準大掃除', sub: '全室基礎深清', price: 'NT$ 5,000起' },
        { value: '年度大掃除-全套', label: '全套大掃除', sub: '含廚房油汙、浴室水垢', price: 'NT$ 8,000起' },
      ];
    case '裝潢':
      return [
        { value: '裝潢後清潔-標準', label: '標準裝潢清', sub: '工後基礎清潔', price: 'NT$ 6,000起' },
        { value: '裝潢後清潔-精緻', label: '精緻裝潢清', sub: '含玻璃、矽利康', price: 'NT$ 10,000起' },
      ];
    case '民宿':
      return [
        { value: '民宿單次清潔', label: '民宿單次', sub: '退房/入住清潔', price: 'NT$ 1,200起' },
        { value: '民宿定期合作', label: '民宿長期合作', sub: '月結制', price: '洽談報價' },
      ];
    default:
      return [];
  }
}

const timeSlots = [
  { value: '上午 08:00-12:00', label: '上午 08:00-12:00' },
  { value: '下午 13:00-17:00', label: '下午 13:00-17:00' },
  { value: '晚間 18:00-21:00', label: '晚間 18:00-21:00' },
];

const REFERRAL_OPTIONS = ['Facebook', 'Instagram', 'Threads', '朋友推薦', 'LINE', 'Google 搜尋', '其他'];
const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
const ENHANCE_AREAS = ['廚房', '浴室', '窗戶', '陽台', '地板', '衣櫃內部', '油煙機', '冰箱', '其他'];



function SearchCombobox({ items, value, onChange, disabled, placeholder, disabledPlaceholder, searchPlaceholder }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filtered = items.filter(d => d.includes(search));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between rounded-xl font-normal text-sm"
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || (disabled ? disabledPlaceholder : placeholder)}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>無符合結果</CommandEmpty>
            <CommandGroup>
              {filtered.map(d => (
                <CommandItem
                  key={d}
                  value={d}
                  onSelect={() => { onChange(d); setOpen(false); setSearch(''); }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === d ? 'opacity-100' : 'opacity-0'}`} />
                  {d}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DistrictCombobox({ districts, value, onChange, disabled }) {
  return (
    <SearchCombobox
      items={districts}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="請選擇"
      disabledPlaceholder="請先選縣市"
      searchPlaceholder="搜尋鄉鎮市區..."
    />
  );
}

export default function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null); // 已儲存的會員資料

  // 訂購人（付款人）
  const [orderer, setOrderer] = useState({ name: '', phone: '', email: '' });
  // 使用會員資料勾選
  const [useProfilePhone, setUseProfilePhone] = useState(false);
  const [useProfileAddress, setUseProfileAddress] = useState(false);
  const [useProfileName, setUseProfileName] = useState(false);
  const [useProfileEmail, setUseProfileEmail] = useState(false);

  // 服務地址
  const [addrCity, setAddrCity] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrDetail, setAddrDetail] = useState('');
  const [addrCoords, setAddrCoords] = useState(null);

  // 清潔類型 & 服務方案
  const [cleaningType, setCleaningType] = useState('');
  const [servicePlan, setServicePlan] = useState('');

  // 其他表單欄位
  const [housingType, setHousingType] = useState('');
  const [hasElevator, setHasElevator] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [hasPet, setHasPet] = useState('');
  const [cleaningTools, setCleaningTools] = useState('我方自帶');
  const [enhanceAreas, setEnhanceAreas] = useState([]);
  const [preferredWeekdays, setPreferredWeekdays] = useState([]);
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [referrer, setReferrer] = useState('');

  const { data: cleaners = [] } = useQuery({
    queryKey: ['activeCleaners'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }),
  });

  useEffect(() => {
    const loadUserData = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        try {
          const profiles = await base44.entities.ClientProfile.filter({ user_id: userData.id });
          if (profiles[0]) setSavedProfile(profiles[0]);
        } catch (e) {}
      }
    };
    loadUserData();
  }, []);

  // 勾選「常用姓名」
  useEffect(() => {
    if (useProfileName && user?.full_name) {
      setOrderer(prev => ({ ...prev, name: user.full_name }));
    }
  }, [useProfileName, user]);

  // 勾選「常用電話」
  useEffect(() => {
    if (useProfilePhone && savedProfile?.phone) {
      setOrderer(prev => ({ ...prev, phone: savedProfile.phone }));
    }
  }, [useProfilePhone, savedProfile]);

  // 勾選「常用Email」
  useEffect(() => {
    if (useProfileEmail && user?.email) {
      setOrderer(prev => ({ ...prev, email: user.email }));
    }
  }, [useProfileEmail, user]);

  // 當勾選「常用地址」時帶入
  useEffect(() => {
    if (useProfileAddress && savedProfile?.address) {
      // 嘗試解析地址中的縣市
      const city = TAIWAN_CITIES.find(c => savedProfile.address.includes(c)) || '';
      setAddrCity(city);
      setAddrDistrict('');
      setAddrDetail(savedProfile.address.replace(city, '').trim());
    } else if (!useProfileAddress) {
      setAddrCity('');
      setAddrDistrict('');
      setAddrDetail('');
    }
  }, [useProfileAddress, savedProfile]);

  // 切換縣市時清空區和清潔類型
  const handleCityChange = (city) => {
    setAddrCity(city);
    setAddrDistrict('');
    setCleaningType('');
    setServicePlan('');
  };

  // 切換清潔類型時清空方案
  const handleCleaningTypeChange = (type) => {
    setCleaningType(type);
    setServicePlan('');
    setPreferredWeekdays([]);
  };

  const cleaningTypes = getCleaningTypes(addrCity);
  const servicePlans = getServicePlans(cleaningType);
  const isRecurring = cleaningType === '定清';
  const fullAddress = [addrCity, addrDistrict, addrDetail].filter(Boolean).join('');

  const getAmount = () => {
    if (servicePlan.includes('基礎月護')) return 8400;
    if (servicePlan.includes('進階月安')) return 16000;
    if (servicePlan.includes('尊榮月恆')) return 24600;
    if (servicePlan.includes('輕量')) return 1800;
    if (servicePlan.includes('標準大掃除')) return 5000;
    if (servicePlan.includes('全套大掃除')) return 8000;
    if (servicePlan.includes('標準裝潢')) return 6000;
    if (servicePlan.includes('精緻裝潢')) return 10000;
    if (servicePlan.includes('民宿單次')) return 1200;
    return 2000;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!policyAgreed) { toast.error('請同意取消及退款政策才能繼續'); return; }
    if (!user) { toast.error('請先登入帳號'); base44.auth.redirectToLogin('/BookingForm'); return; }

    const missing = [];
    if (!orderer.name) missing.push('訂購人姓名');
    if (!orderer.phone) missing.push('聯絡電話');
    if (!addrCity) missing.push('服務縣市');
    if (!addrDistrict) missing.push('鄉鎮市區');
    if (!addrDetail) missing.push('詳細地址');
    if (!cleaningType) missing.push('清潔類型');
    if (!servicePlan) missing.push('服務方案');
    if (!date) missing.push('希望服務日期');
    if (!timeSlot) missing.push('希望時段');

    if (missing.length > 0) { toast.error(`請填寫：${missing.join('、')}`); return; }

    setIsSubmitting(true);
    let photoUrls = [];
    if (photoFiles.length > 0) {
      for (let i = 0; i < photoFiles.length; i++) {
        setUploadStatus(`上傳照片中 ${i + 1}/${photoFiles.length}`);
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFiles[i] });
          photoUrls.push(file_url);
        } catch (e) { console.warn('照片上傳失敗:', e); }
      }
      setUploadStatus('');
    }

    let booking = null;
    try {
      booking = await base44.entities.Booking.create({
        client_id: user.id,
        client_name: orderer.name,
        service_type: servicePlan,
        status: '待確認',
        scheduled_date: format(date, 'yyyy-MM-dd'),
        time_slot: timeSlot,
        address: fullAddress,
        phone: orderer.phone,
        notes: [
        `清潔類型: ${cleaningType}`,
        housingType ? `房型: ${housingType}${hasElevator ? ` (${hasElevator})` : ''}` : '',
          squareFootage ? `坪數: ${squareFootage}` : '',
          enhanceAreas.length ? `加強: ${enhanceAreas.join(', ')}` : '',
          addrCoords ? `GPS: ${addrCoords.lat.toFixed(6)},${addrCoords.lng.toFixed(6)}` : '',
          notes ? `備註: ${notes}` : '',
        ].filter(Boolean).join(' | '),
      });

      window.location.href = `/PaymentRedirect?booking_id=${booking.id}&amount=${getAmount()}&item_name=${encodeURIComponent(`HESON ${servicePlan}`)}`;
    } catch (error) {
      setIsSubmitting(false);
      toast.error(booking ? '預約已建立，但通知失敗，請聯繫客服確認' : '預約建立失敗，請稍後重試');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-6 bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="container mx-auto px-5 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-stone-600 font-medium">首次預約享 NT$300 折扣</span>
          </div>
          <h1 className="text-3xl font-medium text-stone-800">立即預約服務</h1>
          <p className="text-stone-500 mt-2 text-sm">填寫以下資料，讓我們為您安排最適合的服務</p>
        </div>
      </section>

      {/* Login Banner */}
      {!user && (
        <div className="container mx-auto px-5 max-w-2xl py-4">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 flex-1">登入後可快速帶入會員資料</p>
            <button onClick={() => base44.auth.redirectToLogin('/BookingForm')}
              className="text-sm font-medium text-amber-700 underline">登入</button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="container mx-auto px-5 max-w-2xl py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── 區塊1：訂購人資訊 ── */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-base font-semibold text-stone-800 border-b border-stone-100 pb-2">訂購人資訊</h2>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>姓名 *</Label>
                  {user?.full_name && (
                    <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                      <Checkbox checked={useProfileName} onCheckedChange={setUseProfileName} className="h-3.5 w-3.5" />
                      使用會員姓名（{user.full_name}）
                    </label>
                  )}
                </div>
                <Input value={orderer.name} onChange={e => { setUseProfileName(false); setOrderer(p => ({...p, name: e.target.value})); }}
                  placeholder="請輸入姓名" className="rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>聯絡電話 *</Label>
                  {savedProfile?.phone && (
                    <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                      <Checkbox checked={useProfilePhone} onCheckedChange={setUseProfilePhone} className="h-3.5 w-3.5" />
                      使用常用電話（{savedProfile.phone}）
                    </label>
                  )}
                </div>
                <Input value={orderer.phone} onChange={e => { setUseProfilePhone(false); setOrderer(p => ({...p, phone: e.target.value})); }}
                  placeholder="09XX-XXX-XXX" className="rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>電子郵件</Label>
                  {user?.email && (
                    <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                      <Checkbox checked={useProfileEmail} onCheckedChange={setUseProfileEmail} className="h-3.5 w-3.5" />
                      使用會員Email（{user.email}）
                    </label>
                  )}
                </div>
                <Input value={orderer.email} onChange={e => { setUseProfileEmail(false); setOrderer(p => ({...p, email: e.target.value})); }}
                  placeholder="email@example.com" className="rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* ── 區塊2：服務地址 ── */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h2 className="text-base font-semibold text-stone-800">服務地址</h2>
                {savedProfile?.address && (
                  <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                    <Checkbox checked={useProfileAddress} onCheckedChange={setUseProfileAddress}
                      className="h-3.5 w-3.5" />
                    使用常用地址
                  </label>
                )}
              </div>

              {/* 縣市 / 區 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>縣市 *</Label>
                  <SearchCombobox
                    items={TAIWAN_CITIES.map(c => HESON_DIRECT_CITIES.includes(c) ? `${c} ✓` : c)}
                    value={addrCity ? (HESON_DIRECT_CITIES.includes(addrCity) ? `${addrCity} ✓` : addrCity) : ''}
                    onChange={v => handleCityChange(v.replace(' ✓', ''))}
                    placeholder="請選擇縣市"
                    searchPlaceholder="搜尋縣市..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>鄉鎮市區 *</Label>
                  <DistrictCombobox
                    districts={CITY_DISTRICTS[addrCity] || []}
                    value={addrDistrict}
                    onChange={setAddrDistrict}
                    disabled={!addrCity}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>詳細地址 *</Label>
                <Input value={addrDetail} onChange={e => setAddrDetail(e.target.value)}
                  placeholder="路名、門牌號碼、樓層" className="rounded-xl" />
              </div>

              {/* 地圖定位 */}
              {addrDetail && addrCity && (
                <AddressMap
                  address={fullAddress}
                  onLocationChange={setAddrCoords}
                />
              )}

              {addrCity && !HESON_DIRECT_CITIES.includes(addrCity) && (
                <p className="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2">
                  📍 {addrCity} 目前由合作廠商提供服務（大掃除、裝潢、民宿類）
                </p>
              )}
              {addrCity && HESON_DIRECT_CITIES.includes(addrCity) && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  ✓ {addrCity} 為赫頌直營服務地區，提供完整服務方案
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── 區塊3：清潔需求 ── */}
          {addrCity && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-base font-semibold text-stone-800 border-b border-stone-100 pb-2">清潔需求</h2>

                {/* 房屋資訊 */}
                <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>房屋型態</Label>
                  <Select value={housingType} onValueChange={setHousingType}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="透天">透天</SelectItem>
                      <SelectItem value="公寓">公寓</SelectItem>
                      <SelectItem value="華廈">華廈</SelectItem>
                      <SelectItem value="大樓">大樓</SelectItem>
                      <SelectItem value="農舍">農舍</SelectItem>
                      <SelectItem value="廠辦">廠辦</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>坪數</Label>
                  <Input type="number" value={squareFootage} onChange={e => setSquareFootage(e.target.value)}
                    placeholder="例：30" className="rounded-xl" />
                </div>
                </div>

                {/* 有無電梯 */}
                {housingType && (
                <div className="space-y-1.5">
                  <Label>有無電梯</Label>
                  <div className="flex gap-2">
                    {['有電梯', '無電梯'].map(v => (
                      <button key={v} type="button" onClick={() => setHasElevator(v)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${hasElevator === v ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* 清潔類型 */}
                <div className="space-y-1.5">
                  <Label>清潔類型 *</Label>
                  <Select value={cleaningType} onValueChange={handleCleaningTypeChange}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇清潔類型" /></SelectTrigger>
                    <SelectContent>
                      {cleaningTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 服務方案 */}
                {servicePlans.length > 0 && (
                  <div className="space-y-2">
                    <Label>服務方案 *</Label>
                    <RadioGroup value={servicePlan} onValueChange={setServicePlan} className="space-y-2">
                      {servicePlans.map(plan => (
                        <label key={plan.value}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            servicePlan === plan.value ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-stone-300'
                          }`}>
                          <RadioGroupItem value={plan.value} className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-stone-800 text-sm">{plan.label}</p>
                              <p className="text-xs text-amber-600 font-semibold">{plan.price}</p>
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5">{plan.sub}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* 偏好星期（定清才顯示） */}
                {isRecurring && (
                  <div className="space-y-2">
                    <Label>偏好服務星期（可複選）</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map(day => (
                        <button key={day} type="button"
                          onClick={() => setPreferredWeekdays(p => p.includes(day) ? p.filter(d => d !== day) : [...p, day])}
                          className={`px-3 py-1.5 rounded-lg border-2 text-sm transition-all ${preferredWeekdays.includes(day) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── 區塊4：服務時間 ── */}
          {servicePlan && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-base font-semibold text-stone-800 border-b border-stone-100 pb-2">希望服務時間</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>日期 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl text-sm">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'M/d (EEE)', { locale: zhTW }) : '選擇日期'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={date} onSelect={setDate}
                          disabled={d => d < new Date(Date.now() + 48 * 60 * 60 * 1000)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label>時段 *</Label>
                    <Select value={timeSlot} onValueChange={setTimeSlot}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 區塊5：其他資訊 ── */}
          {servicePlan && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-base font-semibold text-stone-800 border-b border-stone-100 pb-2">其他資訊</h2>

                {/* 寵物 */}
                <div className="space-y-1.5">
                  <Label>家中是否有寵物？</Label>
                  <div className="flex gap-2">
                    {['有', '沒有'].map(v => (
                      <button key={v} type="button" onClick={() => setHasPet(v)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${hasPet === v ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 現場掃具 */}
                <div className="space-y-1.5">
                  <Label>現場清潔工具</Label>
                  <div className="flex gap-2">
                    {['客戶自備', '我方自帶', '混合'].map(v => (
                      <button key={v} type="button" onClick={() => setCleaningTools(v)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${cleaningTools === v ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 加強清潔 */}
                <div className="space-y-1.5">
                  <Label>加強清潔區域（可複選，選填）</Label>
                  <div className="flex flex-wrap gap-2">
                    {ENHANCE_AREAS.map(area => (
                      <button key={area} type="button"
                        onClick={() => setEnhanceAreas(p => p.includes(area) ? p.filter(a => a !== area) : [...p, area])}
                        className={`px-3 py-1.5 rounded-lg border-2 text-sm transition-all ${enhanceAreas.includes(area) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 現場照片 */}
                <div className="space-y-1.5">
                  <Label>現場照片（選填，有助精準估價）</Label>
                  <label htmlFor="photo-upload"
                    className="flex items-center gap-3 border-2 border-dashed border-stone-200 rounded-xl p-4 cursor-pointer hover:border-amber-300 transition-colors bg-stone-50">
                    <Upload className="w-5 h-5 text-stone-400 flex-shrink-0" />
                    <span className="text-sm text-stone-500">點擊上傳（最多 5 張）</span>
                  </label>
                  <input id="photo-upload" type="file" accept="image/*" multiple className="hidden"
                    onChange={e => setPhotoFiles(Array.from(e.target.files || []).slice(0, 5))} />
                  {photoFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {photoFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1 bg-stone-100 rounded-lg px-2 py-1 text-xs text-stone-600">
                          {f.name.slice(0, 14)}{f.name.length > 14 ? '…' : ''}
                          <button type="button" onClick={() => setPhotoFiles(p => p.filter((_, idx) => idx !== i))}>
                            <X className="w-3 h-3 text-stone-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 得知來源 */}
                <div className="space-y-1.5">
                  <Label>您是從哪裡得知赫頌？</Label>
                  <Select value={referralSource} onValueChange={v => { setReferralSource(v); if (v !== '朋友推薦') setReferrer(''); }}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇（選填）" /></SelectTrigger>
                    <SelectContent>
                      {REFERRAL_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {referralSource === '朋友推薦' && (
                    <Input value={referrer} onChange={e => setReferrer(e.target.value)}
                      placeholder="推薦人姓名（選填）" className="rounded-xl mt-2" />
                  )}
                </div>

                {/* 備註 */}
                <div className="space-y-1.5">
                  <Label>特殊需求備註</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="有任何特殊需求請在此說明..." className="rounded-xl min-h-[80px]" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 取消政策 + 送出 */}
          {servicePlan && (
            <>
              <CancellationPolicy agreed={policyAgreed} onAgreeChange={setPolicyAgreed} />
              <Button type="submit" disabled={isSubmitting}
                className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-2xl text-base font-medium">
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{uploadStatus || '處理中...'}</>
                  : '確認預約並前往付款'}
              </Button>
              <p className="text-xs text-stone-400 text-center">送出後將引導您完成付款，付款成功即確認預約</p>
            </>
          )}
        </form>
      </div>

      <Footer />
    </div>
  );
}