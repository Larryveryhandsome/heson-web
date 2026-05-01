import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldBan, ShieldCheck, Monitor, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DeviceManager() {
  const [search, setSearch] = useState('');
  const [confirmBan, setConfirmBan] = useState(null); // { fingerprint, userAgent, associated_emails }
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['bannedDevices'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listBannedDevices', { _: 1 });
      return res.data?.devices || [];
    },
  });

  const filtered = devices.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.fingerprint || '').includes(q) ||
      (d.reason || '').toLowerCase().includes(q) ||
      (d.banned_by || '').toLowerCase().includes(q) ||
      (d.associated_emails || []).some(e => e.toLowerCase().includes(q)) ||
      (d.user_agent || '').toLowerCase().includes(q)
    );
  });

  const activeBanned = devices.filter(d => d.is_active);

  const handleToggleBan = async (device, banAction) => {
    if (banAction === 'ban') {
      setConfirmBan(device);
      setReason('');
      return;
    }
    setLoading(true);
    await base44.functions.invoke('banDevice', { action: 'unban', recordId: device.id });
    queryClient.invalidateQueries({ queryKey: ['bannedDevices'] });
    setLoading(false);
  };

  const confirmBanDevice = async () => {
    if (!confirmBan) return;
    setLoading(true);
    await base44.functions.invoke('banDevice', {
      action: 'ban',
      fingerprint: confirmBan.fingerprint,
      userAgent: confirmBan.user_agent,
      reason: reason || '管理員封禁',
    });
    queryClient.invalidateQueries({ queryKey: ['bannedDevices'] });
    setConfirmBan(null);
    setReason('');
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="p-4 border-b border-stone-100 bg-white flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2 text-sm">
          <Monitor className="w-4 h-4 text-stone-400" />
          <span className="text-stone-500">共記錄 <strong className="text-stone-800">{devices.length}</strong> 台裝置</span>
        </div>
        <Badge className="bg-red-100 text-red-700">封禁中 {activeBanned.length}</Badge>
        <Badge className="bg-green-100 text-green-700">已解封 {devices.length - activeBanned.length}</Badge>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-stone-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋指紋、Email、User-Agent..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            {search ? '找不到符合的裝置' : '目前無裝置紀錄（裝置在用戶登入後自動記錄）'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(device => (
              <div key={device.id} className={`bg-white border rounded-xl p-4 flex flex-col gap-3 ${device.is_active ? 'border-red-200 bg-red-50/30' : 'border-stone-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Monitor className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      <span className="font-mono text-xs text-stone-600 break-all">{device.fingerprint}</span>
                      {device.is_active ? (
                        <Badge className="bg-red-100 text-red-700 text-xs flex-shrink-0">封禁中</Badge>
                      ) : (
                        <Badge className="bg-stone-100 text-stone-500 text-xs flex-shrink-0">已解封</Badge>
                      )}
                    </div>
                    {device.reason && (
                      <p className="text-xs text-red-600 mb-1">封禁原因：{device.reason}</p>
                    )}
                    {device.user_agent && (
                      <p className="text-xs text-stone-400 truncate">{device.user_agent}</p>
                    )}
                    {device.associated_emails?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {device.associated_emails.map(email => (
                          <span key={email} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">{email}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-stone-400">
                      {device.banned_by && <span>封禁者：{device.banned_by}</span>}
                      {device.created_date && <span>{format(new Date(device.created_date), 'yyyy/MM/dd', { locale: zhTW })}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {device.is_active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
                        disabled={loading}
                        onClick={() => handleToggleBan(device, 'unban')}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />解封
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50"
                        disabled={loading}
                        onClick={() => handleToggleBan(device, 'ban')}
                      >
                        <ShieldBan className="w-3.5 h-3.5" />封禁
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-400">
        💡 裝置在用戶登入後自動記錄。封禁裝置後，任何從該裝置嘗試存取的用戶都將被擋在平台外。
      </div>

      {/* Confirm Ban Dialog */}
      <Dialog open={!!confirmBan} onOpenChange={() => setConfirmBan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              確認封禁裝置
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              封禁後，所有從此裝置嘗試訪問的用戶將被擋在平台外。
            </p>
            <div className="bg-stone-50 rounded-lg p-3 text-xs font-mono text-stone-500 break-all">
              {confirmBan?.fingerprint}
            </div>
            {confirmBan?.associated_emails?.length > 0 && (
              <div>
                <p className="text-xs text-stone-500 mb-1">關聯帳號：</p>
                <div className="flex flex-wrap gap-1">
                  {confirmBan.associated_emails.map(e => (
                    <span key={e} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">{e}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-stone-600 font-medium">封禁原因（選填）</label>
              <Input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="輸入封禁原因..."
                className="mt-1 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBan(null)}>取消</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={confirmBanDevice} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '確認封禁'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}