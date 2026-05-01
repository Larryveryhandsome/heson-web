import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Briefcase, FileText, Check, Trash2, AlignLeft } from 'lucide-react';

const DEFAULT_FORM = {
  date: '',
  time_slot: '',
  worker_name: '',
  location: '',
  work_type: '清潔',
  notes: '',
  status: '已排班',
};

const TIME_SLOTS = [
  '08:00-12:00', '09:00-13:00', '10:00-14:00',
  '13:00-17:00', '14:00-18:00', '15:00-19:00',
  '18:00-21:00', '09:00-17:00', '全天'
];

export default function ScheduleFormDialog({ open, onClose, onSave, initial, onDelete }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({ ...DEFAULT_FORM, ...initial });
    } else {
      setForm(DEFAULT_FORM);
    }
    setPreview(false);
  }, [initial, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isValid = form.date && form.time_slot && form.worker_name;

  const statusColor = { '已排班': 'bg-blue-100 text-blue-700', '已完成': 'bg-green-100 text-green-700', '已取消': 'bg-red-100 text-red-700' };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? '編輯排班' : '新增排班'}</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />日期 *</Label>
                <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" />時段 *</Label>
                <Select value={form.time_slot} onValueChange={v => set('time_slot', v)}>
                  <SelectTrigger><SelectValue placeholder="選擇時段" /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    <SelectItem value="custom">自訂</SelectItem>
                  </SelectContent>
                </Select>
                {form.time_slot === 'custom' && (
                  <Input placeholder="如 10:00-16:00" onChange={e => set('time_slot', e.target.value)} className="mt-1" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" />工讀生姓名 *</Label>
              <Input value={form.worker_name} onChange={e => set('worker_name', e.target.value)} placeholder="輸入姓名" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />工作地點</Label>
              <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="輸入地點" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Briefcase className="w-3 h-3" />工作類型</Label>
                <Select value={form.work_type} onValueChange={v => set('work_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="清潔">清潔</SelectItem>
                    <SelectItem value="整理">整理</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">狀態</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="已排班">已排班</SelectItem>
                    <SelectItem value="已完成">已完成</SelectItem>
                    <SelectItem value="已取消">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><FileText className="w-3 h-3" />備註</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="備註..." rows={2} />
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm text-stone-500 mb-3">請確認以下排班資訊：</p>
            <div className="bg-stone-50 rounded-lg p-4 space-y-2.5">
              {[
                { label: '日期', value: form.date, emoji: '📅' },
                { label: '時段', value: form.time_slot, emoji: '🕐' },
                { label: '工讀生', value: form.worker_name, emoji: '👤' },
                { label: '地點', value: form.location || '—', emoji: '📍' },
                { label: '類型', value: form.work_type, emoji: '💼' },
              ].map(({ label, value, emoji }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">{emoji} {label}</span>
                  <span className="text-sm font-medium text-stone-800">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500">狀態</span>
                <Badge className={statusColor[form.status]}>{form.status}</Badge>
              </div>
              {form.notes && (
                <div className="pt-1 border-t border-stone-200">
                  <p className="text-xs text-stone-500">備註：{form.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!preview ? (
            <>
              <div className="flex-1">
                {onDelete && (
                  <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={onDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={onClose}>取消</Button>
              <Button onClick={() => setPreview(true)} disabled={!isValid} className="bg-amber-500 hover:bg-amber-600">
                預覽確認
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPreview(false)}>返回修改</Button>
              <Button onClick={() => onSave(form)} className="bg-green-600 hover:bg-green-700 gap-1">
                <Check className="w-4 h-4" />確認儲存
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}