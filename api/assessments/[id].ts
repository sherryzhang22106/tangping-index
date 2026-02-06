import type { VercelRequest, VercelResponse } from '@vercel/node';
import { queryOne, initDatabase } from '../lib/db';

// 确保数据库表存在
let dbInitialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 初始化数据库（只执行一次）
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: '缺少测评ID' });
    }

    const assessment = await queryOne(
      `SELECT id, visitor_id, code, responses, scores, ai_status, ai_analysis, ai_generated_at, ai_word_count, created_at
       FROM assessments WHERE id = $1`,
      [id]
    );

    if (!assessment) {
      return res.status(404).json({ error: '测评不存在' });
    }

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
    return res.status(500).json({ error: '服务器错误' });
  }
}
