/**
 * HESON 自動化業務邏輯
 * - 預約狀態自動更新（逾期 → 已完成）
 * - 系統統計快取（5 分鐘 TTL，減少 DB 讀取）
 * - 定時任務排程器
 */

const db = require('../db');
const aiCache = require('./aiCache');

// ─────────────────────────────────────────────
// 統計快取（5 分鐘 TTL）
// ─────────────────────────────────────────────
let _statsCache = null;
let _statsCacheTs = 0;
const STATS_TTL = 5 * 60 * 1000;

function getStats(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _statsCache && now - _statsCacheTs < STATS_TTL) {
    return _statsCache;
  }
  try {
    const bookings  = db.prepare("SELECT COUNT(*) as n FROM bookings").get().n;
    const pending   = db.prepare("SELECT COUNT(*) as n FROM bookings WHERE status='待確認'").get().n;
    const confirmed = db.prepare("SELECT COUNT(*) as n FROM bookings WHERE status='已確認'").get().n;
    const completed = db.prepare("SELECT COUNT(*) as n FROM bookings WHERE status='已完成'").get().n;
    const users     = db.prepare("SELECT COUNT(*) as n FROM users").get().n;
    const cleaners  = db.prepare("SELECT COUNT(*) as n FROM cleaner_profiles").get().n;
    const clients   = db.prepare("SELECT COUNT(*) as n FROM client_profiles").get().n;
    const revenue   = db.prepare(
      "SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE status='已付款'"
    ).get().s;

    _statsCache = { bookings, pending, confirmed, completed, users, cleaners, clients, revenue };
    _statsCacheTs = now;
    return _statsCache;
  } catch (err) {
    console.error('[automation] getStats error:', err.message);
    return _statsCache || {};
  }
}

function invalidateStatsCache() {
  _statsCache = null;
  _statsCacheTs = 0;
  aiCache.invalidate('admin');   // 讓 adminAI FAQ 也重新計算
  aiCache.invalidate('sheet');
}

// ─────────────────────────────────────────────
// 預約狀態自動更新
// ─────────────────────────────────────────────
function autoUpdateBookingStatus() {
  try {
    // 超過服務日期且狀態為「已確認」→ 自動改為「已完成」
    const done = db.prepare(`
      UPDATE bookings
      SET status = '已完成', updated_at = datetime('now')
      WHERE scheduled_date < date('now')
        AND status = '已確認'
    `).run();

    // 超過服務日期 3 天且仍為「待確認」→ 改為「已取消」（未處理視為超時取消）
    const cancelled = db.prepare(`
      UPDATE bookings
      SET status = '已取消', updated_at = datetime('now'),
          notes = COALESCE(notes || ' | ', '') || '系統自動取消（超時未確認）'
      WHERE scheduled_date < date('now', '-3 days')
        AND status = '待確認'
    `).run();

    if (done.changes > 0 || cancelled.changes > 0) {
      console.log(`[auto] 預約狀態更新：${done.changes} 筆→已完成，${cancelled.changes} 筆→已取消`);
      invalidateStatsCache();
    }

    return { completed: done.changes, cancelled: cancelled.changes };
  } catch (err) {
    console.error('[automation] autoUpdateBookingStatus error:', err.message);
    return { completed: 0, cancelled: 0 };
  }
}

// ─────────────────────────────────────────────
// 今日工作提醒預載（減少 AI 即時查詢）
// 每次啟動及每小時更新一次，存入 module 變數供 adminAI 直接使用
// ─────────────────────────────────────────────
let _todayBriefing = '';
let _todayBriefingTs = 0;
const BRIEFING_TTL = 60 * 60 * 1000; // 1 小時

function getTodayBriefing(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _todayBriefing && now - _todayBriefingTs < BRIEFING_TTL) {
    return _todayBriefing;
  }
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = db.prepare(`
      SELECT client_name, service_type, time_slot, address, status, cleaner_name
      FROM bookings WHERE scheduled_date = ?
      ORDER BY time_slot
    `).all(today);

    const unassigned = db.prepare(`
      SELECT COUNT(*) as n FROM bookings
      WHERE status = '待確認' AND cleaner_name IS NULL
    `).get().n;

    if (todayBookings.length === 0 && unassigned === 0) {
      _todayBriefing = `今日（${today}）無預約服務。待確認預約 ${unassigned} 筆。`;
    } else {
      const list = todayBookings.map((b, i) =>
        `  ${i+1}. ${b.client_name} | ${b.service_type} | ${b.time_slot} | 管理師：${b.cleaner_name || '未指派'} | ${b.status}`
      ).join('\n');
      _todayBriefing = `今日（${today}）共 ${todayBookings.length} 筆服務：\n${list}\n\n待確認未指派預約：${unassigned} 筆`;
    }
    _todayBriefingTs = now;
    return _todayBriefing;
  } catch (err) {
    console.error('[automation] getTodayBriefing error:', err.message);
    return '';
  }
}

// ─────────────────────────────────────────────
// 定時任務（每小時執行）
// ─────────────────────────────────────────────
let _timer = null;

function startScheduler() {
  // 立即執行一次
  autoUpdateBookingStatus();
  getStats(true);
  getTodayBriefing(true);

  // 每小時重複
  _timer = setInterval(() => {
    autoUpdateBookingStatus();
    getStats(true);
    getTodayBriefing(true);
    console.log(`[auto] 定時任務完成 ${new Date().toLocaleString('zh-TW')}`);
  }, 60 * 60 * 1000);

  console.log('[auto] 自動化排程器已啟動');
}

function stopScheduler() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = {
  getStats,
  invalidateStatsCache,
  autoUpdateBookingStatus,
  getTodayBriefing,
  startScheduler,
  stopScheduler,
};
