import React, { useState } from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Calendar, Clock, MapPin, CreditCard, Loader2, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusConfig = {
  '待確認': { color: 'bg-yellow-100 text-yellow-700', label: '待確認' },
  '已確認': { color: 'bg-blue-100 text-blue-700', label: '已確認' },
  '已完成': { color: 'bg-green-100 text-green-700', label: '已完成' },
  '已取消': { color: 'bg-stone-100 text-stone-500', label: '已取消' },
};

export default function OrderQuery() {
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) {
      toast.error('請輸入手機號碼');
      return;
    }

    // 正規化電話：去掉空格和 dash
    const normalized = trimmed.replace(/[\s-]/g, '');
    if (!/^09\d{8}$/.test(normalized)) {
      toast.error('請輸入正確的 10 碼手機號碼（09 開頭）');
      return;
    }

    setLoading(true);
    setSearched(false);

    // 1. 用 phone 欄位精確查詢（避免把所有訂單載到 client）
    const phoneBookings = await base44.entities.Booking.filter({ phone: normalized });

    // 2. 透過 ClientProfile 查同一用戶的所有預約
    const profiles = await base44.entities.ClientProfile.filter({ phone: normalized });
    let profileBookings = [];
    for (const profile of profiles) {
      if (profile.user_id) {
        const ub = await base44.entities.Booking.filter({ client_id: profile.user_id });
        profileBookings = profileBookings.concat(ub);
      }
    }

    // 合併去重
    const seen = new Set();
    const results = [];
    for (const b of [...phoneBookings, ...profileBookings]) {
      if (!seen.has(b.id)) { seen.add(b.id); results.push(b); }
    }

    results.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
    setBookings(results);
    setSearched(true);
    setLoading(false);
  };

  const getPaymentHref = (booking) => {
    const priceMap = {
      '單次清潔': 2000,
      '基礎月護-4次': 8400,
      '進階月安-8次': 16000,
      '尊榮月恆-12次': 24600,
    };
    const amount = priceMap[booking.service_type] || 2000;
    return `/PaymentRedirect?booking_id=${booking.id}&amount=${amount}&item_name=${encodeURIComponent(booking.service_type)}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-6">
              <Search className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-stone-600 font-medium">免登入查詢您的預約紀錄</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-800 mb-4">
              預約<span className="font-medium">查詢</span>
            </h1>
            <p className="text-stone-500 mb-10">輸入您預約時填寫的手機號碼，即可查詢所有歷史預約狀態</p>

            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例：0912345678"
                  className="pl-10 h-12 rounded-xl text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-6 bg-stone-800 hover:bg-stone-900 text-white rounded-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 bg-white min-h-[40vh]">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {bookings?.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-stone-600 font-medium">查無預約紀錄</p>
                  <p className="text-stone-400 text-sm mt-2 mb-6">請確認手機號碼是否正確，或使用預約時填寫的號碼</p>
                  <Link to={createPageUrl("BookingForm")}>
                    <Button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-6">
                      立即預約
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-stone-500 text-sm mb-6">共找到 <span className="font-semibold text-stone-800">{bookings.length}</span> 筆預約紀錄</p>
                  {bookings.map((booking, i) => {
                    const sc = statusConfig[booking.status] || statusConfig['待確認'];
                    const isPending = booking.status === '待確認';
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                      >
                        <Card className="border border-stone-100 shadow-sm">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-medium text-stone-800">{booking.service_type}</span>
                                  <Badge className={sc.color}>{sc.label}</Badge>
                                  {booking.cleaner_name && (
                                    <span className="text-xs text-stone-400">管理師：{booking.cleaner_name}</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {booking.scheduled_date && (
                                    <div className="flex items-center gap-1.5 text-sm text-stone-500">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {format(new Date(booking.scheduled_date), 'yyyy年M月d日 (EEE)', { locale: zhTW })}
                                    </div>
                                  )}
                                  {booking.time_slot && (
                                    <div className="flex items-center gap-1.5 text-sm text-stone-500">
                                      <Clock className="w-3.5 h-3.5" />
                                      {booking.time_slot}
                                    </div>
                                  )}
                                </div>
                                {booking.address && (
                                  <div className="flex items-start gap-1.5 text-sm text-stone-400">
                                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    {booking.address}
                                  </div>
                                )}
                              </div>

                              {/* Payment CTA for pending */}
                              {isPending && (
                                <Link to={getPaymentHref(booking)}>
                                  <Button
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl whitespace-nowrap"
                                  >
                                    <CreditCard className="w-4 h-4 mr-1.5" />
                                    前往繳費
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {!searched && !loading && (
            <div className="text-center py-20 text-stone-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>輸入手機號碼開始查詢</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}