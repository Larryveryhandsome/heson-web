import React from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-8 bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl md:text-4xl font-light text-stone-800">隱私<span className="font-medium">政策</span></h1>
          <p className="text-stone-500 mt-3">最後更新：2026年4月</p>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl prose prose-stone">
          <div className="space-y-8 text-stone-700 leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">一、前言</h2>
              <p>HESON 家事管理（以下簡稱「本公司」）非常重視您的隱私權。本隱私政策說明本公司如何收集、使用、儲存及保護您的個人資料。使用本平台即表示您同意本政策之內容。</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">二、個人資料收集範圍</h2>
              <p>本公司可能收集以下資料：</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>基本識別資料：姓名、電話、電子郵件地址</li>
                <li>服務相關資料：服務地址、房屋類型、坪數、預約日期與時段</li>
                <li>付款資料：交易編號（不儲存完整信用卡資訊，由綠界金流加密處理）</li>
                <li>使用記錄：瀏覽紀錄、服務評價與留言</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">三、個人資料使用目的</h2>
              <p>本公司收集您的個人資料，用於以下目的：</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>處理服務預約與確認</li>
                <li>與您聯繫確認服務細節</li>
                <li>安排並派遣服務人員</li>
                <li>寄送服務通知與行銷訊息（您可隨時取消訂閱）</li>
                <li>改善本平台服務品質</li>
                <li>履行法律義務</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">四、資料安全</h2>
              <p>本公司採用業界標準的安全措施保護您的個人資料，包括 SSL 加密傳輸、存取控制及定期安全審查。付款資訊由通過 PCI DSS 認證之綠界科技金流系統處理，本公司不儲存完整信用卡資訊。</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">五、資料分享</h2>
              <p>本公司不會將您的個人資料出售或租借給第三方。僅在以下情況下共享：</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>提供服務所必要之合作廠商（如付款處理、物流）</li>
                <li>依法令規定或主管機關要求</li>
                <li>經您明確同意</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">六、您的權利</h2>
              <p>依據《個人資料保護法》，您有權：</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>查詢及閱覽您的個人資料</li>
                <li>要求複製您的個人資料</li>
                <li>要求補充或更正個人資料</li>
                <li>要求停止蒐集、處理或利用個人資料</li>
                <li>要求刪除個人資料</li>
              </ul>
              <p className="mt-3">如需行使上述權利，請聯絡：service@heson.tw</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">七、Cookie 政策</h2>
              <p>本網站使用 Cookie 以提升使用體驗。您可透過瀏覽器設定管理 Cookie，但停用後可能影響部分功能。</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">八、政策修訂</h2>
              <p>本公司保留隨時修訂本政策之權利。重大變更時將於網站公告，建議您定期查閱。</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">九、聯絡我們</h2>
              <p>若有任何疑問，請聯繫：</p>
              <ul className="list-none space-y-1 mt-2">
                <li>📧 service@heson.tw</li>
                <li>📞 0906-991-023（週一至週五 09:00–18:00）</li>
                <li>📍 宜蘭縣羅東鎮中正南路131號5樓</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}