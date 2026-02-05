import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateToken, verifyPassword } from '../../shared/auth';

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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请提供用户名和密码' });
    }

    // 使用环境变量验证管理员
    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    // 如果没有配置密码哈希，使用简单密码验证（仅用于测试）
    if (!envPasswordHash) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      if (username === envUsername && password === defaultPassword) {
        const token = generateToken(username);
        return res.status(200).json({
          success: true,
          token,
          username,
        });
      }
    } else {
      // 使用哈希密码验证
      if (username === envUsername && verifyPassword(password, envPasswordHash)) {
        const token = generateToken(username);
        return res.status(200).json({
          success: true,
          token,
          username,
        });
      }
    }

    return res.status(401).json({ error: '用户名或密码错误' });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
}
