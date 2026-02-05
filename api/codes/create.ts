import type { VercelRequest, VercelResponse } from '@vercel/node';

// 简单的内存存储（生产环境应使用数据库）
// 这里我们使用文件系统或环境变量来持久化

function generateCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix;
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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
    const { count = 10, packageType = 'STANDARD', prefix = 'LYING', expiresInDays } = req.body || {};

    // 限制数量
    const actualCount = Math.min(Math.max(1, count), 100);

    // 生成兑换码
    const codes: string[] = [];
    const now = new Date();
    const expiresAt = expiresInDays
      ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    for (let i = 0; i < actualCount; i++) {
      codes.push(generateCode(prefix + '-'));
    }

    // 注意：这里只是生成兑换码并返回
    // 实际验证兑换码时会在 validate.ts 中处理
    // 生产环境应该将这些码存入数据库

    return res.status(200).json({
      success: true,
      data: {
        codes,
        count: codes.length,
        packageType,
        expiresAt,
        createdAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create codes error:', error);
    return res.status(500).json({ error: '创建失败', details: String(error) });
  }
}
