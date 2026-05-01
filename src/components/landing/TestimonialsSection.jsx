import React from 'react';
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "林先生",
    location: "新北市板橋區",
    service: "深度清潔",
    comment: "深度清潔服務讓我的廚房煥然一新，油煙機清洗得非常乾淨。人員準時到達，專業度很高。",
    rating: 5,
    avatar: "林"
  },
  {
    name: "王太太",
    location: "台中市西屯區",
    service: "定期清潔",
    comment: "訂閱方案後，每次都能指定同一位清潔人員，建立了很好的信任感。強烈推薦！",
    rating: 5,
    avatar: "王"
  },
  {
    name: "張先生",
    location: "桃園市中壢區",
    service: "商業清潔",
    comment: "辦公室清潔服務非常專業，整個空間煥然一新。員工都說環境變好了，工作效率也提升了。",
    rating: 5,
    avatar: "張"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-amber-600 text-sm font-medium tracking-wider uppercase">用戶心聲</span>
          <h2 className="text-3xl font-light text-stone-800 mt-3">
            來自真實客戶的 <span className="font-medium">評價</span>
          </h2>
          <p className="text-stone-500 mt-3">所有評價皆為真實用戶回饋，公開透明</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-stone-100 relative"
            >
              <Quote className="w-8 h-8 text-amber-200 absolute top-6 right-6" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-stone-600 leading-relaxed mb-6 text-sm">"{t.comment}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-medium text-stone-800">{t.name}</p>
                  <p className="text-xs text-stone-400">{t.location} · {t.service}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}