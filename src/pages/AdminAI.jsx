import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot, Send, Loader2, Copy, Check, Trash2,
  Sparkles, Terminal, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// Markdown 輕量渲染（程式碼區塊 + 粗體）
// ─────────────────────────────────────────────
function MdText({ text }) {
  const parts = [];
  const codeRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = codeRegex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: text.slice(last, m.index) });
    parts.push({ type: 'code', lang: m[1], content: m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

  return (
    <div className="space-y-2">
      {parts.map((p, i) =>
        p.type === 'code' ? (
          <CodeBlock key={i} lang={p.lang} code={p.content} />
        ) : (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: p.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/`([^`]+)`/g, '<code class="bg-stone-100 px-1 rounded text-xs font-mono">$1</code>')
            }}
          />
        )
      )}
    </div>
  );
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg overflow-hidden border border-stone-200">
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-800 text-xs text-stone-400">
        <span className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3" />
          {lang || 'code'}
        </span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-white transition-colors">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? '已複製' : '複製'}
        </button>
      </div>
      <pre className="bg-stone-900 text-stone-100 text-xs p-3 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────
// 快捷問題
// ─────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '目前有幾筆預約？', icon: '📊' },
  { label: '哪些預約還未指派管理師？', icon: '📋' },
  { label: '如何新增一個後台頁面？', icon: '🛠️' },
  { label: '如何修改側邊欄選項？', icon: '📝' },
  { label: '說明整個系統架構', icon: '🏗️' },
  { label: '如何新增一個資料表欄位？', icon: '🗄️' },
];

// ─────────────────────────────────────────────
// 主頁面
// ─────────────────────────────────────────────
export default function AdminAI() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `您好！我是 HESON 系統管理員 AI 助理。\n\n我知道這個系統的完整架構，可以：\n- **查詢即時資料**（預約、客戶、管理師統計）\n- **回答技術問題**（如何新增功能、修改頁面）\n- **提供程式碼建議**（附帶檔案路徑和修改位置）\n- **分析系統狀況**（找出問題、提供優化建議）\n\n> 💡 如需直接修改程式碼，請複製我提供的指令到本機 **Claude Code CLI** 執行。\n\n請問有什麼需要協助的？`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const me = await base44.auth.me();
      if (me.role !== 'admin') { window.location.href = '/'; return; }
      setAuthChecked(true);
    };
    check();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
      const res = await base44.functions.invoke('adminAI', { message: msg, history });
      const data = res.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || '（無回應）',
        error: !data.success
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ 連線失敗：${err.message}`,
        error: true
      }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '對話已清空。有什麼需要協助的嗎？'
    }]);
    toast.success('對話已清空');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-stone-50 overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-stone-800">管理員 AI 助理</h1>
            <p className="text-xs text-stone-400">由本機 Claude Code CLI 驅動</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
            ● 已連線
          </Badge>
          <Button variant="ghost" size="icon" onClick={clearChat} title="清空對話" className="h-8 w-8 text-stone-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── 對話區 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user'
                ? 'bg-stone-800 text-white rounded-tr-sm'
                : msg.error
                  ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                  : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <MdText text={msg.content} />
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-white shadow-sm">
                管
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="text-sm text-stone-500">思考中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 快捷問題 ── */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-xs text-stone-400 mb-2 px-1">快速提問</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-full text-stone-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors shadow-sm"
              >
                <span>{q.icon}</span>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 輸入區 ── */}
      <div className="border-t border-stone-200 bg-white px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="詢問系統問題、請求程式碼建議..."
              className="pr-4 text-sm rounded-xl border-stone-300 focus:border-amber-400 focus:ring-amber-400"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
            />
          </div>
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4 h-10 flex-shrink-0 shadow-sm"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </Button>
        </div>
        <p className="text-xs text-stone-400 mt-1.5 px-1">
          Enter 傳送 · 程式碼修改請複製指令到本機 Claude Code CLI 執行
        </p>
      </div>

    </div>
  );
}
