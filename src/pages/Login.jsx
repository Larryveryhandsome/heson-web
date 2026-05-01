import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAppState } = useAuth();

  const [mode, setMode] = useState('login'); // login | register | setup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let userData;
      if (mode === 'login') {
        userData = await base44.auth.login(email, password);
      } else if (mode === 'register') {
        userData = await base44.auth.register(email, password, fullName);
      } else {
        userData = await base44.auth.setupAdmin(email, password, fullName);
      }
      await checkAppState();

      // 角色導向：若 redirect 是根目錄，依角色跳轉到對應首頁
      let target = decodeURIComponent(redirect);
      if (target === '/') {
        const role = userData?.role;
        if (role === 'admin') target = '/AdminDashboard';
        else if (role === 'cleaner') target = '/CleanerJobs';
        else target = '/ClientDashboard';
      }
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || '操作失敗，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-amber-600 mb-1">HESON</div>
          <div className="text-stone-500 text-sm">赫頌家事管理</div>
        </div>

        {/* 模式切換 */}
        <div className="flex rounded-xl bg-stone-100 p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white shadow text-amber-700' : 'text-stone-500'}`}
          >
            登入
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white shadow text-amber-700' : 'text-stone-500'}`}
          >
            註冊
          </button>
          <button
            onClick={() => { setMode('setup'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'setup' ? 'bg-white shadow text-red-600' : 'text-stone-500'}`}
          >
            初始管理員
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === 'register' || mode === 'setup') && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">姓名</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="您的姓名"
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">密碼</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少 6 碼"
              required
              minLength={6}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {mode === 'setup' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs">
              此功能只有在系統沒有任何管理員帳號時才能使用。設定完成後請移除此選項。
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            {loading ? '處理中...' : mode === 'login' ? '登入' : mode === 'register' ? '建立帳號' : '建立管理員'}
          </button>
        </form>

        <p className="text-center text-xs text-stone-400 mt-6">
          © {new Date().getFullYear()} HESON 赫頌家事管理
        </p>
      </div>
    </div>
  );
}
