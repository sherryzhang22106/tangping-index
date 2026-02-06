import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma';

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

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      console.log('Assessment not found:', id);
      return res.status(404).json({ success: false, error: '测评不存在' });
    }

    console.log('Assessment found:', { id: assessment.id, hasScores: !!assessment.scores });

    return res.status(200).json({
      success: true,
      data: {
        id: assessment.id,
        visitorId: assessment.visitorId,
        code: assessment.code,
        responses: assessment.responses,
        scores: assessment.scores,
        aiAnalysis: assessment.aiAnalysis,
        aiStatus: assessment.aiStatus,
        createdAt: assessment.createdAt,
      },
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    return res.status(500).json({ success: false, error: '服务器错误' });
  }
}
