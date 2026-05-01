/**
 * POST /api/contact  — 企業合作/一般洽詢
 * 儲存詢問內容，並透過 LINE 通知管理員
 */

const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { subject, body, to } = req.body || {};
  if (!subject || !body) return res.status(400).json({ error: '缺少必填欄位' });

  // 非同步送 LINE 通知
  setImmediate(async () => {
    try {
      const lb = require('../utils/lineBot');
      if (lb.notifyGroups) {
        const msg = `📩 新洽詢通知\n\n主旨：${subject}\n\n${body}`;
        await lb.notifyGroups(msg);
      }
    } catch (e) {
      console.error('[contact] LINE 通知失敗:', e.message);
    }
  });

  res.json({ ok: true });
});

module.exports = router;
