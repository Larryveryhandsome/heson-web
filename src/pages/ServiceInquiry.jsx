import React, { useState, useEffect } from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, Loader2, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const serviceConfig = {
  "居家清潔": {
    emoji: "🏠",
    title: "居家清潔服務",
    desc: "讓我們了解您的居家清潔需求",
    priceBase: 2000,
    fields: ["name","phone","address","housing_type","sqft","clean_type","date","time_slot","notes"],
  },
  "家電清洗": {
    emoji: "❄️",
    title: "家電清洗服務",
    desc: "請告訴我們需要清洗的家電種類與數量",
    priceBase: 1200,
    fields: ["name","phone","address","appliances","date","time_slot","notes"],
  },
  "整理收納": {
    emoji: "📦",
    title: "整理收納服務",
    desc: "讓整理師幫您打造最舒適的生活空間",
    priceBase: 1800,
    fields: ["name","phone","address","sqft","space_desc","date","time_slot","notes"],
  },
  "商業清潔": {
    emoji: "🏢",
    title: "商業清潔服務",
    desc: "專業企業清潔，維持最佳工作環境",
    priceBase: 2400,
    fields: ["name","phone","company","address","sqft","clean_freq","date","time_slot","notes"],
  },
  "布面清洗": {
    emoji: "🛋️",
    title: "布面清洗服務",
    desc: "深層清潔沙發、床墊、窗簾等布面家具",
    priceBase: 1500,
    fields: ["name","phone","address","fabric_items","date","time_slot","notes"],
  },
  "裝潢後清潔": {
    emoji: "🔨",
    title: "裝潢後清潔服務",
    desc: "新屋、工程後的專業深度清潔",
    priceBase: 3000,
    fields: ["name","phone","address","sqft","finish_date","date","time_slot","notes"],
  },
};

const timeSlots = ["上午 08:00-12:00", "下午 13:00-17:00", "晚間 18:00-21:00"];
const applianceOptions = ["冷氣", "洗衣機", "油煙機", "熱水器", "冰箱", "烘衣機"];
const fabricOptions = ["沙發", "床墊(單人)", "床墊(雙人)", "窗簾(組)", "椅子"];

export default function ServiceInquiry() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceName = urlParams.get('service') || "居家清潔";
  const config = serviceConfig[serviceName] || serviceConfig["居家清潔"];

  const [user, setUser] = useState(null);
  const [date, setDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliances, setAppliances] = useState({});
  const [fabricItems, setFabricItems] = useState({});
  const [form, setForm] = useState({
    name: '', phone: '', address: '', housing_type: '', sqft: '',
    clean_type: '', time_slot: '', notes: '', company: '',
    space_desc: '', clean_freq: '', finish_date: '',
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (auth) {
        const u = await base44.auth.me();
        setUser(u);
        setForm(f => ({ ...f, name: u.full_name || '' }));
      }
    });
  }, []);

  const f = config.fields;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !date || !form.time_slot) {
      toast.error('請填寫所有必填欄位');
      return;
    }
    setIsSubmitting(true);

    try {
      let notesArr = [];
    if (form.housing_type) notesArr.push(`房屋類型: ${form.housing_type}`);
    if (form.sqft) notesArr.push(`坪數: ${form.sqft}`);
    if (form.clean_type) notesArr.push(`清潔類型: ${form.clean_type}`);
    if (form.company) notesArr.push(`公司: ${form.company}`);
    if (form.space_desc) notesArr.push(`空間描述: ${form.space_desc}`);
    if (form.clean_freq) notesArr.push(`清潔頻率: ${form.clean_freq}`);
    if (form.finish_date) notesArr.push(`完工日期: ${form.finish_date}`);
    const appList = Object.entries(appliances).filter(([,v])=>v>0).map(([k,v])=>`${k}×${v}`).join(', ');
    if (appList) notesArr.push(`家電: ${appList}`);
    const fabList = Object.entries(fabricItems).filter(([,v])=>v>0).map(([k,v])=>`${k}×${v}`).join(', ');
    if (fabList) notesArr.push(`布面: ${fabList}`);
    if (form.notes) notesArr.push(`備註: ${form.notes}`);

      const booking = await base44.entities.Booking.create({
        client_id: user?.id || 'guest',
        client_name: form.name,
        service_type: serviceName === "居家清潔" ? (form.clean_type === "定期" ? "基礎月護-4次" : "單次清潔") : "單次清潔",
        status: '待確認',
        scheduled_date: format(date, 'yyyy-MM-dd'),
        time_slot: form.time_slot,
        address: form.address,
        notes: `【${serviceName}】${notesArr.join(' | ')}`,
      });

      window.location.href = `/PaymentRedirect?booking_id=${booking.id}&amount=${config.priceBase}&item_name=${encodeURIComponent(`HESON ${serviceName}`)}`;
    } catch (error) {
      setIsSubmitting(false);
      toast.error('預約建立失敗，請稍後重試');
    }
  };

  const Field = ({ label, children, required }) => (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-8 bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <div className="text-5xl mb-4">{config.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-light text-stone-800">
            <span className="font-medium">{config.title}</span>
          </h1>
          <p className="text-stone-500 mt-3">{config.desc}</p>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 基本聯絡 */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="姓名" required>
                <Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="您的姓名" className="rounded-xl" />
              </Field>
              <Field label="聯絡電話" required>
                <Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0912-345-678" className="rounded-xl" />
              </Field>
            </div>

            {f.includes("company") && (
              <Field label="公司名稱" required>
                <Input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="公司名稱" className="rounded-xl" />
              </Field>
            )}

            <Field label="服務地址" required>
              <Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="請輸入完整地址" className="rounded-xl" />
            </Field>

            {f.includes("housing_type") && (
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="房屋類型">
                  <Select value={form.housing_type} onValueChange={v=>setForm({...form,housing_type:v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="透天">透天</SelectItem>
                      <SelectItem value="公寓">公寓</SelectItem>
                      <SelectItem value="華廈、大樓">華廈、大樓</SelectItem>
                      <SelectItem value="農舍">農舍</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="坪數">
                  <Input type="number" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})} placeholder="例：30" className="rounded-xl" />
                </Field>
              </div>
            )}

            {f.includes("sqft") && !f.includes("housing_type") && (
              <Field label="空間坪數">
                <Input type="number" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})} placeholder="例：30" className="rounded-xl" />
              </Field>
            )}

            {f.includes("clean_type") && (
              <Field label="清潔類型">
                <Select value={form.clean_type} onValueChange={v=>setForm({...form,clean_type:v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="單次">單次清潔</SelectItem>
                    <SelectItem value="定期">定期清潔（週一次）</SelectItem>
                    <SelectItem value="大掃除">年度大掃除</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {f.includes("clean_freq") && (
              <Field label="清潔頻率">
                <Select value={form.clean_freq} onValueChange={v=>setForm({...form,clean_freq:v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="每週一次">每週一次</SelectItem>
                    <SelectItem value="每兩週一次">每兩週一次</SelectItem>
                    <SelectItem value="每月一次">每月一次</SelectItem>
                    <SelectItem value="單次">單次</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {f.includes("appliances") && (
              <Field label="需要清洗的家電（請填寫台數）">
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {applianceOptions.map(item => (
                    <div key={item} className="flex items-center gap-2 bg-stone-50 rounded-xl p-3">
                      <span className="text-sm text-stone-700 flex-1">{item}</span>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={appliances[item] || 0}
                        onChange={e=>setAppliances({...appliances,[item]:parseInt(e.target.value)||0})}
                        className="w-16 rounded-lg text-center"
                      />
                      <span className="text-xs text-stone-400">台</span>
                    </div>
                  ))}
                </div>
              </Field>
            )}

            {f.includes("fabric_items") && (
              <Field label="需要清洗的布面項目（請填寫件數）">
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {fabricOptions.map(item => (
                    <div key={item} className="flex items-center gap-2 bg-stone-50 rounded-xl p-3">
                      <span className="text-sm text-stone-700 flex-1">{item}</span>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={fabricItems[item] || 0}
                        onChange={e=>setFabricItems({...fabricItems,[item]:parseInt(e.target.value)||0})}
                        className="w-16 rounded-lg text-center"
                      />
                      <span className="text-xs text-stone-400">件</span>
                    </div>
                  ))}
                </div>
              </Field>
            )}

            {f.includes("space_desc") && (
              <Field label="空間描述">
                <Textarea value={form.space_desc} onChange={e=>setForm({...form,space_desc:e.target.value})} placeholder="例：客廳雜物過多，需要分類收納..." className="rounded-xl" />
              </Field>
            )}

            {f.includes("finish_date") && (
              <Field label="裝潢完工日期（預計）">
                <Input type="date" value={form.finish_date} onChange={e=>setForm({...form,finish_date:e.target.value})} className="rounded-xl" />
              </Field>
            )}

            {/* 日期時間 */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="希望服務日期" required>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal rounded-xl">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: zhTW }) : "選擇日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={d=>d<new Date()} initialFocus />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field label="希望時段" required>
                <Select value={form.time_slot} onValueChange={v=>setForm({...form,time_slot:v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇時段" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="備註">
              <Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="有任何特殊需求或說明..." className="rounded-xl" />
            </Field>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl text-base">
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />處理中...</> : <>確認預約並前往付款 <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>

            <p className="text-xs text-stone-400 text-center">送出後將引導您完成付款，付款成功即確認預約</p>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
}