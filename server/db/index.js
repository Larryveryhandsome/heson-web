// 使用 Node.js 22 內建 SQLite（不需要任何外部 native 模組）
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.VERCEL
  ? '/tmp/heson.db'
  : path.join(__dirname, '..', 'data', 'heson.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// 確保 data 目錄存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// 啟用 WAL 模式（多讀單寫）
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// 初始化 Schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

// 建立預設管理員（若尚未存在）
const adminExists = db.prepare("SELECT id FROM users WHERE email = 'mingus445606@gmail.com'").get();
if (!adminExists) {
  db.prepare(
    "INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, 'admin')"
  ).run(
    '3e992ef9-d2a4-4978-8029-ecbab4d6ca8e',
    'mingus445606@gmail.com',
    '$2a$10$ga/Ab3nrpGcQbG/kId3HKuF.p8XMsDk9M7U69xI533wuPoSBd9CDG',
    '管理員'
  );
  console.log('[DB] 預設管理員帳號已建立：mingus445606@gmail.com');
}

console.log(`[DB] SQLite 已連線：${DB_PATH}`);

module.exports = db;
