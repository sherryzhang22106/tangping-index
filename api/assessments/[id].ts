import type { VercelRequest, VercelResponse } from '@vercel/node';

// 动态导入数据库模块
let dbModule: any = null;

async function getDb() {
  if (!dbModule) {
    try {
      dbModule = await import('../lib/db');
    } catch (e) {
      console.error('Failed to load database module:', e);
      return null;
    }
  }
  return dbModule;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    const { id } = req.query;

    console.log('Get assessment request, id:', id);

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: '缺少测评ID' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: '数据库服务不可用' });
    }

    // 初始化数据库
    try {
      await db.initDatabase();
    } catch (initErr) {
      console.error('Database init error:', initErr);
    }

    const assessment = await db.queryOne(
      `SELECT id, visitor_id, code, responses, scores, ai_status, ai_analysis, ai_generated_at, ai_word_count, created_at
       FROM assessments WHERE id = $1`,
      [id]
    );

    if (!assessment) {
      console.log('Assessment not found:', id);
      return res.status(404).json({ success: false, error: '测评不存在' });
    }

    console.log('Assessment found:', { id: assessment.id, hasScores: !!assessment.scores });

    return res.status(200).json({
      success: true,
      data: {
        id: assessment.id,
        visitorId: assessment.visitor_id,
        code: assessment.code,
        responses: assessment.responses,
        scores: assessment.scores,
        aiAnalysis: assessment.ai_analysis,
        aiStatus: assessment.ai_status,
        aiGeneratedAt: assessment.ai_generated_at,
        aiWordCount: assessment.ai_word_count,
        createdAt: assessment.created_at,
      },
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    return res.status(500).json({ success: false, error: '服务器错误' });
  }
}
