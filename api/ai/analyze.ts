
import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/chat/completions';

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

  if (!DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not configured');
    return res.status(500).json({ error: 'AI服务未配置' });
  }

  try {
    const { assessmentId, userData } = req.body;

    if (!userData) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const sanitizedUserData = {
      base_info: {
        city: userData.base_info?.city || '',
        career: userData.base_info?.career || '',
        sleep: userData.base_info?.sleep || '',
      },
      scores: userData.scores,
      dimensions: userData.dimensions,
      analysis: userData.analysis,
      open_answers: {
        q39_ideal_day: userData.open_answers?.q39_ideal_day || '',
        q40_current_state: userData.open_answers?.q40_current_state || '',
        q41_reasons: userData.open_answers?.q41_reasons || '',
      },
      high_score_summary: userData.high_score_summary || '',
    };

    const prompt = buildAIPrompt(sanitizedUserData);

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

    return res.status(200).json({
      success: true,
      aiAnalysis: aiContent,
      aiStatus: 'completed',
      aiGeneratedAt: new Date().toISOString(),
      aiWordCount: aiContent.length,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return res.status(500).json({ error: 'AI分析失败' });
  }
}

function buildAIPrompt(userData: any): string {
  const { base_info, scores, dimensions, analysis, open_answers, high_score_summary } = userData;

  const isYangWoQiZuo = scores?.is_yangwoqizuo;
  const yangWoQiZuoSection = isYangWoQiZuo ? `
【重点关注 - 仰卧起坐型】
用户是"仰卧起坐型"（${scores.yangwoqizuo_subtype}：${scores.yangwoqizuo_description}），需要：
1. 在开场白明确指出这一特征
2. 深入分析维度间的矛盾
3. 给出针对性建议，帮助用户接受这种"中间状态"
4. 在结尾给予特别的温暖和理解
` : '';

  return `# 用户数据

## 基础信息
- 城市等级：${base_info.city || '未知'}
- 职业阶段：${base_info.career || '未知'}
- 睡眠质量：${base_info.sleep || '未知'}

## 测评结果
- 总分：${scores?.total_score || scores?.totalScore || 0}分
- 等级：${scores?.level?.level || scores?.level || ''} - ${scores?.level?.name || scores?.level_name || ''}
- 等级描述：${scores?.level?.description || scores?.level_description || ''}

## 五维度得分
| 维度 | 百分制 | 相对水平 |
|------|--------|----------|
| 打工人现状 | ${dimensions?.work?.percent || 0} | ${dimensions?.work?.level || ''} |
| 社交电量 | ${dimensions?.social?.percent || 0} | ${dimensions?.social?.level || ''} |
| 生活状态 | ${dimensions?.life?.percent || 0} | ${dimensions?.life?.level || ''} |
| 精神状态 | ${dimensions?.mental?.percent || 0} | ${dimensions?.mental?.level || ''} |
| 价值观念 | ${dimensions?.value?.percent || 0} | ${dimensions?.value?.level || ''} |

- 得分最高维度：${analysis?.highest_dim || ''}（最"躺"的方面）
- 得分最低维度：${analysis?.lowest_dim || ''}（还在"卷"的方面）

## 开放题回答
- Q39（理想的一天）：${open_answers.q39_ideal_day || '未填写'}
- Q40（现状形容）：${open_answers.q40_current_state || '未填写'}
- Q41（坚持/放弃理由）：${open_answers.q41_reasons || '未填写'}

${yangWoQiZuoSection}

---

# 输出要求：生成2000-2500字的个性化分析报告

## 写作风格要求
1. 说人话：别用"您""请""建议"，用"你""试试""可以"
2. 共情但不泛滥：理解用户，但别过度煽情
3. 有洞察但不说教：可以点出问题，但不要居高临下
4. 温柔但不鸡汤：接纳用户的状态，但别灌鸡汤
5. 具体而非抽象：少用"提升自己""保持积极"，多用具体场景
6. 严禁使用 Markdown 的双星号 (**) 进行加粗

## 报告结构

### 第一部分：开场白（200字）
结合基础信息和测评结果，给出一个温暖的开场。

### 第二部分：五维度解读（800字）
分析用户在五个维度上的表现，重点分析最高分和最低分维度。

### 第三部分：理想与现实（400字）
基于Q39的回答，分析用户的理想状态和现实差距。

### 第四部分：躺平类型诊断（300字）
判断用户属于哪种躺平类型。

### 第五部分：个性化建议（500字）
给出3-5条具体可行的建议。

### 第六部分：结尾寄语（200字）
温暖的结尾，不要用"加油"，换成"慢慢来""别急"。

---

现在，请基于以上框架和用户数据，生成一份真诚、有洞察力的分析报告。`;
}
