import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateCode, updateCodeStatus } from '../../shared/codes-store';

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

    // 验证兑换码
    const result = validateCode(sanitizedCode);

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.error });
    }

    // 激活兑换码
    updateCodeStatus(sanitizedCode, 'ACTIVATED', visitorId);

    return res.status(200).json({
      success: true,
      data: {
        code: sanitizedCode,
        packageType: result.codeRecord?.packageType || 'STANDARD',
        status: 'ACTIVATED',
      },
    });
  } catch (error) {
    console.error('Code validation error:', error);
    return res.status(500).json({ success: false, message: '服务器错误', details: String(error) });
  }
}
