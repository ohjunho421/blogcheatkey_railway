// Railway에서 세션 관리 migration 실행
import { config } from 'dotenv';
import { Pool } from 'pg';
import { readFileSync } from 'fs';

// .env 파일 로드
config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const sql = readFileSync('migration-session-management.sql', 'utf8');

(async () => {
  try {
    console.log('🔧 세션 관리 Migration 시작...\n');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
        const name = statement.match(/TABLE\s+(\w+)/)?.[1] || 
                     statement.match(/INDEX\s+(\w+)/)?.[1];
        console.log(`  ✓ ${name || 'SQL'} 처리 중...`);
        await pool.query(statement);
      }
    }
    
    console.log('\n✅ Migration 완료!');
    console.log('\n생성된 테이블:');
    console.log('  - project_sessions (프로젝트 세션 관리)');
    console.log('\n생성된 인덱스:');
    console.log('  - idx_project_sessions_user_id');
    console.log('  - idx_project_sessions_project_id');
    console.log('  - idx_project_sessions_updated_at');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration 실패:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
})();
