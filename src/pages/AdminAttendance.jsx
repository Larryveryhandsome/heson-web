import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, CheckCircle, XCircle, Clock, AlertCircle, Plus, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const statusConfig = {
  '出勤': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  '請假': { color: 'bg-blue-100 text-blue-700', icon: Calendar },
  '遲到': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  '缺勤': { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminAttendance() {
  const [user, setUser] = useState(null);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM'));
  const [filterStatus, setFilterStatus] = useState('全部');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ cleaner_name: '', date: format(new Date(), 'yyyy-MM-dd'), check_in: '', check_out: '', status: '出勤', notes: '' });
  const qc = useQueryClient();

  useEffect(() => {
    const load = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') { window.location.href = createPageUrl("Home"); return; }
      setUser(userData);
    };
    load();
  }, []);

  const { data: attendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date'),
    initialData: [],
  });

  const { data: cleaners } = useQuery({
    queryKey: ['cleanersForAttendance'],
    queryFn: () => base44.entities.CleanerProfile.filter({ is_active: true }),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setShowDialog(false);
      toast.success('出勤記錄已新增');
      setForm({ cleaner_name: '', date: format(new Date(), 'yyyy-MM-dd'), check_in: '', check_out: '', status: '出勤', notes: '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Attendance.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }); toast.success('已更新'); }
  });

  const filtered = attendance.filter(a => {
    const matchDate = a.date?.startsWith(filterDate);
    const matchStatus = filterStatus === '全部' || a.status === filterStatus;
    return matchDate && matchStatus;
  });

  const stats = {
    出勤: filtered.filter(a => a.status === '出勤').length,
    請假: filtered.filter(a => a.status === '請假').length,
    遲到: filtered.filter(a => a.status === '遲到').length,
    缺勤: filtered.filter(a => a.status === '缺勤').length,
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <div className="hidden lg:block">
        <Sidebar userRole="admin" userName={user?.full_name} />
      </div>
      <MobileNav userRole="admin" userName={user?.full_name} />

      <main className="flex-1 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-medium text-stone-800">員工出勤管理</h1>
              <p className="text-stone-500 mt-1">管理師出勤記錄與統計</p>
            </div>
            <Button onClick={() => setShowDialog(true)} className="bg-stone-800 hover:bg-stone-900 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />新增記錄
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(stats).map(([key, val]) => {
              const cfg = statusConfig[key];
              const Icon = cfg.icon;
              return (
                <Card key={key} className="border-0 shadow-sm">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">{key}</p>
                      <p className="text-3xl font-semibold text-stone-800 mt-1">{val}</p>
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cfg.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Input
              type="month"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-40 rounded-xl"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['全部', '出勤', '請假', '遲到', '缺勤'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      {['管理師', '日期', '簽到', '簽退', '狀態', '備註', '操作'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-stone-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-stone-400 py-10">本月無出勤記錄</td></tr>
                    ) : filtered.map(a => (
                      <tr key={a.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3 font-medium text-stone-800">{a.cleaner_name || '-'}</td>
                        <td className="px-4 py-3 text-stone-600">{a.date}</td>
                        <td className="px-4 py-3 text-stone-600">{a.check_in || '-'}</td>
                        <td className="px-4 py-3 text-stone-600">{a.check_out || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={statusConfig[a.status]?.color || 'bg-stone-100 text-stone-600'}>
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-stone-500 text-sm max-w-[150px] truncate">{a.notes || '-'}</td>
                        <td className="px-4 py-3">
                          <Select value={a.status} onValueChange={val => updateMutation.mutate({ id: a.id, data: { status: val } })}>
                            <SelectTrigger className="w-24 h-8 text-xs rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['出勤', '請假', '遲到', '缺勤'].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增出勤記錄</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>管理師</Label>
              <Select value={form.cleaner_name} onValueChange={v => setForm({ ...form, cleaner_name: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="請選擇管理師" />
                </SelectTrigger>
                <SelectContent>
                  {cleaners.map(c => (
                    <SelectItem key={c.id} value={c.nickname}>{c.nickname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>日期</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>狀態</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['出勤', '請假', '遲到', '缺勤'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>簽到時間</Label>
                <Input type="time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>簽退時間</Label>
                <Input type="time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>備註</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="選填" className="rounded-xl" />
            </div>
            <Button
              className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-xl"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.cleaner_name || !form.date}
            >
              確認新增
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}