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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const formData = await req.formData();
    const params = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    const hashKey = Deno.env.get('ECPAY_HASH_KEY');
    const hashIV = Deno.env.get('ECPAY_HASH_IV');

    const receivedMac = params.CheckMacValue;
    const paramsWithoutMac = { ...params };
    delete paramsWithoutMac.CheckMacValue;
    const computedMac = await generateCheckMac(paramsWithoutMac, hashKey, hashIV);

    if (receivedMac !== computedMac) {
      return new Response('0|CheckMacValue Error', { status: 200 });
    }

    const merchantTradeNo = params.MerchantTradeNo;
    const rtnCode = params.RtnCode;
    const tradeNo = params.TradeNo;
    const paymentType = params.PaymentType;
    const paymentDate = params.PaymentDate;

    const payments = await base44.asServiceRole.entities.Payment.filter({ merchant_trade_no: merchantTradeNo });
    if (payments.length > 0) {
      const payment = payments[0];
      const isSuccess = rtnCode === '1';

      await base44.asServiceRole.entities.Payment.update(payment.id, {
        trade_no: tradeNo,
        status: isSuccess ? '已付款' : '付款失敗',
        payment_type: paymentType,
        payment_date: paymentDate,
        ecpay_response: JSON.stringify(params),
      });

      if (isSuccess && payment.booking_id) {
        await base44.asServiceRole.entities.Booking.update(payment.booking_id, { status: '已確認' });
      }
    }

    return new Response('1|OK', { status: 200 });
  } catch (error) {
    return new Response('0|Error', { status: 200 });
  }
});