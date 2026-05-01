/**
 * 檔案上傳 API
 * POST /api/upload
 * body: { filename, mimetype, data: base64 }
 * 回傳: { file_url }
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

router.post('/', (req, res) => {
  const { filename, mimetype, data } = req.body;
  if (!data) return res.status(400).json({ error: '缺少檔案資料' });

  // 安全性：只允許圖片
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (mimetype && !allowedTypes.includes(mimetype)) {
    return res.status(400).json({ error: '只允許上傳圖片檔案' });
  }

  const ext = (filename || 'file').split('.').pop().toLowerCase() || 'jpg';
  const safeName = `${uuidv4()}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeName);

  try {
    const buffer = Buffer.from(data, 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: '檔案過大（上限 8MB）' });
    }
    fs.writeFileSync(filePath, buffer);
    res.json({ file_url: `/uploads/${safeName}` });
  } catch (err) {
    console.error('[upload]', err.message);
    res.status(500).json({ error: '上傳失敗' });
  }
});

module.exports = router;
