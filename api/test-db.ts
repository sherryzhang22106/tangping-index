import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 30) + '...',
      NODE_ENV: process.env.NODE_ENV,
    },
    prisma: {
      status: 'not_tested',
    },
  };

  try {
    // 尝试导入 Prisma
    const { PrismaClient } = await import('@prisma/client');
    diagnostics.prisma.import = 'success';

    // 尝试创建实例
    const prisma = new PrismaClient();
    diagnostics.prisma.instance = 'success';

    // 尝试连接
    await prisma.$connect();
    diagnostics.prisma.connect = 'success';

    // 尝试简单查询
    const count = await prisma.assessment.count();
    diagnostics.prisma.query = 'success';
    diagnostics.prisma.assessmentCount = count;

    await prisma.$disconnect();
    diagnostics.prisma.status = 'working';

  } catch (error: any) {
    diagnostics.prisma.status = 'error';
    diagnostics.prisma.error = error.message;
    diagnostics.prisma.errorName = error.name;
    diagnostics.prisma.errorStack = error.stack?.split('\n').slice(0, 5);
  }

  return res.status(200).json(diagnostics);
}
