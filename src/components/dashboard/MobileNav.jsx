import React, { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  Calendar,
  ClipboardList,
  User,
  Menu,
  X,
  LogOut,
  Users,
  FileText,
  BarChart3,
  UserCheck,
  Table,
  Sparkles
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function MobileNav({ userRole = 'client', userName = '' }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const clientLinks = [
    { name: "我的方案", path: "ClientDashboard", icon: Home },
    { name: "我的預約", path: "MyBookings", icon: Calendar },
    { name: "新增預約", path: "ClientBooking", icon: Calendar },
    { name: "服務紀錄", path: "ClientHistory", icon: ClipboardList },
    { name: "個人資料", path: "ClientProfile", icon: User },
  ];

  const cleanerLinks = [
    { name: "接案列表", path: "CleanerJobs", icon: ClipboardList },
    { name: "我的行程", path: "CleanerSchedule", icon: Calendar },
    { name: "服務回報", path: "CleanerReport", icon: FileText },
    { name: "個人資料", path: "CleanerProfile", icon: User },
  ];

  const adminLinks = [
    { name: "總覽", path: "AdminDashboard", icon: BarChart3 },
    { name: "派單管理", path: "AdminDispatch", icon: Calendar },
    { name: "客戶管理", path: "AdminClients", icon: Users },
    { name: "管理師管理", path: "AdminCleaners", icon: User },
    { name: "員工出勤", path: "AdminAttendance", icon: UserCheck },
    { name: "試算表", path: "InternalSpreadsheet", icon: Table },
    { name: "AI 助理", path: "AdminAI", icon: Sparkles },
  ];

  const getLinks = () => {
    switch (userRole) {
      case 'admin':
        return adminLinks;
      case 'cleaner':
        return cleanerLinks;
      default:
        return clientLinks;
    }
  };

  const links = getLinks();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={createPageUrl("Home")} className="cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/b0c86a022_557043631_1369298458531323_7985963993755754895_n.jpg"
            alt="HESON"
            className="h-8 w-auto"
          />
        </Link>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2">
              <Menu className="w-6 h-6 text-stone-600" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <div className="p-6 border-b border-stone-100">
              <p className="text-sm text-stone-500">
                您好，{userName || '訪客'}
              </p>
            </div>
            <nav className="p-4">
              <ul className="space-y-1">
                {links.map((link) => {
                  const isActive = location.pathname.includes(link.path);
                  return (
                    <li key={link.path}>
                      <Link
                        to={createPageUrl(link.path)}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-amber-50 text-amber-700'
                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                        }`}
                      >
                        <link.icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 w-full transition-all"
              >
                <LogOut className="w-5 h-5" />
                登出
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}