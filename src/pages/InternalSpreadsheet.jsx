import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, Edit2, Check, X, RefreshCw, Table,
  Search, Loader2, ShieldCheck, Monitor, ArrowLeft, Undo2
} from "lucide-react";
import RoleManager from "@/components/internal/RoleManager";
import DeviceManager from "@/components/internal/DeviceManager";

// ─────────────────────────────────────────────
// 可編輯儲存格
// ─────────────────────────────────────────────
function EditableCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');

  const handleSave = () => {
    onSave(val);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[120px]">
        <Input
          value={val}
          onChange={e => setVal(e.target.value)}
          className="h-7 text-xs px-1 py-0"
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          autoFocus
        />
        <button onClick={handleSave} className="text-green-600 hover:text-green-700">
          <Check className="w-3 h-3" />
        </button>
        <button onClick={() => setEditing(false)} className="text-red-500 hover:text-red-600">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-1 cursor-pointer hover:bg-amber-50 rounded px-1 min-h-[24px] min-w-[80px]"
      onClick={() => setEditing(true)}
    >
      <span className="text-xs text-stone-700">{value ?? '-'}</span>
      <Edit2 className="w-3 h-3 text-stone-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 flex-shrink-0" />
    </div>
  );
}

// ─────────────────────────────────────────────
// AI 助理
// ─────────────────────────────────────────────
function AIChat({ bookings, onMutation }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '您好！我是內部 AI 助理。您可以要求我：\n1. **修改試算表資料**（例：「把張三的狀態改成已完成」）\n2. **查詢資料**（例：「列出本週所有待確認的預約」）\n請問有什麼需要協助的？'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('spreadsheetAI', {
        message: userMsg,
        bookings: bookings
      });
      const data = response.data;

      if (data.mutations && data.mutations.length > 0) {
        const undoItems = [];
        for (const m of data.mutations) {
          const oldBooking = bookings.find(b => b.id === m.id);
          if (oldBooking) {
            if (m.delete) {
              await base44.entities.Booking.delete(m.id);
              undoItems.push({ id: m.id, oldFields: oldBooking, delete: true });
            } else if (m.fields) {
              const oldFields = {};
              Object.keys(m.fields).forEach(k => { oldFields[k] = oldBooking[k]; });
              await base44.entities.Booking.update(m.id, m.fields);
              undoItems.push({ id: m.id, oldFields, newFields: m.fields });
            }
          }
        }
        if (undoItems.length > 0 && onMutation) {
          onMutation({ type: 'ai', items: undoItems, description: `AI 修改 ${undoItems.length} 筆資料` });
        }
        queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] });
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 發生錯誤，請稍後再試。' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-amber-600" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user'
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-700'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
              <Bot className="w-4 h-4 text-amber-600" />
            </div>
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-stone-200 p-3 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="輸入指令或問題..."
          className="text-sm"
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          size="icon"
          className="bg-stone-800 hover:bg-stone-900 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 欄位定義
// ─────────────────────────────────────────────
const COLUMNS = [
  { key: 'client_name',   label: '客戶姓名',   editable: true },
  { key: 'service_type',  label: '服務類型',   editable: true },
  { key: 'scheduled_date',label: '預約日期',   editable: true },
  { key: 'time_slot',     label: '時段',       editable: true },
  { key: 'status',        label: '狀態',       editable: true },
  { key: 'address',       label: '地址',       editable: true },
  { key: 'cleaner_name',  label: '指派管理師', editable: true },
  { key: 'notes',         label: '備註',       editable: true },
  { key: 'created_date',  label: '建立時間',   editable: false },
];

// ─────────────────────────────────────────────
// 主頁面
// ─────────────────────────────────────────────
export default function InternalSpreadsheet() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('sheet');
  const queryClient = useQueryClient();
  const [undoStack, setUndoStack] = useState([]);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const me = await base44.auth.me();
      if (me.role !== 'admin') { window.location.href = '/'; return; }
      setUser(me);
      setAuthChecked(true);
    };
    check();
  }, []);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['spreadsheetBookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 200),
    enabled: authChecked,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fields }) => base44.entities.Booking.update(id, fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] }),
  });

  const recordUndo = (item) => {
    setUndoStack(prev => [...prev.slice(-49), item]);
  };

  const handleUndo = async () => {
    if (undoStack.length === 0 || undoing) return;
    setUndoing(true);
    const lastAction = undoStack[undoStack.length - 1];
    try {
      if (lastAction.type === 'single') {
        await base44.entities.Booking.update(lastAction.id, lastAction.oldFields);
      } else if (lastAction.type === 'ai') {
        for (const item of lastAction.items) {
          if (item.delete) {
            await base44.entities.Booking.create(item.oldFields);
          } else {
            await base44.entities.Booking.update(item.id, item.oldFields);
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['spreadsheetBookings'] });
      setUndoStack(prev => prev.slice(0, -1));
    } catch (err) {
      console.error('Undo failed:', err);
    }
    setUndoing(false);
  };

  const handleCellUpdate = (booking, field, newValue) => {
    const oldValue = booking[field];
    if (oldValue === newValue) return;
    recordUndo({
      type: 'single',
      id: booking.id,
      oldFields: { [field]: oldValue },
      description: `修改 ${booking.client_name || '資料'} 的${COLUMNS.find(c => c.key === field)?.label || field}`
    });
    updateMutation.mutate({ id: booking.id, fields: { [field]: newValue } });
  };

  const filtered = bookings.filter(b => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.client_name   || '').toLowerCase().includes(q) ||
      (b.service_type  || '').toLowerCase().includes(q) ||
      (b.status        || '').toLowerCase().includes(q) ||
      (b.address       || '').toLowerCase().includes(q) ||
      (b.cleaner_name  || '').toLowerCase().includes(q)
    );
  });

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0 h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Table className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-stone-800 text-sm">內部試算表</h1>
            <p className="text-xs text-stone-400">清潔訂單 · 共 {bookings.length} 筆</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0 || undoing}
            className="gap-1 text-xs px-2"
            title={undoStack.length > 0 ? `復原：${undoStack[undoStack.length - 1]?.description || '上一步'}` : '沒有可復原的操作'}
          >
            <Undo2 className="w-3 h-3" />
            <span className="hidden sm:inline">復原</span>
            {undoStack.length > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px] bg-amber-100 text-amber-700">{undoStack.length}</Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="gap-1 text-xs px-2">
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">重整</span>
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-stone-200 px-2 flex gap-0 flex-shrink-0 overflow-x-auto">
        {[
          { id: 'sheet',   icon: Table,       label: '試算表'  },
          { id: 'ai',      icon: Bot,         label: 'AI 助理' },
          { id: 'roles',   icon: ShieldCheck, label: '權限管理' },
          { id: 'devices', icon: Monitor,     label: '裝置封禁' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden flex min-h-0">

        {/* 試算表 tab */}
        {activeTab === 'sheet' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 搜尋列 */}
            <div className="px-3 py-2 bg-white border-b border-stone-200 flex items-center gap-2 flex-shrink-0">
              <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜尋客戶、服務類型、狀態、地址..."
                className="text-sm border-0 focus-visible:ring-0 p-0 h-auto shadow-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-stone-400 hover:text-stone-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 表格 */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                </div>
              ) : (
                <table className="w-full text-xs border-collapse min-w-max">
                  <thead className="sticky top-0 bg-stone-50 z-10">
                    <tr>
                      <th className="px-2 py-2 text-center font-medium text-stone-400 border-b border-r border-stone-200 w-8">#</th>
                      {COLUMNS.map(col => (
                        <th
                          key={col.key}
                          className="px-3 py-2 text-left font-medium text-stone-600 border-b border-r border-stone-200 whitespace-nowrap"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length + 1} className="text-center py-12 text-stone-400">
                          {searchTerm ? '沒有符合的資料' : '尚無預約資料'}
                        </td>
                      </tr>
                    ) : filtered.map((booking, idx) => (
                      <tr key={booking.id} className="hover:bg-amber-50/40 border-b border-stone-100">
                        <td className="px-2 py-1 text-stone-400 border-r border-stone-100 text-center">{idx + 1}</td>
                        {COLUMNS.map(col => (
                          <td key={col.key} className="px-1 py-0.5 border-r border-stone-100">
                            {col.editable ? (
                              <EditableCell
                                value={booking[col.key]}
                                onSave={val => handleCellUpdate(booking, col.key, val)}
                              />
                            ) : (
                              <span className="px-1 text-xs text-stone-500">
                                {col.key === 'created_date' && booking[col.key]
                                  ? new Date(booking[col.key]).toLocaleDateString('zh-TW')
                                  : booking[col.key] || '-'}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* AI 助理 tab */}
        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AIChat bookings={bookings} onMutation={recordUndo} />
          </div>
        )}

        {/* 權限管理 tab */}
        {activeTab === 'roles' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <RoleManager />
          </div>
        )}

        {/* 裝置封禁 tab */}
        {activeTab === 'devices' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <DeviceManager />
          </div>
        )}
      </div>
    </div>
  );
}
