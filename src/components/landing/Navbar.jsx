import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(true);
  const navigate = useNavigate();

  const handleBooking = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin(window.location.origin + '/BookingForm');
      return;
    }
    navigate('/BookingForm');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    };
    checkAuth();
  }, []);

  const navItems = [
    { name: "首頁", path: "Home" },
    { name: "關於我們", path: "About" },
    { name: "服務方案", path: "BookingForm" },
    { name: "查詢訂單", path: "OrderQuery" },
    { name: "常見問題", path: "FAQ" },
  ];

  const getDashboardPath = () => {
    if (!user) return "Home";
    if (user.role === 'admin') return "AdminDashboard";
    // Check if user is a cleaner by checking their profile
    return "ClientDashboard";
  };

  return (
    <>
      {/* Top Announcement Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-stone-800 text-white text-xs text-center py-2 pl-4 pr-12 flex items-center justify-center gap-2">
          <span>🎉 新會員首次預約享 <strong>85 折</strong>優惠！限時活動，立即預約享好康</span>
          <Link to={createPageUrl("BookingForm")} className="underline text-amber-300 font-medium whitespace-nowrap">立即預約</Link>
          <button onClick={() => setShowBanner(false)} className="absolute right-0 top-0 bottom-0 w-12 px-3 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">×</button>
        </div>
      )}
    <nav className={`fixed ${showBanner ? 'top-8' : 'top-0'} left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/b0c86a022_557043631_1369298458531323_7985963993755754895_n.jpg"
              alt="HESON"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={createPageUrl(item.path)}
                className={`text-sm font-medium transition-colors ${
                  location.pathname.includes(item.path)
                    ? 'text-amber-600'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link to={createPageUrl(getDashboardPath())}>
                <Button variant="outline" className="rounded-full border-stone-300">
                  <User className="w-4 h-4 mr-2" />
                  我的帳戶
                </Button>
              </Link>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-stone-600"
                  onClick={() => base44.auth.redirectToLogin()}
                >
                  登入
                </Button>
                <Button onClick={handleBooking} className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-6">
                  立即預約
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-stone-800" />
            ) : (
              <Menu className="w-6 h-6 text-stone-800" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="container mx-auto px-6 py-6">
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.path)}
                    className="text-stone-600 hover:text-stone-900 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t pt-4 mt-2">
                  {user ? (
                    <Link to={createPageUrl(getDashboardPath())}>
                      <Button className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-full">
                        <User className="w-4 h-4 mr-2" />
                        我的帳戶
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full rounded-full"
                        onClick={() => base44.auth.redirectToLogin()}
                      >
                        登入
                      </Button>
                      <Button onClick={handleBooking} className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-full">
                        立即預約
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}