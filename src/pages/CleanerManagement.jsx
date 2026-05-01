import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, XCircle, Download, Phone, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CleanerManagement() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (auth) {
        const u = await base44.auth.me();
        setUser(u);
        if (u.role !== 'admin') window.location.href = '/';
      }
    });
  }, []);

  const { data: applications = [], refetch } = useQuery({
    queryKey: ['cleanerApplications', statusFilter],
    queryFn: () => base44.entities.CleanerApplication.filter({ status: statusFilter }),
  });

  const updateStatus = async (appId, newStatus) => {
    try {
      await base44.entities.CleanerApplication.update(appId, { status: newStatus });
      toast.success(`已更新為 ${newStatus === 'approved' ? '已核准' : '已拒絕'}`);
      refetch();
    } catch (e) {
      toast.error('更新失敗');
    }
  };

  const createCleanerProfile = async (app) => {
    try {
      await base44.entities.CleanerProfile.create({
        nickname: app.nickname,
        phone: app.phone,
        line_id: app.line_id,
        service_areas: [],
        experience_years: app.experience_years,
        pet_acceptance: app.pet_acceptance,
        has_own_tools: app.has_own_tools,
        transportation: app.transportation,
        police_record_verified: false,
        id_verified: true,
        is_active: true,
        profile_photo: null,
      });
      await updateStatus(app.id, 'approved');
      toast.success('清潔師檔案已建立');
      refetch();
    } catch (e) {
      toast.error('建立失敗');
    }
  };

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300'
  };

  const statusLabel = {
    pending: '待審核',
    approved: '已核准',
    rejected: '已拒絕'
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-stone-600">僅管理員可訪問此頁面</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-light text-stone-800">
              清潔師管理系統
            </h1>
          </div>
          <p className="text-stone-600">審核應徵申請、建立清潔師檔案</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                statusFilter === status
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300'
              }`}
            >
              {statusLabel[status]} ({applications.length})
            </button>
          ))}
        </div>

        {/* Applications Grid */}
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600 text-lg">暫無相關申請</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map((app) => (
              <Card key={app.id} className="border-stone-200 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-stone-800 flex items-center gap-2">
                        {app.nickname}
                        <span className={`text-xs px-3 py-1 rounded-full border ${statusColor[app.status]}`}>
                          {statusLabel[app.status]}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-stone-500 mt-1">申請日期：{new Date(app.created_date).toLocaleDateString('zh-TW')}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact & Documents */}
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-xl">
                    <div className="space-y-2 text-sm">
                      <p className="text-stone-600">
                        <Phone className="w-4 h-4 inline mr-2 text-amber-600" />
                        {app.phone}
                      </p>
                      <p className="text-stone-600">
                        <Mail className="w-4 h-4 inline mr-2 text-amber-600" />
                        {app.email || '未提供'}
                      </p>
                      <p className="text-stone-600">Line: {app.line_id || '未提供'}</p>
                      <p className="text-stone-600">住址：{app.address || '未提供'}</p>
                    </div>
                    <div className="space-y-2">
                      {app.id_copy_url && (
                        <a
                          href={app.id_copy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <Download className="w-4 h-4" /> 身分證影本
                        </a>
                      )}
                      {app.bank_copy_url && (
                        <a
                          href={app.bank_copy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <Download className="w-4 h-4" /> 銀行帳號影本
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Work Details */}
                  <div className="grid md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-sm">
                      <p className="text-blue-600 font-medium">經驗年數</p>
                      <p className="text-stone-700 mt-1">{app.experience_years} 年</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-blue-600 font-medium">交通工具</p>
                      <p className="text-stone-700 mt-1">{app.transportation || '大眾運輸'}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-blue-600 font-medium">期望薪資</p>
                      <p className="text-stone-700 mt-1">{app.expected_salary || '未指定'}</p>
                    </div>
                  </div>

                  {/* Work Preferences */}
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200 text-sm">
                    <div>
                      <p className="text-purple-600 font-medium mb-2">可工作情況</p>
                      <ul className="space-y-1 text-stone-700">
                        <li>• 每週 {app.available_days || '未指定'}</li>
                        <li>• 時段：{app.available_times || '未指定'}</li>
                        <li>• 可接受寵物家庭：{app.pet_acceptance ? '是' : '否'}</li>
                        <li>• 自備工具：{app.has_own_tools ? '是' : '否'}</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-purple-600 font-medium mb-2">過去經驗</p>
                      <p className="text-stone-700 line-clamp-4">{app.past_work || '無'}</p>
                    </div>
                  </div>

                  {/* Health Declaration */}
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-sm">
                    <p className="text-red-600 font-medium mb-2">健康狀況宣告</p>
                    <p className="text-stone-700">{app.health_issues || '無特殊健康問題'}</p>
                  </div>

                  {/* Action Buttons */}
                  {app.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => createCleanerProfile(app)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-5"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> 核准並建立檔案
                      </Button>
                      <Button
                        onClick={() => updateStatus(app.id, 'rejected')}
                        variant="destructive"
                        className="flex-1 rounded-xl py-5"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> 拒絕
                      </Button>
                    </div>
                  )}

                  {app.status === 'approved' && (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-sm text-green-700 font-medium">
                      ✓ 已核准並建立清潔師檔案
                    </div>
                  )}

                  {app.status === 'rejected' && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700 font-medium">
                      ✗ 申請已拒絕
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}