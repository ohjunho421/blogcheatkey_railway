// Railway에서 관리자 기능 migration 실행
import { Pool } from 'pg';
import { readFileSync } from 'fs';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const sql = readFileSync('migration-admin-features.sql', 'utf8');

(async () => {
  try {
    console.log('🔧 관리자 기능 Migration 시작...\n');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('완료 메시지'));
    
    for (const statement of statements) {
      if (statement.includes('ALTER TABLE') || statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
        const tableName = statement.match(/TABLE\s+(\w+)/)?.[1] || 
                         statement.match(/INDEX\s+(\w+)/)?.[1];
        console.log(`  ✓ ${tableName || 'SQL'} 처리 중...`);
        await pool.query(statement);
      }
    }
    
    console.log('\n✅ Migration 완료!');
    console.log('\n생성된 테이블:');
    console.log('  - user_activity_log (사용자 활동 로그)');
    console.log('  - payment_records (결제 기록)');
    console.log('\n추가된 필드 (users):');
    console.log('  - total_tokens_used');
    console.log('  - monthly_tokens_used');
    console.log('  - last_token_reset_at');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration 실패:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
})();
