
import React, { useState, useEffect } from 'react';
import { AssessmentResponse, Question } from '../types';
import { QUESTIONS } from '../constants';
import PaymentModal from './PaymentModal';

interface Props {
  responses: AssessmentResponse;
  setResponses: React.Dispatch<React.SetStateAction<AssessmentResponse>>;
  onSubmit: () => void;
  loading: boolean;
  hasPaidForTest: boolean;
  onPaymentSuccess: () => void;
  onCodeSuccess: (code: string) => Promise<boolean>;
  visitorId: string;
}

const FREE_QUESTIONS_COUNT = 10; // 正式测评题目前10题免费（不含前3题基础信息）
const BASE_INFO_COUNT = 3; // 前3题是基础信息

const Questionnaire: React.FC<Props> = ({
  responses,
  setResponses,
  onSubmit,
  loading,
  hasPaidForTest,
  onPaymentSuccess,
  onCodeSuccess,
  visitorId
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  const currentQuestion = QUESTIONS[currentIndex];

  const handleResponse = (qId: number, val: any) => {
    setResponses(prev => ({ ...prev, [qId]: val }));
    if (currentQuestion.type === 'CHOICE') {
      setTimeout(() => handleNext(), 350);
    }
  };

  const handleNext = () => {
    // 检查是否需要付费（基础信息3题 + 正式测评10题 = 第13题，index=12 答完后触发）
    // 即 currentIndex === BASE_INFO_COUNT + FREE_QUESTIONS_COUNT - 1 = 12
    const paymentTriggerIndex = BASE_INFO_COUNT + FREE_QUESTIONS_COUNT - 1;
    if (currentIndex === paymentTriggerIndex && !hasPaidForTest) {
      setShowPaymentModal(true);
      return;
    }

    if (currentIndex < QUESTIONS.length - 1) {
      setDirection('next');
      setCurrentIndex(prev => prev + 1);
    } else {
      onSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection('prev');
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    onPaymentSuccess();
    // 继续到下一题
    setDirection('next');
    setCurrentIndex(prev => prev + 1);
  };

  const handleCodeComplete = async (code: string) => {
    const success = await onCodeSuccess(code);
    if (success) {
      setShowPaymentModal(false);
      // 继续到下一题
      setDirection('next');
      setCurrentIndex(prev => prev + 1);
    }
  };

  const isCurrentComplete = () => {
    const val = responses[currentQuestion.id];
    if (currentQuestion.type === 'OPEN') {
      return val && val.length > 0;
    }
    return val !== undefined && val !== '';
  };

  const getModuleInfo = () => {
    const q = currentQuestion;
    if (q.isBaseInfo) return { name: '基础信息', color: 'text-slate-500' };
    if (q.module === '打工人现状') return { name: '打工人现状', color: 'text-blue-600' };
    if (q.module === '社交电量') return { name: '社交电量', color: 'text-pink-600' };
    if (q.module === '生活状态') return { name: '生活状态', color: 'text-emerald-600' };
    if (q.module === '精神状态') return { name: '精神状态', color: 'text-purple-600' };
    if (q.module === '价值观念') return { name: '价值观念', color: 'text-amber-600' };
    if (q.module === '开放题') return { name: '灵魂拷问', color: 'text-orange-600' };
    return { name: '测评', color: 'text-slate-500' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-pulse">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-8 border-orange-100 rounded-full"></div>
          <div className="absolute inset-0 border-8 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h3 className="mt-10 text-2xl font-black text-slate-800 tracking-tight">AI 正在分析你的躺平指数...</h3>
        <p className="text-slate-500 mt-4 text-center max-w-xs leading-relaxed">
          正在计算五大维度得分，判断你是卷王还是躺平祖师爷
        </p>
      </div>
    );
  }

  const moduleInfo = getModuleInfo();

  const feedbacks: Record<number, string> = {
    4: "早上的状态往往决定了一天的基调",
    12: "35岁危机是真实存在的，但应对方式因人而异",
    16: "恋爱消耗的能量，有时候比工作还多",
    23: "周末的状态，最能反映你的真实能量水平",
    28: "口头禅是潜意识的出口",
    32: "焦虑不可怕，可怕的是焦虑到麻木"
  };

  const openQuestionPlaceholders: Record<number, string> = {
    39: "比如：睡到自然醒，去海边发呆，和喜欢的人吃顿好的...",
    40: "比如：i人e人都别约我了，我是废人 / 班上的不是我，是那身皮...",
    41: "比如：坚持=不想让父母失望 / 放弃=真的好累了..."
  };

  return (
    <div className="max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center py-4 px-2">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1">
            第 {currentIndex + 1} / {QUESTIONS.length} 题
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
            <span className={`text-xs font-bold ${moduleInfo.color}`}>
              {moduleInfo.name}
            </span>
            {currentIndex >= BASE_INFO_COUNT && currentIndex < BASE_INFO_COUNT + FREE_QUESTIONS_COUNT && !hasPaidForTest && (
              <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">免费体验</span>
            )}
          </div>
        </div>
        <div className="text-right">
           <span className="text-2xl font-black text-slate-200 tabular-nums italic">
             {Math.round(((currentIndex + 1) / QUESTIONS.length) * 100)}%
           </span>
        </div>
      </div>

      <div
        key={currentQuestion.id}
        className={`bg-white p-6 md:p-10 rounded-[2rem] shadow-xl shadow-orange-100 border border-slate-50 relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-${direction === 'next' ? 'right' : 'left'}-8`}
      >
        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500/10"></div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-6">
          {currentQuestion.text}
        </h2>

        <div className="space-y-3">
          {currentQuestion.type === 'CHOICE' && (
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options?.map((opt, idx) => {
                const isSelected = responses[currentQuestion.id] === idx;
                return (
                  <button key={idx} onClick={() => handleResponse(currentQuestion.id, idx)}
                    className={`text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                      isSelected ? 'border-orange-500 bg-orange-500 text-white shadow-lg' : 'border-slate-50 bg-slate-50/50 text-slate-600 hover:border-orange-100'
                    }`}>
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 text-sm ${isSelected ? 'border-white/30 bg-white/20' : 'border-slate-200'}`}>
                      {isSelected ? '✓' : String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-bold text-base leading-snug">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'OPEN' && (
            <div className="space-y-4">
              <textarea autoFocus className="w-full h-32 px-5 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-orange-400 transition-all outline-none resize-none text-slate-800 text-base font-medium"
                placeholder={openQuestionPlaceholders[currentQuestion.id] || "请坦诚地写下你的想法..."}
                value={responses[currentQuestion.id] || ''}
                maxLength={500}
                onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-300 uppercase">随便写点什么</span>
                <span className={`text-xs font-black ${
                  (responses[currentQuestion.id]?.length || 0) > 450 ? 'text-amber-500' : 'text-slate-300'
                }`}>
                  {responses[currentQuestion.id]?.length || 0} / 500 字
                </span>
              </div>
            </div>
          )}
        </div>

        {feedbacks[currentQuestion.id] && responses[currentQuestion.id] !== undefined && (
          <div className="mt-6 p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex gap-3 animate-in fade-in zoom-in">
            <span className="text-xl">💡</span>
            <p className="text-sm text-orange-800 font-bold italic leading-relaxed">{feedbacks[currentQuestion.id]}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="w-full flex justify-between items-center px-2">
          <button onClick={handlePrev} disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-black text-slate-300 hover:text-orange-600 transition-all disabled:opacity-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>

          {(currentQuestion.type !== 'CHOICE' || currentIndex === QUESTIONS.length - 1) && (
            <button onClick={handleNext} disabled={!isCurrentComplete()}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white transition-all shadow-xl disabled:opacity-50 ${
                currentIndex === QUESTIONS.length - 1 ? 'bg-emerald-600 shadow-emerald-200' : 'bg-orange-500 shadow-orange-200'
              }`}
            >
              <span className="text-base">{currentIndex === QUESTIONS.length - 1 ? '生成报告' : '下一题'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* 付费解锁弹窗 */}
      {showPaymentModal && (
        <PaymentModal
          type="test"
          price={1.9}
          visitorId={visitorId}
          onPaymentSuccess={handlePaymentComplete}
          onCodeSuccess={handleCodeComplete}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default Questionnaire;
