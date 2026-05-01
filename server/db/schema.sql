-- HESON 資料庫 Schema
-- 所有 id 使用 UUID (TEXT)，created_at/updated_at 自動管理

-- ========================
-- 使用者帳號
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  -- role: user | cleaner | admin | banned
  full_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- Booking 預約
-- ========================
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  cleaner_id TEXT,
  service_type TEXT,
  status TEXT DEFAULT '待確認',
  scheduled_date TEXT,
  time_slot TEXT,
  address TEXT,
  phone TEXT,
  notes TEXT,
  client_name TEXT,
  cleaner_name TEXT,
  confirmed_by_cleaner INTEGER DEFAULT 0,
  -- extra fields from AI booking flow
  city TEXT,
  housing_type TEXT,
  square_footage REAL,
  has_pets INTEGER DEFAULT 0,
  cleaning_tools TEXT,
  enhance_areas TEXT,
  weekdays TEXT,
  referral_source TEXT,
  referrer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- Payment 付款
-- ========================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  client_id TEXT,
  merchant_trade_no TEXT UNIQUE,
  trade_no TEXT,
  amount REAL NOT NULL,
  status TEXT DEFAULT '待付款',
  payment_type TEXT,
  payment_date TEXT,
  item_name TEXT,
  ecpay_response TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- CleanerProfile 管理師資料
-- ========================
CREATE TABLE IF NOT EXISTS cleaner_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  name TEXT,
  nickname TEXT NOT NULL,
  gender TEXT,
  age INTEGER,
  phone TEXT NOT NULL,
  line_id TEXT,
  residence_area TEXT,
  education TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  experience_years REAL,
  service_types TEXT, -- JSON array
  pet_acceptance TEXT,
  has_own_tools INTEGER DEFAULT 0,
  transportation TEXT,
  available_hours TEXT,
  other_job TEXT,
  service_areas TEXT, -- JSON array
  expected_hourly_rate REAL,
  bank_name TEXT,
  bank_account TEXT,
  bank_book_photo TEXT,
  police_record_verified INTEGER DEFAULT 0,
  id_card_front TEXT,
  id_card_back TEXT,
  id_verified INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  profile_photo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- ClientProfile 客戶資料
-- ========================
CREATE TABLE IF NOT EXISTS client_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  housing_type TEXT,
  square_footage REAL,
  family_members TEXT,
  has_pets INTEGER DEFAULT 0,
  subscription_plan TEXT DEFAULT '無',
  remaining_visits INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- CleanerApplication 申請表
-- ========================
CREATE TABLE IF NOT EXISTS cleaner_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  residence_area TEXT,
  experience_years REAL,
  service_types TEXT,
  transportation TEXT,
  available_hours TEXT,
  notes TEXT,
  status TEXT DEFAULT '待審核',
  -- status: 待審核 | 已通過 | 已拒絕
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- Attendance 出勤記錄
-- ========================
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  cleaner_id TEXT,
  booking_id TEXT,
  check_in_time TEXT,
  check_out_time TEXT,
  status TEXT DEFAULT '正常',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- ServiceReport 服務報告
-- ========================
CREATE TABLE IF NOT EXISTS service_reports (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  cleaner_id TEXT,
  client_id TEXT,
  before_photos TEXT, -- JSON array
  after_photos TEXT,  -- JSON array
  notes TEXT,
  areas_cleaned TEXT,
  duration_minutes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- ServiceReview 評價
-- ========================
CREATE TABLE IF NOT EXISTS service_reviews (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  cleaner_id TEXT,
  client_id TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- ServicePlan 服務方案
-- ========================
CREATE TABLE IF NOT EXISTS service_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan_type TEXT,
  price REAL,
  visits_per_month INTEGER,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- ServiceCase 服務案件
-- ========================
CREATE TABLE IF NOT EXISTS service_cases (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  client_id TEXT,
  cleaner_id TEXT,
  case_type TEXT,
  status TEXT DEFAULT '處理中',
  description TEXT,
  resolution TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- PartTimeSchedule 兼職排班
-- ========================
CREATE TABLE IF NOT EXISTS part_time_schedules (
  id TEXT PRIMARY KEY,
  cleaner_id TEXT,
  date TEXT,
  time_slot TEXT,
  status TEXT DEFAULT '可用',
  booking_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- PartTimeScheduleHistory 排班歷史
-- ========================
CREATE TABLE IF NOT EXISTS part_time_schedule_history (
  id TEXT PRIMARY KEY,
  cleaner_id TEXT,
  date TEXT,
  time_slot TEXT,
  action TEXT,
  booking_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- BannedDevice 封鎖裝置
-- ========================
CREATE TABLE IF NOT EXISTS banned_devices (
  id TEXT PRIMARY KEY,
  fingerprint TEXT UNIQUE,
  user_email TEXT,
  reason TEXT,
  banned_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- GoogleSheetLog 同步記錄
-- ========================
CREATE TABLE IF NOT EXISTS google_sheet_logs (
  id TEXT PRIMARY KEY,
  action TEXT,
  sheet_id TEXT,
  sheet_name TEXT,
  rows_affected INTEGER,
  status TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- CustomSheet 自訂試算表
-- ========================
CREATE TABLE IF NOT EXISTS custom_sheets (
  id TEXT PRIMARY KEY,
  name TEXT,
  columns TEXT, -- JSON array
  data TEXT,    -- JSON array of rows
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========================
-- AppConfig 系統設定（LINE 群組 ID 等）
-- ========================
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ========================
-- LINE 群組成員（用於真正 @mention）
-- ========================
CREATE TABLE IF NOT EXISTS line_group_members (
  group_id TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  display_name TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, user_id)
);

-- ========================
-- Attendance 補充欄位（if not already migrated）
-- ========================
-- 注意：SQLite 不支援 IF NOT EXISTS for columns, 用程式層做兼容

-- 觸發器：自動更新 updated_at
CREATE TRIGGER IF NOT EXISTS trg_users_updated AFTER UPDATE ON users
  BEGIN UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_bookings_updated AFTER UPDATE ON bookings
  BEGIN UPDATE bookings SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_payments_updated AFTER UPDATE ON payments
  BEGIN UPDATE payments SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_cleaner_profiles_updated AFTER UPDATE ON cleaner_profiles
  BEGIN UPDATE cleaner_profiles SET updated_at = datetime('now') WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_client_profiles_updated AFTER UPDATE ON client_profiles
  BEGIN UPDATE client_profiles SET updated_at = datetime('now') WHERE id = NEW.id; END;
