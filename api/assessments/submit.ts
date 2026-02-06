import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { query, initDatabase } from '../lib/db';

// 生成唯一ID
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// 确保数据库表存在
let dbInitialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 初始化数据库（只执行一次）
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const { visitorId, code, responses, scores } = req.body;

    if (!visitorId || !responses || !scores) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 生成评测ID
    const assessmentId = generateId();

    // 保存到数据库
    await query(
      `INSERT INTO assessments (id, visitor_id, code, responses, scores, ai_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        assessmentId,
        visitorId,
        code || 'FREE_TEST',
        JSON.stringify(responses),
        JSON.stringify(scores),
        'pending'
      ]
    );

    console.log('Assessment saved to database:', {
      id: assessmentId,
      visitorId,
      code,
      totalScore: scores.totalScore,
      level: scores.level?.name
    });

    return res.status(201).json({
      success: true,
      id: assessmentId,
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
}
