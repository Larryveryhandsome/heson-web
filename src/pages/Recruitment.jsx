import React from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Clock, DollarSign, Heart } from "lucide-react";

const jobs = [
  { title:"居家清潔服務師", type:"兼職／全職", location:"宜蘭縣", salary:"時薪 $300-400", desc:"負責到府居家清潔服務，需具備良好服務態度，提供完整教育訓練。" },
  { title:"家電清洗技師", type:"兼職", location:"宜蘭縣", salary:"時薪 $350-450", desc:"負責冷氣、洗衣機、油煙機等家電深度清洗，具相關經驗者優先。" },
  { title:"整理收納師", type:"兼職", location:"宜蘭縣", salary:"時薪 $400-500", desc:"協助客戶進行空間整理與收納規劃，需具備整理收納相關知識。" },
  { title:"客服專員", type:"全職", location:"羅東辦公室", salary:"月薪 $30,000起", desc:"負責客戶預約接洽、電話服務、平台管理，具良好溝通能力。" },
];

export default function Recruitment() {
  return (
    <div className="min-h-screen"><Navbar />
      <section className="pt-32 pb-8 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl md:text-4xl font-light text-stone-800">人才<span className="font-medium">招募</span></h1>
          <p className="text-stone-500 mt-3">加入 HESON，一起打造更美好的居家環境</p>
        </div>
      </section>
      <section className="py-10 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {[{Icon:DollarSign,t:"有競爭力的薪資",d:"依能力給予合理報酬"},{Icon:Clock,t:"彈性工作時間",d:"配合個人作息排班"},{Icon:Heart,t:"友善工作環境",d:"重視員工身心健康"},{Icon:MapPin,t:"在地就業",d:"服務宜蘭在地鄉親"}].map(({Icon,...i})=>(
              <div key={i.t} className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div><p className="font-medium text-stone-800">{i.t}</p><p className="text-xs text-stone-500">{i.d}</p></div>
              </div>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-stone-800 mb-5">目前職缺</h2>
          <div className="space-y-4">
            {jobs.map(job=>(
              <div key={job.title} className="border border-stone-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-800">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
                    </div>
                    <p className="text-sm text-stone-500 mt-3">{job.desc}</p>
                  </div>
                  <Link to={createPageUrl("JoinCleaner")}>
                    <Button size="sm" className="bg-stone-800 hover:bg-stone-900 text-white rounded-xl shrink-0">應徵</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}