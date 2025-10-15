import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === 'production';
const isNeonDb = process.env.DATABASE_URL.includes('neon.tech');

// 로컬 개발환경 또는 Railway: 일반 PostgreSQL 사용
// 프로덕션 Replit: Neon Serverless 사용
let pool: PgPool | NeonPool;
let db: ReturnType<typeof drizzleNode> | ReturnType<typeof drizzleNeon>;

if (!isProduction || !isNeonDb) {
  // 로컬 개발용 또는 Railway PostgreSQL 연결
  console.log('🔧 Using standard PostgreSQL for development/Railway');
  
  const localPool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  localPool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });

  pool = localPool;
  db = drizzleNode(localPool, { schema });
} else {
  // 프로덕션용 Neon Serverless 연결 (Replit 배포)
  console.log('🚀 Using Neon Serverless for production (Replit)');
  
  neonConfig.webSocketConstructor = ws;
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineConnect = false;
  neonConfig.pipelineTLS = false;

  const neonPool = new NeonPool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  neonPool.on('error', (err) => {
    console.error('Neon database pool error:', err);
  });

  pool = neonPool;
  db = drizzleNeon({ client: neonPool, schema });
}

export { pool, db };