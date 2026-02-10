import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/chat/completions';

// 内存缓存正在生成的内容（生产环境建议用 Redis）
const streamingCache = new Map<string, { content: string; status: 'generating' | 'completed' | 'failed'; updatedAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // GET /api/ai/stream?action=poll&taskId=xxx - 轮询获取内容
  if (req.method === 'GET' && action === 'poll') {
    const { taskId } = req.query;
    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ success: false, error: '缺少 taskId' });
    }

    const cached = streamingCache.get(taskId);
    if (!cached) {
      // 尝试从数据库获取
      try {
        const assessment = await prisma.assessment.findUnique({
          where: { id: taskId },
          select: { aiAnalysis: true, aiStatus: true }
        });
        if (assessment?.aiAnalysis) {
          return res.status(200).json({
            success: true,
            content: assessment.aiAnalysis,
            status: assessment.aiStatus || 'completed',
            isComplete: true
          });
        }
      } catch (e) {
        // ignore
      }
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    return res.status(200).json({
      success: true,
      content: cached.content,
      status: cached.status,
      isComplete: cached.status === 'completed' || cached.status === 'failed'
    });
  }

  // POST /api/ai/stream?action=start - 开始流式生成
  if (req.method === 'POST' && action === 'start') {
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ success: false, error: 'AI服务未配置' });
    }

    const { assessmentId, userData } = req.body;
    if (!userData) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    const taskId = assessmentId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 初始化缓存
    streamingCache.set(taskId, { content: '', status: 'generating', updatedAt: Date.now() });

    // 立即返回 taskId，后台继续处理
    res.status(200).json({ success: true, taskId, status: 'generating' });

    // 异步执行流式生成（不阻塞响应）
    generateStreamContent(taskId, userData, assessmentId).catch(err => {
      console.error('Stream generation error:', err);
      const cached = streamingCache.get(taskId);
      if (cached) {
        cached.status = 'failed';
        cached.updatedAt = Date.now();
      }
    });

    return;
  }

  return res.status(400).json({ success: false, error: '无效请求' });
}

async function generateStreamContent(taskId: string, userData: any, assessmentId?: string) {
  const prompt = buildAIPrompt(userData);

  try {
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
        max_tokens: 8000,
        stream: true, // 启用流式输出
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              // 更新缓存
              const cached = streamingCache.get(taskId);
              if (cached) {
                cached.content = fullContent;
                cached.updatedAt = Date.now();
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    // 标记完成
    const cached = streamingCache.get(taskId);
    if (cached) {
      cached.status = 'completed';
      cached.updatedAt = Date.now();
    }

    // 保存到数据库
    if (assessmentId && fullContent) {
      try {
        await prisma.assessment.update({
          where: { id: assessmentId },
          data: {
            aiStatus: 'completed',
            aiAnalysis: fullContent,
          },
        });
      } catch (e) {
        console.error('Failed to save to database:', e);
      }
    }

    // 5分钟后清理缓存
    setTimeout(() => {
      streamingCache.delete(taskId);
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error('Stream generation error:', error);
    const cached = streamingCache.get(taskId);
    if (cached) {
      cached.status = 'failed';
      cached.updatedAt = Date.now();
    }
  }
}

function buildAIPrompt(userData: any): string {
  const { base_info, scores, dimensions, analysis, open_answers } = userData;

  const city = base_info?.city || '未知';
  const career = base_info?.career || '未知';
  const sleep = base_info?.sleep || '未知';

  const totalScore = scores?.totalScore || scores?.total_score || 0;
  const level = scores?.level?.level || scores?.level || '';
  const levelName = scores?.level?.name || scores?.level_name || '';

  const isYangWoQiZuo = scores?.is_yangwoqizuo || scores?.isYangWoQiZuo || false;
  const yangWoQiZuoSubtype = scores?.yangwoqizuo_subtype || scores?.yangWoQiZuoSubtype || '';
  const yangWoQiZuoDesc = scores?.yangwoqizuo_description || scores?.yangWoQiZuoDescription || '';

  const workRaw = dimensions?.work?.raw || dimensions?.work?.score || 0;
  const workMax = 63;
  const workPercent = dimensions?.work?.percent || Math.round((workRaw / workMax) * 100);
  const workLevel = dimensions?.work?.level || getLevel(workPercent);

  const socialRaw = dimensions?.social?.raw || dimensions?.social?.score || 0;
  const socialMax = 49;
  const socialPercent = dimensions?.social?.percent || Math.round((socialRaw / socialMax) * 100);
  const socialLevel = dimensions?.social?.level || getLevel(socialPercent);

  const lifeRaw = dimensions?.life?.raw || dimensions?.life?.score || 0;
  const lifeMax = 56;
  const lifePercent = dimensions?.life?.percent || Math.round((lifeRaw / lifeMax) * 100);
  const lifeLevel = dimensions?.life?.level || getLevel(lifePercent);

  const mentalRaw = dimensions?.mental?.raw || dimensions?.mental?.score || 0;
  const mentalMax = 42;
  const mentalPercent = dimensions?.mental?.percent || Math.round((mentalRaw / mentalMax) * 100);
  const mentalLevel = dimensions?.mental?.level || getLevel(mentalPercent);

  const valueRaw = dimensions?.value?.raw || dimensions?.value?.score || 0;
  const valueMax = 35;
  const valuePercent = dimensions?.value?.percent || Math.round((valueRaw / valueMax) * 100);
  const valueLevel = dimensions?.value?.level || getLevel(valuePercent);

  const highestDim = analysis?.highest_dim || analysis?.highestDim || '';
  const lowestDim = analysis?.lowest_dim || analysis?.lowestDim || '';
  const highestScore = analysis?.highest_score || analysis?.highestScore || 0;
  const lowestScore = analysis?.lowest_score || analysis?.lowestScore || 0;
  const dimGap = highestScore - lowestScore;

  const q39 = open_answers?.q39_ideal_day || open_answers?.q39 || '未填写';
  const q40 = open_answers?.q40_current_state || open_answers?.q40 || '未填写';
  const q41 = open_answers?.q41_reasons || open_answers?.q41 || '未填写';

  const yangWoQiZuoInfo = isYangWoQiZuo
    ? `是（${yangWoQiZuoSubtype}：${yangWoQiZuoDesc}）`
    : '否';

  return `# 用户数据输入

## 基础信息
- 城市等级：${city}
- 职业阶段：${career}
- 睡眠质量：${sleep}

## 测评结果
- 总分：${totalScore}分（满分245分）
- 等级：Lv.${level} - ${levelName}
- 是否为仰卧起坐型：${yangWoQiZuoInfo}

## 五维度得分
| 维度 | 原始分 | 百分制 | 相对水平 |
|------|--------|--------|----------|
| 打工人现状 | ${workRaw}/${workMax} | ${workPercent} | ${workLevel} |
| 社交电量 | ${socialRaw}/${socialMax} | ${socialPercent} | ${socialLevel} |
| 生活状态 | ${lifeRaw}/${lifeMax} | ${lifePercent} | ${lifeLevel} |
| 精神状态 | ${mentalRaw}/${mentalMax} | ${mentalPercent} | ${mentalLevel} |
| 价值观念 | ${valueRaw}/${valueMax} | ${valuePercent} | ${valueLevel} |

- 得分最高维度：${highestDim}（${highestScore}分）→ 最"躺"的方面
- 得分最低维度：${lowestDim}（${lowestScore}分）→ 还在"卷"的方面
- 维度落差：${dimGap}分

## 开放题回答
- Q39（理想的一天）：${q39}
- Q40（现状形容）：${q40}
- Q41（坚持/放弃理由）：${q41}

---

# 输出要求：生成3000字左右的个性化分析报告

请按以下结构输出，使用简洁的格式，不要使用 Markdown 的加粗语法（**）：

## 第一部分：开场白（250-300字）
结合基础信息开场，引用Q40的表述，点出核心判定。

## 第二部分：基础信息的深度解读（200-250字）
根据城市+职业阶段的组合，给出针对性洞察。

## 第三部分：五维度深度解读（1000-1200字）
逐维度分析，重点分析最高分和最低分维度。

## 第四部分：理想与现实的对话（500-600字）
基于Q39（理想的一天）的深度分析。

## 第五部分：躺平类型诊断（400-500字）
判断躺平类型并分析。

## 第六部分：说点真话（400-500字）
温柔地戳破一些东西。

## 第七部分：个性化建议（600-800字）
给出具体可执行的建议。

## 第八部分：结尾寄语（250-300字）
温暖的结尾，不要鸡汤。

---

# 格式要求
1. 使用 ## 作为大标题
2. 使用 ### 作为小标题
3. 不要使用 ** 加粗
4. 段落之间空一行
5. 列表使用 - 开头
6. 语气像朋友聊天

现在，请生成报告。`;
}

function getLevel(percent: number): string {
  if (percent < 40) return '低';
  if (percent < 70) return '中';
  return '高';
}
