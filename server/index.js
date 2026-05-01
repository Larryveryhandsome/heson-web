require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 確保必要環境變數存在
if (!process.env.JWT_SECRET) {
  console.error('[ERROR] 請在 .env 設定 JWT_SECRET');
  process.exit(1);
}
// AI 透過本機 Claude Code CLI 執行，不需要 ANTHROPIC_API_KEY

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────
// 中介層
// ────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 檔案上傳目錄（身份證、存摺等）
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ────────────────────────────────────
// API 路由
// ────────────────────────────────────
app.use('/api/auth',             require('./routes/auth'));
app.use('/api/entities',         require('./routes/entities'));
app.use('/api/functions/hesonAI',        require('./routes/functions/hesonAI'));
app.use('/api/functions/spreadsheetAI',  require('./routes/functions/spreadsheetAI'));
app.use('/api/functions/adminAI',        require('./routes/functions/adminAI'));
app.use('/api/functions/checkDevice',    require('./routes/functions/checkDevice'));

// ECPay 路由
// POST /api/functions/ecpayCreateOrder  → router POST /
// POST /api/functions/ecpayCreateOrder/callback → router POST /callback（綠界 callback）
app.use('/api/functions/ecpayCreateOrder', require('./routes/functions/ecpay'));
app.use('/api/functions/dispatchCleaner',  require('./routes/functions/dispatchCleaner'));
app.use('/api/upload',                     require('./routes/upload'));

// LINE Webhook（Bot 加入群組自動儲存 Group ID）
app.use('/api/line', require('./routes/line'));

// 洽詢通知
app.use('/api/contact', require('./routes/contact'));

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ────────────────────────────────────
// 自動化排程器（預約狀態更新、統計快取預熱）
// ────────────────────────────────────
const { startScheduler } = require('./utils/automation');
startScheduler();

// ────────────────────────────────────
// 前端靜態檔案
// 先 build：cd .. && npm run build
// ────────────────────────────────────
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback（所有非 /api 路徑都回傳 index.html）
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`[Static] 前端靜態檔案已掛載：${DIST_DIR}`);
} else {
  console.warn(`[WARN] dist/ 目錄不存在，請先執行 npm run build`);
  console.warn(`       目前只有 API 可用，前端請用 npm run dev`);
}

// ────────────────────────────────────
// 啟動
// ────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ HESON 伺服器啟動`);
  console.log(`   http://localhost:${PORT}`);
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    console.log(`   公網：https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }
  console.log('');
});
