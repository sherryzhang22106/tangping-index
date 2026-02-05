import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: '请提供用户名和密码' });
    }

    // 使用环境变量验证管理员
    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === envUsername && password === envPassword) {
      // 简单的token生成（base64编码）
      const tokenData = {
        username,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
      };
      const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      return res.status(200).json({
        success: true,
        token,
        username,
      });
    }

    return res.status(401).json({ error: '用户名或密码错误' });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: '服务器错误', details: String(error) });
  }
}
