// 使用 Node.js 22 內建 SQLite（不需要任何外部 native 模組）
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'heson.db');
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

console.log(`[DB] SQLite 已連線：${DB_PATH}`);

module.exports = db;
