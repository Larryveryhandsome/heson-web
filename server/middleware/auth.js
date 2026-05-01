const jwt = require('jsonwebtoken');
const db = require('../db');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登入' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // 從 DB 重新撈最新 role（防止 role 變更後舊 token 仍有效）
    const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: '使用者不存在' });
    if (user.role === 'banned') return res.status(403).json({ error: '帳號已停用' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登入' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '權限不足' });
    }
    next();
  };
}

// 可選 auth（有 token 就解析，沒有也不報錯）
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(payload.id);
    if (user && user.role !== 'banned') req.user = user;
  } catch {
    // ignore
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
