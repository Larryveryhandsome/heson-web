/**
 * 綠界 ECPay 金流路由
 *
 * 環境變數（在 server/.env 設定）：
 *   ECPAY_MERCHANT_ID  — 特店編號（正式：8 碼，測試：2000132）
 *   ECPAY_HASH_KEY     — Hash Key
 *   ECPAY_HASH_IV      — Hash IV
 *   ECPAY_API_URL      — API 位址（測試：https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5）
 *   SERVER_URL         — 本伺服器公開網址（供 ECPay callback，例如 http://61.220.214.118:4001）
 */
const express = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

// ──────────────────────────────────────────────
// 工具函式
// ──────────────────────────────────────────────

/** 綠界 URL 編碼（小寫、空白→+，特殊字元保留） */
function ecpayEncode(str) {
  return encodeURIComponent(String(str))
    .replace(/%20/g, '+')
    .replace(/!/g,   '%21')
    .replace(/'/g,   '%27')
    .replace(/\(/g,  '%28')
    .replace(/\)/g,  '%29')
    .replace(/\*/g,  '%2A')
    .toLowerCase();
}

/** 產生 CheckMacValue（SHA256） */
function genCheckMac(params, hashKey, hashIV) {
  const sorted = Object.keys(params)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(k => `${k}=${params[k]}`)
    .join('&');
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  return crypto.createHash('sha256').update(ecpayEncode(raw)).digest('hex').toUpperCase();
}

/** 取得設定，回傳 null 表示尚未設定 */
function getConfig() {
  const id  = process.env.ECPAY_MERCHANT_ID;
  const key = process.env.ECPAY_HASH_KEY;
  const iv  = process.env.ECPAY_HASH_IV;
  if (!id || !key || !iv) return null;
  return {
    merchantId: id,
    hashKey:    key,
    hashIV:     iv,
    apiUrl: process.env.ECPAY_API_URL ||
      'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
    serverUrl: process.env.SERVER_URL || 'http://localhost:4001',
  };
}

// ──────────────────────────────────────────────
// POST /api/functions/ecpayCreateOrder
// 前端呼叫：base44.functions.invoke('ecpayCreateOrder', {...})
// ──────────────────────────────────────────────
router.post('/', requireAuth, (req, res) => {
  const cfg = getConfig();
  if (!cfg) {
    return res.status(503).json({
      error: '付款功能尚未啟用，請在 server/.env 填入 ECPay 相關設定後重啟伺服器。'
    });
  }

  const { booking_id, amount, item_name, return_url } = req.body;
  if (!booking_id || !amount) {
    return res.status(400).json({ error: '缺少 booking_id 或 amount' });
  }

  const amountInt = Math.round(Number(amount));
  if (isNaN(amountInt) || amountInt <= 0) {
    return res.status(400).json({ error: '金額格式錯誤' });
  }

  // MerchantTradeNo：最多 20 碼英數字，不可重複
  const tradeNo = `H${Date.now()}`.slice(0, 20);

  // 交易時間
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const tradeDate =
    `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Callback：ECPay server → 本伺服器（需公開可存取）
  const returnUrl = `${cfg.serverUrl}/api/functions/ecpayCreateOrder/callback`;
  // 付款完成後前端跳轉 URL
  const orderResultUrl = return_url || `${cfg.serverUrl}/PaymentResult`;

  const params = {
    MerchantID:        cfg.merchantId,
    MerchantTradeNo:   tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType:       'aio',
    TotalAmount:       String(amountInt),
    TradeDesc:         'HESON%E5%B1%85%E5%AE%B6%E6%B8%85%E6%BD%94%E6%9C%8D%E5%8B%99',
    ItemName:          item_name || 'HESON居家清潔服務',
    ReturnURL:         returnUrl,
    OrderResultURL:    orderResultUrl,
    ChoosePayment:     'Credit',
    EncryptType:       '1',
  };
  params.CheckMacValue = genCheckMac(params, cfg.hashKey, cfg.hashIV);

  // 寫入 payments 表
  try {
    const paymentId = `pay_${Date.now()}`;
    db.prepare(`
      INSERT INTO payments (id, booking_id, merchant_trade_no, amount, status, item_name)
      VALUES (?, ?, ?, ?, '待付款', ?)
    `).run(paymentId, booking_id, tradeNo, amountInt, item_name || 'HESON居家清潔服務');
  } catch (err) {
    console.error('[ECPay] 寫入 payments 失敗：', err.message);
    // 繼續，不中斷付款流程
  }

  // 產生送出表單的 HTML
  const inputs = Object.entries(params)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${v.replace(/"/g, '&quot;')}" />`)
    .join('\n');
  const formHtml = `<form method="POST" action="${cfg.apiUrl}">\n${inputs}\n</form>`;

  res.json({ formHtml, tradeNo });
});

// ──────────────────────────────────────────────
// POST /api/functions/ecpayCallback
// 綠界付款結果通知（由 ECPay 伺服器 POST）
// ──────────────────────────────────────────────
router.post('/callback', (req, res) => {
  const cfg = getConfig();
  if (!cfg) return res.send('0|Config Error');

  const params = { ...req.body };
  const receivedMac = params.CheckMacValue;
  delete params.CheckMacValue;

  const expected = genCheckMac(params, cfg.hashKey, cfg.hashIV);
  if (expected !== receivedMac) {
    console.warn('[ECPay] CheckMacValue 驗證失敗');
    return res.send('0|CheckMacValue Error');
  }

  const { RtnCode, MerchantTradeNo, TradeNo, PaymentType } = params;
  const status = RtnCode === '1' ? '已付款' : '付款失敗';

  try {
    db.prepare(`
      UPDATE payments
      SET status = ?, trade_no = ?, payment_type = ?,
          payment_date = datetime('now'), ecpay_response = ?
      WHERE merchant_trade_no = ?
    `).run(status, TradeNo || '', PaymentType || '', JSON.stringify(params), MerchantTradeNo);

    if (RtnCode === '1') {
      // 同步更新預約狀態
      const payment = db.prepare(
        'SELECT booking_id FROM payments WHERE merchant_trade_no = ?'
      ).get(MerchantTradeNo);
      if (payment) {
        db.prepare(`UPDATE bookings SET status = '已付款' WHERE id = ?`)
          .run(payment.booking_id);
      }
    }
  } catch (err) {
    console.error('[ECPay] callback 更新失敗：', err.message);
  }

  res.send('1|OK');
});

module.exports = router;
