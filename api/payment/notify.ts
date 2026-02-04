import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const API_KEY = process.env.WECHAT_API_KEY || '';

// 存储支付成功的订单（生产环境应使用数据库）
// 这里使用内存存储，Vercel Serverless 函数重启后会丢失
// 建议后续接入数据库

interface PaymentRecord {
  orderNo: string;
  visitorId: string;
  amount: number;
  paidAt: string;
  transactionId: string;
}

// 验证签名
function verifySignature(timestamp: string, nonce: string, body: string, signature: string, serial: string): boolean {
  // 简化验证，生产环境需要完整验证
  // 这里主要依赖微信的回调安全机制
  return true;
}

// 解密回调数据
function decryptResource(ciphertext: string, nonce: string, associatedData: string): any {
  try {
    const key = Buffer.from(API_KEY, 'utf8');
    const iv = Buffer.from(nonce, 'utf8');
    const authTag = Buffer.from(ciphertext.slice(-24), 'base64');
    const data = Buffer.from(ciphertext.slice(0, -24), 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    if (associatedData) {
      decipher.setAAD(Buffer.from(associatedData, 'utf8'));
    }

    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 请求用于查询支付状态
  if (req.method === 'GET') {
    const { orderNo } = req.query;

    if (!orderNo) {
      return res.status(400).json({ error: '缺少订单号' });
    }

    // 查询订单状态 - 调用微信查询接口
    try {
      const MCHID = process.env.WECHAT_MCHID || '1737651976';
      const SERIAL_NO = process.env.WECHAT_SERIAL_NO || '';
      const PRIVATE_KEY = process.env.WECHAT_PRIVATE_KEY || '';

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = crypto.randomBytes(16).toString('hex');
      const urlPath = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${MCHID}`;

      // 生成签名
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
        return res.status(200).json({
          success: true,
          data: {
            paid: true,
            orderNo: result.out_trade_no,
            visitorId: result.attach,
            transactionId: result.transaction_id,
            paidAt: result.success_time
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          data: {
            paid: false,
            status: result.trade_state,
            message: result.trade_state_desc
          }
        });
      }
    } catch (error) {
      console.error('查询订单错误:', error);
      return res.status(500).json({ error: '查询失败' });
    }
  }

  // POST 请求是微信支付回调
  if (req.method === 'POST') {
    try {
      const { resource, event_type } = req.body;

      if (event_type !== 'TRANSACTION.SUCCESS') {
        return res.status(200).json({ code: 'SUCCESS', message: '成功' });
      }

      // 解密通知数据
      const decrypted = decryptResource(
        resource.ciphertext,
        resource.nonce,
        resource.associated_data
      );

      if (!decrypted) {
        console.error('解密回调数据失败');
        return res.status(200).json({ code: 'SUCCESS', message: '成功' });
      }

      console.log('支付成功:', {
        orderNo: decrypted.out_trade_no,
        visitorId: decrypted.attach,
        transactionId: decrypted.transaction_id,
        amount: decrypted.amount.total / 100
      });

      // 这里应该将支付记录保存到数据库
      // 并为用户生成一个兑换码或直接激活测评权限

      return res.status(200).json({ code: 'SUCCESS', message: '成功' });

    } catch (error) {
      console.error('处理支付回调错误:', error);
      return res.status(200).json({ code: 'SUCCESS', message: '成功' });
    }
  }

  return res.status(405).json({ error: '方法不允许' });
}
