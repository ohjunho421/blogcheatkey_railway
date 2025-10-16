-- Railway PostgreSQL 초기 스키마
-- 실행 방법: railway run psql $DATABASE_URL < init-railway-db.sql

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
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
);

-- User Business Info 테이블
CREATE TABLE IF NOT EXISTS user_business_info (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  expertise TEXT NOT NULL,
  differentiators TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blog Projects 테이블
CREATE TABLE IF NOT EXISTS blog_projects (
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
);

-- Chat Messages 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES blog_projects(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Completed Projects 테이블
CREATE TABLE IF NOT EXISTS completed_projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  title TEXT,
  keyword TEXT NOT NULL,
  content TEXT NOT NULL,
  reference_data JSONB,
  seo_metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 완료 메시지
SELECT 'All tables created successfully!' as status;
