import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../shared/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    // 获取今天的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 统计查询
    const [
      totalAssessments,
      todayAssessments,
      completedAssessments,
      todayCompleted,
      totalCodes,
      unusedCodes,
      usedCodes,
      todayUsedCodes,
      totalTestPaid,
      todayTestPaid,
      totalAIPaid,
      todayAIPaid,
    ] = await Promise.all([
      // 总测评数
      prisma.assessment.count(),
      // 今日测评数
      prisma.assessment.count({ where: { createdAt: { gte: today } } }),
      // 已完成AI分析
      prisma.assessment.count({ where: { aiStatus: 'completed' } }),
      // 今日完成AI分析
      prisma.assessment.count({ where: { aiStatus: 'completed', createdAt: { gte: today } } }),
      // 总兑换码数
      prisma.redemptionCode.count(),
      // 未使用兑换码
      prisma.redemptionCode.count({ where: { status: 'UNUSED' } }),
      // 已使用兑换码
      prisma.redemptionCode.count({ where: { status: 'USED' } }),
      // 今日使用兑换码
      prisma.redemptionCode.count({ where: { status: 'USED', activatedAt: { gte: today } } }),
      // 测评付费用户（code不是FREE_TEST的）
      prisma.assessment.count({ where: { NOT: { code: 'FREE_TEST' } } }),
      prisma.assessment.count({ where: { NOT: { code: 'FREE_TEST' }, createdAt: { gte: today } } }),
      // AI报告付费用户（有ai_analysis的）
      prisma.assessment.count({ where: { aiAnalysis: { not: null } } }),
      prisma.assessment.count({ where: { aiAnalysis: { not: null }, createdAt: { gte: today } } }),
    ]);

    // 访问量用测评数估算
    const totalVisits = totalAssessments;
    const todayVisits = todayAssessments;

    return res.status(200).json({
      success: true,
      data: {
        // 测评相关
        totalAssessments,
        todayAssessments,
        completedAssessments,
        todayCompleted,
        // 兑换码相关
        totalCodes,
        unusedCodes,
        usedCodes,
        todayUsedCodes,
        // 访问量
        totalVisits,
        todayVisits,
        // 完成前13题（用总测评数代替）
        totalPartialComplete: totalAssessments,
        todayPartialComplete: todayAssessments,
        // 付费统计
        totalTestPaid,
        todayTestPaid,
        totalAIPaid,
        todayAIPaid,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
}
