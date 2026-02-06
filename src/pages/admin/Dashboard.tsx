import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface Stats {
  // 测评相关
  totalAssessments: number;
  todayAssessments: number;
  completedAssessments: number;
  todayCompleted: number;
  // 兑换码相关
  totalCodes: number;
  unusedCodes: number;
  usedCodes: number;
  todayUsedCodes: number;
  // 真正的访问量
  totalVisits: number;
  todayVisits: number;
  // 参与测评数（选择过至少1题）
  totalParticipations: number;
  todayParticipations: number;
  // 付费统计
  totalTestPaid: number;
  todayTestPaid: number;
  totalAIPaid: number;
  todayAIPaid: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      // 获取统计数据
      const statsRes = await fetch('/api/stats', {
        headers: adminApi.getAuthHeaders(),
      });
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      // 获取最近测评
      const assessmentsRes = await adminApi.listAssessments({ limit: 5 });
      if (assessmentsRes.success) {
        const assessments = Array.isArray(assessmentsRes.data)
          ? assessmentsRes.data
          : (assessmentsRes.data?.assessments || []);
        setRecentAssessments(assessments);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">管理后台</h1>
              <p className="text-xs text-slate-400">躺平指数测评</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-2">
              <Link to="/admin/dashboard" className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-bold text-sm">
                仪表盘
              </Link>
              <Link to="/admin/codes" className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm">
                兑换码
              </Link>
              <Link to="/admin/assessments" className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm">
                测评数据
              </Link>
            </nav>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-black text-slate-900 mb-8">数据概览</h2>

        {/* 访问量统计 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-700 mb-4">📊 访问量</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">今日访问</div>
              <div className="text-3xl font-black text-blue-600">{stats?.todayVisits || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">累计访问</div>
              <div className="text-3xl font-black text-slate-900">{stats?.totalVisits || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">今日参与测评</div>
              <div className="text-3xl font-black text-purple-600">{stats?.todayParticipations || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">累计参与测评</div>
              <div className="text-3xl font-black text-slate-900">{stats?.totalParticipations || 0}</div>
            </div>
          </div>
        </div>

        {/* 付费统计 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-700 mb-4">💰 付费统计（含兑换码）</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">今日测评付费</div>
              <div className="text-3xl font-black text-emerald-600">{stats?.todayTestPaid || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">累计测评付费</div>
              <div className="text-3xl font-black text-slate-900">{stats?.totalTestPaid || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">今日AI报告付费</div>
              <div className="text-3xl font-black text-orange-600">{stats?.todayAIPaid || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">累计AI报告付费</div>
              <div className="text-3xl font-black text-slate-900">{stats?.totalAIPaid || 0}</div>
            </div>
          </div>
        </div>

        {/* 兑换码统计 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-700 mb-4">🎫 兑换码</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">可用兑换码</div>
              <div className="text-3xl font-black text-green-600">{stats?.unusedCodes || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">已使用</div>
              <div className="text-3xl font-black text-amber-600">{stats?.usedCodes || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">今日使用</div>
              <div className="text-3xl font-black text-blue-600">{stats?.todayUsedCodes || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">总兑换码</div>
              <div className="text-3xl font-black text-slate-900">{stats?.totalCodes || 0}</div>
            </div>
          </div>
        </div>

        {/* 测评统计 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-700 mb-4">📝 测评数据</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">今日测评</div>
              <div className="text-3xl font-black text-blue-600">{stats?.todayAssessments || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">累计测评</div>
              <div className="text-3xl font-black text-slate-900">{stats?.totalAssessments || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">今日AI完成</div>
              <div className="text-3xl font-black text-emerald-600">{stats?.todayCompleted || 0}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-1">累计AI完成</div>
              <div className="text-3xl font-black text-slate-900">{stats?.completedAssessments || 0}</div>
            </div>
          </div>
        </div>

        {/* Recent Assessments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">最近测评</h3>
            <Link to="/admin/assessments" className="text-sm text-orange-600 font-bold hover:underline">
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentAssessments.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400">
                暂无测评数据
              </div>
            ) : (
              recentAssessments.map((assessment) => (
                <div key={assessment.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-900">{assessment.code || 'FREE_TEST'}</div>
                    <div className="text-sm text-slate-400">
                      {new Date(assessment.createdAt || assessment.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      assessment.aiStatus === 'completed' || assessment.ai_status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : assessment.aiStatus === 'generating' || assessment.ai_status === 'generating'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-50 text-slate-600'
                    }`}>
                      {(assessment.aiStatus || assessment.ai_status) === 'completed' ? '已完成' :
                       (assessment.aiStatus || assessment.ai_status) === 'generating' ? '生成中' : '待处理'}
                    </span>
                    <span className="text-lg font-black text-orange-600">
                      {assessment.scores?.totalScore || (assessment.scores as any)?.total_score || '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
