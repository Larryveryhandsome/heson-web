/**
 * 通用 Entity CRUD + 行級安全（RLS）
 *
 * URL 格式：/api/entities/:entity
 * 支援操作：GET（列表/單筆）、POST（新增）、PUT（更新）、DELETE（刪除）
 *
 * RLS 規則（對應 Base44 定義）：
 *   - bookings: client_id 或 cleaner_id 等於 user.id，或是 admin
 *   - payments: client_id 等於 user.id，或是 admin
 *   - cleaner_profiles/client_profiles: user_id 等於 user.id，或是 admin
 *   - 其他：admin 才能讀
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

// 非同步 LINE 通知（不阻塞回應）
let _lineBot = null;
function getLineBot() {
  if (!_lineBot) { try { _lineBot = require('../utils/lineBot'); } catch { _lineBot = {}; } }
  return _lineBot;
}

// Entity 名稱 → 資料表名稱 對應
const ENTITY_TABLE = {
  Booking: 'bookings',
  Payment: 'payments',
  CleanerProfile: 'cleaner_profiles',
  ClientProfile: 'client_profiles',
  CleanerApplication: 'cleaner_applications',
  Attendance: 'attendance',
  ServiceReport: 'service_reports',
  ServiceReview: 'service_reviews',
  ServicePlan: 'service_plans',
  ServiceCase: 'service_cases',
  PartTimeSchedule: 'part_time_schedules',
  PartTimeScheduleHistory: 'part_time_schedule_history',
  BannedDevice: 'banned_devices',
  GoogleSheetLog: 'google_sheet_logs',
  CustomSheet: 'custom_sheets',
};

// 合法欄位名正則（防止 column-name injection）
const SAFE_COL = /^[a-z_][a-z0-9_]*$/;
function safeCol(name) {
  if (!SAFE_COL.test(name)) throw new Error(`非法欄位名：${name}`);
  return name;
}

// 行級安全過濾 → { sql, params }（全參數化，無字串插值）
function rlsFilter(entity, user) {
  if (!user) return null;
  if (user.role === 'admin') return { sql: '1=1', params: [] };

  const id = user.id;
  switch (entity) {
    case 'Booking':
      return {
        sql: '(client_id = ? OR cleaner_id IN (SELECT id FROM cleaner_profiles WHERE user_id = ?))',
        params: [id, id],
      };
    case 'Payment':
      return { sql: 'client_id = ?', params: [id] };
    case 'CleanerProfile':
    case 'ClientProfile':
      return { sql: 'user_id = ?', params: [id] };
    case 'Attendance':
      return { sql: 'cleaner_id = ?', params: [id] };
    case 'ServiceReport':
    case 'ServiceReview':
      return { sql: '(cleaner_id = ? OR client_id = ?)', params: [id, id] };
    case 'CleanerApplication':
      return { sql: 'user_id = ?', params: [id] };
    case 'PartTimeSchedule':
      return { sql: 'cleaner_id = ?', params: [id] };
    default:
      return { sql: '1=0', params: [] };
  }
}

// 解析 JSON 欄位（array 類型）
function parseRow(row) {
  if (!row) return row;
  const jsonFields = ['service_types', 'service_areas', 'before_photos', 'after_photos', 'columns', 'data'];
  const out = { ...row };
  for (const f of jsonFields) {
    if (out[f] && typeof out[f] === 'string') {
      try { out[f] = JSON.parse(out[f]); } catch { /* keep as string */ }
    }
  }
  // boolean 欄位
  const boolFields = ['has_own_tools', 'police_record_verified', 'id_verified', 'is_active',
    'confirmed_by_cleaner', 'has_pets'];
  for (const f of boolFields) {
    if (f in out) out[f] = Boolean(out[f]);
  }
  // Base44 相容別名：created_at → created_date、updated_at → updated_date
  if (out.created_at !== undefined) out.created_date = out.created_at;
  if (out.updated_at !== undefined) out.updated_date = out.updated_at;
  return out;
}

// 序列化插入資料（array → JSON string）
function serializeData(data) {
  const jsonFields = ['service_types', 'service_areas', 'before_photos', 'after_photos', 'enhance_areas', 'weekdays', 'columns', 'data'];
  const out = { ...data };
  for (const f of jsonFields) {
    if (out[f] !== undefined && typeof out[f] !== 'string') {
      out[f] = JSON.stringify(out[f]);
    }
  }
  return out;
}

// ────────────────────────────────────────────
// GET /api/entities/:entity          → 列表
// GET /api/entities/:entity/:id      → 單筆
// ────────────────────────────────────────────
router.get('/:entity', optionalAuth, (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return res.status(404).json({ error: '找不到此 Entity' });

  const rls = rlsFilter(req.params.entity, req.user);
  if (rls === null) return res.status(401).json({ error: '未登入' });

  const conditions = [rls.sql];
  const params = [...rls.params];

  // 支援簡單篩選：?field=value — 欄位名必須是安全識別字
  const META_KEYS = new Set(['_sort', '_order', '_limit', '_offset']);
  for (const key of Object.keys(req.query)) {
    if (META_KEYS.has(key)) continue;
    try { safeCol(key); } catch { continue; } // 略過非法欄位名
    conditions.push(`${key} = ?`);
    params.push(req.query[key]);
  }

  // 排序：只允許白名單欄位，防止 ORDER BY injection
  const SORT_WHITELIST = new Set(['created_at', 'updated_at', 'scheduled_date', 'name', 'status', 'id']);
  const sortAlias = { created_date: 'created_at', updated_date: 'updated_at' };
  const rawSort = req.query._sort || 'created_at';
  const sort = sortAlias[rawSort] || (SORT_WHITELIST.has(rawSort) ? rawSort : 'created_at');
  const order = req.query._order === 'asc' ? 'ASC' : 'DESC';
  const limit = Math.min(parseInt(req.query._limit) || 200, 1000);
  const offset = parseInt(req.query._offset) || 0;

  try {
    const rows = db.prepare(
      `SELECT * FROM ${table} WHERE ${conditions.join(' AND ')} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset).map(parseRow);
    res.json(rows);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:entity/:id', optionalAuth, (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return res.status(404).json({ error: '找不到此 Entity' });

  const rls = rlsFilter(req.params.entity, req.user);
  if (rls === null) return res.status(401).json({ error: '未登入' });

  const authorized = db.prepare(
    `SELECT * FROM ${table} WHERE id = ? AND (${rls.sql})`
  ).get(req.params.id, ...rls.params);
  if (!authorized) return res.status(404).json({ error: '找不到此資料' });

  res.json(parseRow(authorized));
});

// ────────────────────────────────────────────
// POST /api/entities/:entity  → 新增
// ────────────────────────────────────────────
router.post('/:entity', optionalAuth, (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return res.status(404).json({ error: '找不到此 Entity' });

  // 部分 entity 需要登入才能建立
  const requiresAuth = ['CleanerProfile', 'ServiceReport', 'ServiceReview', 'Attendance', 'PartTimeSchedule'];
  if (requiresAuth.includes(req.params.entity) && !req.user) {
    return res.status(401).json({ error: '需要登入' });
  }

  const id = uuidv4();
  const data = serializeData({ id, ...req.body });

  // 自動注入 user_id / client_id（如果是本人操作）
  if (req.user) {
    if (!data.client_id && table === 'bookings') data.client_id = req.user.id;
    if (!data.user_id && ['client_profiles', 'cleaner_profiles', 'cleaner_applications'].includes(table)) {
      data.user_id = req.user.id;
    }
  }

  const cols = Object.keys(data);
  const placeholders = cols.map(() => '?').join(', ');
  const vals = Object.values(data);

  try {
    db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`).run(...vals);
    const created = parseRow(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));

    // 新預約 → LINE 群組通知（非同步，不阻塞回應）
    if (req.params.entity === 'Booking') {
      setImmediate(() => {
        const lb = getLineBot();
        if (lb.notifyGroups) {
          const b = created;
          const contact = process.env.LINE_CONTACT || '請聯絡管理員';
          const notes = b.notes ? `\n重點：\n${b.notes.split('\n').map(l => `*${l}`).join('\n')}` : '';
          const msg = [
            '🌟最新案件通知 @All',
            '',
            '⚠️名額有限‼️招滿為止‼️',
            '',
            `${b.service_type || '清潔服務'}`,
            '［需1人，缺1人］',
            `📅 ${b.scheduled_date || ''} ${b.time_slot || ''}`,
            `🏠 ${b.city || ''}`,
            `📍 ${b.address || ''}`,
            notes,
            '',
            '⸻',
            '',
            '👇🏻接案需求請聯絡：',
            `Line ➤ ${contact}`,
          ].filter(l => l !== null).join('\n');
          lb.notifyGroups(msg).catch(e => console.error('[LINE] 新預約通知失敗:', e.message));
        }
      });
    }

    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ────────────────────────────────────────────
// PUT /api/entities/:entity/:id  → 更新
// ────────────────────────────────────────────
router.put('/:entity/:id', requireAuth, (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return res.status(404).json({ error: '找不到此 Entity' });

  const rls = rlsFilter(req.params.entity, req.user);
  const authorized = db.prepare(
    `SELECT id FROM ${table} WHERE id = ? AND (${rls.sql})`
  ).get(req.params.id, ...rls.params);
  if (!authorized) return res.status(403).json({ error: '無權修改此資料' });

  const data = serializeData(req.body);
  delete data.id;
  delete data.created_at;

  // 驗證欄位名
  let setClauses;
  try {
    setClauses = Object.keys(data).map(k => `${safeCol(k)} = ?`).join(', ');
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const vals = [...Object.values(data), req.params.id];

  try {
    db.prepare(`UPDATE ${table} SET ${setClauses} WHERE id = ?`).run(...vals);
    const updated = parseRow(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id));
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ────────────────────────────────────────────
// DELETE /api/entities/:entity/:id  → 刪除
// ────────────────────────────────────────────
router.delete('/:entity/:id', requireAuth, (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return res.status(404).json({ error: '找不到此 Entity' });

  const rls = rlsFilter(req.params.entity, req.user);
  const authorized = db.prepare(
    `SELECT id FROM ${table} WHERE id = ? AND (${rls.sql})`
  ).get(req.params.id, ...rls.params);
  if (!authorized) return res.status(403).json({ error: '無權刪除此資料' });

  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
