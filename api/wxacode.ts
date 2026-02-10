import type { VercelRequest, VercelResponse } from '@vercel/node';

// 小程序配置
const MINIPROGRAM_APPID = process.env.MINIPROGRAM_APPID || 'wxd8ebf8c2915ab9d4';
const MINIPROGRAM_SECRET = process.env.MINIPROGRAM_SECRET || '';

// 缓存 access_token
let accessTokenCache: { token: string; expiresAt: number } | null = null;

// 获取 access_token
async function getAccessToken(): Promise<string> {
  // 检查缓存
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${MINIPROGRAM_APPID}&secret=${MINIPROGRAM_SECRET}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.errcode) {
    console.error('获取 access_token 失败:', data);
    throw new Error(data.errmsg || '获取 access_token 失败');
  }

  // 缓存 token，提前 5 分钟过期
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000
  };

  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!MINIPROGRAM_SECRET) {
    return res.status(500).json({ success: false, error: '小程序配置未完成' });
  }

  try {
    const { scene, page, width } = req.method === 'GET' ? req.query : req.body;

    // 获取 access_token
    const accessToken = await getAccessToken();

    // 调用微信 API 生成小程序码
    // 使用 getUnlimited 接口，可以生成无限个小程序码
    const wxaCodeUrl = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

    const response = await fetch(wxaCodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scene: scene || 'share=1', // 场景值，最多32个字符
        page: page || 'pages/index/index', // 小程序页面路径
        width: parseInt(width as string) || 280, // 二维码宽度
        auto_color: false,
        line_color: { r: 249, g: 115, b: 22 }, // 橙色线条
        is_hyaline: false, // 不透明背景
      }),
    });

    // 检查响应类型
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      // 返回的是 JSON，说明出错了
      const errorData = await response.json();
      console.error('生成小程序码失败:', errorData);
      return res.status(400).json({
        success: false,
        error: errorData.errmsg || '生成小程序码失败',
        errcode: errorData.errcode
      });
    }

    // 返回的是图片二进制数据
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    return res.status(200).json({
      success: true,
      data: {
        base64: `data:image/png;base64,${base64Image}`,
        contentType: 'image/png'
      }
    });

  } catch (error: any) {
    console.error('生成小程序码错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    });
  }
}
