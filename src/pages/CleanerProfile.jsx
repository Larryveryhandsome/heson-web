import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const serviceAreas = ['台北市', '新北市', '宜蘭縣'];

export default function CleanerProfile() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
    line_id: '',
    service_areas: [],
    experience_years: '',
    pet_acceptance: false,
    has_own_tools: false,
    transportation: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: cleanerProfile, isLoading } = useQuery({
    queryKey: ['cleanerProfile', user?.id],
    queryFn: () => base44.entities.CleanerProfile.filter({ user_id: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  useEffect(() => {
    if (cleanerProfile?.[0]) {
      const profile = cleanerProfile[0];
      setFormData({
        nickname: profile.nickname || '',
        phone: profile.phone || '',
        line_id: profile.line_id || '',
        service_areas: profile.service_areas || [],
        experience_years: profile.experience_years || '',
        pet_acceptance: profile.pet_acceptance || false,
        has_own_tools: profile.has_own_tools || false,
        transportation: profile.transportation || '',
      });
    }
  }, [cleanerProfile]);

  const profile = cleanerProfile?.[0];

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return base44.entities.CleanerProfile.update(profile.id, data);
      } else {
        return base44.entities.CleanerProfile.create({ ...data, user_id: user?.id, is_active: false });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleanerProfile'] });
      toast.success("資料已更新");
    },
  });

  const toggleServiceArea = (area) => {
    const newAreas = formData.service_areas.includes(area)
      ? formData.service_areas.filter(a => a !== area)
      : [...formData.service_areas, area];
    setFormData({ ...formData, service_areas: newAreas });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block">
        <Sidebar userRole="cleaner" userName={profile?.nickname || user?.full_name} />
      </div>
      <MobileNav userRole="cleaner" userName={profile?.nickname || user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">個人資料</h1>
            <p className="text-stone-500 mt-1">更新您的管理師資料</p>
          </div>

          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="mb-6 shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-medium text-stone-800">{profile?.nickname || user?.full_name || '訪客'}</h2>
                    <p className="text-stone-500">{user?.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {profile?.is_active ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已啟用
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        待審核
                      </Badge>
                    )}
                    {profile?.police_record_verified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Shield className="w-3 h-3 mr-1" />
                        良民證已驗證
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">管理師資訊</CardTitle>
                <CardDescription>
                  完善您的資料以獲得更多接案機會
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">暱稱</Label>
                      <Input
                        id="nickname"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        placeholder="例：林小姐"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">聯絡電話</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0912-345-678"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="line_id">LINE ID</Label>
                      <Input
                        id="line_id"
                        value={formData.line_id}
                        onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                        placeholder="您的 LINE ID"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exp">年資</Label>
                      <Input
                        id="exp"
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                        placeholder="例：3"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Service Areas */}
                  <div className="space-y-3">
                    <Label>服務區域</Label>
                    <div className="flex flex-wrap gap-2">
                      {serviceAreas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleServiceArea(area)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            formData.service_areas.includes(area)
                              ? 'bg-amber-500 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transportation */}
                  <div className="space-y-2">
                    <Label>交通工具</Label>
                    <Select 
                      value={formData.transportation} 
                      onValueChange={(v) => setFormData({ ...formData, transportation: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="請選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="機車">機車</SelectItem>
                        <SelectItem value="汽車">汽車</SelectItem>
                        <SelectItem value="大眾運輸">大眾運輸</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Switches */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                      <div>
                        <Label htmlFor="pets" className="cursor-pointer">接受寵物家庭</Label>
                        <p className="text-sm text-stone-500 mt-1">
                          願意服務有寵物的家庭
                        </p>
                      </div>
                      <Switch
                        id="pets"
                        checked={formData.pet_acceptance}
                        onCheckedChange={(checked) => setFormData({ ...formData, pet_acceptance: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                      <div>
                        <Label htmlFor="tools" className="cursor-pointer">自備清潔工具</Label>
                        <p className="text-sm text-stone-500 mt-1">
                          可自行攜帶專業清潔工具
                        </p>
                      </div>
                      <Switch
                        id="tools"
                        checked={formData.has_own_tools}
                        onCheckedChange={(checked) => setFormData({ ...formData, has_own_tools: checked })}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl text-base"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        儲存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        儲存資料
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