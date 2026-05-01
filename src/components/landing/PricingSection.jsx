import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Clock, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const platformPlans = [
  {
    id: "light",
    name: "輕量方案",
    icon: "⚡",
    hourly_rate: 600,
    min_hours: 3,
    price_range: "$1,800 - $2,400",
    features: [
      "時薪 NT$600",
      "最低 3 小時起",
      "彈性排期",
      "可加時服務"
    ]
  },
  {
    id: "recurring_biweekly",
    name: "雙週方案",
    icon: "📅",
    price: 4600,
    visits: "2次/共8小時",
    features: [
      "每月自動扣款",
      "每雙週一次服務",
      "優先排期",
      "可隨時調整"
    ]
  },
  {
    id: "recurring_monthly_lite",
    name: "小資包月",
    icon: "🏠",
    price: 8400,
    visits: "4次/共16小時",
    features: [
      "每月自動扣款",
      "每週一次服務",
      "優先排期",
      "可隨時調整"
    ],
    popular: true
  },
  {
    id: "recurring_monthly",
    name: "家庭包月",
    icon: "👨‍👩‍👧",
    price: 14400,
    visits: "8次/共32小時",
    features: [
      "每月自動扣款",
      "每週二次服務",
      "優先排期",
      "專屬客服"
    ]
  },
  {
    id: "recurring_enterprise",
    name: "企業/別墅",
    icon: "🏢",
    price: 25600,
    visits: "16次/共64小時",
    features: [
      "每月自動扣款",
      "每週四次服務",
      "優先排期",
      "專屬客服管家"
    ]
  }
];

const hesonPlans = [
  {
    id: "fine_cleaning",
    name: "細清案件",
    icon: "✨",
    price: 3000,
    duration: "6小時/人",
    addon: "加時：NT$600 × 1小時/人",
    features: [
      "細節拍照估價",
      "專業細清師傅",
      "公司專業器材"
    ]
  },
  {
    id: "raw_unit",
    name: "毛坯案件",
    icon: "🏗️",
    price: "500-800/坪",
    duration: "場勘估價",
    features: [
      "免費場勘估價",
      "專業細清師傅",
      "公司專業器材",
      "驗收滿意為止"
    ]
  }
];

export default function PricingSection() {
  const [selected, setSelected] = useState('platform');

  const handleBooking = async (plan) => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin('/BookingForm');
      return;
    }
    
    // 存儲選擇的方案到會話存儲
    sessionStorage.setItem('selectedPlan', JSON.stringify(plan));
    window.location.href = '/BookingForm';
  };

  return (
    <section className="py-24 bg-gradient-to-b from-stone-50 to-white">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">
            訂閱方案
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-stone-800 mt-4">
            選擇最適合您的 <span className="font-medium">服務方案</span>
          </h2>
          <p className="text-stone-500 mt-4 max-w-2xl mx-auto">
            平台派案、赫頌直營，多種選擇滿足您的需求
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setSelected('platform')}
            className={`px-8 py-3 rounded-xl font-medium transition-all ${
              selected === 'platform'
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            🌟 平台派案
          </button>
          <button
            onClick={() => setSelected('heson')}
            className={`px-8 py-3 rounded-xl font-medium transition-all ${
              selected === 'heson'
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            🌟 赫頌直營
          </button>
        </div>

        {/* Platform Plans */}
        {selected === 'platform' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
              {platformPlans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`rounded-2xl p-6 relative ${
                    plan.popular
                      ? 'bg-stone-800 text-white shadow-2xl scale-105'
                      : 'bg-white border border-stone-200 shadow-lg'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        熱門方案
                      </div>
                    </div>
                  )}

                  <div className="text-3xl mb-3">{plan.icon}</div>
                  <h3 className={`text-lg font-semibold mb-4 ${plan.popular ? 'text-white' : 'text-stone-800'}`}>
                    {plan.name}
                  </h3>

                  <div className="mb-6 pb-6 border-b border-opacity-20" style={{ borderColor: plan.popular ? 'white' : 'black' }}>
                    {plan.price_range ? (
                      <p className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-stone-800'}`}>
                        {plan.price_range}
                      </p>
                    ) : (
                      <>
                        <p className={`text-2xl font-bold ${plan.popular ? 'text-white' : 'text-stone-800'}`}>
                          NT${plan.price?.toLocaleString()}
                        </p>
                        <p className={`text-xs mt-1 ${plan.popular ? 'text-stone-400' : 'text-stone-500'}`}>
                          {plan.visits}
                        </p>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-amber-400' : 'text-amber-600'}`} />
                        <span className={plan.popular ? 'text-stone-300' : 'text-stone-600'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleBooking(plan)}
                    className={`w-full py-3 rounded-lg font-medium ${
                      plan.popular
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-stone-800 hover:bg-stone-900 text-white'
                    }`}
                  >
                    立即訂閱
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Heson Direct Plans */}
        {selected === 'heson' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {hesonPlans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl p-8 bg-white border border-stone-200 shadow-lg"
                >
                  <div className="text-4xl mb-4">{plan.icon}</div>
                  <h3 className="text-2xl font-semibold text-stone-800 mb-1">
                    {plan.name}
                  </h3>

                  <div className="mb-6 pb-6 border-b border-stone-200">
                    <p className="text-2xl font-bold text-stone-800">
                      NT${typeof plan.price === 'number' ? plan.price.toLocaleString() : plan.price}
                    </p>
                    <p className="text-xs text-stone-500 mt-2">
                      {plan.duration}
                    </p>
                    {plan.addon && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        {plan.addon}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="text-stone-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="p-4 bg-stone-50 rounded-lg mb-6 border border-stone-200">
                    <p className="text-sm text-stone-600">
                      <span className="font-semibold">注意：</span>赫頌直營案件需透過官方LINE確認細節，付款後將引導您加入官方聯繫。
                    </p>
                  </div>

                  <Button
                    onClick={() => handleBooking(plan)}
                    className="w-full py-3 rounded-lg font-medium bg-stone-800 hover:bg-stone-900 text-white"
                  >
                    立即諮詢
                  </Button>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-2xl max-w-2xl mx-auto"
            >
              <p className="text-stone-700">
                <span className="font-semibold text-blue-900">赫頌直營流程：</span>
                <br />
                1. 填寫預約資訊 → 2. 完成付款 → 3. 加入官方LINE → 4. 管理員確認細節並聯繫您
              </p>
            </motion.div>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-stone-400 text-sm mt-12"
        >
          * 詳細費用及條款請參閱完整方案說明。
        </motion.p>
      </div>
    </section>
  );
}