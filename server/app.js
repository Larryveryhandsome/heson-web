require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// ────────────────────────────────────
// 中介層
// ────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 檔案上傳目錄
const UPLOADS_DIR = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ────────────────────────────────────
// API 路由
// ────────────────────────────────────
app.use('/api/auth',                           require('./routes/auth'));
app.use('/api/entities',                       require('./routes/entities'));
app.use('/api/functions/hesonAI',              require('./routes/functions/hesonAI'));
app.use('/api/functions/spreadsheetAI',        require('./routes/functions/spreadsheetAI'));
app.use('/api/functions/adminAI',              require('./routes/functions/adminAI'));
app.use('/api/functions/checkDevice',          require('./routes/functions/checkDevice'));
app.use('/api/functions/ecpayCreateOrder',     require('./routes/functions/ecpay'));
app.use('/api/functions/dispatchCleaner',      require('./routes/functions/dispatchCleaner'));
app.use('/api/upload',                         require('./routes/upload'));
app.use('/api/line',                           require('./routes/line'));
app.use('/api/contact',                        require('./routes/contact'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ────────────────────────────────────
// 前端靜態檔案（本機 / Render / Railway 用）
// ────────────────────────────────────
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (!process.env.VERCEL && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

module.exports = app;
