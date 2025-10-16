-- 관리자 기능 강화를 위한 DB 마이그레이션

-- 1. users 테이블에 토큰 사용량 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tokens_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_tokens_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_token_reset_at TIMESTAMP DEFAULT NOW();

-- 2. 사용자 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  activity_type TEXT NOT NULL,
  project_id INTEGER REFERENCES blog_projects(id),
  tokens_used INTEGER DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 결제 기록 테이블 생성
CREATE TABLE IF NOT EXISTS payment_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  plan_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_status TEXT DEFAULT 'pending',
  depositor_name TEXT,
  confirmation_note TEXT,
  confirmed_by INTEGER REFERENCES users(id),
  confirmed_at TIMESTAMP,
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at DESC);

-- 완료 메시지
SELECT 'Admin features migration completed successfully!' as status;
