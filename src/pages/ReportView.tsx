
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import Report from '../components/Report';
import { ReportData, Scores } from '../types';

const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [autoDownload, setAutoDownload] = useState(false);
  const downloadTriggered = useRef(false);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) {
        setError('报告ID无效');
        setLoading(false);
        return;
      }

      try {
        const result = await api.getAssessment(id);
        if (result && result.scores) {
          setReportData({
            scores: result.scores as Scores,
            aiStatus: result.aiStatus || 'pending',
            aiAnalysis: result.aiAnalysis,
            aiGeneratedAt: result.completedAt,
          } as ReportData);

          // 检查是否需要自动下载
          if (searchParams.get('download') === 'true') {
            setAutoDownload(true);
          }
        } else {
          setError('报告不存在或已过期');
        }
      } catch (err) {
        console.error('Load report error:', err);
        setError('加载报告失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id, searchParams]);

  // 自动下载逻辑
  useEffect(() => {
    if (autoDownload && reportData && !downloadTriggered.current) {
      downloadTriggered.current = true;
      // 等待页面渲染完成后触发下载
      setTimeout(() => {
        const downloadBtn = document.querySelector('[data-download-pdf]') as HTMLButtonElement;
        if (downloadBtn) {
          downloadBtn.click();
        }
      }, 2000);
    }
  }, [autoDownload, reportData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">正在加载报告...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">{error || '报告不存在'}</h2>
          <p className="text-slate-500 mb-8">该报告可能已过期或链接无效</p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg"
          >
            去测测我的躺平指数
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black text-slate-900 leading-none">躺平指数测评</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">测测你在躺平光谱上的位置</p>
            </div>
          </Link>
          <Link
            to="/"
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg"
          >
            我也要测
          </Link>
        </div>
      </header>

      {/* Report Content */}
      <main className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Report
            data={reportData}
            assessmentId={id}
            onMeToo={() => window.location.href = '/'}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-orange-100 text-center text-slate-400 text-sm bg-gradient-to-b from-white to-orange-50/30">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-bold text-slate-900 mb-2">躺平指数测评 v1.0</p>
          <p className="text-xs text-slate-400">基于社会心理学模型与 AI 系统开发</p>
          <p className="text-[10px] tracking-widest font-bold text-orange-400 mt-4">躺平光谱研究所 &copy; 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default ReportView;
