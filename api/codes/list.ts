import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    // 由于没有持久化存储，返回空列表
    // 提示：生成的兑换码请导出Excel保存，任何以 TP-/LYING-/TEST-/VIP- 开头的码都有效
    return res.status(200).json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      message: '提示：生成的兑换码请导出Excel保存。任何以 TP-/LYING-/TEST-/VIP- 开头的码都可使用。',
    });
  } catch (error) {
    console.error('List codes error:', error);
    return res.status(500).json({ error: '服务器错误', details: String(error) });
  }
}
