import { Pool, PoolConfig } from 'pg';

// Serverless 环境优化的连接池配置
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
  max: 1, // Serverless 环境使用单连接
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
};

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
      pool = null;
    });
  }
  return pool;
}

// 数据库初始化标记
let dbInitialized = false;

// 初始化数据库表
export async function initDatabase() {
  if (dbInitialized) return;

  const client = await getPool().connect();
  try {
    // 创建 assessments 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id VARCHAR(36) PRIMARY KEY,
        visitor_id VARCHAR(100) NOT NULL,
        code VARCHAR(50),
        responses JSONB NOT NULL,
        scores JSONB NOT NULL,
        ai_status VARCHAR(20) DEFAULT 'pending',
        ai_analysis TEXT,
        ai_generated_at TIMESTAMP,
        ai_word_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建 codes 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        package_type VARCHAR(20) DEFAULT 'STANDARD',
        status VARCHAR(20) DEFAULT 'active',
        used_by VARCHAR(100),
        used_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assessments_visitor_id ON assessments(visitor_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_codes_code ON codes(code)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_codes_status ON codes(status)
    `);

    dbInitialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 查询方法
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// 获取单行
export async function queryOne(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// 获取多行
export async function queryMany(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows;
}

export default { query, queryOne, queryMany, initDatabase };
