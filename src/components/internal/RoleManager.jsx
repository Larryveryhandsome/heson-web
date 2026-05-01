import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Check, Crown, Briefcase, User, Users, ShieldBan } from "lucide-react";

const ROLES = [
  {
    value: 'admin',
    label: '管理員',
    icon: Crown,
    color: 'bg-red-100 text-red-700 border-red-200',
    badgeClass: 'bg-red-100 text-red-700',
  },
  {
    value: 'partner',
    label: '工作夥伴',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'user',
    label: '會員',
    icon: User,
    color: 'bg-green-100 text-green-700 border-green-200',
    badgeClass: 'bg-green-100 text-green-700',
  },
  {
    value: 'banned',
    label: '封禁',
    icon: ShieldBan,
    color: 'bg-red-100 text-red-700 border-red-200',
    badgeClass: 'bg-red-100 text-red-700',
  },
];

function getRoleInfo(role) {
  return ROLES.find(r => r.value === role) || {
    label: '訪客',
    badgeClass: 'bg-stone-100 text-stone-500',
  };
}

function UserCard({ u }) {
  const [saving, setSaving] = useState(null);
  const queryClient = useQueryClient();
  const roleInfo = getRoleInfo(u.role);

  const handleRoleChange = async (newRole) => {
    if (newRole === u.role) return;
    setSaving(newRole);
    await base44.functions.invoke('updateUserRole', { userId: u.id, role: newRole });
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    setSaving(null);
  };

  const getBgColor = () => {
    if (u.role === 'banned') return 'border-red-200 bg-red-50/20';
    return 'border-stone-200';
  };

  const getAvatarColor = () => {
    if (u.role === 'banned') return 'bg-red-100';
    return 'bg-stone-100';
  };

  return (
    <div className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${getBgColor()}`}>
      {/* Avatar + Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor()}`}>
          {u.role === 'banned'
            ? <ShieldBan className="w-4 h-4 text-red-600" />
            : <span className="text-sm font-medium text-stone-600">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
          }
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-stone-800 text-sm">{u.full_name || '（未設定姓名）'}</span>
            <Badge className={`${roleInfo.badgeClass} text-xs`}>{roleInfo.label}</Badge>
          </div>
          <p className="text-xs text-stone-400 truncate">{u.email}</p>
        </div>
      </div>

      {/* Role buttons — mutually exclusive */}
      <div className="flex items-center gap-1 flex-wrap sm:flex-shrink-0">
        {ROLES.map(r => {
          const Icon = r.icon;
          const isActive = u.role === r.value;
          const isSaving = saving === r.value;
          return (
            <button
              key={r.value}
              onClick={() => handleRoleChange(r.value)}
              disabled={!!saving}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isActive
                  ? r.color + ' shadow-sm'
                  : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700'
              }`}
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isActive ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RoleManager() {
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listAllUsers', { _: 1 });
      return res.data?.users || [];
    },
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    partner: users.filter(u => u.role === 'partner').length,
    user: users.filter(u => u.role === 'user' || !u.role).length,
    banned: users.filter(u => u.role === 'banned').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="p-4 border-b border-stone-100 bg-white">
        {/* Total user count */}
        <div className="flex items-center gap-2 text-sm mb-3">
          <Users className="w-4 h-4 text-stone-400" />
          <span className="text-stone-500">共 <strong className="text-stone-800">{users.length}</strong> 位用戶</span>
        </div>
        {/* Role breakdown */}
        <div className="flex gap-3 flex-wrap">
          {ROLES.map(r => (
            <div key={r.value} className="flex items-center gap-1.5">
              <Badge className={r.badgeClass + ' text-xs'}>{r.label}</Badge>
              <span className="text-sm font-medium text-stone-700">{roleStats[r.value] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-stone-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋姓名、Email 或角色..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            {search ? '找不到符合的用戶' : '目前無用戶資料'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <UserCard key={u.id} u={u} />
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-400">
        💡 每位用戶只能擁有一個身份狀態：管理員、工作夥伴、會員或封禁。點擊按鈕即可切換。
      </div>
    </div>
  );
}