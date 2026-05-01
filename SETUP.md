# HESON 赫頌家事管理平台 — 安裝說明

## 系統需求
- **Node.js 22+**（https://nodejs.org）
- **ngrok**（https://ngrok.com，需要自己的帳號）
- Windows 10/11

---

## 快速啟動

### 1. 安裝依賴套件
```bash
cd heson-main
npm install
```

### 2. 設定環境變數
編輯 `server/.env`，確認以下欄位：
```
JWT_SECRET=（保持原值，或換新的隨機字串）
LINE_CHANNEL_ACCESS_TOKEN=（LINE Bot Token）
LINE_CHANNEL_SECRET=（LINE Bot Secret）
LINE_CONTACT=0906991023
PORT=4001
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

### 5. 開機自動啟動（選用）
將 `heson-startup.vbs` 複製到：
`C:\Users\<使用者>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`

---

## 帳號資訊
- 管理員帳號：請使用平台內建的 admin 帳號登入
- 預設 admin 帳號：請洽原始管理員

## 網站路徑
- 前台：`http://localhost:4001`
- 管理後台：`http://localhost:4001/AdminDashboard`

## 注意事項
- `server/data/heson.db` 是 SQLite 資料庫，包含所有客戶與預約資料，請妥善保管
- 資料庫已包含在此包中，直接使用即可
- 如需重建前端：`npm run build`
