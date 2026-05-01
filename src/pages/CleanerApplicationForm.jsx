import React, { useState } from 'react';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CleanerApplicationForm() {
  const [section, setSection] = useState('identity'); // identity | work | documents
  const [form, setForm] = useState({
    nickname: '', phone: '', line_id: '', address: '', email: '',
    experience_years: '', transportation: '', pet_acceptance: false, has_own_tools: false,
    health_issues: '', available_days: '', available_times: '', expected_salary: '',
    past_work: '', health_declaration: false, terms_agreed: false
  });
  const [files, setFiles] = useState({ id_copy: null, bank_copy: null });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setFiles({ ...files, [field]: res.file_url });
      toast.success('檔案上傳成功');
    } catch (e) {
      toast.error('檔案上傳失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nickname || !form.phone || !files.id_copy || !files.bank_copy || !form.health_declaration || !form.terms_agreed) {
      toast.error('請填寫所有必填欄位並同意相關條款');
      return;
    }
    setLoading(true);
    try {
      await base44.entities.CleanerApplication.create({
        nickname: form.nickname,
        phone: form.phone,
        line_id: form.line_id,
        address: form.address,
        email: form.email,
        experience_years: parseInt(form.experience_years) || 0,
        transportation: form.transportation,
        pet_acceptance: form.pet_acceptance,
        has_own_tools: form.has_own_tools,
        health_issues: form.health_issues,
        available_days: form.available_days,
        available_times: form.available_times,
        expected_salary: form.expected_salary,
        past_work: form.past_work,
        id_copy_url: files.id_copy,
        bank_copy_url: files.bank_copy,
        status: 'pending',
      });
      setSubmitted(true);
    } catch (e) {
      toast.error('申請提交失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="flex items-center justify-center min-h-[70vh] pt-20">
          <div className="text-center p-10 max-w-md">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-stone-800 mb-2">申請已送出！</h2>
            <p className="text-stone-500 mb-4">感謝您有意加入 HESON 團隊。我們將於 3-5 個工作天內審查您的資料，並透過電話聯繫您。</p>
            <p className="text-xs text-stone-400">申請編號已寄送至您的郵件，請妥善保管。</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const sections = {
    identity: { title: '基本身份文件', desc: '身分證、聯絡方式、銀行帳號' },
    work: { title: '工作相關資料', desc: '經驗、排班、交通、健康狀況' },
    documents: { title: '條款與聲明', desc: '確認並同意相關條款' }
  };

  return (
    <div className="min-h-screen"><Navbar />
      <section className="pt-32 pb-8 bg-gradient-to-br from-stone-50 to-amber-50/30">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl md:text-4xl font-light text-stone-800">加入 <span className="font-medium">清潔師團隊</span></h1>
          <p className="text-stone-500 mt-3">成為 HESON 的專業清潔服務夥伴，靈活排班、穩定收入</p>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
          {/* Progress Tabs */}
          <div className="flex gap-2 mb-10">
            {['identity', 'work', 'documents'].map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  section === s
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {sections[s].title}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section: Identity */}
            {section === 'identity' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">📋 基本身份與法定文件</p>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>暱稱 / 工作名稱 *</Label>
                      <Input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="例：阿美、清潔小王" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>聯絡電話 *</Label>
                      <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0912-345-678" className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Line ID</Label>
                      <Input value={form.line_id} onChange={e => setForm({ ...form, line_id: e.target.value })} placeholder="@example" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>電子郵件</Label>
                      <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className="rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>居住地址</Label>
                    <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="縣市區鄉鎮" className="rounded-xl" />
                  </div>

                  {/* File Upload: ID Copy */}
                  <div className="space-y-2">
                    <Label>身分證影本 * <span className="text-xs text-stone-400">(JPG/PNG)</span></Label>
                    <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:border-amber-500 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload('id_copy', e.target.files?.[0])}
                        className="hidden"
                        id="id-upload"
                      />
                      <label htmlFor="id-upload" className="cursor-pointer">
                        {files.id_copy ? (
                          <p className="text-green-600 font-medium flex items-center justify-center gap-2">✓ 已上傳</p>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-5 h-5 text-stone-400" />
                            <p className="text-sm text-stone-600">點擊上傳身分證影本</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* File Upload: Bank Copy */}
                  <div className="space-y-2">
                    <Label>銀行帳號存摺影本 * <span className="text-xs text-stone-400">(用於薪資匯款)</span></Label>
                    <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:border-amber-500 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload('bank_copy', e.target.files?.[0])}
                        className="hidden"
                        id="bank-upload"
                      />
                      <label htmlFor="bank-upload" className="cursor-pointer">
                        {files.bank_copy ? (
                          <p className="text-green-600 font-medium flex items-center justify-center gap-2">✓ 已上傳</p>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-5 h-5 text-stone-400" />
                            <p className="text-sm text-stone-600">點擊上傳銀行帳號影本</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setSection('work')}
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl"
                >
                  下一步 →
                </Button>
              </div>
            )}

            {/* Section: Work */}
            {section === 'work' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-5 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-800 font-medium">💼 工作相關資料</p>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>相關工作經驗</Label>
                      <Select value={form.experience_years} onValueChange={v => setForm({ ...form, experience_years: v })}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">無經驗（可受訓）</SelectItem>
                          <SelectItem value="1">1-2年</SelectItem>
                          <SelectItem value="3">3-5年</SelectItem>
                          <SelectItem value="5">5年以上</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>交通工具</Label>
                      <Select value={form.transportation} onValueChange={v => setForm({ ...form, transportation: v })}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="請選擇" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>無（大眾運輸）</SelectItem>
                          <SelectItem value="機車">機車</SelectItem>
                          <SelectItem value="汽車">汽車</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                      <Checkbox checked={form.pet_acceptance} onCheckedChange={v => setForm({ ...form, pet_acceptance: v })} />
                      <label className="text-sm text-stone-700 cursor-pointer">可接受有寵物家庭的打掃工作</label>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                      <Checkbox checked={form.has_own_tools} onCheckedChange={v => setForm({ ...form, has_own_tools: v })} />
                      <label className="text-sm text-stone-700 cursor-pointer">自備清潔用具</label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>每週可工作天數</Label>
                    <Input value={form.available_days} onChange={e => setForm({ ...form, available_days: e.target.value })} placeholder="例：3-4天" className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>可工作時段</Label>
                    <Input value={form.available_times} onChange={e => setForm({ ...form, available_times: e.target.value })} placeholder="例：09:00-17:00 或 全日" className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>期望薪資</Label>
                    <Input value={form.expected_salary} onChange={e => setForm({ ...form, expected_salary: e.target.value })} placeholder="例：時薪 $300 或 每間 $500" className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>過去工作經歷簡述</Label>
                    <Textarea value={form.past_work} onChange={e => setForm({ ...form, past_work: e.target.value })} placeholder="曾在哪些地方做過清潔工作..." className="rounded-xl min-h-[100px]" />
                  </div>

                  <div className="space-y-2">
                    <Label>健康狀況宣告</Label>
                    <Textarea value={form.health_issues} onChange={e => setForm({ ...form, health_issues: e.target.value })} placeholder="是否有嚴重過敏、氣喘、腰傷等影響工作的健康問題" className="rounded-xl min-h-[80px]" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setSection('identity')}
                    variant="outline"
                    className="flex-1 py-6 rounded-xl"
                  >
                    ← 上一步
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSection('documents')}
                    className="flex-1 bg-stone-800 hover:bg-stone-900 text-white py-6 rounded-xl"
                  >
                    下一步 →
                  </Button>
                </div>
              </div>
            )}

            {/* Section: Documents & Terms */}
            {section === 'documents' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-green-800 font-medium">✓ 條款與聲明</p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-sm text-stone-700">
                    <h3 className="font-medium">工作內容說明：</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>換床單被套、整理枕頭、重新鋪床</li>
                      <li>清潔浴室（馬桶、洗手台、地板、玻璃）</li>
                      <li>吸塵、掃拖地、倒垃圾</li>
                      <li>補充備品（毛巾、牙刷、茶包、水等）</li>
                      <li>公共空間簡單整理（走廊、樓梯等）</li>
                    </ul>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <Checkbox
                      checked={form.health_declaration}
                      onCheckedChange={v => setForm({ ...form, health_declaration: v })}
                      className="mt-1"
                    />
                    <label className="text-xs text-stone-700 cursor-pointer">
                      我確認上述健康狀況宣告為真實，並能勝任上述工作內容。
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <Checkbox
                      checked={form.terms_agreed}
                      onCheckedChange={v => setForm({ ...form, terms_agreed: v })}
                      className="mt-1"
                    />
                    <label className="text-xs text-stone-700 cursor-pointer">
                      我已閱讀並同意 HESON 的 <a href="/TermsOfService" className="text-blue-600 underline" target="_blank">服務條款</a> 與 <a href="/PrivacyPolicy" className="text-blue-600 underline" target="_blank">隱私政策</a>。
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setSection('work')}
                    variant="outline"
                    className="flex-1 py-6 rounded-xl"
                  >
                    ← 上一步
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !form.health_declaration || !form.terms_agreed}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl"
                  >
                    {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />提交中...</> : "確認送出申請"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
}