import React, { useState } from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function JoinCleaner() {
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', experience_years:'', transportation:'', notes:'' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('請填寫必填欄位'); return; }
    setLoading(true);
    await base44.entities.PartTimeWorker.create({ name: form.name, phone: form.phone, email: form.email, address: form.address, work_experience: form.experience_years + '年', transportation: form.transportation, notes: form.notes, is_active: false });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) return (
    <div className="min-h-screen"><Navbar />
      <div className="flex items-center justify-center min-h-[70vh] pt-20">
        <div className="text-center p-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-medium text-stone-800 mb-2">申請已送出！</h2>
          <p className="text-stone-500">我們將於3個工作天內與您聯繫，感謝您有意加入HESON團隊。</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen"><Navbar />
      <section className="pt-32 pb-8 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl md:text-4xl font-light text-stone-800">加入<span className="font-medium">服務人員</span></h1>
          <p className="text-stone-500 mt-3">成為HESON的專業服務人員，靈活排班、穩定收入</p>
        </div>
      </section>
      <section className="py-10 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[{emoji:"💰",t:"高薪保障",d:"平均時薪 $300 起"},{emoji:"🕐",t:"彈性排班",d:"自由選擇接案時間"},{emoji:"🏆",t:"專業培訓",d:"上崗前完整教育訓練"}].map(i=>(
              <div key={i.t} className="text-center p-5 bg-amber-50 rounded-2xl">
                <div className="text-3xl mb-2">{i.emoji}</div>
                <p className="font-medium text-stone-800">{i.t}</p>
                <p className="text-xs text-stone-500 mt-1">{i.d}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>姓名 *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="您的姓名" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>聯絡電話 *</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0912-345-678" className="rounded-xl" /></div>
            </div>
            <div className="space-y-2"><Label>電子郵件</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="your@email.com" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>居住地址</Label><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="縣市區鄉鎮" className="rounded-xl" /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>相關工作年資</Label><Select value={form.experience_years} onValueChange={v=>setForm({...form,experience_years:v})}><SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger><SelectContent><SelectItem value="0">無經驗（可受訓）</SelectItem><SelectItem value="1">1-2年</SelectItem><SelectItem value="3">3-5年</SelectItem><SelectItem value="5">5年以上</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>交通工具</Label><Select value={form.transportation} onValueChange={v=>setForm({...form,transportation:v})}><SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger><SelectContent><SelectItem value="機車">機車</SelectItem><SelectItem value="汽車">汽車</SelectItem><SelectItem value="大眾運輸">大眾運輸</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>自我介紹（選填）</Label><Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="介紹您的優勢或特殊技能..." className="rounded-xl" /></div>
            <Button type="submit" disabled={loading} className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl text-base">
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />送出中...</> : "送出申請"}
            </Button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
}