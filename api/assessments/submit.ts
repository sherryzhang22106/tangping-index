import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// 生成唯一ID
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

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
    const { visitorId, code, responses, scores } = req.body;

    if (!visitorId || !responses || !scores) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 生成评测ID
    const assessmentId = generateId();

    // 注意：由于 Vercel Hobby 计划限制，这里不使用数据库
    // 评测数据通过 AI 分析 API 处理
    // 支付用户（code 以 PAID_ 开头）直接通过
    // 兑换码用户在前端已验证

    console.log('Assessment submitted:', {
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
