import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const APPID = process.env.WECHAT_APPID || 'wx767495c6a6f841c2';
const MCHID = process.env.WECHAT_MCHID || '1737651976';
const API_KEY = process.env.WECHAT_API_KEY || '';
const SERIAL_NO = process.env.WECHAT_SERIAL_NO || '7C26A3FC97A9933F59D6D1B988FDEEB0FD791AF5';
const PRIVATE_KEY = process.env.WECHAT_PRIVATE_KEY || '';
const NOTIFY_URL = process.env.WECHAT_NOTIFY_URL || 'https://lying.bettermee.cn/api/payment';

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

// 创建支付订单
async function createPayment(visitorId: string): Promise<any> {
  if (!PRIVATE_KEY || !API_KEY) {
    throw new Error('支付配置未完成');
  }

  const orderNo = generateOrderNo();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();

  const requestBody = {
    appid: APPID,
    mchid: MCHID,
    description: '躺平指数测评',
    out_trade_no: orderNo,
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00'),
    notify_url: NOTIFY_URL,
    amount: {
      total: 290,
      currency: 'CNY'
    },
    attach: visitorId
  };

  const bodyStr = JSON.stringify(requestBody);
  const urlPath = '/v3/pay/transactions/native';
  const signature = generateSignature('POST', urlPath, timestamp, nonceStr, bodyStr);

  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${SERIAL_NO}"`;

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
    throw new Error(result.message || '创建支付订单失败');
  }

  return {
    orderNo,
    codeUrl: result.code_url,
    amount: 2.9,
    expireTime: 30 * 60
  };
}

// 查询支付状态
async function queryPayment(orderNo: string): Promise<any> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const urlPath = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${MCHID}`;

  const message = `GET\n${urlPath}\n${timestamp}\n${nonceStr}\n\n`;
  let privateKey = PRIVATE_KEY;
  if (!privateKey.includes('-----BEGIN')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  const signature = sign.sign(privateKey, 'base64');

  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${SERIAL_NO}"`;

  const response = await fetch(`https://api.mch.weixin.qq.com${urlPath}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': authorization,
    },
  });

  const result = await response.json();

  if (result.trade_state === 'SUCCESS') {
    return {
      paid: true,
      orderNo: result.out_trade_no,
      visitorId: result.attach,
      transactionId: result.transaction_id,
      paidAt: result.success_time
    };
  } else {
    return {
      paid: false,
      status: result.trade_state,
      message: result.trade_state_desc
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // POST /api/payment?action=create - 创建支付
    if (req.method === 'POST' && action === 'create') {
      const { visitorId } = req.body;
      if (!visitorId) {
        return res.status(400).json({ error: '缺少用户标识' });
      }
      const data = await createPayment(visitorId);
      return res.status(200).json({ success: true, data });
    }

    // GET /api/payment?action=query&orderNo=xxx - 查询支付状态
    if (req.method === 'GET' && action === 'query') {
      const { orderNo } = req.query;
      if (!orderNo || typeof orderNo !== 'string') {
        return res.status(400).json({ error: '缺少订单号' });
      }
      const data = await queryPayment(orderNo);
      return res.status(200).json({ success: true, data });
    }

    // POST /api/payment (无action) - 微信回调
    if (req.method === 'POST' && !action) {
      const { event_type } = req.body;
      if (event_type === 'TRANSACTION.SUCCESS') {
        console.log('支付成功回调:', req.body);
      }
      return res.status(200).json({ code: 'SUCCESS', message: '成功' });
    }

    return res.status(400).json({ error: '无效的请求' });

  } catch (error: any) {
    console.error('支付API错误:', error);
    return res.status(500).json({ error: error.message || '服务器错误' });
  }
}
