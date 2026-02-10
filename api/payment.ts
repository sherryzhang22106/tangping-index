import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// H5 公众号配置
const APPID = process.env.WECHAT_APPID || 'wx767495c6a6f841c2';
const APP_SECRET = process.env.WECHAT_APP_SECRET || '';

// 小程序配置
const MINIPROGRAM_APPID = process.env.MINIPROGRAM_APPID || 'wxd8ebf8c2915ab9d4';
const MINIPROGRAM_SECRET = process.env.MINIPROGRAM_SECRET || '7ad3656d19aaefed862edeca85d824e7';

// 微信支付配置
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

// 获取私钥
function getPrivateKey(): string {
  let privateKey = PRIVATE_KEY;
  if (!privateKey.includes('-----BEGIN')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }
  return privateKey.replace(/\\n/g, '\n');
}

// 生成签名
function generateSignature(method: string, url: string, timestamp: string, nonceStr: string, body: string): string {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  return sign.sign(getPrivateKey(), 'base64');
}

// 生成订单号
function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TP${dateStr}${random}`;
}

// 通过 code 获取 openid（H5 公众号）
async function getOpenId(code: string): Promise<string> {
  if (!APP_SECRET) {
    throw new Error('缺少APP_SECRET配置');
  }

  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${APP_SECRET}&code=${code}&grant_type=authorization_code`;
  const response = await fetch(url);
  const result = await response.json();

  if (result.errcode) {
    console.error('获取openid失败:', result);
    throw new Error(result.errmsg || '获取用户信息失败');
  }

  return result.openid;
}

// 通过小程序 code 获取 openid（小程序专用）
async function getMiniprogramOpenId(code: string): Promise<string> {
  const secret = MINIPROGRAM_SECRET || APP_SECRET;
  if (!secret) {
    throw new Error('缺少小程序SECRET配置');
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${MINIPROGRAM_APPID}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
  const response = await fetch(url);
  const result = await response.json();

  if (result.errcode) {
    console.error('小程序获取openid失败:', result);
    throw new Error(result.errmsg || '获取用户信息失败');
  }

  return result.openid;
}

// 创建小程序支付订单
async function createMiniprogramPayment(openid: string, amount: number, description: string): Promise<any> {
  if (!PRIVATE_KEY || !API_KEY) {
    throw new Error('支付配置未完成');
  }

  const orderNo = generateOrderNo();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  const totalFen = Math.round(amount * 100);

  const requestBody = {
    appid: MINIPROGRAM_APPID,
    mchid: MCHID,
    description: description || '躺平指数测评',
    out_trade_no: orderNo,
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00'),
    notify_url: NOTIFY_URL,
    amount: {
      total: totalFen,
      currency: 'CNY'
    },
    payer: {
      openid: openid
    }
  };

  const bodyStr = JSON.stringify(requestBody);
  const urlPath = '/v3/pay/transactions/jsapi';
  const signature = generateSignature('POST', urlPath, timestamp, nonceStr, bodyStr);
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${SERIAL_NO}"`;

  const response = await fetch('https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi', {
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
    console.error('小程序支付创建失败:', result);
    throw new Error(result.message || '创建支付订单失败');
  }

  // 生成小程序调起支付需要的参数
  const payTimestamp = Math.floor(Date.now() / 1000).toString();
  const payNonceStr = generateNonceStr();
  const packageStr = `prepay_id=${result.prepay_id}`;

  // 签名
  const payMessage = `${MINIPROGRAM_APPID}\n${payTimestamp}\n${payNonceStr}\n${packageStr}\n`;
  const paySign = crypto.createSign('RSA-SHA256');
  paySign.update(payMessage);
  const paySignature = paySign.sign(getPrivateKey(), 'base64');

  return {
    orderNo,
    timeStamp: payTimestamp,
    nonceStr: payNonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign: paySignature,
    amount: amount
  };
}

// 创建 Native 支付订单（PC扫码）
async function createNativePayment(visitorId: string, amount: number, description: string): Promise<any> {
  if (!PRIVATE_KEY || !API_KEY) {
    throw new Error('支付配置未完成');
  }

  const orderNo = generateOrderNo();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  const totalFen = Math.round(amount * 100); // 转换为分

  const requestBody = {
    appid: APPID,
    mchid: MCHID,
    description: description || '躺平指数测评',
    out_trade_no: orderNo,
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00'),
    notify_url: NOTIFY_URL,
    amount: {
      total: totalFen,
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
    console.error('Native支付创建失败:', result);
    throw new Error(result.message || '创建支付订单失败');
  }

  return {
    orderNo,
    codeUrl: result.code_url,
    amount: amount,
    expireTime: 30 * 60
  };
}

// 创建 JSAPI 支付订单（微信内支付）
async function createJsapiPayment(visitorId: string, openid: string, amount: number, description: string): Promise<any> {
  if (!PRIVATE_KEY || !API_KEY) {
    throw new Error('支付配置未完成');
  }

  const orderNo = generateOrderNo();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  const totalFen = Math.round(amount * 100); // 转换为分

  const requestBody = {
    appid: APPID,
    mchid: MCHID,
    description: description || '躺平指数测评',
    out_trade_no: orderNo,
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00'),
    notify_url: NOTIFY_URL,
    amount: {
      total: totalFen,
      currency: 'CNY'
    },
    attach: visitorId,
    payer: {
      openid: openid
    }
  };

  const bodyStr = JSON.stringify(requestBody);
  const urlPath = '/v3/pay/transactions/jsapi';
  const signature = generateSignature('POST', urlPath, timestamp, nonceStr, bodyStr);
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${SERIAL_NO}"`;

  const response = await fetch('https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi', {
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
    console.error('JSAPI支付创建失败:', result);
    throw new Error(result.message || '创建支付订单失败');
  }

  // 生成前端调起支付需要的参数
  const payTimestamp = Math.floor(Date.now() / 1000).toString();
  const payNonceStr = generateNonceStr();
  const packageStr = `prepay_id=${result.prepay_id}`;

  // 签名
  const payMessage = `${APPID}\n${payTimestamp}\n${payNonceStr}\n${packageStr}\n`;
  const paySign = crypto.createSign('RSA-SHA256');
  paySign.update(payMessage);
  const paySignature = paySign.sign(getPrivateKey(), 'base64');

  return {
    orderNo,
    appId: APPID,
    timeStamp: payTimestamp,
    nonceStr: payNonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign: paySignature,
    amount: amount
  };
}

// 创建 H5 支付订单（手机浏览器唤起微信）
async function createH5Payment(visitorId: string, amount: number, description: string, clientIp: string): Promise<any> {
  if (!PRIVATE_KEY || !API_KEY) {
    throw new Error('支付配置未完成');
  }

  const orderNo = generateOrderNo();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  const totalFen = Math.round(amount * 100); // 转换为分

  const requestBody = {
    appid: APPID,
    mchid: MCHID,
    description: description || '躺平指数测评',
    out_trade_no: orderNo,
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00'),
    notify_url: NOTIFY_URL,
    amount: {
      total: totalFen,
      currency: 'CNY'
    },
    attach: visitorId,
    scene_info: {
      payer_client_ip: clientIp || '127.0.0.1',
      h5_info: {
        type: 'Wap',
        wap_url: 'https://lying.bettermee.cn',
        wap_name: '躺平指数测评'
      }
    }
  };

  const bodyStr = JSON.stringify(requestBody);
  const urlPath = '/v3/pay/transactions/h5';
  const signature = generateSignature('POST', urlPath, timestamp, nonceStr, bodyStr);
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${SERIAL_NO}"`;

  const response = await fetch('https://api.mch.weixin.qq.com/v3/pay/transactions/h5', {
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
    console.error('H5支付创建失败:', result);
    throw new Error(result.message || '创建支付订单失败');
  }

  return {
    orderNo,
    h5Url: result.h5_url,
    amount: amount,
    expireTime: 30 * 60
  };
}

// 查询支付状态
async function queryPayment(orderNo: string): Promise<any> {
  if (!PRIVATE_KEY) {
    throw new Error('支付配置未完成');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const urlPath = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${MCHID}`;

  const message = `GET\n${urlPath}\n${timestamp}\n${nonceStr}\n\n`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  const signature = sign.sign(getPrivateKey(), 'base64');

  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${SERIAL_NO}"`;

  const response = await fetch(`https://api.mch.weixin.qq.com${urlPath}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': authorization,
    },
  });

  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch (e) {
    console.error('查询响应不是JSON:', text.substring(0, 200));
    throw new Error('查询支付状态失败');
  }

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
      status: result.trade_state || 'UNKNOWN',
      message: result.trade_state_desc || result.message || '未知状态'
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
    // GET /api/payment?action=oauth - 获取微信授权URL
    if (req.method === 'GET' && action === 'oauth') {
      const { redirect } = req.query;
      const redirectUri = encodeURIComponent(redirect as string || 'https://lying.bettermee.cn/');
      const state = generateNonceStr(16);
      const oauthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`;
      return res.status(200).json({ success: true, data: { url: oauthUrl } });
    }

    // POST /api/payment?action=create - 创建 Native 支付（PC扫码）
    if (req.method === 'POST' && action === 'create') {
      const { visitorId, amount = 1.9, description = '躺平指数测评' } = req.body;
      if (!visitorId) {
        return res.status(400).json({ error: '缺少用户标识' });
      }
      const data = await createNativePayment(visitorId, amount, description);
      return res.status(200).json({ success: true, data });
    }

    // POST /api/payment?action=jsapi - 创建 JSAPI 支付（微信内）
    if (req.method === 'POST' && action === 'jsapi') {
      const { visitorId, code, amount = 1.9, description = '躺平指数测评' } = req.body;
      if (!visitorId || !code) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      // 用 code 换取 openid
      const openid = await getOpenId(code);
      const data = await createJsapiPayment(visitorId, openid, amount, description);
      return res.status(200).json({ success: true, data });
    }

    // POST /api/payment?action=h5 - 创建 H5 支付（手机浏览器）
    if (req.method === 'POST' && action === 'h5') {
      const { visitorId, amount = 1.9, description = '躺平指数测评' } = req.body;
      if (!visitorId) {
        return res.status(400).json({ error: '缺少用户标识' });
      }
      // 获取客户端IP
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                       req.headers['x-real-ip'] as string ||
                       '127.0.0.1';
      const data = await createH5Payment(visitorId, amount, description, clientIp);
      return res.status(200).json({ success: true, data });
    }

    // POST /api/payment?action=code2session - 小程序登录获取 openid
    if (req.method === 'POST' && action === 'code2session') {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: '缺少code参数' });
      }
      try {
        const openid = await getMiniprogramOpenId(code);
        return res.status(200).json({ success: true, openid });
      } catch (error: any) {
        console.error('code2session error:', error);
        return res.status(400).json({ success: false, error: error.message });
      }
    }

    // POST /api/payment?action=miniprogram - 创建小程序支付订单
    if (req.method === 'POST' && action === 'miniprogram') {
      const { openid, amount = 1.9, description = '躺平指数测评' } = req.body;
      if (!openid) {
        return res.status(400).json({ success: false, error: '缺少openid参数' });
      }
      try {
        const data = await createMiniprogramPayment(openid, amount, description);
        return res.status(200).json({ success: true, data });
      } catch (error: any) {
        console.error('miniprogram payment error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
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
