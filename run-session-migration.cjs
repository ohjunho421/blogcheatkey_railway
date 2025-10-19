const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Pool } = pg;

async function runMigration() {
  console.log('🚀 Starting session management migration...');

  // Create connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection established');

    // Read migration SQL file
    const sqlPath = path.join(__dirname, 'migration-session-management.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Migration SQL file loaded');

    // Execute migration
    await client.query(sql);
    console.log('✅ Migration executed successfully');

    // Verify table creation
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_sessions'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ project_sessions table created and verified');
      
      // Get column count
      const columns = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = 'project_sessions'
      `);
      console.log(`📊 Table has ${columns.rows[0].count} columns`);
    } else {
      console.error('❌ Table verification failed');
    }

    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Database connection closed');
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ Session management feature migration completed successfully!');
    console.log('You can now save and load writing sessions in the application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed with error:', error);
    process.exit(1);
  });
