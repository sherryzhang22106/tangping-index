import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    const { type, visitorId, page } = req.body;

    if (!visitorId) {
      return res.status(400).json({ success: false, error: '缺少visitorId' });
    }

    if (type === 'visit') {
      // 记录页面访问
      await prisma.visit.create({
        data: {
          visitorId,
          page: page || 'home',
          userAgent: req.headers['user-agent'] || null,
        },
      });
      return res.status(200).json({ success: true });
    }

    if (type === 'participate') {
      // 记录参与测评（只记录一次）
      try {
        await prisma.participation.create({
          data: {
            visitorId,
          },
        });
      } catch (e: any) {
        // 如果已存在（unique constraint），忽略错误
        if (e.code !== 'P2002') {
          throw e;
        }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, error: '未知的type' });
  } catch (error: any) {
    console.error('Track error:', error);
    return res.status(500).json({ success: false, error: '记录失败' });
  }
}
