// Vercel serverless 後端
// 使用 in-memory store，不依賴 node:sqlite
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'heson-vercel-preview-secret-2026';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── In-memory store ──────────────────────────────────────────
const ADMIN_HASH = '$2a$10$ga/Ab3nrpGcQbG/kId3HKuF.p8XMsDk9M7U69xI533wuPoSBd9CDG';
const users = [
  {
    id: '3e992ef9-d2a4-4978-8029-ecbab4d6ca8e',
    email: 'mingus445606@gmail.com',
    password_hash: ADMIN_HASH,
    full_name: '管理員',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
];
const store = {
  bookings: [], payments: [], cleaner_profiles: [], client_profiles: [],
  cleaner_applications: [], attendance: [], service_reports: [], service_reviews: [],
  service_plans: [], service_cases: [], part_time_schedules: [],
  part_time_schedule_history: [], banned_devices: [], custom_sheets: [],
};

// ── Helpers ──────────────────────────────────────────────────
function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: '請先登入' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'token 無效或已過期' });
  }
}
const ENTITY_MAP = {
  Booking: 'bookings', Payment: 'payments', CleanerProfile: 'cleaner_profiles',
  ClientProfile: 'client_profiles', CleanerApplication: 'cleaner_applications',
  Attendance: 'attendance', ServiceReport: 'service_reports', ServiceReview: 'service_reviews',
  ServicePlan: 'service_plans', ServiceCase: 'service_cases',
  PartTimeSchedule: 'part_time_schedules', PartTimeScheduleHistory: 'part_time_schedule_history',
  BannedDevice: 'banned_devices', CustomSheet: 'custom_sheets',
};

// ── Auth routes ───────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email?.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Email 或密碼錯誤' });
  if (user.role === 'banned') return res.status(403).json({ error: '帳號已停用' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email 或密碼錯誤' });
  const { password_hash, ...safe } = user;
  res.json({ token: makeToken(user), user: safe });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: '請填寫 Email 與密碼' });
  if (users.find(u => u.email === email.toLowerCase())) return res.status(409).json({ error: '此 Email 已註冊' });
  const user = { id: uuidv4(), email: email.toLowerCase(), password_hash: await bcrypt.hash(password, 10), full_name: full_name || '', role: 'user', created_at: new Date().toISOString() };
  users.push(user);
  const { password_hash, ...safe } = user;
  res.json({ token: makeToken(user), user: safe });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: '找不到使用者' });
  const { password_hash, ...safe } = user;
  res.json(safe);
});

app.post('/api/auth/logout', (req, res) => res.json({ ok: true }));

app.get('/api/auth/users', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '權限不足' });
  res.json(users.map(({ password_hash, ...u }) => u));
});

app.put('/api/auth/users/:id/role', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '權限不足' });
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: '找不到使用者' });
  user.role = req.body.role;
  res.json({ ok: true });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: '缺少 Google token' });
  try {
    const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const info = await gRes.json();
    if (!info.email || info.error_description) return res.status(401).json({ error: 'Google 驗證失敗' });
    const email = info.email.toLowerCase();
    let user = users.find(u => u.email === email);
    if (!user) {
      user = { id: uuidv4(), email, password_hash: null, full_name: info.name || '', role: 'user', created_at: new Date().toISOString() };
      users.push(user);
    }
    const { password_hash, ...safe } = user;
    res.json({ token: makeToken(user), user: safe });
  } catch (e) {
    res.status(500).json({ error: 'Google 登入失敗' });
  }
});

app.post('/api/auth/setup-admin', async (req, res) => {
  if (users.some(u => u.role === 'admin')) return res.status(403).json({ error: '已有管理員帳號' });
  const { email, password, full_name } = req.body;
  const user = { id: uuidv4(), email: email.toLowerCase(), password_hash: await bcrypt.hash(password, 10), full_name: full_name || '管理員', role: 'admin', created_at: new Date().toISOString() };
  users.push(user);
  const { password_hash, ...safe } = user;
  res.json({ token: makeToken(user), user: safe });
});

// ── Entity CRUD ───────────────────────────────────────────────
app.get('/api/entities/:entity', requireAuth, (req, res) => {
  const key = ENTITY_MAP[req.params.entity];
  if (!key) return res.status(404).json({ error: '未知實體' });
  let rows = store[key] || [];
  for (const [k, v] of Object.entries(req.query)) {
    if (!k.startsWith('_')) rows = rows.filter(r => String(r[k]) === String(v));
  }
  if (req.query._sort) {
    const asc = req.query._order !== 'desc';
    rows = [...rows].sort((a, b) => asc ? (a[req.query._sort] > b[req.query._sort] ? 1 : -1) : (a[req.query._sort] < b[req.query._sort] ? 1 : -1));
  }
  if (req.query._limit) rows = rows.slice(Number(req.query._offset) || 0, (Number(req.query._offset) || 0) + Number(req.query._limit));
  res.json(rows);
});

app.get('/api/entities/:entity/:id', requireAuth, (req, res) => {
  const key = ENTITY_MAP[req.params.entity];
  if (!key) return res.status(404).json({ error: '未知實體' });
  const row = (store[key] || []).find(r => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: '找不到資料' });
  res.json(row);
});

app.post('/api/entities/:entity', requireAuth, (req, res) => {
  const key = ENTITY_MAP[req.params.entity];
  if (!key) return res.status(404).json({ error: '未知實體' });
  const row = { id: uuidv4(), ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  store[key].push(row);
  res.json(row);
});

app.put('/api/entities/:entity/:id', requireAuth, (req, res) => {
  const key = ENTITY_MAP[req.params.entity];
  if (!key) return res.status(404).json({ error: '未知實體' });
  const idx = store[key].findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '找不到資料' });
  store[key][idx] = { ...store[key][idx], ...req.body, updated_at: new Date().toISOString() };
  res.json(store[key][idx]);
});

app.delete('/api/entities/:entity/:id', requireAuth, (req, res) => {
  const key = ENTITY_MAP[req.params.entity];
  if (!key) return res.status(404).json({ error: '未知實體' });
  store[key] = store[key].filter(r => r.id !== req.params.id);
  res.json({ ok: true });
});

// ── Functions（空回應，避免前端報錯）────────────────────────
app.post('/api/functions/:name', requireAuth, (req, res) => {
  res.json({ data: null, message: '此功能在預覽模式下不可用' });
});

// ── Upload ────────────────────────────────────────────────────
app.post('/api/upload', requireAuth, (req, res) => {
  res.json({ file_url: '/placeholder-upload.jpg' });
});

// ── Contact ───────────────────────────────────────────────────
app.post('/api/contact', (req, res) => res.json({ ok: true }));

// ── LINE webhook（忽略）──────────────────────────────────────
app.post('/api/line/webhook', (req, res) => res.sendStatus(200));
app.get('/api/line/:path', requireAuth, (req, res) => res.json([]));

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'vercel-preview' }));

module.exports = app;
