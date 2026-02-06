import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AssessmentResponse, ReportData, Scores } from './types';
import { api } from './services/api';
import * as scoring from './services/scoring';
import Landing from './components/Landing';
import CodeActivation from './components/CodeActivation';
import Questionnaire from './components/Questionnaire';
import Report from './components/Report';
import ProgressModal from './components/ProgressModal';
import PaymentModal from './components/PaymentModal';
import { ToastContainer, useToast } from './components/Toast';
import { formatUserDataForAI } from './services/aiAnalysis';

// Admin pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCodes from './pages/admin/Codes';
import AdminAssessments from './pages/admin/Assessments';
import ReportView from './pages/ReportView';

type AppState = 'LANDING' | 'ACTIVE' | 'REPORT';

const MainApp: React.FC = () => {
  // 检查URL参数
  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      payFlag: urlParams.get('pay'),
      wxCode: urlParams.get('code'),
      payType: urlParams.get('type') as 'test' | 'ai' | null,
    };
  };

  const [appState, setAppState] = useState<AppState>(() => {
    const { payFlag, wxCode, payType } = getUrlParams();
    // 只有测评付费回调才进入测评状态，AI付费回调应该进入报告状态
    if (payFlag && wxCode && payType === 'test') {
      return 'ACTIVE';
    }
    if (payFlag && wxCode && payType === 'ai') {
      return 'REPORT';
    }
    return 'LANDING';
  });

  const [hasPaidForTest, setHasPaidForTestInternal] = useState<boolean>(() => {
    const paid = localStorage.getItem('tangping_paid_test') === 'true';
    console.log('[App] hasPaidForTest initialized from localStorage:', paid);
    return paid;
  });

  // 包装 setter 以便追踪谁在修改这个值
  const setHasPaidForTest = (value: boolean) => {
    console.log('[App] setHasPaidForTest called with:', value, new Error().stack);
    setHasPaidForTestInternal(value);
  };
  const [hasPaidForAI, setHasPaidForAI] = useState<boolean>(() => {
    return localStorage.getItem('tangping_paid_ai') === 'true';
  });
  const [assessmentId, setAssessmentId] = useState<string | null>(() => {
    // AI付费回调时恢复 assessmentId
    const { payFlag, wxCode, payType } = getUrlParams();
    if (payFlag && wxCode && payType === 'ai') {
      return localStorage.getItem('tangping_last_assessment_id');
    }
    return null;
  });
  const [userId] = useState<string>(() => {
    const id = localStorage.getItem('growth_barrier_uid');
    if (id) return id;
    const newId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('growth_barrier_uid', newId);
    return newId;
  });

  const [responses, setResponses] = useState<AssessmentResponse>(() => {
    const { payFlag, wxCode } = getUrlParams();
    if (payFlag && wxCode) {
      const savedProgress = localStorage.getItem(`progress_${localStorage.getItem('growth_barrier_uid') || ''}`);
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          if (parsed.responses) {
            return parsed.responses;
          }
        } catch (e) {
          console.error('Failed to parse saved progress:', e);
        }
      }
    }
    return {};
  });

  const [report, setReport] = useState<ReportData | null>(() => {
    // AI付费回调时恢复报告数据
    const { payFlag, wxCode, payType } = getUrlParams();
    if (payFlag && wxCode && payType === 'ai') {
      const savedReport = localStorage.getItem('tangping_last_report');
      if (savedReport) {
        try {
          return JSON.parse(savedReport);
        } catch (e) {
          console.error('Failed to parse saved report:', e);
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [pendingProgress, setPendingProgress] = useState<{responses: AssessmentResponse} | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'test' | 'ai'>('test');
  const [paymentHandled, setPaymentHandled] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  // 处理微信支付回调
  useEffect(() => {
    if (paymentHandled) return;

    const { payFlag, wxCode, payType } = getUrlParams();

    if (payFlag && wxCode) {
      setPaymentHandled(true);
      setPaymentType(payType || 'test');
      setShowPaymentModal(true);
    }
  }, [paymentHandled]);

  useEffect(() => {
    const checkProgress = async () => {
      const { payFlag, wxCode } = getUrlParams();
      if (payFlag || wxCode) {
        return;
      }

      if (appState !== 'LANDING') {
        return;
      }

      const saved = await api.getProgress(userId);
      if (saved && Object.keys(saved.responses).length > 3) {
        setPendingProgress(saved);
        setShowRecovery(true);
      }
    };
    checkProgress();

    // 记录页面访问
    api.trackVisit(userId, 'home');
  }, [userId]);

  const handleResume = () => {
    if (pendingProgress) {
      setResponses(pendingProgress.responses);
      setAppState('ACTIVE');
    }
    setShowRecovery(false);
  };

  const handleStartFresh = () => {
    api.saveProgress(userId, 0, {});
    setShowRecovery(false);
  };

  // 测评付费成功（1.9元）
  const handleTestPaymentSuccess = () => {
    setHasPaidForTest(true);
    localStorage.setItem('tangping_paid_test', 'true');
    toast.success('支付成功，继续测评！');
  };

  // 测评兑换码验证成功
  const handleTestCodeSuccess = async (code: string) => {
    const result = await api.validateCode(code, userId);
    if (result.success) {
      setHasPaidForTest(true);
      localStorage.setItem('tangping_paid_test', 'true');
      toast.success('兑换码激活成功！');
      return true;
    } else {
      toast.error(result.message || '兑换码无效');
      return false;
    }
  };

  // AI报告付费成功（1元）
  const handleAIPaymentSuccess = () => {
    setHasPaidForAI(true);
    localStorage.setItem('tangping_paid_ai', 'true');
    toast.success('解锁成功！');
    // 触发AI分析
    if (assessmentId && report) {
      triggerAIAnalysis(assessmentId, report.scores, responses);
    }
  };

  const triggerAIAnalysis = async (id: string, scores: Scores, currentResponses: AssessmentResponse) => {
    try {
      setReport(prev => prev ? { ...prev, aiStatus: 'generating' } : null);

      const userData = formatUserDataForAI(currentResponses, scores);
      const result = await api.triggerAIAnalysis(id, userData);

      if (result.success) {
        setReport(prev => prev ? {
          ...prev,
          aiStatus: 'completed',
          aiAnalysis: result.aiAnalysis,
          aiGeneratedAt: result.aiGeneratedAt,
          aiWordCount: result.aiWordCount
        } : null);
      } else {
        throw new Error(result.error || 'AI分析失败');
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      setReport(prev => prev ? { ...prev, aiStatus: 'failed' } : null);
      toast.error('AI分析失败，请稍后重试');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const finalScores = scoring.calculateScores(responses);
      const submitResult = await api.submitAssessment(userId, 'FREE_TEST', responses, finalScores);
      if (submitResult.success && submitResult.id) {
        setAssessmentId(submitResult.id);
        // 保存 assessmentId 到 localStorage，以便 AI 付费回调时恢复
        localStorage.setItem('tangping_last_assessment_id', submitResult.id);

        const basicReport = {
          scores: finalScores,
          aiStatus: hasPaidForAI ? 'pending' as const : 'locked' as const
        };
        setReport(basicReport);
        // 保存报告数据到 localStorage，以便 AI 付费回调时恢复
        localStorage.setItem('tangping_last_report', JSON.stringify(basicReport));

        setAppState('REPORT');

        // 如果已付费AI，自动触发AI分析
        if (hasPaidForAI) {
          triggerAIAnalysis(submitResult.id, finalScores, responses);
        }
      } else {
        toast.error(submitResult.message || '提交失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('报告生成失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  const resetToHome = () => {
    setAppState('LANDING');
    setReport(null);
    setResponses({});
    setAssessmentId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-100">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 px-6 py-4 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button onClick={resetToHome} className="flex items-center gap-3 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black text-slate-900 leading-none">躺平指数测评</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">测测你在躺平光谱上的位置</p>
            </div>
          </button>
          {appState === 'ACTIVE' && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">测评进度</span>
              <div className="w-24 md:w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500" style={{ width: `${Math.round((Object.keys(responses).length / 41) * 100)}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow w-full py-8">
        <div className="max-w-5xl mx-auto px-4">
          {appState === 'LANDING' && <Landing onStart={() => {
            console.log('[App] Starting assessment, hasPaidForTest:', hasPaidForTest);
            setAppState('ACTIVE');
          }} />}
          {appState === 'ACTIVE' && (
            <Questionnaire
              responses={responses}
              setResponses={(updater) => {
                setResponses(prev => {
                  const next = typeof updater === 'function' ? updater(prev) : updater;
                  api.saveProgress(userId, 0, next);
                  // 当用户第一次选择题目时，记录参与
                  if (Object.keys(prev).length === 0 && Object.keys(next).length > 0) {
                    api.trackParticipation(userId);
                  }
                  return next;
                });
              }}
              onSubmit={handleSubmit}
              loading={loading}
              hasPaidForTest={hasPaidForTest}
              onPaymentSuccess={handleTestPaymentSuccess}
              onCodeSuccess={handleTestCodeSuccess}
              visitorId={userId}
            />
          )}
          {appState === 'REPORT' && report && (
            <Report
              data={report}
              assessmentId={assessmentId || undefined}
              hasPaidForAI={hasPaidForAI}
              onAIPaymentSuccess={handleAIPaymentSuccess}
              onRefreshAI={() => assessmentId && hasPaidForAI && triggerAIAnalysis(assessmentId, report.scores, responses)}
              onMeToo={resetToHome}
              visitorId={userId}
            />
          )}
        </div>
      </main>

      <footer className="py-12 border-t border-orange-100 text-center text-slate-400 text-sm bg-gradient-to-b from-white to-orange-50/30 print:hidden">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-left">
            <p className="font-bold text-slate-900">躺平指数测评 v1.0</p>
            <p className="text-xs mt-1 text-slate-400">基于社会心理学模型与 AI 系统开发</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-xs text-slate-400 hover:text-orange-600 transition-colors">隐私政策</a>
            <a href="/terms" className="text-xs text-slate-400 hover:text-orange-600 transition-colors">用户协议</a>
          </div>
          <p className="text-[10px] tracking-widest font-bold text-orange-400">躺平光谱研究所 &copy; 2025</p>
        </div>
      </footer>

      {showRecovery && <ProgressModal onConfirm={handleResume} onCancel={handleStartFresh} />}

      {/* 微信支付回调后的支付弹窗 */}
      {showPaymentModal && (
        <PaymentModal
          type={paymentType}
          price={paymentType === 'test' ? 1.9 : 1}
          visitorId={userId}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            if (paymentType === 'test') {
              handleTestPaymentSuccess();
            } else {
              handleAIPaymentSuccess();
            }
            // 清除URL参数
            window.history.replaceState({}, '', window.location.pathname);
          }}
          onCodeSuccess={paymentType === 'test' ? handleTestCodeSuccess : undefined}
          onClose={() => {
            setShowPaymentModal(false);
            // 清除URL参数
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
      )}
    </div>
  );
};

// Privacy Policy Page
const PrivacyPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 py-16 px-4">
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-12 shadow-xl">
      <h1 className="text-3xl font-black text-slate-900 mb-8">隐私政策</h1>
      <div className="prose prose-slate max-w-none">
        <h2 className="text-xl font-bold mt-6 mb-4">1. 信息收集</h2>
        <p className="text-slate-600 mb-4">我们收集您在使用本服务时提供的信息，包括测评答案、兑换码使用记录等。这些信息用于生成个性化的躺平指数分析报告。</p>

        <h2 className="text-xl font-bold mt-6 mb-4">2. 信息使用</h2>
        <p className="text-slate-600 mb-4">您的信息仅用于：生成测评报告、改进服务质量、提供客户支持。我们不会将您的个人信息出售给第三方。</p>

        <h2 className="text-xl font-bold mt-6 mb-4">3. 数据安全</h2>
        <p className="text-slate-600 mb-4">我们采用行业标准的安全措施保护您的数据，包括加密传输、安全存储等。</p>

        <h2 className="text-xl font-bold mt-6 mb-4">4. 免责声明</h2>
        <p className="text-slate-600 mb-4">本测评工具仅供娱乐参考，不构成专业心理咨询或医疗建议。如有心理健康问题，请咨询专业人士。</p>
      </div>
      <div className="mt-8">
        <a href="/" className="text-orange-600 font-bold hover:underline">返回首页</a>
      </div>
    </div>
  </div>
);

// Terms of Service Page
const TermsPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 py-16 px-4">
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-12 shadow-xl">
      <h1 className="text-3xl font-black text-slate-900 mb-8">用户协议</h1>
      <div className="prose prose-slate max-w-none">
        <h2 className="text-xl font-bold mt-6 mb-4">1. 服务说明</h2>
        <p className="text-slate-600 mb-4">躺平指数测评是一款基于社会心理学理论的自我探索工具，旨在帮助用户了解自身在"躺平光谱"上的位置。</p>

        <h2 className="text-xl font-bold mt-6 mb-4">2. 使用条款</h2>
        <p className="text-slate-600 mb-4">使用本服务即表示您同意遵守本协议。您需要通过有效的兑换码激活服务。每个兑换码仅限使用一次。</p>

        <h2 className="text-xl font-bold mt-6 mb-4">3. 知识产权</h2>
        <p className="text-slate-600 mb-4">本服务的所有内容、设计、算法均受知识产权保护。未经授权，不得复制、修改或分发。</p>

        <h2 className="text-xl font-bold mt-6 mb-4">4. 免责声明</h2>
        <p className="text-slate-600 mb-4">本测评结果仅供娱乐参考，不能替代专业心理咨询或医疗诊断。对于因使用本服务产生的任何直接或间接损失，我们不承担责任。</p>

        <h2 className="text-xl font-bold mt-6 mb-4">5. 联系方式</h2>
        <p className="text-slate-600 mb-4">如有任何问题，请通过官方渠道联系我们。</p>
      </div>
      <div className="mt-8">
        <a href="/" className="text-orange-600 font-bold hover:underline">返回首页</a>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/report/:id" element={<ReportView />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/codes" element={<AdminCodes />} />
        <Route path="/admin/assessments" element={<AdminAssessments />} />
        <Route path="/admin" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
