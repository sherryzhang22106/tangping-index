
import React, { useEffect, useState, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ReportData } from '../types';
import { parse } from 'marked';
import DOMPurify from 'dompurify';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import PaymentModal from './PaymentModal';

interface Props {
  data: ReportData;
  assessmentId?: string;
  hasPaidForAI?: boolean;
  onAIPaymentSuccess?: () => void;
  onRefreshAI?: () => void;
  onMeToo?: () => void;
  visitorId?: string;
}

const Report: React.FC<Props> = ({ data, assessmentId, hasPaidForAI, onAIPaymentSuccess, onRefreshAI, onMeToo, visitorId }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [renderedMarkdown, setRenderedMarkdown] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIPaymentModal, setShowAIPaymentModal] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const shareModalRef = useRef<HTMLDivElement>(null);
  const shareImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.aiStatus === 'generating') {
      // 更快的进度增长，模拟真实的AI生成过程
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          // 快速增长到80%，然后慢下来
          if (prev < 60) return prev + 3;
          if (prev < 80) return prev + 1.5;
          if (prev < 95) return prev + 0.5;
          return prev;
        });
      }, 300);
      return () => clearInterval(interval);
    } else if (data.aiStatus === 'completed' && data.aiAnalysis) {
      setLoadingProgress(100);
      const rawHtml = parse(data.aiAnalysis);
      const sanitizedHtml = DOMPurify.sanitize(rawHtml as string, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'hr'],
        ALLOWED_ATTR: [],
      });
      setRenderedMarkdown(sanitizedHtml);
    }
  }, [data.aiStatus, data.aiAnalysis]);

  const radarData = [
    { subject: '打工人现状', A: data.scores.dimensions.work, fullMark: 100 },
    { subject: '社交电量', A: data.scores.dimensions.social, fullMark: 100 },
    { subject: '生活状态', A: data.scores.dimensions.life, fullMark: 100 },
    { subject: '精神状态', A: data.scores.dimensions.mental, fullMark: 100 },
    { subject: '价值观念', A: data.scores.dimensions.value, fullMark: 100 },
  ];

  const barData = [
    { name: '打工人现状', value: data.scores.dimensions.work },
    { name: '社交电量', value: data.scores.dimensions.social },
    { name: '生活状态', value: data.scores.dimensions.life },
    { name: '精神状态', value: data.scores.dimensions.mental },
    { name: '价值观念', value: data.scores.dimensions.value },
  ];

  const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b'];

  const Section = ({ title, icon, children, index }: { title: string, icon: React.ReactNode, children?: React.ReactNode, index: number }) => (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-6 transition-all print:shadow-none print:border-slate-200">
      <button
        onClick={() => setOpenSection(openSection === index ? null : index)}
        className="w-full px-8 py-6 flex items-center justify-between group print:hidden"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 duration-300">
            {icon}
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
        </div>
        <svg className={`w-6 h-6 text-slate-300 transition-transform duration-300 ${openSection === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {/* 打印时显示标题 */}
      <div className="hidden print:flex px-8 py-4 items-center gap-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-black text-slate-800">{title}</h3>
      </div>
      <div
        data-section-content
        className={`transition-all duration-500 ${openSection === index ? 'max-h-[15000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden print:max-h-none print:opacity-100`}
      >
        <div className="px-8 pb-8 pt-2">
          {children}
        </div>
      </div>
    </div>
  );

  const handleShare = async () => {
    // 点击分享按钮后自动生成图片
    setShowShareModal(true);
    setGeneratingImage(true);

    // 等待弹窗渲染
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!shareCardRef.current) {
      setGeneratingImage(false);
      return;
    }

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });

      const imageUrl = canvas.toDataURL('image/png');
      setShareImageUrl(imageUrl);

      // 滚动到弹窗顶部
      setTimeout(() => {
        if (shareModalRef.current) {
          shareModalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Generate image error:', error);
      alert('生成图片失败，请重试');
    } finally {
      setGeneratingImage(false);
    }
  };

  // 保存图片到相册
  const handleSaveToAlbum = () => {
    if (!shareImageUrl) return;

    // 创建下载链接
    const link = document.createElement('a');
    link.download = `躺平指数-${data.scores.level.name}.png`;
    link.href = shareImageUrl;
    link.click();

    // 微信内提示
    const isWechat = /micromessenger/i.test(navigator.userAgent);
    if (isWechat) {
      alert('图片已生成！请长按上方图片，选择"保存图片"');
    }
  };

  const handleCopyLink = () => {
    // 生成分享链接，使用 assessmentId
    const shareUrl = assessmentId
      ? `${window.location.origin}/report/${assessmentId}`
      : window.location.href;
    navigator.clipboard.writeText(shareUrl);
    alert('报告链接已复制！发送给朋友即可查看你的躺平报告');
  };

  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);

    const reportElement = document.getElementById('report-content');
    if (!reportElement) {
      alert('报告内容未加载完成，请稍后重试');
      setDownloading(false);
      return;
    }

    try {
      // 展开所有折叠的内容
      const allSections = document.querySelectorAll('[data-section-content]');
      const originalStyles: string[] = [];
      allSections.forEach((section, i) => {
        const el = section as HTMLElement;
        originalStyles[i] = el.style.cssText;
        el.style.maxHeight = 'none';
        el.style.opacity = '1';
      });

      // 隐藏不需要导出的按钮
      const buttons = reportElement.querySelectorAll('.print\\:hidden, button');
      const buttonStyles: string[] = [];
      buttons.forEach((btn, i) => {
        const el = btn as HTMLElement;
        buttonStyles[i] = el.style.display;
        el.style.display = 'none';
      });

      // 等待渲染
      await new Promise(resolve => setTimeout(resolve, 500));

      // 使用 html2pdf 生成并下载 PDF
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `躺平指数报告-${data.scores.level.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(reportElement).save();

      // 恢复按钮显示
      buttons.forEach((btn, i) => {
        (btn as HTMLElement).style.display = buttonStyles[i];
      });

      // 恢复折叠状态
      allSections.forEach((section, i) => {
        (section as HTMLElement).style.cssText = originalStyles[i];
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF 生成失败，请稍后重试');
    } finally {
      setDownloading(false);
    }
  };

  // 获取躺平程度描述 - 与说明文字保持一致
  const getTangpingLevel = (score: number) => {
    if (score <= 30) return { text: '还在卷', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score <= 50) return { text: '半卷半躺', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score <= 70) return { text: '开始躺了', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { text: '彻底躺平', color: 'text-orange-600', bg: 'bg-orange-50' };
  };

  return (
    <div id="report-content" className="max-w-4xl mx-auto pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* 顶部指标 - 统一橙色主题 */}
      <section className="bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <span className="inline-block px-4 py-1.5 bg-white/90 text-slate-700 rounded-full text-[11px] font-black uppercase tracking-widest mb-4 shadow-sm">
                躺平指数测评报告
              </span>
              <h2 className="text-4xl font-black tracking-tight mb-2 text-white drop-shadow-sm">
                {data.scores.level.emoji} {data.scores.level.name}
              </h2>
              <p className="text-white/90 text-sm font-medium">"{data.scores.level.description}"</p>
            </div>
            <div className="text-right bg-white/95 rounded-3xl px-8 py-6 shadow-lg">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">躺平指数</span>
              <p className="text-5xl font-black tabular-nums text-slate-800">{data.scores.totalScore}<span className="text-lg text-slate-300 ml-1">/245</span></p>
              <p className="text-xs text-slate-400 mt-1">分数越高越躺平</p>
            </div>
          </div>

          {/* 四个指标卡片 - 2x2布局 */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-lg">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider">🔥 最躺的方面</span>
              <p className="text-lg font-black mt-2 text-slate-800">{data.scores.analysis.highestDim.nameCn}</p>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-bold text-orange-600">{data.scores.analysis.highestDim.score.toFixed(0)}%</span> 躺平程度
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-lg">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">💪 还在卷的方面</span>
              <p className="text-lg font-black mt-2 text-slate-800">{data.scores.analysis.lowestDim.nameCn}</p>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-bold text-emerald-600">{data.scores.analysis.lowestDim.score.toFixed(0)}%</span> 躺平程度
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-lg">
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider">📊 维度落差</span>
              <p className="text-lg font-black mt-2 text-slate-800">{data.scores.analysis.gap.toFixed(0)}%</p>
              <p className="text-sm text-slate-500 mt-1">{data.scores.analysis.gap > 30 ? '内心很矛盾' : '状态较均衡'}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-lg">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">🏆 躺平等级</span>
              <p className="text-lg font-black mt-2 text-slate-800">{data.scores.level.level}</p>
              <p className="text-sm text-slate-500 mt-1">共6级，越高越躺</p>
            </div>
          </div>
        </div>
      </section>

      {/* 维度分析 */}
      <div className="space-y-4">
        <Section index={0} title="五维度躺平图谱" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}>
          {/* 说明文字 */}
          <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-sm text-amber-800">
              <span className="font-bold">📖 如何理解这些数字？</span><br/>
              每个维度的百分比代表你在该方面的"躺平程度"：<span className="font-bold text-emerald-600">0-30%</span> 还在卷、<span className="font-bold text-blue-600">30-50%</span> 半卷半躺、<span className="font-bold text-amber-600">50-70%</span> 开始躺了、<span className="font-bold text-orange-600">70%+</span> 彻底躺平
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="h-[320px] bg-slate-50/50 rounded-3xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} />
                  <Radar name="躺平程度" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.5} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[320px] bg-slate-50/50 rounded-3xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`${value.toFixed(1)}%`, '躺平程度']} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} isAnimationActive={false}>
                    {barData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 维度详情卡片 - 横排紧凑显示 */}
          <div className="mt-8 grid grid-cols-5 gap-2">
            {barData.map((dim, idx) => {
              const level = getTangpingLevel(dim.value);
              return (
                <div key={dim.name} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-[10px] font-bold text-slate-500">{dim.name}</span>
                  </div>
                  <p className="text-2xl font-black text-slate-800">{dim.value.toFixed(0)}<span className="text-xs text-slate-400">%</span></p>
                  <div className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${level.bg} ${level.color}`}>
                    {level.text}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* AI 深度分析区 */}
        <section className="bg-gradient-to-br from-white via-orange-50/20 to-slate-50 rounded-[3rem] p-10 md:p-16 border border-orange-100 shadow-2xl shadow-orange-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01705C7.91248 16 7.01705 16.8954 7.01705 18V21H4.01705V18C4.01705 15.2386 6.25562 13 9.01705 13H12.017C14.7785 13 17.017 15.2386 17.017 18V21H14.017ZM12.017 11C14.2262 11 16.0171 9.20914 16.0171 7C16.0171 4.79086 14.2262 3 12.0171 3C9.80791 3 8.01705 4.79086 8.01705 7C8.01705 9.20914 9.80791 11 12.017 11Z" /></svg>
          </div>

          <h3 className="text-3xl font-black mb-12 flex items-center gap-4 text-slate-900 tracking-tight">
            AI 知己：你的躺平深度分析
          </h3>

          {/* AI已解锁且完成 */}
          {hasPaidForAI && data.aiStatus === 'completed' ? (
            <article
              className="report-markdown"
              dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
            />
          ) : hasPaidForAI && data.aiStatus === 'generating' ? (
            /* AI已解锁，正在生成 */
            <div className="text-center py-32 space-y-12">
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 border-[16px] border-orange-100/50 rounded-full"></div>
                <div className="absolute inset-0 border-[16px] border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-orange-600 tabular-nums">{Math.floor(loadingProgress)}%</span>
                  <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest mt-2">Analyzing</span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">正在撰写约 3000 字的个性化分析...</h4>
                <p className="text-slate-400 font-medium max-w-md mx-auto">AI 知己正在分析你的五大维度数据，判断你的躺平类型，并给出针对性建议。</p>
              </div>
            </div>
          ) : hasPaidForAI && data.aiStatus === 'failed' ? (
            /* AI已解锁，生成失败 */
            <div className="text-center py-16 space-y-6">
              <div className="text-6xl">😢</div>
              <h4 className="text-xl font-black text-slate-800">AI分析生成失败</h4>
              <p className="text-slate-500">请点击下方按钮重试</p>
              <button
                onClick={onRefreshAI}
                className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all"
              >
                重新生成
              </button>
            </div>
          ) : (
            /* AI未解锁 - 显示付费解锁界面 */
            <div className="text-center py-12 space-y-8">
              <div className="text-6xl">🔒</div>
              <div className="space-y-3">
                <h4 className="text-2xl font-black text-slate-800">想了解你的躺平心理深度分析？</h4>
                <p className="text-slate-500 max-w-md mx-auto">解锁AI专属报告，获取3000字个性化分析和改善建议</p>
              </div>

              {/* 功能预览 */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>3000字深度分析</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>个性化建议</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>心理状态解读</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>专属改善方案</span>
                </div>
              </div>

              <button
                onClick={() => setShowAIPaymentModal(true)}
                className="px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-200 hover:shadow-orange-300 transition-all"
              >
                ¥1 解锁AI深度分析
              </button>

              <p className="text-xs text-slate-400">基础报告免费 · 分享功能不受影响</p>
            </div>
          )}
        </section>
      </div>

      {/* 底部操作区 */}
      <div className="pt-16 border-t border-slate-100 flex flex-col items-center gap-8 print:hidden">
        {/* 主要操作按钮 */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-xl">
          <button
            data-download-pdf
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在生成 PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                下载 PDF 报告
              </>
            )}
          </button>
          <button onClick={handleCopyLink} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            分享报告链接
          </button>
        </div>

        {/* 分享到朋友圈按钮 */}
        <button onClick={handleShare} className="w-full max-w-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-green-200 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          分享到朋友圈
        </button>

        <button onClick={onMeToo} className="flex flex-col items-center gap-4 group mt-4">
          <span className="text-slate-400 text-xs font-black tracking-widest uppercase">再测一次</span>
          <div className="w-16 h-16 rounded-full bg-orange-500 shadow-2xl flex items-center justify-center text-white text-3xl font-black group-hover:scale-110 transition-transform">+</div>
        </button>
      </div>

      {/* 分享弹窗 - 优化为固定在屏幕中央，图片优先显示 */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowShareModal(false); setShareImageUrl(null); }}>
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* 关闭按钮 */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">分享到朋友圈</h3>
              <button onClick={() => { setShowShareModal(false); setShareImageUrl(null); }} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* 生成中状态 */}
            {generatingImage && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="animate-spin h-10 w-10 text-green-500 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-slate-600 font-bold">正在生成分享图片...</p>
              </div>
            )}

            {/* 生成的图片 - 优先显示 */}
            {shareImageUrl && !generatingImage && (
              <>
                <div ref={shareImageRef} className="mb-4">
                  <img
                    src={shareImageUrl}
                    alt="分享图片"
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>

                {/* 保存到相册按钮 - 紧跟图片 */}
                <button
                  onClick={handleSaveToAlbum}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mb-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  保存到相册
                </button>

                <p className="text-xs text-slate-400 text-center mb-4">保存后打开微信 → 朋友圈 → 发布</p>

                {/* 推荐文案 - 折叠显示 */}
                <details className="mb-2">
                  <summary className="text-xs text-amber-600 font-bold cursor-pointer">📝 点击复制推荐文案</summary>
                  <p
                    className="text-sm text-amber-800 cursor-pointer hover:bg-amber-100 p-2 rounded-lg transition-colors mt-2 bg-amber-50"
                    onClick={() => {
                      const text = `测了一下躺平指数，我居然是「${data.scores.level.name}」😂 ${data.scores.level.description}，你们呢？`;
                      navigator.clipboard.writeText(text);
                      alert('文案已复制！');
                    }}
                  >
                    测了一下躺平指数，我居然是「{data.scores.level.name}」😂 {data.scores.level.description}，你们呢？
                  </p>
                </details>
              </>
            )}

            {/* 分享卡片 - 用于生成图片，始终隐藏 */}
            <div ref={shareCardRef} className="bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-xl" style={{ position: 'absolute', left: '-9999px', top: 0, width: '320px' }}>
              <div className="text-center">
                <p className="text-[11px] text-white/80 font-bold tracking-wider mb-4">🔬 躺平光谱研究所 · 权威认证</p>

                {/* 躺在床上的小人图标 */}
                <div className="flex justify-center mb-3">
                  <div className="text-4xl">🛌</div>
                </div>

                {/* 我是XXX - 最显眼 */}
                <h4 className="text-2xl font-black mb-2">我是「{data.scores.level.name}」</h4>
                <p className="text-sm text-white/80 mb-4">"{data.scores.level.description}"</p>

                {/* 躺平指数 */}
                <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4">
                  <p className="text-xs text-white/70 mb-1">躺平指数</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black">{data.scores.totalScore}</span>
                    <span className="text-lg opacity-70">/245</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">躺得不错，继续保持</p>
                </div>

                {/* 亮点数据 - 两列 */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="bg-white/15 rounded-xl p-3">
                    <p className="text-white/60 text-[10px] mb-1">最躺的方面</p>
                    <p className="font-bold text-sm">{data.scores.analysis.highestDim.nameCn}</p>
                    <p className="text-white/70 text-[10px]">{data.scores.analysis.highestDim.score.toFixed(0)}% 已躺平</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3">
                    <p className="text-white/60 text-[10px] mb-1">还在卷的方面</p>
                    <p className="font-bold text-sm">{data.scores.analysis.lowestDim.nameCn}</p>
                    <p className="text-white/70 text-[10px]">卷不动了也得卷</p>
                  </div>
                </div>

                {/* 底部引导 - 二维码 */}
                <div className="pt-4 border-t border-white/20">
                  <p className="text-base font-bold mb-2">你是什么躺平段位？</p>
                  <p className="text-xs text-white/70 mb-3">41道灵魂拷问，测出你的真实状态</p>
                  <div className="flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('https://lying.bettermee.cn')}&bgcolor=ffffff&color=000000`}
                      alt="扫码测试"
                      className="w-20 h-20 rounded-lg bg-white p-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI付费解锁弹窗 */}
      {showAIPaymentModal && visitorId && (
        <PaymentModal
          type="ai"
          price={1}
          visitorId={visitorId}
          onPaymentSuccess={() => {
            setShowAIPaymentModal(false);
            onAIPaymentSuccess?.();
          }}
          onClose={() => setShowAIPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default Report;
