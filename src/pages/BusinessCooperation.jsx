import React, { useState } from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2, Building2, Users, Award, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'service@heson.tw';

export default function BusinessCooperation() {
  const [form, setForm] = useState({ company:'', name:'', phone:'', email:'', address:'', needs:'' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company || !form.name || !form.phone) { toast.error('請填寫必填欄位'); return; }
    setLoading(true);
    await base44.integrations.Core.SendEmail({
      to: ADMIN_EMAIL,
      subject: `企業合作洽談 - ${form.company}`,
      body: `公司名稱：${form.company}\n聯絡人：${form.name}\n電話：${form.phone}\n Email：${form.email}\n地址：${form.address}\n需求：${form.needs}`,
    });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) return (
    <div className="min-h-screen"><Navbar />
      <div className="flex items-center justify-center min-h-[70vh] pt-20">
        <div className="text-center p-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-medium text-stone-800 mb-2">感謝您的洽詢！</h2>
          <p className="text-stone-500">我們的企業服務專員將於2個工作天內與您聯繫。</p>
        </div>
      </div><Footer /></div>
  );

  return (
    <div className="min-h-screen"><Navbar />
      <section className="pt-32 pb-8 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl md:text-4xl font-light text-stone-800">企業<span className="font-medium">合作洽談</span></h1>
          <p className="text-stone-500 mt-3">專業企業清潔解決方案，讓您的工作環境始終保持最佳狀態</p>
        </div>
      </section>
      <section className="py-10 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[{Icon:Building2,t:"辦公室清潔",d:"定期清潔方案"},{Icon:Users,t:"專業團隊",d:"嚴格背景審查"},{Icon:Award,t:"品質保證",d:"服務滿意保障"},{Icon:Clock,t:"彈性時間",d:"不打擾工作時間"}].map(({Icon,...i})=>(
              <div key={i.t} className="text-center p-4 bg-stone-50 rounded-2xl">
                <Icon className="w-7 h-7 text-amber-600 mx-auto mb-2" />
                <p className="font-medium text-stone-800 text-sm">{i.t}</p>
                <p className="text-xs text-stone-500 mt-1">{i.d}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>公司名稱 *</Label><Input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="您的公司名稱" className="rounded-xl" /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>聯絡人 *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="姓名" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>聯絡電話 *</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0912-345-678" className="rounded-xl" /></div>
            </div>
            <div className="space-y-2"><Label>電子郵件</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="company@email.com" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>公司地址</Label><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="請輸入公司地址" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>合作需求說明</Label><Textarea value={form.needs} onChange={e=>setForm({...form,needs:e.target.value})} placeholder="請描述您的清潔需求、辦公室大小、清潔頻率等..." className="rounded-xl min-h-[120px]" /></div>
            <Button type="submit" disabled={loading} className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl text-base">
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />送出中...</> : "送出合作洽詢"}
            </Button>
          </form>
        </div>
      </section><Footer /></div>
  );
}