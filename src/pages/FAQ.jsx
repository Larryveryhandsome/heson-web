import React from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "什麼是「家事管理師」？",
    answer: "家事管理師是經過 HESON 專業培訓的居家服務人員。他們不只是傳統的清潔人員，更是您居家生活的專業夥伴。從日常清潔、收納整理到家務協助，都能提供專業且貼心的服務。"
  },
  {
    question: "服務範圍包含哪些區域？",
    answer: "目前 HESON 的服務範圍涵蓋台北市、新北市及宜蘭縣。我們持續擴展服務區域，如果您的所在地尚未在服務範圍內，歡迎聯繫我們了解更多。"
  },
  {
    question: "如何預約服務？",
    answer: "您可以透過官網的預約系統直接預約，或是加入我們的官方 LINE 帳號，由專人為您安排最適合的服務時段。首次預約可享免費試掃服務。"
  },
  {
    question: "訂閱方案可以隨時更換嗎？",
    answer: "可以的！我們提供彈性的訂閱方案，您可以根據自己的需求隨時調整服務頻率。如需更換方案，只需提前告知我們的客服人員即可。"
  },
  {
    question: "家事管理師是固定的嗎？",
    answer: "是的，我們採用固定專人服務的模式。每位客戶都會配對一位固定的家事管理師，讓他們能熟悉您的居家環境與習慣，提供更貼心的服務。"
  },
  {
    question: "服務前需要準備什麼？",
    answer: "基本上不需要特別準備。我們的家事管理師會自備專業清潔工具與環保清潔劑。如果您有特殊的清潔需求或偏好使用的清潔用品，可以事先告知我們。"
  },
  {
    question: "服務時間有多長？",
    answer: "每次服務時間約 3-4 小時，依據您的居家坪數與清潔需求而定。我們提供上午（08:00-12:00）、下午（13:00-17:00）、晚間（18:00-21:00）三個時段供您選擇。"
  },
  {
    question: "如何確保服務品質？",
    answer: "我們建立完整的品質管理系統：1. 標準化 SOP 清潔流程 2. 服務前後照片回報 3. 客戶滿意度調查 4. 定期對家事管理師進行培訓與考核。如果您對服務有任何建議，我們都會認真處理。"
  },
  {
    question: "家事管理師有經過背景審核嗎？",
    answer: "當然！所有家事管理師都必須通過嚴格的審核流程，包括：身分證驗證、良民證查驗、面試評估、專業培訓等。我們確保每一位進入您家中的人員都是值得信賴的。"
  },
  {
    question: "如果服務當天需要取消怎麼辦？",
    answer: "如需取消或改期服務，請於服務前 24 小時通知我們，以便我們做適當的安排。臨時取消可能會影響到管理師的排程，感謝您的體諒與配合。"
  }
];

export default function FAQ() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">
              FAQ
            </span>
            <h1 className="text-4xl md:text-5xl font-light text-stone-800 mt-4">
              常見<span className="font-medium">問題</span>
            </h1>
            <p className="text-stone-600 mt-6">
              找不到您想問的問題嗎？歡迎透過 LINE 聯繫我們
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <AccordionItem 
                    value={`item-${index}`}
                    className="bg-stone-50 rounded-2xl px-6 border-0"
                  >
                    <AccordionTrigger className="text-left text-stone-800 hover:text-amber-600 py-5 text-base font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-stone-600 pb-5 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-16 text-center bg-stone-800 rounded-3xl p-10"
            >
              <h3 className="text-2xl font-light text-white mb-4">
                還有其他問題嗎？
              </h3>
              <p className="text-stone-400 mb-6">
                我們的客服團隊隨時為您服務
              </p>
              <a href="https://lin.ee/6KgqiOU" target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base rounded-full">
                  <MessageCircle className="mr-2 w-5 h-5" />
                  LINE 聯繫我們
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}