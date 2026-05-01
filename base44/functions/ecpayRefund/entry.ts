import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function ecpayUrlEncode(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .toLowerCase();
}

async function generateCheckMac(params, hashKey, hashIV) {
  const sorted = Object.keys(params).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  let str = `HashKey=${hashKey}&` + sorted.map(k => `${k}=${params[k]}`).join('&') + `&HashIV=${hashIV}`;
  str = ecpayUrlEncode(str);
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

const ECPAY_REFUND_URL = 'https://payment.ecpay.com.tw/CreditDetail/DoAction';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { payment_id } = await req.json();
    const payments = await base44.asServiceRole.entities.Payment.filter({ id: payment_id });
    if (!payments.length) return Response.json({ error: '找不到付款記錄' }, { status: 404 });

    const p = payments[0];
    if (p.status !== '已付款') return Response.json({ error: '此筆交易無法退款' }, { status: 400 });
    if (!p.trade_no) return Response.json({ error: '缺少綠界交易編號' }, { status: 400 });

    const merchantID = Deno.env.get('ECPAY_MERCHANT_ID');
    const hashKey = Deno.env.get('ECPAY_HASH_KEY');
    const hashIV = Deno.env.get('ECPAY_HASH_IV');

    const params = {
      MerchantID: merchantID,
      MerchantTradeNo: p.merchant_trade_no,
      TradeNo: p.trade_no,
      Action: 'R',
      TotalAmount: String(p.amount),
    };
    params.CheckMacValue = await generateCheckMac(params, hashKey, hashIV);

    const formBody = new URLSearchParams(params).toString();
    const response = await fetch(ECPAY_REFUND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });
    const result = await response.text();

    if (result.includes('1|OK') || result.includes('RtnCode=1')) {
      await base44.asServiceRole.entities.Payment.update(p.id, { status: '已退款' });
      if (p.booking_id) {
        await base44.asServiceRole.entities.Booking.update(p.booking_id, { status: '已取消' });
      }
      return Response.json({ success: true, message: '退款成功' });
    } else {
      return Response.json({ success: false, message: `退款失敗：${result}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});