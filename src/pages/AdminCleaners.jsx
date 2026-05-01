import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { User, Shield, CheckCircle, XCircle, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function AdminCleaners() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: cleaners } = useQuery({
    queryKey: ['allCleaners'],
    queryFn: () => base44.entities.CleanerProfile.list('-created_date'),
    initialData: [],
  });

  const updateCleanerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CleanerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCleaners'] });
      toast.success("更新成功");
    },
  });

  const toggleActive = (cleaner) => {
    updateCleanerMutation.mutate({
      id: cleaner.id,
      data: { is_active: !cleaner.is_active }
    });
  };

  const toggleVerification = (cleaner, field) => {
    updateCleanerMutation.mutate({
      id: cleaner.id,
      data: { [field]: !cleaner[field] }
    });
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
        <Sidebar userRole="admin" userName={user?.full_name} />
      </div>
      <MobileNav userRole="admin" userName={user?.full_name} />
      
      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-stone-800">管理師管理</h1>
            <p className="text-stone-500 mt-1">審核與管理家事管理師帳號</p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-stone-500">總管理師數</p>
                <p className="text-3xl font-semibold text-stone-800 mt-1">{cleaners?.length || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-stone-500">已啟用</p>
                <p className="text-3xl font-semibold text-green-600 mt-1">
                  {cleaners?.filter(c => c.is_active).length || 0}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-stone-500">待審核</p>
                <p className="text-3xl font-semibold text-yellow-600 mt-1">
                  {cleaners?.filter(c => !c.is_active).length || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cleaners Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>管理師</TableHead>
                        <TableHead>聯絡資訊</TableHead>
                        <TableHead>服務區域</TableHead>
                        <TableHead>驗證狀態</TableHead>
                        <TableHead>帳號狀態</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cleaners?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-stone-400">
                            暫無管理師資料
                          </TableCell>
                        </TableRow>
                      ) : (
                        cleaners?.map((cleaner) => (
                          <TableRow key={cleaner.id} className="hover:bg-stone-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-stone-800">{cleaner.nickname}</p>
                                  <p className="text-xs text-stone-400">年資 {cleaner.experience_years || 0} 年</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                  <Phone className="w-3 h-3" />
                                  {cleaner.phone || '-'}
                                </div>
                                <p className="text-xs text-stone-400">LINE: {cleaner.line_id || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {cleaner.service_areas?.map((area) => (
                                  <Badge key={area} variant="secondary" className="text-xs">
                                    {area}
                                  </Badge>
                                )) || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <button
                                  onClick={() => toggleVerification(cleaner, 'police_record_verified')}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {cleaner.police_record_verified ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-stone-300" />
                                  )}
                                  <span className={cleaner.police_record_verified ? 'text-green-700' : 'text-stone-400'}>
                                    良民證
                                  </span>
                                </button>
                                <button
                                  onClick={() => toggleVerification(cleaner, 'id_verified')}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {cleaner.id_verified ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-stone-300" />
                                  )}
                                  <span className={cleaner.id_verified ? 'text-green-700' : 'text-stone-400'}>
                                    身分證
                                  </span>
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={cleaner.is_active}
                                  onCheckedChange={() => toggleActive(cleaner)}
                                />
                                <span className={`text-sm ${cleaner.is_active ? 'text-green-600' : 'text-stone-400'}`}>
                                  {cleaner.is_active ? '已啟用' : '未啟用'}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}