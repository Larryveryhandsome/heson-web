/**
 * LINE Webhook 路由
 * POST /api/line/webhook  → LINE 平台推送事件
 * GET  /api/line/groups   → 查詢已登記群組（管理用）
 * GET  /api/line/members  → 查詢已記錄的群組成員
 */

const express = require('express');
const {
  verifySignature, saveGroupId, saveMember, fetchMemberDisplayName,
  pushMessageWithMentions, getBotUserId,
} = require('../utils/lineBot');
const { formatCaseList } = require('../utils/lineCaseFormatter');

const router = express.Router();

async function handleEvent(event) {
  const src = event.source || {};

  // Bot 加入群組 → 儲存群組 ID
  if (event.type === 'join') {
    const id = src.groupId || src.roomId;
    if (id) {
      saveGroupId(id);
      console.log(`[LINE] Bot 加入：${id}`);
    }
    return;
  }

  // 追蹤好友
  if (event.type === 'follow') {
    console.log(`[LINE] 新好友：${src.userId}`);
    return;
  }

  // 任何群組訊息 → 記錄發話者為成員
  if (event.type === 'message') {
    const groupId = src.groupId || src.roomId;
    const userId = src.userId;

    if (groupId && userId) {
      // 背景取得 display name 並儲存（非阻塞）
      setImmediate(async () => {
        try {
          const displayName = await fetchMemberDisplayName(groupId, userId);
          saveMember(groupId, userId, displayName);
        } catch { /* silent */ }
      });
    }

    // 只處理文字訊息
    if (event.message?.type !== 'text') return;
    if (!groupId) return;

    const mentionees = event.message.mention?.mentionees || [];
    if (mentionees.length === 0) return;

    // 確認 Bot 被 mention
    const botId = await getBotUserId();
    const botMentioned = botId
      ? mentionees.some(m => m.userId === botId)
      : true;
    if (!botMentioned) return;

    // 移除所有 @xxx，取出案件純文字
    const rawText = event.message.text.replace(/@[^\s\n]+/g, '').trim();
    if (rawText.length < 5) return;

    console.log(`[LINE] 案件排班請求（群組 ${groupId}）：${rawText.slice(0, 60)}`);

    try {
      const contact = process.env.LINE_CONTACT || '請聯絡管理員';
      const formatted = await formatCaseList(rawText, contact);
      await pushMessageWithMentions(groupId, formatted);
      console.log(`[LINE] 已發送格式化案件至 ${groupId}`);
    } catch (err) {
      console.error('[LINE] 案件格式化失敗:', err.message);
    }
  }
}

// POST /api/line/webhook
router.post('/webhook', (req, res) => {
  const signature = req.headers['x-line-signature'];
  const rawForVerify = Buffer.from(JSON.stringify(req.body) || '{}');
  if (!verifySignature(rawForVerify, signature)) {
    console.warn('[LINE] 簽名驗證失敗（未設定 secret 時跳過）');
  }

  const events = req.body?.events || [];
  res.status(200).json({ ok: true });

  for (const event of events) {
    handleEvent(event).catch(err =>
      console.error('[LINE] handleEvent error:', err.message)
    );
  }
});

// GET /api/line/groups
router.get('/groups', (req, res) => {
  try {
    const db = require('../db');
    const groups = db.prepare(
      "SELECT value, updated_at FROM app_config WHERE key LIKE 'line_group_%'"
    ).all();
    res.json({ groups: groups.map(g => ({ id: g.value, registeredAt: g.updated_at })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/line/members — 管理用，查看已記錄的成員
router.get('/members', (req, res) => {
  try {
    const db = require('../db');
    const members = db.prepare(
      'SELECT group_id, user_id, display_name, updated_at FROM line_group_members ORDER BY group_id, display_name'
    ).all();
    res.json({ members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
