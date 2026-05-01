import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Home, Phone, MapPin, Users, PawPrint, LogOut } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ClientProfile() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    housing_type: '',
    square_footage: '',
    family_members: '',
    has_pets: false,
    subscription_plan: '無',
    remaining_visits: 0,
  });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: clientProfile, isLoading } = useQuery({
    queryKey: ['clientProfile', user?.id],
    queryFn: () => base44.entities.ClientProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  useEffect(() => {
    if (clientProfile?.[0]) {
      const p = clientProfile[0];
      setFormData({
        phone: p.phone || '',
        address: p.address || '',
        housing_type: p.housing_type || '',
        square_footage: p.square_footage || '',
        family_members: p.family_members || '',
        has_pets: p.has_pets || false,
        subscription_plan: p.subscription_plan || '無',
        remaining_visits: p.remaining_visits || 0,
      });
    }
  }, [clientProfile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const profile = clientProfile?.[0];
      if (profile) return base44.entities.ClientProfile.update(profile.id, data);
      return base44.entities.ClientProfile.create({ ...data, user_id: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile'] });
      toast.success("資料已更新");
    },
  });

  if (!user || isLoading) {
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
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 font-headline mb-1">帳戶設定</p>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-stone-900">個人資料</h1>
          </motion.div>

          {/* Profile Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            <div className="bg-[#131b2e] rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                  <span className="text-white text-2xl font-headline font-bold">
                    {user?.full_name?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-white font-headline font-extrabold text-xl">{user?.full_name || '訪客'}</h2>
                  <p className="text-[#7c839b] text-sm mt-0.5">{user?.email}</p>
                  {clientProfile?.[0]?.subscription_plan && (
                    <span className="inline-block mt-2 bg-white/10 text-[#bec6e0] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      {clientProfile[0].subscription_plan}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-white rounded-3xl border border-[#e8eef6] p-6 mb-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">帳戶資訊</p>
              <div className="space-y-4">
                {/* Phone */}
                <div className="flex items-center justify-between p-4 bg-[#eef4fc] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                      <Phone className="w-4 h-4 text-stone-700" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">聯絡電話</p>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0912-345-678"
                        className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center justify-between p-4 bg-[#eef4fc] rounded-2xl">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-stone-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">服務地址</p>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="請輸入完整地址"
                        className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#e8eef6] p-6 mb-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">居家資訊</p>
              <div className="space-y-4">
                {/* Housing + Sqft */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-[#eef4fc] rounded-2xl">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">房屋類型</p>
                    <Select value={formData.housing_type} onValueChange={(v) => setFormData({ ...formData, housing_type: v })}>
                      <SelectTrigger className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 text-sm focus:ring-0">
                        <SelectValue placeholder="請選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="透天">透天厝</SelectItem>
                        <SelectItem value="公寓">公寓</SelectItem>
                        <SelectItem value="大樓">大樓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-[#eef4fc] rounded-2xl">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">坪數</p>
                    <Input
                      type="number"
                      value={formData.square_footage}
                      onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                      placeholder="例：30"
                      className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm"
                    />
                  </div>
                </div>

                {/* Family */}
                <div className="flex items-center gap-3 p-4 bg-[#eef4fc] rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-stone-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">家庭成員</p>
                    <Input
                      value={formData.family_members}
                      onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                      placeholder="例：2大1小"
                      className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm"
                    />
                  </div>
                </div>

                {/* Pets */}
                <div className="flex items-center justify-between p-4 bg-[#eef4fc] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                      <PawPrint className="w-4 h-4 text-stone-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">是否有寵物</p>
                      <p className="text-xs text-stone-400">管理師均接受寵物友善訓練</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.has_pets}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_pets: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#e8eef6] p-6">
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-5">訂閱資訊</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Subscription Plan */}
                <div className="p-4 bg-[#eef4fc] rounded-2xl">
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">目前方案</p>
                  <Select value={formData.subscription_plan} onValueChange={(v) => setFormData({ ...formData, subscription_plan: v })} disabled>
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 text-sm focus:ring-0">
                      <SelectValue placeholder="請選擇" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="基礎月護-4次">基礎月護-4次</SelectItem>
                      <SelectItem value="進階月安-8次">進階月安-8次</SelectItem>
                      <SelectItem value="尊榮月恆-12次">尊榮月恆-12次</SelectItem>
                      <SelectItem value="單次清潔">單次清潔</SelectItem>
                      <SelectItem value="無">無</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Remaining Visits */}
                <div className="p-4 bg-[#eef4fc] rounded-2xl">
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">剩餘次數</p>
                  <Input
                    type="number"
                    value={formData.remaining_visits}
                    disabled
                    className="border-0 bg-transparent p-0 h-auto font-semibold text-stone-900 placeholder:text-stone-300 focus-visible:ring-0 text-sm disabled:opacity-100"
                  />
                </div>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="w-full bg-[#131b2e] text-white font-headline font-bold py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
            >
              {saveMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" />儲存中...</> : <><Save className="w-5 h-5" />儲存資料</>}
            </button>

            {/* Logout */}
            <button
              onClick={() => base44.auth.logout()}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#eef4fc] hover:bg-red-50 hover:text-red-600 transition-colors duration-300 font-semibold text-stone-500 text-sm"
            >
              <LogOut className="w-4 h-4" />登出
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}