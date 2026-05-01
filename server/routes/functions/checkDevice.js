const express = require('express');
const db = require('../../db');

const router = express.Router();

// POST /api/functions/checkDevice
router.post('/', (req, res) => {
  const { fingerprint } = req.body;
  if (!fingerprint) return res.json({ banned: false });

  const record = db.prepare('SELECT * FROM banned_devices WHERE fingerprint = ?').get(fingerprint);
  if (record) {
    return res.json({ banned: true, reason: record.reason || '裝置已被封鎖' });
  }
  res.json({ banned: false });
});

// POST /api/functions/banDevice（需要 admin）
const { requireAuth, requireRole } = require('../../middleware/auth');
router.post('/ban', requireAuth, requireRole('admin'), (req, res) => {
  const { fingerprint, user_email, reason } = req.body;
  if (!fingerprint) return res.status(400).json({ error: '需要 fingerprint' });

  const { v4: uuidv4 } = require('uuid');
  db.prepare(`
    INSERT INTO banned_devices (id, fingerprint, user_email, reason, banned_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(fingerprint) DO UPDATE SET reason = excluded.reason, user_email = excluded.user_email
  `).run(uuidv4(), fingerprint, user_email || '', reason || '', 'admin');

  res.json({ ok: true });
});

module.exports = router;
