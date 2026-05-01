import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

function NavLink({ to, children }) {
  const navigate = useNavigate();
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <a href={to} onClick={handleClick} className="hover:text-amber-400 transition-colors">
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/b0c86a022_557043631_1369298458531323_7985963993755754895_n.jpg"
                alt="HESON"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm leading-relaxed">
              HESON 家事管理<br />
              空下雙手，陪伴家人<br />
              <span className="text-xs text-stone-500 mt-1 block">© 2026 HESON</span>
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-white font-medium mb-4">快速連結</h4>
            <ul className="space-y-3 text-sm">
              <li><NavLink to={createPageUrl("Home")}>首頁</NavLink></li>
              <li><NavLink to={createPageUrl("About")}>關於我們</NavLink></li>
              <li><NavLink to={createPageUrl("BookingForm")}>立即預約</NavLink></li>
              <li><NavLink to={createPageUrl("FAQ")}>常見問題</NavLink></li>
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-white font-medium mb-4">服務項目</h4>
            <ul className="space-y-3 text-sm">
              <li><NavLink to="/ServiceInquiry?service=%E5%B1%85%E5%AE%B6%E6%B8%85%E6%BD%94">鐘點居家清潔</NavLink></li>
              <li><NavLink to="/ServiceInquiry?service=%E5%AE%9A%E6%9C%9F%E6%B8%85%E6%BD%94">定期清潔方案</NavLink></li>
              <li><NavLink to="/ServiceInquiry?service=%E5%AE%B6%E9%9B%BB%E6%B8%85%E6%B4%97">家電深度清洗</NavLink></li>
              <li><NavLink to="/ServiceInquiry?service=%E6%95%B4%E7%90%86%E6%94%B6%E7%B4%8D">整理收納服務</NavLink></li>
              <li><NavLink to="/ServiceInquiry?service=%E5%95%86%E6%A5%AD%E6%B8%85%E6%BD%94">企業商用清潔</NavLink></li>
              <li><NavLink to="/ServiceInquiry?service=%E8%A3%9D%E6%BD%A2%E5%BE%8C%E6%B8%85%E6%BD%94">裝潢後清潔</NavLink></li>
            </ul>
          </div>
          
          {/* Platform */}
          <div>
            <h4 className="text-white font-medium mb-4">平台資訊</h4>
            <ul className="space-y-3 text-sm">
              <li><NavLink to={createPageUrl("JoinCleaner")}>加入服務人員</NavLink></li>
              <li><NavLink to={createPageUrl("BusinessCooperation")}>企業合作洽談</NavLink></li>
              <li><NavLink to={createPageUrl("TermsOfService")}>服務條款</NavLink></li>
              <li><NavLink to={createPageUrl("PrivacyPolicy")}>隱私政策</NavLink></li>
              <li><NavLink to={createPageUrl("Recruitment")}>人才招募</NavLink></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-white font-medium mb-4">聯絡資訊</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span>宜蘭縣羅東鎮中正南路131號5樓</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>0906-991-023</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>service@heson.tw</span>
              </li>
              <li>
                <a 
                  href="https://lin.ee/xKVxq7Y" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors mt-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  加入官方 LINE
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-xs">
          <p>© 2026 HESON 家事管理. All rights reserved.</p>
          <p className="mt-2">宜蘭縣羅東鎮中正南路131號5樓 | 0906-991-023（週一至週五 09:00–18:00）</p>
        </div>
      </div>
    </footer>
  );
}