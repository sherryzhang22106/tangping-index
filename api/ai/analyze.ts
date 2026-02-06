import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/chat/completions';

// 数据库相关 - 可选
let dbModule: any = null;
let dbInitialized = false;

async function getDb() {
  if (!dbModule) {
    try {
      dbModule = await import('../lib/db');
    } catch (e) {
      console.log('Database module not available');
      return null;
    }
  }
  return dbModule;
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
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  console.log('=== AI Analysis Request ===');
  console.log('DEEPSEEK_API_KEY exists:', !!DEEPSEEK_API_KEY);

  if (!DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not configured');
    return res.status(500).json({ success: false, error: 'AI服务未配置，请联系管理员' });
  }

  try {
    const { assessmentId, userData } = req.body;

    console.log('Assessment ID:', assessmentId);
    console.log('User data keys:', userData ? Object.keys(userData) : 'null');

    if (!userData) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    // 初始化数据库（可选，失败不影响AI分析）
    const db = await getDb();
    if (db && !dbInitialized) {
      try {
        await db.initDatabase();
        dbInitialized = true;
        console.log('Database initialized');
      } catch (dbErr) {
        console.error('Database init error (non-fatal):', dbErr);
      }
    }

    console.log('Building AI prompt...');
    const prompt = buildAIPrompt(userData);
    console.log('Prompt length:', prompt.length);

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
        max_tokens: 8000,
      }),
    });

    console.log('DeepSeek response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return res.status(500).json({ success: false, error: `AI服务暂时不可用 (${response.status})，请稍后重试` });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';

    console.log('AI content length:', aiContent.length);

    if (!aiContent) {
      console.error('DeepSeek returned empty content:', JSON.stringify(data).substring(0, 500));
      return res.status(500).json({ success: false, error: 'AI生成内容为空，请重试' });
    }

    const aiGeneratedAt = new Date().toISOString();
    const aiWordCount = aiContent.length;

    console.log('AI analysis completed successfully, word count:', aiWordCount);

    // 保存到数据库（可选）
    if (assessmentId && db && dbInitialized) {
      try {
        await db.query(
          `UPDATE assessments
           SET ai_status = $1, ai_analysis = $2, ai_generated_at = $3, ai_word_count = $4, updated_at = NOW()
           WHERE id = $5`,
          ['completed', aiContent, aiGeneratedAt, aiWordCount, assessmentId]
        );
        console.log('AI analysis saved to database');
      } catch (dbErr) {
        console.error('Failed to save AI analysis to database:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      aiAnalysis: aiContent,
      aiStatus: 'completed',
      aiGeneratedAt,
      aiWordCount,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return res.status(500).json({ success: false, error: `AI分析失败: ${errorMessage}` });
  }
}

function buildAIPrompt(userData: any): string {
  const { base_info, scores, dimensions, analysis, open_answers } = userData;

  // 提取基础信息
  const city = base_info?.city || '未知';
  const career = base_info?.career || '未知';
  const sleep = base_info?.sleep || '未知';

  // 提取分数信息
  const totalScore = scores?.totalScore || scores?.total_score || 0;
  const level = scores?.level?.level || scores?.level || '';
  const levelName = scores?.level?.name || scores?.level_name || '';

  // 仰卧起坐型判断
  const isYangWoQiZuo = scores?.is_yangwoqizuo || scores?.isYangWoQiZuo || false;
  const yangWoQiZuoSubtype = scores?.yangwoqizuo_subtype || scores?.yangWoQiZuoSubtype || '';
  const yangWoQiZuoDesc = scores?.yangwoqizuo_description || scores?.yangWoQiZuoDescription || '';

  // 提取维度信息 - 使用原始分和满分
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

  // 最高分和最低分维度
  const highestDim = analysis?.highest_dim || analysis?.highestDim || '';
  const lowestDim = analysis?.lowest_dim || analysis?.lowestDim || '';
  const highestScore = analysis?.highest_score || analysis?.highestScore || 0;
  const lowestScore = analysis?.lowest_score || analysis?.lowestScore || 0;
  const dimGap = highestScore - lowestScore;

  // 开放题回答
  const q39 = open_answers?.q39_ideal_day || open_answers?.q39 || '未填写';
  const q40 = open_answers?.q40_current_state || open_answers?.q40 || '未填写';
  const q41 = open_answers?.q41_reasons || open_answers?.q41 || '未填写';

  // 构建仰卧起坐型说明
  const yangWoQiZuoInfo = isYangWoQiZuo
    ? `是（${yangWoQiZuoSubtype}：${yangWoQiZuoDesc}）`
    : '否';

  return `# 用户数据输入

## 基础信息
- **城市等级**：${city}
- **职业阶段**：${career}
- **睡眠质量**：${sleep}

## 测评结果
- **总分**：${totalScore}分（满分245分）
- **等级**：Lv.${level} - ${levelName}
- **是否为仰卧起坐型**：${yangWoQiZuoInfo}

## 五维度得分
| 维度 | 原始分 | 百分制 | 相对水平 |
|------|--------|--------|----------|
| 打工人现状 | ${workRaw}/${workMax} | ${workPercent} | ${workLevel} |
| 社交电量 | ${socialRaw}/${socialMax} | ${socialPercent} | ${socialLevel} |
| 生活状态 | ${lifeRaw}/${lifeMax} | ${lifePercent} | ${lifeLevel} |
| 精神状态 | ${mentalRaw}/${mentalMax} | ${mentalPercent} | ${mentalLevel} |
| 价值观念 | ${valueRaw}/${valueMax} | ${valuePercent} | ${valueLevel} |

- **得分最高维度**：${highestDim}（${highestScore}分）→ 最"躺"的方面
- **得分最低维度**：${lowestDim}（${lowestScore}分）→ 还在"卷"的方面
- **维度落差**：${dimGap}分

## 开放题回答
- **Q39（理想的一天）**：${q39}
- **Q40（现状形容）**：${q40}
- **Q41（坚持/放弃理由）**：${q41}

---

# 输出要求：生成3000字左右的个性化分析报告

## 第一部分：开场白（250-300字）
### 写作要点
1. **结合基础信息开场**
   - "看到你是[城市等级]+[职业阶段]，我大概能理解你现在的状态了"
   - 不同组合给出不同共鸣点
2. **睡眠质量的隐喻**
   - "你说自己[睡眠状况]，这本身就很说明问题了"
3. **引用Q40的梗/表述**
   - "你用'[Q40回答]'形容自己，我觉得特别准确"
4. **点出核心判定**
   - 如果是仰卧起坐型，必须在开场就明确点出

## 第二部分：基础信息的深度解读（200-250字）
根据城市+职业阶段的组合，给出针对性洞察。分析睡眠质量的身心信号。

## 第三部分：五维度深度解读（1000-1200字）
### 如果是"仰卧起坐型"
- 先整体分析矛盾：最低分维度和最高分维度的分裂
- 根据细分类型（努力上行型/摆烂下行型/分裂矛盾型）给出针对性分析

### 如果不是"仰卧起坐型"
- 全面低分（Lv.1-2）：分析"全方位在努力"的状态
- 全面高分（Lv.5-6）：分析"全方位躺平"的状态

### 逐维度分析
- 最高分维度（最"躺"的方面）：深入分析原因
- 最低分维度（还在坚持的方面）：分析这个"最后防线"
- 其他有特点的维度

## 第四部分：理想与现实的对话（500-600字）
### 基于Q39（理想的一天）的深度分析
- 判断理想描述的类型（具体型/模糊型/不切实际型）
- 分析理想与现实的差距
- 给一个温柔的提醒或现实的建议

## 第五部分：躺平类型诊断（400-500字）
根据总分+维度+开放题，判断躺平类型：
- 主动选择型躺平
- 被迫型躺平
- 仰卧起坐型躺平
- 防御型躺平

## 第六部分：说点真话（400-500字）
根据不同等级/类型，给出不同的"真话"，要敢于戳破，但语气要温柔。

## 第七部分：个性化建议（600-800字）
### 立即可做的小事（3-5条）
根据用户的得分最高维度（最躺的方面）给出针对性建议，要具体、可执行、低门槛。

### 中期可以尝试的（2-3条）
根据用户类型给出方向性建议。

### 长期的提醒（1-2条）
给所有人的普适建议。

## 第八部分：结尾寄语（250-300字）
- 称呼用户为"朋友"
- 回应整体状态，给予接纳和理解
- 不要用"加油""你可以的"，换成"慢慢来""别急""你已经很棒了"
- 如果用户状态很差，要格外温柔
- 如果是"仰卧起坐型"，给一个特别的拥抱
- 根据Q39或Q41，给一句定制化的话

---

# 语气和风格要求（贯穿全文）
1. **说人话**：别用"您""请""建议"，用"你""试试""可以"
2. **共情但不泛滥**：理解用户，但别过度煽情
3. **有洞察但不说教**：可以点出问题，但不要居高临下
4. **温柔但不鸡汤**：接纳用户的状态，但别灌鸡汤
5. **具体而非抽象**：少用"提升自己""保持积极"，多用具体场景
6. **网络化但不尬**：可以用梗，但要自然
7. **允许矛盾存在**：不要试图给完美答案
8. **严禁使用 Markdown 的双星号 (**) 进行加粗**

---

# 最后检查清单
- 是否结合了前置三题（城市/职业/睡眠）进行分析？
- 是否判断了"仰卧起坐型"并给出针对性分析？
- 是否结合了所有三道开放题的回答？
- 是否指出了最高分和最低分维度的深层含义？
- 是否给出了至少5条具体可执行的建议？
- 是否在适当的地方说了"真话"（温柔地戳破）？
- 结尾是否温暖且不鸡汤？
- 总字数是否在2800-3200字之间？
- 语气是否像朋友聊天而非客服回复？

现在，请基于以上框架和用户数据，生成一份真诚、有洞察力、能让用户感觉"被看见"的分析报告。`;
}

function getLevel(percent: number): string {
  if (percent < 40) return '低';
  if (percent < 70) return '中';
  return '高';
}
