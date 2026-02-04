import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const MCHID = process.env.WECHAT_MCHID || '1737651976';
const API_KEY = process.env.WECHAT_API_KEY || '';
const SERIAL_NO = process.env.WECHAT_SERIAL_NO || '7C26A3FC97A9933F59D6D1B988FDEEB0FD791AF5';
const PRIVATE_KEY = process.env.WECHAT_PRIVATE_KEY || '';
const NOTIFY_URL = process.env.WECHAT_NOTIFY_URL || 'https://lying.bettermee.cn/api/payment/notify';

// 生成随机字符串
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成签名
function generateSignature(method: string, url: string, timestamp: string, nonceStr: string, body: string): string {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;

  // 处理私钥格式
  let privateKey = PRIVATE_KEY;
  if (!privateKey.includes('-----BEGIN')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  return sign.sign(privateKey, 'base64');
}

// 生成订单号
function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TP${dateStr}${random}`;
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
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ error: '缺少用户标识' });
    }

    if (!PRIVATE_KEY || !API_KEY) {
      return res.status(500).json({ error: '支付配置未完成' });
    }

    const orderNo = generateOrderNo();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = generateNonceStr();

    // Native 支付请求参数
    const requestBody = {
      appid: 'wx_native', // Native支付不需要真实appid，使用占位符
      mchid: MCHID,
      description: '躺平指数测评',
      out_trade_no: orderNo,
      time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00'),
      notify_url: NOTIFY_URL,
      amount: {
        total: 290, // 2.9元 = 290分
        currency: 'CNY'
      },
      attach: visitorId // 附加数据，用于回调时识别用户
    };

    const bodyStr = JSON.stringify(requestBody);
    const urlPath = '/v3/pay/transactions/native';
    const signature = generateSignature('POST', urlPath, timestamp, nonceStr, bodyStr);

    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${SERIAL_NO}"`;

    // 调用微信支付API
    const response = await fetch('https://api.mch.weixin.qq.com/v3/pay/transactions/native', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorization,
      },
      body: bodyStr,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('微信支付错误:', result);
      return res.status(400).json({
        error: result.message || '创建支付订单失败',
        detail: result
      });
    }

    // 返回支付二维码链接
    return res.status(200).json({
      success: true,
      data: {
        orderNo,
        codeUrl: result.code_url, // 二维码链接
        amount: 2.9,
        expireTime: 30 * 60 // 30分钟过期
      }
    });

  } catch (error) {
    console.error('创建支付订单错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
}
