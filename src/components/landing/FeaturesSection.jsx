import React from 'react';
import { motion } from "framer-motion";
import { Clock, Users, Star, Gift, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const reasons = [
  { icon: Clock, title: "24hr 線上預約", desc: "隨時隨地線上預約，相關流程皆有紀錄" },
  { icon: Users, title: "專人快速回覆", desc: "預約成功後，24hr 內快速回覆確認" },
  { icon: Star, title: "評價完整公開透明", desc: "網友真實評價回饋，服務品質透明呈現" },
  { icon: Gift, title: "不定期紅利回饋", desc: "訂閱方案享折扣優惠，定期活動回饋" },
];

const steps = [
  { num: "01", title: "選擇服務", desc: "從六大服務類型中選擇您需要的項目，系統智能推薦最適合的方案" },
  { num: "02", title: "選擇時間", desc: "選定日期、時段與服務時數，查看師傅即時空檔，彈性安排" },
  { num: "03", title: "確認預約", desc: "一鍵完成預約，系統立即派案，24hr 內師傅確認" },
];

export default function FeaturesSection() {
  return (
    <>
      {/* 4 Reasons */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">我們的優勢</span>
            <h2 className="text-3xl font-light text-stone-800 mt-3">
              選擇 <span className="font-medium">HESON</span> 的四個理由
            </h2>
            <p className="text-stone-500 mt-2">台灣最值得信賴的家事服務媒合平台</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-stone-50 hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-stone-100"
              >
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <r.icon className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="font-medium text-stone-800 mb-2">{r.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-20 bg-gradient-to-b from-stone-50 to-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">預約流程</span>
            <h2 className="text-3xl font-light text-stone-800 mt-3">
              三步完成 <span className="font-medium">預約</span>
            </h2>
            <p className="text-stone-500 mt-2">極簡流程，讓您的時間更有價值</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-stone-100 mb-4">{s.num}</div>
                <h3 className="text-xl font-medium text-stone-800 mb-3 -mt-6">{s.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 w-8 text-stone-300 text-xl">→</div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link to={createPageUrl("BookingForm")}>
              <Button size="lg" className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-10 py-6 text-base">
                免費開始使用 <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}