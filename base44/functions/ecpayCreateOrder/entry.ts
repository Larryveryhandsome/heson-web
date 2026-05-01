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

const ECPAY_URL = 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, amount, item_name, return_url } = await req.json();

    const merchantID = Deno.env.get('ECPAY_MERCHANT_ID');
    const hashKey = Deno.env.get('ECPAY_HASH_KEY');
    const hashIV = Deno.env.get('ECPAY_HASH_IV');

    const merchantTradeNo = `HES${Date.now()}`.substring(0, 20);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const merchantTradeDate = `${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const reqUrl = new URL(req.url);
    const callbackUrl = `https://api.base44.com/api/apps/${Deno.env.get('BASE44_APP_ID')}/functions/ecpayCallback`;

    const params = {
      MerchantID: merchantID,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: merchantTradeDate,
      PaymentType: 'aio',
      TotalAmount: String(Math.round(amount)),
      TradeDesc: 'HESON居家清潔服務',
      ItemName: item_name,
      ReturnURL: callbackUrl,
      ChoosePayment: 'Credit',
      EncryptType: '1',
      OrderResultURL: return_url || `https://heson.base44.app/PaymentResult`,
    };

    params.CheckMacValue = await generateCheckMac(params, hashKey, hashIV);

    await base44.entities.Payment.create({
      booking_id,
      client_id: user.id,
      merchant_trade_no: merchantTradeNo,
      amount: Math.round(amount),
      status: '待付款',
      item_name,
    });

    const formFields = Object.entries(params)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`)
      .join('\n');

    const formHtml = `<!DOCTYPE html><html><body>
<form id="ecpay" action="${ECPAY_URL}" method="POST">${formFields}</form>
<script>document.getElementById('ecpay').submit();</script>
</body></html>`;

    return Response.json({ formHtml, merchantTradeNo });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});