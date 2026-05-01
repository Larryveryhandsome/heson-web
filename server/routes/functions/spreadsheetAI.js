/**
 * 試算表 AI 助理
 * 三層優化：FAQ → DB 直查 → Claude CLI（壓縮資料量）
 */
const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { routeSpreadsheet } = require('../../utils/claude');
const aiCache = require('../../utils/aiCache');
const db = require('../../db');

const router = express.Router();

// ─────────────────────────────────────────────
// 層 1：FAQ（純文字問題）
// ─────────────────────────────────────────────
const SHEET_FAQ = [
  {
    patterns: ['欄位', '有哪些欄位', '欄位名稱', '哪些欄位'],
    answer: `試算表欄位說明：
- **客戶姓名**：預約人全名
- **服務類型**：單次清潔 / 基礎月護 / 進階月安 / 尊榮月恆
- **預約日期**：格式 YYYY-MM-DD
- **時段**：上午 08:00-12:00 / 下午 13:00-17:00 / 晚間 18:00-21:00
- **狀態**：待確認 / 已確認 / 進行中 / 已完成 / 已取消
- **地址**：服務地址
- **指派管理師**：負責管理師姓名
- **備註**：特殊需求或說明`
  },
  {
    patterns: ['狀態有哪些', '可以改成什麼狀態', '狀態選項'],
    answer: `預約狀態選項：
**待確認** → 剛建立，待管理員確認
**已確認** → 管理員確認，等待服務
**進行中** → 服務進行中
**已完成** → 服務已完成（超過日期自動更新）
**已取消** → 已取消`
  },
];

function checkSheetFAQ(message) {
  const msg = message.toLowerCase();
  for (const faq of SHEET_FAQ) {
    if (faq.patterns.some(p => msg.includes(p.toLowerCase()))) return faq.answer;
  }
  return null;
}

// ─────────────────────────────────────────────
// 層 2：DB 直查（純查詢，不需要 AI）
// ─────────────────────────────────────────────
function trySheetDBAnswer(message, bookings) {
  const msg = message;

  // 統計類
  if (/共幾筆|總共幾|有幾筆|幾筆資料/.test(msg)) {
    return `目前試算表共 **${bookings.length}** 筆預約資料。`;
  }

  // 待確認
  if (/待確認/.test(msg) && !/改|修改|更新|設定/.test(msg)) {
    const rows = bookings.filter(b => b.status === '待確認');
    if (rows.length === 0) return '目前沒有待確認的預約。';
    return `待確認預約共 **${rows.length}** 筆：\n` +
      rows.map((r, i) => `${i+1}. ${r.client_name} | ${r.service_type} | ${r.scheduled_date}`).join('\n');
  }

  // 未指派
  if (/未指派|沒有管理師|沒指派/.test(msg)) {
    const rows = bookings.filter(b => !b.cleaner_name && b.status !== '已取消');
    if (rows.length === 0) return '所有預約都已指派管理師。';
    return `未指派管理師共 **${rows.length}** 筆：\n` +
      rows.map((r, i) => `${i+1}. ${r.client_name} | ${r.scheduled_date} | ${r.status}`).join('\n');
  }

  return null;
}

// ─────────────────────────────────────────────
// 壓縮 booking 資料（只傳必要欄位給 AI）
// ─────────────────────────────────────────────
function compressBookings(bookings) {
  return bookings.slice(0, 50).map((b, i) =>
    `[${i+1}]${b.id}|${b.client_name||''}|${b.service_type||''}|${b.scheduled_date||''}|${b.status||''}|${b.cleaner_name||''}`
  ).join('\n');
}

// ─────────────────────────────────────────────
// POST /api/functions/spreadsheetAI
// ─────────────────────────────────────────────
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '僅限管理員使用' });

  try {
    const { message, bookings: clientBookings } = req.body;
    if (!message) return res.status(400).json({ error: '請輸入問題' });

    const msg = message.trim();

    // 從 DB 取得最新資料（不依賴前端傳來的，確保準確）
    const bookings = (() => {
      try {
        return db.prepare(
          'SELECT id,client_name,service_type,scheduled_date,time_slot,status,address,cleaner_name,notes FROM bookings ORDER BY created_at DESC LIMIT 100'
        ).all();
      } catch { return clientBookings || []; }
    })();

    // 層 1：FAQ
    const faqAnswer = checkSheetFAQ(msg);
    if (faqAnswer) return res.json({ reply: faqAnswer, mutations: undefined, success: true });

    // 層 2：DB 直查
    const dbAnswer = trySheetDBAnswer(msg, bookings);
    if (dbAnswer) return res.json({ reply: dbAnswer, mutations: undefined, success: true });

    // 層 3：快取
    const cached = aiCache.get('sheet', msg);
    if (cached) return res.json({ reply: cached, mutations: undefined, success: true });

    // 層 4：Claude CLI（壓縮資料）
    const bookingList = compressBookings(bookings);
    const systemPrompt = `你是 HESON 試算表 AI 助理，管理預約資料。繁體中文回答。

【格式】ID|客戶|服務類型|日期|狀態|管理師
【資料（共 ${bookings.length} 筆，顯示前 50 筆）】
${bookingList}

【修改指令格式】
如需修改資料，在回答末尾附加：
\`\`\`json
{"mutations":[{"id":"booking_id","fields":{"field":"value"}}]}
\`\`\`
如需刪除：{"id":"booking_id","delete":true}`;

    const { text: reply, model, tokens } = await routeSpreadsheet(systemPrompt, msg);

    // 解析 mutations
    let mutations = [];
    let cleanReply = reply;
    const jsonMatch = reply.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.mutations?.length > 0) {
          mutations = parsed.mutations;
          for (const m of mutations) {
            if (m.id && m.fields) {
              const setClauses = Object.keys(m.fields).map(k => `${k} = ?`).join(', ');
              db.prepare(`UPDATE bookings SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`)
                .run(...Object.values(m.fields), m.id);
            } else if (m.id && m.delete) {
              db.prepare('DELETE FROM bookings WHERE id = ?').run(m.id);
            }
          }
          cleanReply = reply.replace(/```json[\s\S]*?```/g, '').trim();
        }
      } catch { /* ignore parse errors */ }
    }

    // 純查詢才快取（含 mutations 的不快取）
    if (mutations.length === 0) {
      aiCache.set('sheet', msg, cleanReply);
    }

    res.json({
      reply: cleanReply,
      mutations: mutations.length > 0 ? mutations : undefined,
      success: true,
      _meta: { model, tokens },
    });
  } catch (err) {
    console.error('[spreadsheetAI]', err.message);
    res.status(500).json({ reply: '發生錯誤，請稍後再試。', success: false });
  }
});

module.exports = router;
