import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, User, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const ACTION_LABELS = {
  create: { label: '新增', icon: PlusCircle, color: 'bg-green-100 text-green-700' },
  update: { label: '編輯', icon: Edit2, color: 'bg-blue-100 text-blue-700' },
  delete: { label: '刪除', icon: Trash2, color: 'bg-red-100 text-red-700' },
};

export default function ScheduleHistoryDrawer({ open, onClose, histories, onRestore }) {
  const cutoff = subDays(new Date(), 30);
  const recent = (histories || []).filter(h => {
    try { return parseISO(h.changed_at || h.created_date) >= cutoff; } catch { return true; }
  }).sort((a, b) => new Date(b.changed_at || b.created_date) - new Date(a.changed_at || a.created_date));

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            變更歷史（近 30 天）
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {recent.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-8">暫無變更記錄</p>
          )}
          {recent.map((h) => {
            const actionInfo = ACTION_LABELS[h.action] || ACTION_LABELS.update;
            const ActionIcon = actionInfo.icon;
            const snap = h.snapshot || {};
            let timeStr = '';
            try {
              timeStr = format(parseISO(h.changed_at || h.created_date), 'MM/dd HH:mm', { locale: zhTW });
            } catch {
              timeStr = h.changed_at || h.created_date || '';
            }
            return (
              <div key={h.id} className="border border-stone-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={actionInfo.color + ' gap-1 text-xs'}>
                      <ActionIcon className="w-3 h-3" />{actionInfo.label}
                    </Badge>
                    <span className="text-xs text-stone-400">{timeStr}</span>
                  </div>
                  {h.action !== 'delete' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs gap-1 px-2"
                      onClick={() => onRestore(h)}
                    >
                      <RotateCcw className="w-3 h-3" />還原
                    </Button>
                  )}
                </div>
                <div className="text-xs text-stone-600 space-y-0.5">
                  {snap.worker_name && <div className="flex items-center gap-1"><User className="w-3 h-3 text-stone-400" />{snap.worker_name}</div>}
                  {snap.date && <div>{snap.date} {snap.time_slot}</div>}
                  {snap.location && <div>📍 {snap.location}</div>}
                  {h.description && <div className="text-stone-400 italic">{h.description}</div>}
                </div>
                {h.changed_by && (
                  <div className="text-[10px] text-stone-400">操作者：{h.changed_by}</div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}