// 간단한 관리자 기능 migration
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  // 1. users 테이블에 토큰 필드 추가
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tokens_used INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_tokens_used INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_token_reset_at TIMESTAMP DEFAULT NOW()`,
  
  // 2. user_activity_log 테이블 생성
  `CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    activity_type TEXT NOT NULL,
    project_id INTEGER REFERENCES blog_projects(id),
    tokens_used INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  // 3. payment_records 테이블 생성
  `CREATE TABLE IF NOT EXISTS payment_records (
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
  )`,
];

const indexes = [
  `CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(payment_status)`,
  `CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at DESC)`,
];

(async () => {
  try {
    console.log('🔧 관리자 기능 Migration 시작...\n');
    
    for (const sql of migrations) {
      const name = sql.match(/TABLE (\w+)|COLUMN (\w+)/)?.[1] || sql.match(/COLUMN (\w+)/)?.[1] || 'SQL';
      console.log(`  ✓ ${name} 처리 중...`);
      await pool.query(sql);
    }
    
    console.log('\n📊 인덱스 생성 중...');
    for (const sql of indexes) {
      await pool.query(sql);
    }
    
    console.log('\n✅ Migration 완료!');
    console.log('\n생성된 테이블:');
    console.log('  - user_activity_log');
    console.log('  - payment_records');
    console.log('\n추가된 필드:');
    console.log('  - users.total_tokens_used');
    console.log('  - users.monthly_tokens_used');
    console.log('  - users.last_token_reset_at');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration 실패:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
