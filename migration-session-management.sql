-- Migration: Add project_sessions table for session management feature
-- Date: 2024
-- Description: Allows users to save and load writing sessions

-- Create project_sessions table
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

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_project_sessions_user_id ON project_sessions(user_id);

-- Create index for project lookup
CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id ON project_sessions(project_id);

-- Create index for sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_project_sessions_updated_at ON project_sessions(updated_at DESC);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON project_sessions TO your_db_user;
-- GRANT USAGE, SELECT ON SEQUENCE project_sessions_id_seq TO your_db_user;
