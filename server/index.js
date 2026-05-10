if (!process.env.JWT_SECRET) {
  console.error('[ERROR] 請在 .env 設定 JWT_SECRET');
  process.exit(1);
}

const app = require('./app');
const { startScheduler } = require('./utils/automation');

startScheduler();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ HESON 伺服器啟動`);
  console.log(`   http://localhost:${PORT}`);
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    console.log(`   公網：https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }
  console.log('');
});
