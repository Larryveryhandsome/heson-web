import React from 'react';
import { AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function CancellationPolicy({ agreed, onAgreeChange }) {
  return (
    <Card className="border-2 border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertCircle className="w-5 h-5" />
          取消及退款政策
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 text-sm text-amber-950 leading-relaxed">
          <p>
            HESON 致力於提供優質的居家清潔服務，為了保護我們專業的清潔夥伴與客戶的權益，特此制定以下取消及退款政策：
          </p>

          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="flex gap-2">
                <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-700">服務日期前 3 天（含）以上取消</p>
                  <p className="text-amber-900 mt-1">💰 <span className="font-medium">全額退款</span></p>
                  <p className="text-xs text-stone-600 mt-1">
                    若在預定服務日期前 3 個自然日（或以上）提出取消申請，HESON 將全額退款。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="flex gap-2">
                <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-700">服務日期前 1-3 天取消</p>
                  <p className="text-amber-900 mt-1">💰 <span className="font-medium">退款 50%</span></p>
                  <p className="text-xs text-stone-600 mt-1">
                    若在預定服務日期前 1-3 日內提出取消申請，HESON 將退款 50%。扣除部分用作清潔夥伴的時間損失補償。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <div className="flex gap-2">
                <Calendar className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">服務日期前少於 1 天取消</p>
                  <p className="text-amber-900 mt-1">💰 <span className="font-medium">不予退款</span></p>
                  <p className="text-xs text-stone-600 mt-1">
                    若在預定服務日期前少於 24 小時內提出取消申請，因清潔夥伴已專程安排時間、備妥工具與材料，不予退款。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 text-xs space-y-2">
            <p className="font-semibold">📌 重要說明：</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>HESON 的清潔夥伴為獨立承包人，均會提前安排時間專程前往客戶府上。</li>
              <li>時間、車資與工具成本無法變更，尤其在緊急取消時更為困難。</li>
              <li>因此，取消政策是為了在維護雙方權益的基礎上公平處理。</li>
              <li>取消申請請於服務前 24 小時以上聯繫 HESON 官方 LINE 或客服電話。</li>
              <li>退款將於申請確認後 5-7 個工作日內回款至原付款帳戶。</li>
            </ul>
          </div>

          <div className="bg-stone-100 rounded-lg p-3 text-stone-700 text-xs space-y-2">
            <p className="font-semibold">🔄 變更服務日期或時間：</p>
            <p>
              如須變更服務日期或時間，請於原服務日期前 3 天提出申請，HESON 將盡力協助重新排期，不另收費。
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-4 border-t border-amber-200">
          <Checkbox
            id="policy-agree"
            checked={agreed}
            onCheckedChange={onAgreeChange}
            className="mt-1"
          />
          <Label
            htmlFor="policy-agree"
            className="text-sm text-amber-950 cursor-pointer font-medium leading-relaxed"
          >
            我已了解並同意 HESON 的取消及退款政策，並確認本訂單適用上述條款。
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}