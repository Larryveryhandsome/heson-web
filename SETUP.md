# HESON 赫頌家事管理平台 — 安裝說明

## 系統需求
- **Node.js 22+**（https://nodejs.org）
- **ngrok**（https://ngrok.com，需要自己的帳號）
- Windows 10/11

---

## 快速啟動

### 1. 安裝依賴套件
```bash
cd heson-web
npm install
cd server && npm install && cd ..
```

### 2. 設定環境變數
```bash
cp server/.env.example server/.env
```
開啟 `server/.env` 填入以下欄位：
```
JWT_SECRET=（任意隨機字串，至少 32 字元）
PORT=4001
LINE_CHANNEL_ACCESS_TOKEN=（LINE Bot Token）
LINE_CHANNEL_SECRET=（LINE Bot Secret）
LINE_CHANNEL_ID=（LINE Bot Channel ID）
LINE_CONTACT=（聯絡電話）
```

### 3. 設定 ngrok
1. 前往 https://dashboard.ngrok.com 取得你的 authtoken
2. 編輯 `C:\Users\<你的使用者名稱>\AppData\Local\ngrok\ngrok.yml`：
```yaml
version: "2"
authtoken: <你的 ngrok authtoken>
tunnels:
  heson:
    addr: 4001
    proto: http
    domain: <你的靜態網域>.ngrok-free.dev
```
3. 至 LINE Developers Console 將 Webhook URL 更新為：
   `https://<你的網域>.ngrok-free.dev/api/line/webhook`

### 4. 啟動伺服器
```bash
# 先啟動 ngrok（另開一個 terminal）
ngrok start heson

# 啟動 Node 伺服器
node server/index.js
```

### 5. 建立第一個管理員帳號

伺服器啟動後，在**空白資料庫**第一次設定時，執行以下指令建立 admin：

```bash
curl -X POST http://localhost:4001/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"your-password\",\"full_name\":\"管理員\"}"
```

> ⚠️ 此 API 只有在資料庫中**完全沒有 admin 帳號**時才能使用，之後自動鎖定。

### 6. 開機自動啟動（選用）
將 `heson-startup.vbs` 複製到：
`C:\Users\<使用者>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`

---

## 首次安裝 checklist

- [ ] `npm install`（根目錄）
- [ ] `cd server && npm install`
- [ ] 建立 `server/.env`（參考 `server/.env.example`）
- [ ] 設定 ngrok authtoken 與靜態網域
- [ ] 更新 LINE Webhook URL
- [ ] 啟動 ngrok + `node server/index.js`
- [ ] 呼叫 `POST /api/auth/setup-admin` 建立管理員帳號
- [ ] 登入 `http://localhost:4001` 確認前台正常
- [ ] 登入 `http://localhost:4001/AdminDashboard` 確認後台正常

---

## 帳號資訊
- 管理員帳號：首次安裝請用 `POST /api/auth/setup-admin` 建立（見步驟 5）
- 之後登入：`http://localhost:4001/Login`

## 網站路徑
- 前台：`http://localhost:4001`
- 管理後台：`http://localhost:4001/AdminDashboard`

## 注意事項
- `server/data/heson.db` 是 SQLite 資料庫，包含所有客戶與預約資料，請妥善保管
- 資料庫已包含在此包中，直接使用即可
- 如需重建前端：`npm run build`
