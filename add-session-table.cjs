// 간단한 세션 테이블 추가 스크립트
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const { Pool } = pg;

// .env 파일에서 DATABASE_URL 읽기
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^DATABASE_URL=(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
  
  throw new Error('DATABASE_URL을 .env 파일에서 찾을 수 없습니다');
}

const DATABASE_URL = loadEnv();

const SQL = `
-- 세션 테이블 생성
CREATE TABLE IF NOT EXISTS project_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  project_id INTEGER REFERENCES blog_projects(id),
  session_name TEXT NOT NULL,
  session_description TEXT,
  keyword TEXT NOT NULL,
  keyword_analysis JSONB,
  subtitles JSONB,
  research_data JSONB,
  business_info JSONB,
  generated_content TEXT,
  seo_metrics JSONB,
  reference_links JSONB,
  generated_images JSONB,
  reference_blog_links JSONB,
  custom_morphemes TEXT,
  chat_history JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_sessions_user_id ON project_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id ON project_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sessions_updated_at ON project_sessions(updated_at DESC);
`;

async function addTable() {
  console.log('🚀 세션 테이블 추가 시작...\n');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(SQL);
    console.log('✅ project_sessions 테이블이 생성되었습니다!');
    
    // 확인
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'project_sessions'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ 테이블 생성 확인 완료!\n');
      console.log('이제 서버를 재시작하면 세션 관리 기능을 사용할 수 있습니다.');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await pool.end();
  }
}

addTable();
