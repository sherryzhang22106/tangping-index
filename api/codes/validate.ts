import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../shared/db';

function sanitizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS
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
    const { code, visitorId } = req.body || {};

    if (!code) {
      return res.status(400).json({ success: false, message: '请提供兑换码' });
    }

    const sanitizedCode = sanitizeCode(code);

    if (!sanitizedCode || sanitizedCode.length < 4) {
      return res.status(400).json({ success: false, message: '兑换码格式无效' });
    }

    // 从数据库查找兑换码
    const codeRecord = await prisma.redemptionCode.findUnique({
      where: { code: sanitizedCode },
    });

    if (!codeRecord) {
      return res.status(400).json({ success: false, message: '无效的兑换码' });
    }

    // 检查状态
    if (codeRecord.status === 'USED') {
      return res.status(400).json({ success: false, message: '该兑换码已被使用' });
    }

    if (codeRecord.status === 'REVOKED') {
      return res.status(400).json({ success: false, message: '该兑换码已被撤销' });
    }

    // 检查过期
    if (codeRecord.expiresAt && new Date(codeRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: '该兑换码已过期' });
    }

    // 激活兑换码
    await prisma.redemptionCode.update({
      where: { code: sanitizedCode },
      data: {
        status: 'USED',
        activatedAt: new Date(),
        userId: visitorId || null,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        code: sanitizedCode,
        packageType: codeRecord.packageType,
        status: 'ACTIVATED',
      },
    });
  } catch (error) {
    console.error('Code validation error:', error);
    return res.status(500).json({ success: false, message: '服务器错误', details: String(error) });
  }
}
