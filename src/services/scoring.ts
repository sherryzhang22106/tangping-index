
import { AssessmentResponse, Scores, DimensionScores, YangWoQiZuoResult, LevelInfo, BaseInfo, OpenAnswers } from '../types';
import { QUESTIONS, DIMENSIONS, LEVELS } from '../constants';

/**
 * 获取选项分值
 */
const getScore = (qId: number, val: any): number => {
  if (val === undefined || val === null) return 0;
  const q = QUESTIONS.find(q => q.id === qId);
  if (!q || q.isBaseInfo) return 0;

  if (q.type === 'CHOICE') {
    const idx = Number(val);
    return q.options?.[idx]?.value || 0;
  }
  return 0;
};

/**
 * 计算总分（Q4-Q38，共35题）
 */
export const calculateTotalScore = (responses: AssessmentResponse): number => {
  let total = 0;
  for (let i = 4; i <= 38; i++) {
    total += getScore(i, responses[i]);
  }
  return total;
};

/**
 * 计算五维度得分
 */
export const calculateDimensionScores = (responses: AssessmentResponse): { raw: DimensionScores; display: DimensionScores } => {
  const raw: DimensionScores = {
    work: 0,
    social: 0,
    life: 0,
    mental: 0,
    value: 0
  };

  // 打工人现状 Q4-Q12
  for (let i = 4; i <= 12; i++) {
    raw.work += getScore(i, responses[i]);
  }
  // 社交电量 Q13-Q19
  for (let i = 13; i <= 19; i++) {
    raw.social += getScore(i, responses[i]);
  }
  // 生活状态 Q20-Q27
  for (let i = 20; i <= 27; i++) {
    raw.life += getScore(i, responses[i]);
  }
  // 精神状态 Q28-Q33
  for (let i = 28; i <= 33; i++) {
    raw.mental += getScore(i, responses[i]);
  }
  // 价值观念 Q34-Q38
  for (let i = 34; i <= 38; i++) {
    raw.value += getScore(i, responses[i]);
  }

  // 转换为百分制
  const display: DimensionScores = {
    work: Number(((raw.work / DIMENSIONS.work.maxScore) * 100).toFixed(1)),
    social: Number(((raw.social / DIMENSIONS.social.maxScore) * 100).toFixed(1)),
    life: Number(((raw.life / DIMENSIONS.life.maxScore) * 100).toFixed(1)),
    mental: Number(((raw.mental / DIMENSIONS.mental.maxScore) * 100).toFixed(1)),
    value: Number(((raw.value / DIMENSIONS.value.maxScore) * 100).toFixed(1))
  };

  return { raw, display };
};

/**
 * 获取等级信息
 */
export const getLevel = (totalScore: number): LevelInfo => {
  for (const level of LEVELS) {
    if (totalScore >= level.min && totalScore <= level.max) {
      return level;
    }
  }
  return LEVELS[LEVELS.length - 1];
};

/**
 * 检测开放题中的矛盾词汇
 */
const checkContradiction = (openAnswers: OpenAnswers): boolean => {
  const text = [openAnswers.currentState, openAnswers.reasons].join(' ');
  const positiveWords = ['努力', '坚持', '加油', '可以', '继续', '奋斗', '冲', '希望'];
  const negativeWords = ['累', '放弃', '算了', '麻了', '躺平', '不想', '摆烂', '毁灭', '废'];

  const hasPositive = positiveWords.some(w => text.includes(w));
  const hasNegative = negativeWords.some(w => text.includes(w));

  return hasPositive && hasNegative;
};

/**
 * 判断是否为仰卧起坐型
 */
export const detectYangWoQiZuo = (
  totalScore: number,
  dimensions: DimensionScores,
  openAnswers: OpenAnswers
): YangWoQiZuoResult => {
  // 条件1：分数在71-175之间
  const inRange = totalScore >= 71 && totalScore <= 175;

  // 条件2：维度落差≥35
  const scores = Object.values(dimensions);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const gap = max - min;
  const hasLargeGap = gap >= 35;

  // 条件3：特定维度组合
  const combo1 = dimensions.work < 45 && dimensions.mental > 65;
  const combo2 = dimensions.value < 45 && dimensions.life > 65;
  const combo3 = dimensions.social > 65 && dimensions.work < 50;
  const hasCombo = combo1 || combo2 || combo3;

  // 条件4：开放题矛盾词汇
  const hasContradiction = checkContradiction(openAnswers);

  // 至少满足2个条件
  const conditions = [inRange, hasLargeGap, hasCombo, hasContradiction];
  const trueCount = conditions.filter(c => c).length;

  if (trueCount >= 2) {
    // 细分类型判定
    // A型：努力上行型
    if ((dimensions.work < 50 || dimensions.value < 50) &&
        (dimensions.life > 60 || dimensions.mental > 60)) {
      return {
        type: 'yangwoqizuo',
        subtype: 'A-努力上行型',
        description: '想卷但身体不允许'
      };
    }

    // B型：摆烂下行型
    if ((dimensions.work > 60 || dimensions.value > 60) &&
        (dimensions.life < 50 || dimensions.social < 50)) {
      return {
        type: 'yangwoqizuo',
        subtype: 'B-摆烂下行型',
        description: '心态已躺，惯性还在'
      };
    }

    // C型：分裂矛盾型 - 计算标准差
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 20) {
      return {
        type: 'yangwoqizuo',
        subtype: 'C-分裂矛盾型',
        description: '严重的内在分裂'
      };
    }

    return {
      type: 'yangwoqizuo',
      subtype: '标准仰卧起坐型',
      description: '时卷时躺，反复横跳'
    };
  }

  return { type: 'normal' };
};

/**
 * 获取基础信息
 */
export const getBaseInfo = (responses: AssessmentResponse): BaseInfo => {
  const cityMap = ['A', 'B', 'C', 'D'];
  const careerMap = ['A', 'B', 'C', 'D', 'E', 'F'];
  const sleepMap = ['A', 'B', 'C', 'D'];

  return {
    city: cityMap[responses[1]] || 'B',
    career: careerMap[responses[2]] || 'B',
    sleep: sleepMap[responses[3]] || 'C'
  };
};

/**
 * 获取开放题答案
 */
export const getOpenAnswers = (responses: AssessmentResponse): OpenAnswers => {
  return {
    idealDay: responses[39] || '',
    currentState: responses[40] || '',
    reasons: responses[41] || ''
  };
};

/**
 * 维度名称映射
 */
const DIMENSION_NAMES: Record<keyof DimensionScores, string> = {
  work: '打工人现状',
  social: '社交电量',
  life: '生活状态',
  mental: '精神状态',
  value: '价值观念'
};

/**
 * 分析维度最高/最低
 */
export const analyzeDimensions = (dimensions: DimensionScores) => {
  const entries = Object.entries(dimensions) as [keyof DimensionScores, number][];
  const sorted = entries.sort(([, a], [, b]) => b - a);

  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  return {
    highestDim: {
      name: highest[0],
      nameCn: DIMENSION_NAMES[highest[0]],
      score: highest[1]
    },
    lowestDim: {
      name: lowest[0],
      nameCn: DIMENSION_NAMES[lowest[0]],
      score: lowest[1]
    },
    gap: highest[1] - lowest[1]
  };
};

/**
 * 完整计分
 */
export const calculateScores = (responses: AssessmentResponse): Scores => {
  const totalScore = calculateTotalScore(responses);
  const { raw, display } = calculateDimensionScores(responses);
  const level = getLevel(totalScore);
  const openAnswers = getOpenAnswers(responses);
  const yangWoQiZuo = detectYangWoQiZuo(totalScore, display, openAnswers);
  const analysis = analyzeDimensions(display);

  return {
    totalScore,
    level,
    dimensions: display,
    dimensionsRaw: raw,
    yangWoQiZuo,
    analysis
  };
};
