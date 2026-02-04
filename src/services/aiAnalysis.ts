
import { AssessmentResponse, Scores, BaseInfo, OpenAnswers } from '../types';
import { QUESTIONS, BASE_INFO_DESC, DIMENSIONS } from '../constants';
import { getBaseInfo, getOpenAnswers } from './scoring';

/**
 * 格式化高分题目（得分>=5的题目）
 */
function formatHighScoreQuestions(responses: AssessmentResponse): string {
  let output = '';
  for (let i = 4; i <= 38; i++) {
    const q = QUESTIONS.find(q => q.id === i);
    if (!q || q.type !== 'CHOICE') continue;

    const idx = Number(responses[i]);
    const score = q.options?.[idx]?.value || 0;

    if (score >= 5) {
      output += `\nQ${i}: ${q.text}\n`;
      output += `选择：${q.options?.[idx]?.label || '未选择'}\n`;
      output += `得分：${score}/7\n`;
    }
  }
  return output || "暂无显著高分项";
}

/**
 * 获取维度相对水平
 */
function getDimensionLevel(score: number): string {
  if (score < 40) return '低';
  if (score < 60) return '中';
  return '高';
}

/**
 * 格式化用户数据以便AI分析
 */
export function formatUserDataForAI(responses: AssessmentResponse, scores: Scores) {
  const baseInfo = getBaseInfo(responses);
  const openAnswers = getOpenAnswers(responses);

  // 获取选项文本
  const getAnswerText = (id: number) => {
    const q = QUESTIONS.find(q => q.id === id);
    const val = responses[id];
    if (q?.type === 'CHOICE' && q.options) {
      const idx = Number(val);
      return q.options[idx]?.label || "未选择";
    }
    if (q?.type === 'OPEN') {
      return val || '';
    }
    return val;
  };

  return {
    base_info: {
      city: BASE_INFO_DESC.city[baseInfo.city as keyof typeof BASE_INFO_DESC.city] || baseInfo.city,
      career: BASE_INFO_DESC.career[baseInfo.career as keyof typeof BASE_INFO_DESC.career] || baseInfo.career,
      sleep: BASE_INFO_DESC.sleep[baseInfo.sleep as keyof typeof BASE_INFO_DESC.sleep] || baseInfo.sleep
    },
    scores: {
      total_score: scores.totalScore,
      level: scores.level.level,
      level_name: scores.level.name,
      level_description: scores.level.description,
      is_yangwoqizuo: scores.yangWoQiZuo.type === 'yangwoqizuo',
      yangwoqizuo_subtype: scores.yangWoQiZuo.subtype || null,
      yangwoqizuo_description: scores.yangWoQiZuo.description || null
    },
    dimensions: {
      work: {
        raw: scores.dimensionsRaw.work,
        max: DIMENSIONS.work.maxScore,
        percent: scores.dimensions.work,
        level: getDimensionLevel(scores.dimensions.work),
        name: DIMENSIONS.work.name
      },
      social: {
        raw: scores.dimensionsRaw.social,
        max: DIMENSIONS.social.maxScore,
        percent: scores.dimensions.social,
        level: getDimensionLevel(scores.dimensions.social),
        name: DIMENSIONS.social.name
      },
      life: {
        raw: scores.dimensionsRaw.life,
        max: DIMENSIONS.life.maxScore,
        percent: scores.dimensions.life,
        level: getDimensionLevel(scores.dimensions.life),
        name: DIMENSIONS.life.name
      },
      mental: {
        raw: scores.dimensionsRaw.mental,
        max: DIMENSIONS.mental.maxScore,
        percent: scores.dimensions.mental,
        level: getDimensionLevel(scores.dimensions.mental),
        name: DIMENSIONS.mental.name
      },
      value: {
        raw: scores.dimensionsRaw.value,
        max: DIMENSIONS.value.maxScore,
        percent: scores.dimensions.value,
        level: getDimensionLevel(scores.dimensions.value),
        name: DIMENSIONS.value.name
      }
    },
    analysis: {
      highest_dim: scores.analysis.highestDim.nameCn,
      highest_score: scores.analysis.highestDim.score,
      lowest_dim: scores.analysis.lowestDim.nameCn,
      lowest_score: scores.analysis.lowestDim.score,
      gap: scores.analysis.gap
    },
    open_answers: {
      q39_ideal_day: openAnswers.idealDay,
      q40_current_state: openAnswers.currentState,
      q41_reasons: openAnswers.reasons
    },
    high_score_summary: formatHighScoreQuestions(responses)
  };
}
