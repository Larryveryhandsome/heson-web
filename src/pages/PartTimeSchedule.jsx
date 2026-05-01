import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, addWeeks, subWeeks, addMonths, subMonths, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, RefreshCw, History, Calendar, CalendarDays, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScheduleFormDialog from '@/components/schedule/ScheduleFormDialog';
import ScheduleHistoryDrawer from '@/components/schedule/ScheduleHistoryDrawer';
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar';
import { useToast } from '@/components/ui/use-toast';

export default function PartTimeSchedulePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const ok = await base44.auth.isAuthenticated();
      if (!ok) { base44.auth.redirectToLogin(); return; }
      const me = await base44.auth.me();
      if (me.role !== 'admin') { window.location.href = '/'; return; }
      setAuthChecked(true);
    })();
  }, []);

  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['partTimeSchedules'],
    queryFn: () => base44.entities.PartTimeSchedule.list('-date', 1000),
    enabled: authChecked,
  });

  const { data: histories = [] } = useQuery({
    queryKey: ['partTimeScheduleHistories'],
    queryFn: () => base44.entities.PartTimeScheduleHistory.list('-changed_at', 200),
    enabled: authChecked,
  });

  // Save history snapshot
  const saveHistory = async (schedule, action, description = '') => {
    const user = await base44.auth.me();
    await base44.entities.PartTimeScheduleHistory.create({
      schedule_id: schedule.id || 'new',
      action,
      snapshot: { ...schedule },
      changed_by: user?.email || '',
      changed_at: new Date().toISOString(),
      description,
    });
    queryClient.invalidateQueries({ queryKey: ['partTimeScheduleHistories'] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PartTimeSchedule.create(data),
    onSuccess: async (created, data) => {
      await saveHistory(created, 'create', `新增 ${data.worker_name} 的排班`);
      queryClient.invalidateQueries({ queryKey: ['partTimeSchedules'] });
      setFormOpen(false);
      toast({ description: '✅ 排班已新增' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PartTimeSchedule.update(id, data),
    onSuccess: async (updated, { id, data }) => {
      await saveHistory({ ...data, id }, 'update', `編輯 ${data.worker_name} 的排班`);
      queryClient.invalidateQueries({ queryKey: ['partTimeSchedules'] });
      setFormOpen(false);
      setEditingSchedule(null);
      toast({ description: '✅ 排班已更新' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PartTimeSchedule.delete(id),
    onSuccess: async (_, id) => {
      const s = schedules.find(x => x.id === id);
      if (s) await saveHistory(s, 'delete', `刪除 ${s.worker_name} 的排班`);
      queryClient.invalidateQueries({ queryKey: ['partTimeSchedules'] });
      setFormOpen(false);
      setEditingSchedule(null);
      toast({ description: '🗑️ 排班已刪除' });
    },
  });

  const handleSave = (formData) => {
    if (editingSchedule?.id) {
      updateMutation.mutate({ id: editingSchedule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleRestore = async (history) => {
    const snap = history.snapshot;
    if (!snap) return;
    if (snap.id) {
      await updateMutation.mutateAsync({ id: snap.id, data: snap });
    } else {
      await createMutation.mutateAsync(snap);
    }
    await saveHistory(snap, 'update', `從歷史版本還原`);
    toast({ description: '✅ 已還原歷史版本' });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('syncScheduleToGoogleSheet', {});
      toast({ description: `✅ ${res.data?.message || '同步完成'}` });
    } catch (err) {
      toast({ description: `❌ 同步失敗：${err.message}`, variant: 'destructive' });
    }
    setSyncing(false);
  };

  const navigatePrev = () => {
    setCurrentDate(d => viewMode === 'week' ? subWeeks(d, 1) : subMonths(d, 1));
  };
  const navigateNext = () => {
    setCurrentDate(d => viewMode === 'week' ? addWeeks(d, 1) : addMonths(d, 1));
  };

  const getPeriodLabel = () => {
    if (viewMode === 'week') {
      return format(currentDate, 'yyyy年 MM月 第wo週', { locale: zhTW });
    }
    return format(currentDate, 'yyyy年 MM月', { locale: zhTW });
  };

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h1 className="font-semibold text-stone-800 text-sm">狗米工讀排班</h1>
            <p className="text-xs text-stone-400">共 {schedules.length} 筆排班</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1 text-xs px-2" onClick={() => setHistoryOpen(true)}>
            <History className="w-3 h-3" />
            <span className="hidden sm:inline">歷史</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs px-2" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">同步 Sheet</span>
          </Button>
          <Button size="sm" className="gap-1 text-xs px-2 bg-amber-500 hover:bg-amber-600" onClick={() => { setEditingSchedule(null); setFormOpen(true); }}>
            <Plus className="w-3 h-3" />新增
          </Button>
        </div>
      </div>

      {/* Calendar nav */}
      <div className="bg-white border-b border-stone-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigatePrev}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium text-stone-700 min-w-[160px] text-center">{getPeriodLabel()}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigateNext}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-amber-600" onClick={() => setCurrentDate(new Date())}>今天</Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            className={`h-7 px-3 text-xs ${viewMode === 'week' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            onClick={() => setViewMode('week')}
          >週</Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            className={`h-7 px-3 text-xs ${viewMode === 'month' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            onClick={() => setViewMode('month')}
          >月</Button>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScheduleCalendar
            schedules={schedules}
            viewMode={viewMode}
            currentDate={currentDate}
            onSelectSchedule={(s) => { setEditingSchedule(s); setFormOpen(true); }}
            onDayClick={(day) => {
              setEditingSchedule({ date: format(day, 'yyyy-MM-dd') });
              setFormOpen(true);
            }}
          />
        </div>
      )}

      {/* Form dialog */}
      <ScheduleFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingSchedule(null); }}
        onSave={handleSave}
        initial={editingSchedule}
        onDelete={editingSchedule?.id ? () => deleteMutation.mutate(editingSchedule.id) : undefined}
      />

      {/* History drawer */}
      <ScheduleHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        histories={histories}
        onRestore={handleRestore}
      />
    </div>
  );
}