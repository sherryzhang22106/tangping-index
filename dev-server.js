import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '.dev-data.json');

// Load persisted data or use defaults
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return {
        codes: new Map(Object.entries(data.codes || {})),
        assessments: new Map(Object.entries(data.assessments || {})),
        progress: new Map(Object.entries(data.progress || {})),
      };
    }
  } catch (e) {
    console.log('Failed to load data, using defaults');
  }
  // Default data
  return {
    codes: new Map([
      ['TEST001', { code: 'TEST001', status: 'UNUSED', packageType: 'STANDARD', createdAt: new Date().toISOString() }],
      ['TEST002', { code: 'TEST002', status: 'UNUSED', packageType: 'STANDARD', createdAt: new Date().toISOString() }],
      ['TANGPING', { code: 'TANGPING', status: 'UNUSED', packageType: 'STANDARD', createdAt: new Date().toISOString() }],
    ]),
    assessments: new Map(),
    progress: new Map(),
  };
}

// Save data to file
function saveData() {
  try {
    const data = {
      codes: Object.fromEntries(storage.codes),
      assessments: Object.fromEntries(storage.assessments),
      progress: Object.fromEntries(storage.progress),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

// In-memory storage for local development (with persistence)
const storage = loadData();

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-448ce19cde5643e7894695332072dd58';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/chat/completions';

// Parse JSON body
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// CORS headers
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Send JSON response
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Build AI prompt
function buildAIPrompt(userData) {
  const { base_info, scores, dimensions, analysis, open_answers, high_score_summary } = userData;

  const isYangWoQiZuo = scores.is_yangwoqizuo;
  const yangWoQiZuoSection = isYangWoQiZuo ? `
【重点关注 - 仰卧起坐型】
用户是"仰卧起坐型"（${scores.yangwoqizuo_subtype}：${scores.yangwoqizuo_description}），需要：
1. 在开场白明确指出这一特征
2. 深入分析维度间的矛盾
3. 给出针对性建议，帮助用户接受这种"中间状态"
4. 在结尾给予特别的温暖和理解
` : '';

  const healthWarning = (dimensions.mental?.percent > 75 && (base_info.sleep.includes('半夜醒') || base_info.sleep.includes('褪黑素'))) ? `
【健康警示】
用户的精神状态得分${dimensions.mental?.percent}（较高）+ 睡眠质量差
这是需要特别关注的信号，请在分析中温柔地指出这个问题，建议考虑专业帮助。
` : '';

  return `# 角色设定
你是一个懂年轻人的AI知己，既有专业的心理洞察力，又能说人话。你不是居高临下的咨询师，而是能共情、会倾听、敢说真话的朋友。

---

# 用户数据

## 基础信息
- 城市等级：${base_info.city}
- 职业阶段：${base_info.career}
- 睡眠质量：${base_info.sleep}

## 测评结果
- 总分：${scores.total_score}分（满分245分）
- 等级：${scores.level} - ${scores.level_name}
- 等级描述：${scores.level_description}
- 是否为仰卧起坐型：${isYangWoQiZuo ? '是' : '否'}${isYangWoQiZuo ? ` - ${scores.yangwoqizuo_subtype}` : ''}

## 五维度得分
| 维度 | 原始分 | 百分制 | 相对水平 |
|------|--------|--------|----------|
| ${dimensions.work?.name} | ${dimensions.work?.raw}/${dimensions.work?.max} | ${dimensions.work?.percent} | ${dimensions.work?.level} |
| ${dimensions.social?.name} | ${dimensions.social?.raw}/${dimensions.social?.max} | ${dimensions.social?.percent} | ${dimensions.social?.level} |
| ${dimensions.life?.name} | ${dimensions.life?.raw}/${dimensions.life?.max} | ${dimensions.life?.percent} | ${dimensions.life?.level} |
| ${dimensions.mental?.name} | ${dimensions.mental?.raw}/${dimensions.mental?.max} | ${dimensions.mental?.percent} | ${dimensions.mental?.level} |
| ${dimensions.value?.name} | ${dimensions.value?.raw}/${dimensions.value?.max} | ${dimensions.value?.percent} | ${dimensions.value?.level} |

- 得分最高维度：${analysis.highest_dim}（${analysis.highest_score}分）→ 最"躺"的方面
- 得分最低维度：${analysis.lowest_dim}（${analysis.lowest_score}分）→ 还在"卷"的方面
- 维度落差：${analysis.gap}分

## 开放题回答
- Q39（理想的一天）：${open_answers.q39_ideal_day || '未填写'}
- Q40（现状形容）：${open_answers.q40_current_state || '未填写'}
- Q41（坚持/放弃理由）：${open_answers.q41_reasons || '未填写'}

## 高分题目汇总
${high_score_summary}

${yangWoQiZuoSection}
${healthWarning}

---

# 输出要求：生成2800-3200字的个性化分析报告

## 写作风格要求
1. 说人话：别用"您""请""建议"，用"你""试试""可以"
2. 共情但不泛滥：理解用户，但别过度煽情
3. 有洞察但不说教：可以点出问题，但不要居高临下
4. 温柔但不鸡汤：接纳用户的状态，但别灌鸡汤
5. 具体而非抽象：少用"提升自己""保持积极"，多用具体场景
6. 网络化但不尬：可以用梗，但要自然
7. 严禁使用 Markdown 的双星号 (**) 进行加粗，用标题结构区分段落

## 报告结构

### 第一部分：开场白（250-300字）
1. 结合基础信息开场："看到你是[城市等级]+[职业阶段]，我大概能理解你现在的状态了"
2. 睡眠质量的隐喻："你说自己[睡眠状况]，这本身就很说明问题了"
3. 引用Q40的梗/表述："你用'[Q40回答]'形容自己，我觉得特别准确"
4. 点出核心判定：总分、等级，如果是仰卧起坐型必须在开场就明确点出

### 第二部分：基础信息的深度解读（200-250字）
根据城市+职业阶段的组合，给出针对性洞察。睡眠质量作为身心信号分析。

### 第三部分：五维度深度解读（1000-1200字）
1. 如果是仰卧起坐型，先整体分析矛盾，再细分类型针对性分析
2. 最高分维度（最"躺"的方面）深度分析
3. 最低分维度（还在坚持的方面）深度分析
4. 其他维度的观察

### 第四部分：理想与现实的对话（500-600字）
基于Q39（理想的一天）的深度分析：
1. 理想描述的类型判断（具体型/模糊型/不切实际型）
2. 理想与现实的差距分析
3. 给一个温柔的提醒或现实的建议

### 第五部分：躺平类型诊断（400-500字）
根据总分+维度+开放题，判断躺平类型：
- 主动选择型躺平
- 被迫型躺平
- 仰卧起坐型躺平
- 防御型躺平

### 第六部分：说点真话（400-500字）
根据不同等级/类型，给出不同的"真话"，敢于戳破但语气要温柔。

### 第七部分：个性化建议（600-800字）
1. 立即可做的小事（3-5条）：简单到不需要动脑，做完立刻有反馈
2. 中期可以尝试的（2-3条）：根据用户类型给出方向性建议
3. 长期的提醒（1-2条）

### 第八部分：结尾寄语（250-300字）
1. 温暖的称呼
2. 回应整体状态，给予接纳和理解
3. 不要用"加油""你可以的"，换成"慢慢来""别急""你已经很棒了"
4. 如果是仰卧起坐型，给一个特别的拥抱
5. 根据Q39或Q41，给一句定制化的话

---

现在，请基于以上框架和用户数据，生成一份真诚、有洞察力、能让用户感觉"被看见"的分析报告。`;
}

// Route handlers
const routes = {
  // Validate code
  'POST /api/codes/validate': async (req, res, body) => {
    const { code, visitorId } = body;
    if (!code) {
      return sendJson(res, 400, { success: false, message: '请输入兑换码' });
    }

    const codeData = storage.codes.get(code.toUpperCase());
    if (!codeData) {
      return sendJson(res, 404, { success: false, message: '兑换码不存在' });
    }

    if (codeData.status === 'USED') {
      return sendJson(res, 400, { success: false, message: '兑换码已被使用' });
    }

    if (codeData.status === 'REVOKED') {
      return sendJson(res, 400, { success: false, message: '兑换码已失效' });
    }

    // Activate the code
    codeData.status = 'ACTIVATED';
    codeData.activatedAt = new Date();
    codeData.userId = visitorId;
    saveData(); // Persist data

    return sendJson(res, 200, { success: true, data: { code: codeData.code } });
  },

  // Save progress
  'POST /api/progress': async (req, res, body) => {
    const { userId, responses } = body;
    if (!userId) {
      return sendJson(res, 400, { success: false, message: '缺少用户ID' });
    }

    storage.progress.set(userId, { responses, updatedAt: new Date() });
    saveData(); // Persist data
    return sendJson(res, 200, { success: true });
  },

  // Get progress
  'GET /api/progress': async (req, res, body, url) => {
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return sendJson(res, 400, { success: false, message: '缺少用户ID' });
    }

    const progress = storage.progress.get(userId);
    if (!progress) {
      return sendJson(res, 200, { success: true, data: null });
    }

    return sendJson(res, 200, { success: true, data: { responses: progress.responses } });
  },

  // Submit assessment
  'POST /api/assessments/submit': async (req, res, body) => {
    const { visitorId, code, responses, scores } = body;
    if (!visitorId || !code || !responses || !scores) {
      return sendJson(res, 400, { success: false, message: '缺少必要参数' });
    }

    const codeData = storage.codes.get(code.toUpperCase());
    if (!codeData || codeData.status !== 'ACTIVATED') {
      return sendJson(res, 400, { success: false, message: '兑换码状态无效' });
    }

    const id = 'assessment_' + Date.now();
    const assessment = {
      id,
      visitorId,
      code,
      responses,
      scores,
      aiStatus: 'pending',
      createdAt: new Date(),
    };

    storage.assessments.set(id, assessment);
    codeData.status = 'USED';
    storage.progress.delete(visitorId);
    saveData(); // Persist data

    return sendJson(res, 201, { success: true, id });
  },

  // Get assessment
  'GET /api/assessments/:id': async (req, res, body, url) => {
    const id = url.pathname.split('/').pop();
    const assessment = storage.assessments.get(id);
    if (!assessment) {
      return sendJson(res, 404, { success: false, message: '测评不存在' });
    }
    return sendJson(res, 200, { success: true, data: assessment });
  },

  // AI analysis
  'POST /api/ai/analyze': async (req, res, body) => {
    const { assessmentId, userData } = body;
    if (!assessmentId || !userData) {
      return sendJson(res, 400, { error: '缺少必要参数' });
    }

    const assessment = storage.assessments.get(assessmentId);
    if (!assessment) {
      return sendJson(res, 404, { error: '测评不存在' });
    }

    assessment.aiStatus = 'generating';

    try {
      const prompt = buildAIPrompt(userData);

      console.log('Calling DeepSeek API...');
      const response = await fetch(DEEPSEEK_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个懂年轻人的AI知己，既有专业的心理洞察力，又能说人话。你不是居高临下的咨询师，而是能共情、会倾听、敢说真话的朋友。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.85,
          max_tokens: 6000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('DeepSeek API error:', errorData);
        throw new Error('AI API 调用失败');
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || '';

      assessment.aiAnalysis = aiContent;
      assessment.aiStatus = 'completed';
      assessment.completedAt = new Date();
      saveData(); // Persist data

      return sendJson(res, 200, {
        success: true,
        aiAnalysis: aiContent,
        aiStatus: 'completed',
        aiGeneratedAt: new Date().toISOString(),
        aiWordCount: aiContent.length,
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      assessment.aiStatus = 'failed';
      return sendJson(res, 500, { error: 'AI分析失败' });
    }
  },

  // Admin login (simplified for dev)
  'POST /api/auth/admin-login': async (req, res, body) => {
    const { username, password } = body;
    if (username === 'admin' && password === 'admin123') {
      return sendJson(res, 200, { success: true, token: 'dev-token-' + Date.now() });
    }
    return sendJson(res, 401, { success: false, error: '用户名或密码错误' });
  },

  // List codes (admin)
  'GET /api/codes/list': async (req, res, body, url) => {
    const codes = Array.from(storage.codes.values());
    return sendJson(res, 200, { success: true, data: { codes, total: codes.length } });
  },

  // Create codes (admin)
  'POST /api/codes/create': async (req, res, body) => {
    const { count = 1, prefix = 'TP', packageType = 'STANDARD', expiresInDays } = body;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const newCodes = [];
    const generatedCodeStrings = [];

    for (let i = 0; i < Math.min(count, 100); i++) {
      // 使用 crypto 生成更随机的字符，8位
      const randomBytes = crypto.randomBytes(8);
      let code = prefix;
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(randomBytes[j] % chars.length);
      }

      // 确保不重复
      if (storage.codes.has(code)) {
        i--;
        continue;
      }

      const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null;
      const codeData = {
        code,
        status: 'UNUSED',
        packageType,
        createdAt: new Date().toISOString(),
        expiresAt,
      };
      storage.codes.set(code, codeData);
      newCodes.push(codeData);
      generatedCodeStrings.push(code);
    }
    saveData(); // Persist data
    return sendJson(res, 201, {
      success: true,
      data: {
        codes: generatedCodeStrings,
        count: newCodes.length,
        packageType,
        expiresAt: newCodes[0]?.expiresAt || null,
      }
    });
  },

  // Delete all unused codes (admin)
  'POST /api/codes/delete-unused': async (req, res, body) => {
    let deletedCount = 0;
    for (const [code, data] of storage.codes.entries()) {
      if (data.status === 'UNUSED') {
        storage.codes.delete(code);
        deletedCount++;
      }
    }
    saveData();
    return sendJson(res, 200, { success: true, data: { deletedCount } });
  },

  // List assessments (admin)
  'GET /api/assessments/list': async (req, res, body, url) => {
    const assessments = Array.from(storage.assessments.values());
    return sendJson(res, 200, { success: true, data: { assessments, total: assessments.length } });
  },
};

// Create server
const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const routeKey = `${req.method} ${url.pathname}`;
  const body = await parseBody(req);

  // Try exact match first
  if (routes[routeKey]) {
    return routes[routeKey](req, res, body, url);
  }

  // Try pattern match for dynamic routes
  for (const [pattern, handler] of Object.entries(routes)) {
    const [method, path] = pattern.split(' ');
    if (method !== req.method) continue;

    if (path.includes(':')) {
      const regex = new RegExp('^' + path.replace(/:[\w]+/g, '[^/]+') + '$');
      if (regex.test(url.pathname)) {
        return handler(req, res, body, url);
      }
    }
  }

  // 404
  sendJson(res, 404, { error: 'Not found' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   躺平指数测评 - 本地开发服务器                              ║
║                                                            ║
║   API Server: http://localhost:${PORT}                       ║
║                                                            ║
║   预置测试兑换码:                                            ║
║   - TEST001                                                 ║
║   - TEST002                                                 ║
║   - TANGPING                                                ║
║                                                            ║
║   管理员账号: admin / admin123                               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
