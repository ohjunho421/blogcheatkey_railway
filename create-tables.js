// Railway PostgreSQL 테이블 생성
// 실행: railway run node create-tables.js

import { Pool } from 'pg';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const tables = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    profile_image TEXT,
    google_id TEXT UNIQUE,
    kakao_id TEXT UNIQUE,
    naver_id TEXT UNIQUE,
    is_email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    subscription_tier TEXT DEFAULT 'basic',
    subscription_expires_at TIMESTAMP,
    can_generate_content BOOLEAN DEFAULT false,
    can_generate_images BOOLEAN DEFAULT false,
    can_use_chatbot BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS user_business_info (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    expertise TEXT NOT NULL,
    differentiators TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS blog_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    keyword TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'keyword_analysis',
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES blog_projects(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS completed_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    title TEXT,
    keyword TEXT NOT NULL,
    content TEXT NOT NULL,
    reference_data JSONB,
    seo_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )`
];

(async () => {
  try {
    console.log('🔗 Railway PostgreSQL 연결 중...\n');
    
    for (const sql of tables) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      console.log(`  ✓ ${tableName} 테이블 생성 중...`);
      await pool.query(sql);
    }
    
    console.log('\n✅ 모든 테이블 생성 완료!\n');
    
    // 생성된 테이블 확인
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 생성된 테이블 목록:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await pool.end();
    console.log('\n🎉 완료!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 에러:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
})();
