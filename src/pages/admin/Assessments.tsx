import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface Assessment {
  id: string;
  visitorId: string;
  code: string;
  scores: any;
  aiStatus: string;
  createdAt: string;
  completedAt?: string;
}

const AdminAssessments: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadAssessments();
  }, [navigate, statusFilter, pagination.page]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const result = await adminApi.listAssessments({
        status: statusFilter || undefined,
        page: pagination.page,
        limit: 20,
      });

      if (result.success) {
        // Handle both { data: [...] } and { data: { assessments: [...] } } formats
        const assessmentsData = Array.isArray(result.data)
          ? result.data
          : (result.data?.assessments || []);
        setAssessments(assessmentsData);
        setPagination(prev => ({
          ...prev,
          total: result.data?.total || result.pagination?.total || assessmentsData.length,
          totalPages: result.data?.totalPages || result.pagination?.totalPages || 1,
        }));
      }
    } catch (error) {
      console.error('Load assessments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'xlsx') => {
    setExporting(true);
    try {
      const result = await adminApi.exportAssessments({
        format,
        ids: selectedIds.length > 0 ? selectedIds : undefined,
      });

      if (!result.success) {
        alert(result.error || '导出失败');
      }
    } catch (error) {
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === assessments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assessments.map(a => a.id));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-50 text-emerald-600',
      generating: 'bg-amber-50 text-amber-600',
      pending: 'bg-slate-100 text-slate-600',
      failed: 'bg-red-50 text-red-600',
    };
    const labels: Record<string, string> = {
      completed: '已完成',
      generating: '生成中',
      pending: '待处理',
      failed: '失败',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-slate-50 text-slate-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getLevelColor = (level: any) => {
    // 处理 level 可能是对象或字符串的情况
    const levelStr = typeof level === 'object' ? (level?.level || level?.name || '') : String(level || '');
    if (levelStr.includes('Lv.1') || levelStr.includes('卷王')) return 'text-emerald-600';
    if (levelStr.includes('Lv.2') || levelStr.includes('奋斗')) return 'text-lime-600';
    if (levelStr.includes('Lv.3') || levelStr.includes('佛系')) return 'text-amber-600';
    if (levelStr.includes('Lv.4') || levelStr.includes('躺平')) return 'text-orange-600';
    if (levelStr.includes('Lv.5') || levelStr.includes('摆烂')) return 'text-red-600';
    return 'text-slate-600';
  };

  // 查看报告 - 在新标签页打开
  const handleViewReport = (assessmentId: string) => {
    window.open(`/report/${assessmentId}`, '_blank');
  };

  // 下载报告 - 使用与用户端相同的格式
  const handleDownloadReport = async (assessmentId: string) => {
    setDownloadingId(assessmentId);
    try {
      // 在隐藏的 iframe 中加载报告页面并触发下载
      const reportUrl = `/report/${assessmentId}?download=true`;
      window.open(reportUrl, '_blank');
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

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
              <Link to="/admin/dashboard" className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm">
                仪表盘
              </Link>
              <Link to="/admin/codes" className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-bold text-sm">
                兑换码
              </Link>
              <Link to="/admin/assessments" className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-bold text-sm">
                测评数据
              </Link>
            </nav>
            <button onClick={handleLogout} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm">
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900">测评数据</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('xlsx')}
              disabled={exporting}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {exporting ? '导出中...' : '导出 Excel'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['', 'completed', 'generating', 'pending', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {status === '' ? '全部' :
               status === 'completed' ? '已完成' :
               status === 'generating' ? '生成中' :
               status === 'pending' ? '待处理' : '失败'}
            </button>
          ))}
        </div>

        {/* Selection Info */}
        {selectedIds.length > 0 && (
          <div className="mb-4 p-4 bg-orange-50 rounded-xl flex items-center justify-between">
            <span className="text-orange-600 font-bold">
              已选择 {selectedIds.length} 条记录
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-orange-600 hover:text-orange-700 font-bold text-sm"
            >
              清除选择
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : assessments.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              暂无测评数据
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === assessments.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">兑换码</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">躺平指数</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">等级</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">类型</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">AI状态</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">创建时间</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(assessment.id)}
                        onChange={() => toggleSelect(assessment.id)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{assessment.code}</td>
                    <td className="px-6 py-4">
                      <span className="text-2xl font-black text-orange-600">
                        {assessment.scores?.totalScore || assessment.scores?.overallIndex || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const level = assessment.scores?.level;
                        const levelStr = typeof level === 'object' ? (level?.level || level?.name || '-') : (level || '-');
                        return (
                          <span className={`font-bold text-sm ${getLevelColor(level)}`}>
                            {levelStr}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {assessment.scores?.yangWoQiZuo?.type === 'yangwoqizuo' ? '仰卧起坐型' : '普通型'}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(assessment.aiStatus)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(assessment.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleViewReport(assessment.id)}
                          className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          查看报告
                        </button>
                        <button
                          onClick={() => handleDownloadReport(assessment.id)}
                          disabled={downloadingId === assessment.id}
                          className="text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline disabled:opacity-50"
                        >
                          {downloadingId === assessment.id ? '下载中...' : '下载报告'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-slate-600 text-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminAssessments;
