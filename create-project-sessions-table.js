// Railway에서 project_sessions 테이블 생성
import { config } from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const createTableSQL = `
CREATE TABLE IF NOT EXISTS project_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  project_id INTEGER REFERENCES blog_projects(id),
  session_name TEXT NOT NULL,
  session_description TEXT,
  
  -- Snapshot of project state
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
  
  -- Chat history snapshot
  chat_history JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_sessions_user_id ON project_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id ON project_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sessions_updated_at ON project_sessions(updated_at DESC);
`;

(async () => {
  try {
    console.log('🔧 project_sessions 테이블 생성 중...\n');
    
    await pool.query(createTableSQL);
    
    console.log('✅ 테이블 생성 완료!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
})();
