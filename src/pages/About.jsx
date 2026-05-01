import React from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Heart, Users, Shield, Award } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "用心服務",
      description: "每一次服務都以客戶滿意為最高標準，用心呵護您的居家環境"
    },
    {
      icon: Users,
      title: "專業團隊",
      description: "嚴格篩選的家事管理師，經過完整培訓，具備專業清潔技能"
    },
    {
      icon: Shield,
      title: "安心保障",
      description: "良民證驗證、身分審核，為您提供最安心的居家服務"
    },
    {
      icon: Award,
      title: "品質承諾",
      description: "標準化 SOP 流程，確保每次服務品質一致"
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">
              關於 HESON
            </span>
            <h1 className="text-4xl md:text-5xl font-light text-stone-800 mt-4 leading-tight">
              赫頌<span className="font-medium">家事管理</span>
            </h1>
            <p className="text-stone-600 text-lg mt-6 leading-relaxed">
              我們相信，每個人都值得擁有潔淨舒適的居家環境。
              HESON 致力於提供專業、貼心的家事管理服務，
              讓您把寶貴的時間留給更重要的人事物。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/246d43b9c_1.jpg"
                  alt="清潔服務"
                  className="rounded-2xl shadow-lg"
                />
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/55499df64_3.jpg"
                  alt="居家清潔"
                  className="rounded-2xl shadow-lg mt-8"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">
                我們的故事
              </span>
              <h2 className="text-3xl font-light text-stone-800 mt-4">
                源於對<span className="font-medium">美好生活</span>的追求
              </h2>
              <p className="text-stone-600 mt-6 leading-relaxed">
                HESON 成立於對居家生活品質的堅持。我們深知現代人工作繁忙，
                卻渴望回到家時能享受潔淨舒適的環境。
              </p>
              <p className="text-stone-600 mt-4 leading-relaxed">
                我們的「家事管理師」不只是清潔人員，更是您居家生活的好夥伴。
                每位管理師都經過嚴格篩選與專業培訓，
                以標準化的 SOP 流程為您提供一致的高品質服務。
              </p>
              <p className="text-stone-600 mt-4 leading-relaxed">
                透過訂閱制的彈性方案，您可以依據自己的需求選擇服務頻率，
                讓專業的團隊為您打理居家環境，
                您只需要專注於生活中更重要的事。
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-stone-50">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">
              核心價值
            </span>
            <h2 className="text-3xl font-light text-stone-800 mt-4">
              我們的<span className="font-medium">服務承諾</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-8 bg-white rounded-2xl shadow-sm"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-medium text-stone-800 mb-3">
                  {value.title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Image */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl overflow-hidden shadow-2xl"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/468938194_Facebook-HESON.png"
                alt="HESON 團隊"
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}