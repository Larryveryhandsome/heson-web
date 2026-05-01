/**
 * 管理員 AI 助理
 * 三層優化：
 *   1. 靜態 FAQ  → 0 token
 *   2. DB 直查   → 0 token（可即時回答的資料問題）
 *   3. Claude CLI → 只有真正需要 AI 推理的問題才呼叫
 */
const express = require('express');
const { callClaudeCLI } = require('../../utils/claude');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { getStats, getTodayBriefing } = require('../../utils/automation');
const aiCache = require('../../utils/aiCache');
const db = require('../../db');

const router = express.Router();

// ─────────────────────────────────────────────
// 層 1：靜態 FAQ（0 token，立即回傳）
// ─────────────────────────────────────────────
const ADMIN_FAQ = [
  {
    patterns: ['技術架構', '技術堆疊', '技術棧', '用什麼技術', '什麼框架', '前端是'],
    answer: `**HESON 系統技術架構**

**前端**
- React 18 + Vite 6 SPA
- TanStack Query（資料獲取）
- Tailwind CSS + shadcn/ui
- 路徑：\`src/pages/\`、\`src/components/\`

**後端**
- Node.js 22 + Express
- SQLite（Node.js 內建 DatabaseSync）
- JWT 認證
- 路徑：\`server/routes/\`、\`server/utils/\`

**AI**
- 本機 Claude Code CLI（\`claude -p\`）
- 不需要另外設定 API Key

**關鍵設定檔**
- \`server/.env\`：環境變數
- \`server/db/schema.sql\`：資料庫結構
- \`src/api/localClient.js\`：前端 API 客戶端`
  },
  {
    patterns: ['後台頁面', '管理頁面', '有哪些頁面', '頁面列表', '路由列表'],
    answer: `**後台管理頁面列表**

| 路由 | 功能 |
|------|------|
| \`/AdminDashboard\` | 總覽（統計圖表） |
| \`/AdminDispatch\` | 派單管理（確認、指派） |
| \`/AdminClients\` | 客戶管理 |
| \`/AdminCleaners\` | 管理師管理 |
| \`/AdminAttendance\` | 員工出勤 |
| \`/InternalSpreadsheet\` | 試算表（含 AI / 權限 / 裝置） |
| \`/AdminAI\` | 管理員 AI 助理（本頁） |
| \`/CleanerManagement\` | 招募申請審核 |
| \`/ServiceCaseManager\` | 服務案例上傳 |`
  },
  {
    patterns: ['新增頁面', '新增一個頁面', '如何新增頁面', '怎麼加頁面'],
    answer: `**新增一個後台頁面的步驟**

**1. 建立頁面檔案**
\`\`\`
src/pages/AdminXxx.jsx
\`\`\`

**2. 在 App.jsx 加入路由**
\`\`\`jsx
// 加在其他 Admin 路由旁邊
import AdminXxx from './pages/AdminXxx'

<Route path="/AdminXxx"
  element={<LayoutWrapper currentPageName="AdminXxx"><AdminXxx /></LayoutWrapper>}
/>
\`\`\`

**3. 在 Sidebar.jsx 加入選單**
\`\`\`js
// adminLinks 陣列加入：
{ name: "頁面名稱", path: "AdminXxx", icon: SomeIcon }
\`\`\`

**4. 重新 build**
\`\`\`bash
npm run build
\`\`\`
> 在 Claude Code CLI 直接說「幫我新增一個 XXX 頁面」即可自動完成以上全部步驟。`
  },
  {
    patterns: ['修改側邊欄', '修改選單', '加選單', '新增選單', '側邊欄選項'],
    answer: `**修改側邊欄選單**

**檔案位置**
- 桌面版：\`src/components/dashboard/Sidebar.jsx\`
- 手機版：\`src/components/dashboard/MobileNav.jsx\`

**adminLinks 陣列位置（約第 38-47 行）**
\`\`\`js
const adminLinks = [
  { name: "總覽",     path: "AdminDashboard",    icon: BarChart3   },
  { name: "派單管理", path: "AdminDispatch",      icon: Calendar    },
  // ... 在這裡加入新項目
  { name: "新頁面",  path: "NewPage",            icon: SomeIcon    },
];
\`\`\`

修改後需要 \`npm run build\`。`
  },
  {
    patterns: ['新增欄位', '加欄位', '新增資料表欄位', '資料庫欄位', '加入欄位'],
    answer: `**新增資料表欄位**

**步驟 1：修改 schema.sql**
\`server/db/schema.sql\` — 找到對應 CREATE TABLE，加入新欄位

**步驟 2：對已存在的 DB 執行 ALTER TABLE**
\`\`\`sql
ALTER TABLE bookings ADD COLUMN new_field TEXT;
\`\`\`
可直接在伺服器啟動時執行，或透過 Node.js script。

**步驟 3：更新前端 COLUMNS 定義（如試算表）**
\`src/pages/InternalSpreadsheet.jsx\` 的 \`COLUMNS\` 陣列加入新欄位

**注意**：SQLite 的 ALTER TABLE 只支援 ADD COLUMN，不支援刪除或改名欄位。`
  },
  {
    patterns: ['api key', 'claude key', 'anthropic key', 'api 金鑰', '不需要 api'],
    answer: `本系統的 AI 功能透過**本機 Claude Code CLI**執行，不需要另外設定 Anthropic API Key。

只要本機的 Claude Code 已登入（\`claude --version\` 可以執行），AI 功能就可以正常運作。

**環境變數位置**：\`server/.env\`
- \`JWT_SECRET\`：必填
- \`PORT\`：預設 4001
- \`ECPAY_*\`：僅付款功能需要`
  },
  {
    patterns: ['重啟', '重新啟動', '伺服器重啟', 'restart'],
    answer: `**重啟伺服器**

在終端機執行（server 目錄）：
\`\`\`bash
# Windows PowerShell
Stop-Process -Name node -Force
cd server
node index.js
\`\`\`

**重新 build 前端後也需要重啟**：
\`\`\`bash
npm run build   # 在專案根目錄
\`\`\``
  },
  {
    patterns: ['ecpay', '綠界', '付款設定', '金流', '付款功能'],
    answer: `**ECPay 綠界付款設定**

在 \`server/.env\` 填入以下設定後重啟伺服器：
\`\`\`
ECPAY_MERCHANT_ID=（特店編號）
ECPAY_HASH_KEY=（Hash Key）
ECPAY_HASH_IV=（Hash IV）
ECPAY_API_URL=https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5
SERVER_URL=http://你的公網IP:4001
\`\`\`

**測試帳號（綠界提供）**
- MerchantID：\`2000132\`
- HashKey：\`5294y06JbISpM5x9\`
- HashIV：\`v77hoKGq4kWxNNIS\`
- API：\`https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5\``
  },
];

function checkAdminFAQ(message) {
  const msg = message.toLowerCase();
  for (const faq of ADMIN_FAQ) {
    if (faq.patterns.some(p => msg.includes(p.toLowerCase()))) {
      return faq.answer;
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// 層 2：DB 直查（0 token，即時資料問題）
// ─────────────────────────────────────────────
function tryDBAnswer(message) {
  const msg = message;

  // 今日工作
  if (/今天|今日/.test(msg) && /預約|服務|工作|排程/.test(msg)) {
    return getTodayBriefing();
  }

  // 整體統計
  if (/幾筆|幾個|多少|數量|統計|總計|總共/.test(msg) && /預約|客戶|管理師|用戶|人數/.test(msg)) {
    const s = getStats();
    return `**系統即時統計**

| 項目 | 數量 |
|------|------|
| 總預約數 | ${s.bookings} 筆 |
| 待確認 | ${s.pending} 筆 |
| 已確認 | ${s.confirmed} 筆 |
| 已完成 | ${s.completed} 筆 |
| 管理師資料 | ${s.cleaners} 筆 |
| 客戶資料 | ${s.clients} 筆 |
| 已付款金額 | $${(s.revenue || 0).toLocaleString()} |`;
  }

  // 待確認 / 未指派
  if (/待確認|未指派|還沒確認|尚未確認/.test(msg)) {
    try {
      const rows = db.prepare(`
        SELECT client_name, service_type, scheduled_date, time_slot, address
        FROM bookings WHERE status='待確認'
        ORDER BY scheduled_date ASC LIMIT 10
      `).all();
      if (rows.length === 0) return '目前沒有待確認的預約。';
      const list = rows.map((r, i) =>
        `${i+1}. **${r.client_name}** | ${r.service_type} | ${r.scheduled_date} ${r.time_slot} | ${r.address}`
      ).join('\n');
      return `**待確認預約（共 ${rows.length} 筆）**\n\n${list}`;
    } catch { return null; }
  }

  // 最近預約
  if (/最近|最新|剛剛|新的/.test(msg) && /預約/.test(msg)) {
    try {
      const rows = db.prepare(`
        SELECT client_name, service_type, scheduled_date, status, created_at
        FROM bookings ORDER BY created_at DESC LIMIT 5
      `).all();
      if (rows.length === 0) return '目前沒有任何預約。';
      const list = rows.map((r, i) =>
        `${i+1}. **${r.client_name}** | ${r.service_type} | ${r.scheduled_date} | ${r.status}`
      ).join('\n');
      return `**最近 ${rows.length} 筆預約**\n\n${list}`;
    } catch { return null; }
  }

  return null;
}

// ─────────────────────────────────────────────
// 層 3：Claude CLI（精簡 system prompt）
// ─────────────────────────────────────────────
const SYSTEM_COMPACT = `你是 HESON 赫頌家事管理系統的管理員 AI 助理。用繁體中文回答。

技術棧：React 18 + Vite 6 / Node.js 22 + Express + SQLite / Claude Code CLI
主要路徑：src/pages/ src/components/ server/routes/ server/utils/
資料表：users bookings cleaner_profiles client_profiles attendance payments service_cases

回答原則：
- 程式碼修改需附【修改檔案】和【修改位置】
- 程式碼用 \`\`\`語言 格式
- 不確定的事直接說不確定，不要亂猜`;

// ─────────────────────────────────────────────
// POST /api/functions/adminAI
// ─────────────────────────────────────────────
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '僅限管理員使用' });
  }

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: '請輸入問題' });

  const msg = message.trim();

  // 層 1：靜態 FAQ
  const faqAnswer = checkAdminFAQ(msg);
  if (faqAnswer) {
    return res.json({ reply: faqAnswer, source: 'faq', success: true });
  }

  // 層 2：DB 直查
  const dbAnswer = tryDBAnswer(msg);
  if (dbAnswer) {
    return res.json({ reply: dbAnswer, source: 'db', success: true });
  }

  // 層 3：檢查快取
  const cached = aiCache.get('admin', msg);
  if (cached) {
    return res.json({ reply: cached, source: 'cache', success: true });
  }

  // 層 4：Claude CLI（只注入精簡統計，不傳全部 booking）
  try {
    const s = getStats();
    const stats = `即時統計：預約 ${s.bookings} 筆（待確認 ${s.pending}），管理師 ${s.cleaners}，客戶 ${s.clients}`;

    const historyText = history.slice(-8)
      .map(m => `${m.role === 'user' ? '管理員' : 'AI'}：${m.content.slice(0, 300)}`)
      .join('\n');

    const userMessage = [
      stats,
      historyText ? `【對話記錄】\n${historyText}` : '',
      `管理員：${msg}`
    ].filter(Boolean).join('\n\n');

    const { text: reply } = await callClaudeCLI(SYSTEM_COMPACT, userMessage);
    aiCache.set('admin', msg, reply);
    res.json({ reply, source: 'claude', success: true });
  } catch (err) {
    console.error('[adminAI]', err.message);
    res.status(500).json({
      reply: `⚠️ AI 暫時無法回應：${err.message}\n\n請確認本機 Claude Code CLI 已登入。`,
      success: false
    });
  }
});

module.exports = router;
