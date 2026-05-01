import React from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen"><Navbar />
      <section className="pt-32 pb-8 bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl md:text-4xl font-light text-stone-800">服務<span className="font-medium">條款</span></h1>
          <p className="text-stone-500 mt-3">最後更新：2026年4月</p>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl space-y-8 text-stone-700 leading-relaxed">
          {[
            { title:"一、服務說明", content:"HESON 家事管理提供居家清潔、家電清洗、整理收納、商業清潔等專業到府服務。本條款適用於透過本網站或 APP 預約之所有服務。" },
            { title:"二、預約與付款", content:"所有服務需透過本平台線上預約並完成付款後方可確認。付款方式支援信用卡（透過綠界金流）。服務確認後，如需更改請至少提前24小時通知。" },
            { title:"三、取消政策", content:"服務開始前48小時以上取消：全額退款。服務開始前24-48小時取消：收取20%手續費。服務開始前24小時內取消：不予退款。如因不可抗力因素（颱風、地震等），雙方協商處理。" },
            { title:"四、服務品質保證", content:"HESON 保證所有服務人員均經過背景審查與專業培訓。如對服務結果不滿意，請於服務完成後24小時內透過客服反映，我們將安排補救服務或退款。" },
            { title:"五、客戶義務", content:"請確保服務地點安全、整潔，並提供必要的水電資源。如有寵物，請事先告知並妥善安置。請妥善保管個人貴重物品，本公司對未申報之貴重物品損失不負賠償責任。" },
            { title:"六、責任限制", content:"本公司對服務過程中造成之財物損失，依實際損失賠償，最高不超過單次服務費用之五倍。間接損失、精神損失等不予賠償。" },
            { title:"七、智慧財產權", content:"本網站所有內容包括文字、圖片、LOGO等均受著作權法保護，未經授權不得轉載或商業使用。" },
            { title:"八、條款修訂", content:"本公司保留隨時修訂本條款之權利，修訂後於網站公告，繼續使用即表示同意修訂後條款。" },
            { title:"九、聯絡方式", content:"如有任何問題請聯絡：service@heson.tw / 0906-991-023" },
          ].map(s=>(
            <div key={s.title}>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">{s.title}</h2>
              <p>{s.content}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}