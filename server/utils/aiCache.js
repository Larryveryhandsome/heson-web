/**
 * AI 回應快取
 * 相同問題在 TTL 內直接回傳快取，不重複呼叫 Claude CLI
 */

const crypto = require('crypto');

const DEFAULT_TTL = 10 * 60 * 1000; // 10 分鐘

class AICache {
  constructor(ttl = DEFAULT_TTL) {
    this.ttl = ttl;
    this.store = new Map();
  }

  _key(ns, message) {
    return ns + ':' + crypto.createHash('md5').update(message.trim().toLowerCase()).digest('hex');
  }

  get(ns, message) {
    const k = this._key(ns, message);
    const entry = this.store.get(k);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttl) {
      this.store.delete(k);
      return null;
    }
    return entry.reply;
  }

  set(ns, message, reply) {
    if (!reply || reply.length < 10) return;
    const k = this._key(ns, message);
    this.store.set(k, { reply, ts: Date.now() });
    // 超過 500 筆時清除最舊的一半
    if (this.store.size > 500) {
      const entries = [...this.store.entries()].sort((a, b) => a[1].ts - b[1].ts);
      entries.slice(0, 250).forEach(([k]) => this.store.delete(k));
    }
  }

  invalidate(ns) {
    for (const k of this.store.keys()) {
      if (k.startsWith(ns + ':')) this.store.delete(k);
    }
  }

  stats() {
    return { size: this.store.size };
  }
}

// 全域單例，所有 AI 路由共用
const aiCache = new AICache();

module.exports = aiCache;
