import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllCodes } from '../../shared/codes-store';

function verifyToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  // 验证管理员token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }

  const token = authHeader.substring(7);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }

  try {
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

    // 获取所有兑换码
    let codes = getAllCodes();

    // 按状态筛选
    if (status && status !== 'ALL') {
      codes = codes.filter(c => c.status === status);
    }

    // 按创建时间倒序排列
    codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 分页
    const total = codes.length;
    const totalPages = Math.ceil(total / limitNum);
    const skip = (pageNum - 1) * limitNum;
    const pagedCodes = codes.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      data: pagedCodes.map(c => ({
        code: c.code,
        packageType: c.packageType,
        status: c.status,
        createdAt: c.createdAt,
        activatedAt: c.activatedAt,
        expiresAt: c.expiresAt,
        assessmentCount: 0,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('List codes error:', error);
    return res.status(500).json({ error: '服务器错误', details: String(error) });
  }
}
