import React from 'react';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

const activities = [
  {
    emoji: "🎁",
    title: "新會員歡迎禮",
    desc: "加入會員送 $200 折扣券，滿額再抽好禮",
    cta: "立即預約",
    href: null,
    linkTo: "BookingForm",
  },
  {
    emoji: "💬",
    title: "加入 LINE 好友",
    desc: "每月領取專屬折扣，不定期發送限定優惠",
    cta: "加入 LINE",
    href: "https://lin.ee/xKVxq7Y",
    linkTo: null,
  },
  {
    emoji: "🏢",
    title: "企業清潔方案",
    desc: "從細節開始，好環境讓企業創造更高價值",
    cta: "立即預約",
    href: null,
    linkTo: "BookingForm",
  },
];

export default function ThemeActivities() {
  return (
    <section className="py-14 bg-stone-50">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">主題活動</span>
          <h2 className="text-2xl font-light text-stone-800 mt-2">
            各式專題服務，<span className="font-medium">輕鬆處理生活大小事</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {activities.map((a, i) => {
            const inner = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col gap-3 cursor-pointer group"
              >
                <div className="text-3xl">{a.emoji}</div>
                <h3 className="font-medium text-stone-800">{a.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed flex-1">{a.desc}</p>
                <div className="flex items-center gap-1 text-amber-600 text-sm font-medium group-hover:gap-2 transition-all">
                  {a.cta} <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            );
            return a.href ? (
              <a key={a.title} href={a.href} target="_blank" rel="noopener noreferrer">{inner}</a>
            ) : (
              <Link key={a.title} to={createPageUrl(a.linkTo)}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}