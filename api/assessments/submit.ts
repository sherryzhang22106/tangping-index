import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

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
    const useCode = code || 'FREE_TEST';

    // 确保 FREE_TEST code 存在（如果使用的是 FREE_TEST）
    if (useCode === 'FREE_TEST') {
      try {
        await prisma.redemptionCode.upsert({
          where: { code: 'FREE_TEST' },
          update: {},
          create: {
            code: 'FREE_TEST',
            packageType: 'FREE',
            status: 'SYSTEM',
          },
        });
      } catch (e) {
        console.log('FREE_TEST code already exists or created');
      }
    }

    // 保存到数据库
    const assessment = await prisma.assessment.create({
      data: {
        id: assessmentId,
        visitorId,
        code: useCode,
        responses,
        scores,
        aiStatus: 'pending',
      },
    });

    console.log('Assessment saved to database:', { id: assessment.id, visitorId });

    console.log('Assessment submitted:', {
      id: assessmentId,
      visitorId,
      code: useCode,
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
