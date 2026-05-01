process.env.VERCEL = '1';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'heson-vercel-preview-secret-2026';
}

module.exports = require('../server/app');
