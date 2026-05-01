/**
 * LINE Messaging API 工具
 * - notifyGroups(message)         → 通知所有群組（含真正 @mention 所有成員）
 * - notifyUser(lineId, msg)       → 通知個別管理師
 * - saveMember(groupId, userId)   → 記錄群組成員
 * - verifySignature(body, sig)    → Webhook 簽名驗證
 */

const https = require('https');
const crypto = require('crypto');
const db = require('../db');

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

// ─── 群組管理 ───────────────────────────────────────
function getGroupIds() {
  try {
    return db.prepare("SELECT value FROM app_config WHERE key LIKE 'line_group_%'")
      .all().map(r => r.value);
  } catch { return []; }
}

function saveGroupId(groupId) {
  try {
    db.prepare("INSERT OR REPLACE INTO app_config(key,value,updated_at) VALUES(?,?,datetime('now'))")
      .run(`line_group_${groupId}`, groupId);
    console.log(`[LINE] 已儲存群組 ID：${groupId}`);
  } catch (err) {
    console.error('[LINE] saveGroupId error:', err.message);
  }
}

// ─── 成員管理 ───────────────────────────────────────
function saveMember(groupId, userId, displayName) {
  try {
    db.prepare(`INSERT OR REPLACE INTO line_group_members(group_id,user_id,display_name,updated_at)
                VALUES(?,?,?,datetime('now'))`)
      .run(groupId, userId, displayName || null);
  } catch (err) {
    console.error('[LINE] saveMember error:', err.message);
  }
}

function getGroupMembers(groupId) {
  try {
    return db.prepare('SELECT user_id, display_name FROM line_group_members WHERE group_id = ?')
      .all(groupId);
  } catch { return []; }
}

// ─── LINE API 呼叫工具 ───────────────────────────────
function lineRequest(path, method, body) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.line.me',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }); }
        catch { resolve({ status: res.statusCode, body: {} }); }
      });
    });
    req.on('error', () => resolve({ status: 0, body: {} }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// 取得群組成員 display name（LINE API）
async function fetchMemberDisplayName(groupId, userId) {
  const r = await lineRequest(`/v2/bot/group/${groupId}/member/${userId}`, 'GET');
  return r.body?.displayName || null;
}

// ─── 推播訊息（純文字，不含 mention）───────────────
async function pushMessage(to, text) {
  if (!TOKEN) { console.warn('[LINE] 未設定 LINE_CHANNEL_ACCESS_TOKEN，跳過通知'); return; }
  const r = await lineRequest('/v2/bot/message/push', 'POST', {
    to,
    messages: [{ type: 'text', text: String(text) }],
  });
  if (r.status >= 400) console.error(`[LINE] push error ${r.status}:`, JSON.stringify(r.body));
  return r.body;
}

// ─── 推播訊息（含真正 @mention 所有已記錄成員）────────
async function pushMessageWithMentions(groupId, text) {
  if (!TOKEN) { console.warn('[LINE] 未設定 LINE_CHANNEL_ACCESS_TOKEN，跳過通知'); return; }

  const members = getGroupMembers(groupId);
  if (members.length === 0) {
    // 沒有成員記錄就直接發純文字
    return pushMessage(groupId, text);
  }

  // 建立 @DisplayName 前綴，每個成員一個
  const mentionParts = members.map(m => `@${m.display_name || '成員'}`);
  const mentionPrefix = mentionParts.join(' ') + '\n';
  const fullText = mentionPrefix + text;

  // 建立 mentionees 陣列（計算每個 @name 的字元位置）
  const mentionees = [];
  let cursor = 0;
  for (const m of members) {
    const name = m.display_name || '成員';
    const tag = `@${name}`;
    mentionees.push({
      index: cursor,
      length: tag.length,
      userId: m.user_id,
      type: 'user',
    });
    cursor += tag.length + 1; // +1 for space
  }

  const message = {
    type: 'text',
    text: fullText,
    mention: { mentionees },
  };

  const r = await lineRequest('/v2/bot/message/push', 'POST', {
    to: groupId,
    messages: [message],
  });

  if (r.status >= 400) {
    console.error(`[LINE] push mention error ${r.status}:`, JSON.stringify(r.body));
    // fallback：發純文字
    return pushMessage(groupId, text);
  }
  return r.body;
}

// ─── 通知所有群組（含 @mention）────────────────────
async function notifyGroups(message) {
  const gids = getGroupIds();
  if (gids.length === 0) { console.log('[LINE] 尚無登記群組，跳過'); return; }
  for (const gid of gids) {
    await pushMessageWithMentions(gid, message);
  }
}

async function notifyUser(lineId, message) {
  if (!lineId) return;
  await pushMessage(lineId, message);
}

// ─── Webhook 簽名驗證 ─────────────────────────────
function verifySignature(rawBody, signature) {
  if (!CHANNEL_SECRET) return true;
  const hmac = crypto.createHmac('sha256', CHANNEL_SECRET).update(rawBody).digest('base64');
  return hmac === signature;
}

// ─── LINE Reply API ──────────────────────────────
async function replyMessage(replyToken, text) {
  if (!TOKEN || !replyToken) return;
  const r = await lineRequest('/v2/bot/message/reply', 'POST', {
    replyToken,
    messages: [{ type: 'text', text: String(text) }],
  });
  if (r.status >= 400) console.error(`[LINE] reply error ${r.status}:`, JSON.stringify(r.body));
}

// ─── Bot 自身 userId ─────────────────────────────
let _botUserId = null;
async function getBotUserId() {
  if (_botUserId) return _botUserId;
  if (!TOKEN) return null;
  const r = await lineRequest('/v2/bot/info', 'GET');
  _botUserId = r.body?.userId || null;
  if (_botUserId) console.log(`[LINE] Bot userId: ${_botUserId}`);
  return _botUserId;
}

module.exports = {
  notifyGroups, notifyUser,
  pushMessage, pushMessageWithMentions,
  replyMessage, getBotUserId,
  saveGroupId, saveMember, getGroupMembers,
  fetchMemberDisplayName,
  verifySignature,
};
