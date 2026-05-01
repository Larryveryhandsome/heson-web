import React from 'react';
import { ShieldX } from 'lucide-react';

export default function DeviceBannedScreen({ reason }) {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">存取遭拒</h1>
        <p className="text-stone-400 text-sm leading-relaxed mb-4">
          您的裝置已被系統封禁，無法存取此平台。
        </p>
        {reason && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
            封禁原因：{reason}
          </div>
        )}
        <p className="text-stone-600 text-xs mt-6">
          如有疑問，請聯絡平台客服。
        </p>
      </div>
    </div>
  );
}