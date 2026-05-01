/**
 * 派單功能
 * POST /api/functions/dispatchCleaner
 * body: { bookingId, cleanerId }
 * - 更新 booking status → 已確認，設定 cleaner_id / cleaner_name
 * - 送 LINE 群組通知 + 管理師個人通知
 */

const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const db = require('../../db');
const { notifyGroups, notifyUser } = require('../../utils/lineBot');
const { invalidateStatsCache } = require('../../utils/automation');

const router = express.Router();

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '僅限管理員' });
  }

  const { bookingId, cleanerId } = req.body;
  if (!bookingId || !cleanerId) {
    return res.status(400).json({ error: '缺少 bookingId 或 cleanerId' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ error: '預約不存在' });

  const cleaner = db.prepare('SELECT * FROM cleaner_profiles WHERE id = ?').get(cleanerId);
  if (!cleaner) return res.status(404).json({ error: '管理師不存在' });

  const cleanerName = cleaner.nickname || cleaner.name || '未知管理師';

  // 更新預約
  db.prepare(`
    UPDATE bookings
    SET cleaner_id = ?, cleaner_name = ?, status = '已確認', updated_at = datetime('now')
    WHERE id = ?
  `).run(cleanerId, cleanerName, bookingId);

  invalidateStatsCache();

  // LINE 群組通知
  const contact = process.env.LINE_CONTACT || '請聯絡管理員';
  const groupMsg = [
    '✅ 案件已指派 @All',
    '',
    `${booking.service_type || '清潔服務'}`,
    `［管理師：${cleanerName}］`,
    `📅 ${booking.scheduled_date} ${booking.time_slot || ''}`,
    `🏠 ${booking.city || ''}`,
    `📍 ${booking.address || ''}`,
    '',
    '⸻',
    '',
    '👇🏻接案需求請聯絡：',
    `Line ➤ ${contact}`,
  ].join('\n');

  await notifyGroups(groupMsg);

  // 管理師個人 LINE 通知
  if (cleaner.line_id) {
    const personalMsg = [
      `${cleanerName} 您好！`,
      '您有一筆新的派單案件：',
      `服務類型：${booking.service_type || ''}`,
      `日期：${booking.scheduled_date} ${booking.time_slot || ''}`,
      `地址：${booking.address || ''}`,
      `客戶：${booking.client_name || ''}`,
      '請至 HESON 系統確認接案。',
    ].join('\n');
    await notifyUser(cleaner.line_id, personalMsg);
  }

  res.json({ success: true, message: `已成功指派 ${cleanerName}` });
});

module.exports = router;
