const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: '請填寫 Email 與密碼' });
  if (password.length < 6) return res.status(400).json({ error: '密碼至少 6 碼' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: '此 Email 已註冊' });

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)').run(
    id, email.toLowerCase().trim(), password_hash, full_name || '', 'user'
  );

  const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(id);
  const token = makeToken(user);
  res.json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '請填寫 Email 與密碼' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !user.password_hash) return res.status(401).json({ error: 'Email 或密碼錯誤' });
  if (user.role === 'banned') return res.status(403).json({ error: '帳號已停用，請聯絡客服' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Email 或密碼錯誤' });

  const token = makeToken(user);
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // JWT 是無狀態的，前端刪掉 token 即可
  res.json({ ok: true });
});

// PUT /api/auth/password  (修改密碼)
router.put('/password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: '請填寫密碼' });
  if (new_password.length < 6) return res.status(400).json({ error: '新密碼至少 6 碼' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) return res.status(401).json({ error: '目前密碼錯誤' });

  const hash = await bcrypt.hash(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true });
});

// 管理員：列出所有使用者
router.get('/users', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '權限不足' });
  const users = db.prepare('SELECT id, email, role, full_name, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// 管理員：更新 role
router.put('/users/:id/role', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '權限不足' });
  const { role } = req.body;
  const allowed = ['user', 'cleaner', 'admin', 'banned'];
  if (!allowed.includes(role)) return res.status(400).json({ error: '無效的 role' });
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ ok: true });
});

// Google 登入（同 email 自動合併帳號）
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: '缺少 Google token' });
  try {
    const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const info = await gRes.json();
    if (!info.email || info.error_description) return res.status(401).json({ error: 'Google 驗證失敗' });
    const email = info.email.toLowerCase();
    let user = db.prepare('SELECT id, email, role, full_name FROM users WHERE email = ?').get(email);
    if (!user) {
      const id = uuidv4();
      db.prepare('INSERT INTO users (id, email, full_name, role) VALUES (?, ?, ?, ?)').run(id, email, info.name || '', 'user');
      user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(id);
    }
    res.json({ token: makeToken(user), user });
  } catch {
    res.status(500).json({ error: 'Google 登入失敗' });
  }
});

// 建立第一個管理員（只有在沒有任何 admin 時才能用）
router.post('/setup-admin', async (req, res) => {
  const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get();
  if (adminCount.c > 0) return res.status(403).json({ error: '已有管理員帳號，請直接登入' });

  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: '請填寫 Email 與密碼' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
    const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE email = ?').get(email);
    return res.json({ token: makeToken(user), user });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)').run(
    id, email.toLowerCase().trim(), password_hash, full_name || '管理員', 'admin'
  );
  const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(id);
  res.json({ token: makeToken(user), user });
});

module.exports = router;
