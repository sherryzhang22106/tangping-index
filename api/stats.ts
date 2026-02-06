import type { VercelRequest, VercelResponse } from '@vercel/node';

// 动态导入数据库模块
let dbModule: any = null;

async function getDb() {
  if (!dbModule) {
    try {
      dbModule = await import('./lib/db');
    } catch (e) {
      console.error('Failed to load database module:', e);
      return null;
    }
  }
  return dbModule;
}

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
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: '数据库服务不可用' });
    }

    // 初始化数据库
    try {
      await db.initDatabase();
    } catch (initErr) {
      console.error('Database init error:', initErr);
    }

    // 获取今天的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

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
      // 新增统计
      totalVisits,
      todayVisits,
      totalPartialComplete, // 完成前13题
      todayPartialComplete,
      totalTestPaid, // 测评付费
      todayTestPaid,
      totalAIPaid, // AI报告付费
      todayAIPaid,
    ] = await Promise.all([
      // 总测评数
      db.queryOne('SELECT COUNT(*) as count FROM assessments'),
      // 今日测评数
      db.queryOne('SELECT COUNT(*) as count FROM assessments WHERE created_at >= $1', [todayStr]),
      // 已完成AI分析
      db.queryOne("SELECT COUNT(*) as count FROM assessments WHERE ai_status = 'completed'"),
      // 今日完成AI分析
      db.queryOne("SELECT COUNT(*) as count FROM assessments WHERE ai_status = 'completed' AND created_at >= $1", [todayStr]),
      // 总兑换码数
      db.queryOne('SELECT COUNT(*) as count FROM codes'),
      // 未使用兑换码
      db.queryOne("SELECT COUNT(*) as count FROM codes WHERE status = 'active'"),
      // 已使用兑换码
      db.queryOne("SELECT COUNT(*) as count FROM codes WHERE status = 'used'"),
      // 今日使用兑换码
      db.queryOne("SELECT COUNT(*) as count FROM codes WHERE status = 'used' AND used_at >= $1", [todayStr]),
      // 总访问量（用测评数估算，实际需要单独的访问记录表）
      db.queryOne('SELECT COUNT(DISTINCT visitor_id) as count FROM assessments'),
      // 今日访问量
      db.queryOne('SELECT COUNT(DISTINCT visitor_id) as count FROM assessments WHERE created_at >= $1', [todayStr]),
      // 完成前13题的用户（有responses但未完成全部）- 用总测评数代替
      db.queryOne('SELECT COUNT(*) as count FROM assessments'),
      db.queryOne('SELECT COUNT(*) as count FROM assessments WHERE created_at >= $1', [todayStr]),
      // 测评付费用户（code不是FREE_TEST的）
      db.queryOne("SELECT COUNT(*) as count FROM assessments WHERE code != 'FREE_TEST'"),
      db.queryOne("SELECT COUNT(*) as count FROM assessments WHERE code != 'FREE_TEST' AND created_at >= $1", [todayStr]),
      // AI报告付费用户（有ai_analysis的）
      db.queryOne("SELECT COUNT(*) as count FROM assessments WHERE ai_analysis IS NOT NULL"),
      db.queryOne("SELECT COUNT(*) as count FROM assessments WHERE ai_analysis IS NOT NULL AND created_at >= $1", [todayStr]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        // 测评相关
        totalAssessments: parseInt(totalAssessments?.count || '0'),
        todayAssessments: parseInt(todayAssessments?.count || '0'),
        completedAssessments: parseInt(completedAssessments?.count || '0'),
        todayCompleted: parseInt(todayCompleted?.count || '0'),
        // 兑换码相关
        totalCodes: parseInt(totalCodes?.count || '0'),
        unusedCodes: parseInt(unusedCodes?.count || '0'),
        usedCodes: parseInt(usedCodes?.count || '0'),
        todayUsedCodes: parseInt(todayUsedCodes?.count || '0'),
        // 访问量
        totalVisits: parseInt(totalVisits?.count || '0'),
        todayVisits: parseInt(todayVisits?.count || '0'),
        // 完成前13题
        totalPartialComplete: parseInt(totalPartialComplete?.count || '0'),
        todayPartialComplete: parseInt(todayPartialComplete?.count || '0'),
        // 付费统计
        totalTestPaid: parseInt(totalTestPaid?.count || '0'),
        todayTestPaid: parseInt(todayTestPaid?.count || '0'),
        totalAIPaid: parseInt(totalAIPaid?.count || '0'),
        todayAIPaid: parseInt(todayAIPaid?.count || '0'),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
}
