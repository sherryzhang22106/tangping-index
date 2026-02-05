
import React, { useEffect, useState, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ReportData } from '../types';
import { parse } from 'marked';
import DOMPurify from 'dompurify';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

interface Props {
  data: ReportData;
  assessmentId?: string;
  onRefreshAI?: () => void;
  onMeToo?: () => void;
}

const Report: React.FC<Props> = ({ data, assessmentId, onRefreshAI, onMeToo }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [renderedMarkdown, setRenderedMarkdown] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.aiStatus === 'generating') {
      const interval = setInterval(() => {
        setLoadingProgress(prev => (prev >= 99 ? 99 : prev + 0.3));
      }, 1000);
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

  const handleShare = () => {
    setShowShareModal(true);
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

  const handleSaveImage = async () => {
    if (!shareCardRef.current) return;

    setGeneratingImage(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const imageUrl = canvas.toDataURL('image/png');
      setShareImageUrl(imageUrl);

      // 检测是否在微信内
      const isWechat = /micromessenger/i.test(navigator.userAgent);

      if (isWechat) {
        // 微信内：显示图片让用户长按保存
        // 图片已经设置到 shareImageUrl，会显示在弹窗中
      } else {
        // 非微信：直接下载
        const link = document.createElement('a');
        link.download = `躺平指数-${data.scores.level.name}.png`;
        link.href = imageUrl;
        link.click();
      }
    } catch (error) {
      console.error('Save image error:', error);
      alert('生成图片失败，请尝试截图保存');
    } finally {
      setGeneratingImage(false);
    }
  };

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

          {/* 仰卧起坐型标签 */}
          {data.scores.yangWoQiZuo.type === 'yangwoqizuo' && (
            <div className="mt-8 bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔄</span>
                <span className="text-lg font-black text-slate-800">仰卧起坐型</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">{data.scores.yangWoQiZuo.subtype}</span>
              </div>
              <p className="text-slate-600 text-sm">{data.scores.yangWoQiZuo.description} - 时而努力时而躺平，在两者之间反复横跳</p>
            </div>
          )}

          {/* 四个指标卡片 - 优化配色和说明 */}
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

          {/* 维度详情卡片 - 优化显示 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {barData.map((dim, idx) => {
              const level = getTangpingLevel(dim.value);
              return (
                <div key={dim.name} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-xs font-bold text-slate-500">{dim.name}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-800">{dim.value.toFixed(0)}<span className="text-sm text-slate-400">%</span></p>
                  <div className={`mt-2 inline-block px-2 py-1 rounded-lg text-xs font-bold ${level.bg} ${level.color}`}>
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

          {data.aiStatus === 'completed' ? (
            <article
              className="report-markdown"
              dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
            />
          ) : (
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

      {/* 分享弹窗 */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            {/* 生成的图片优先显示在顶部 */}
            {shareImageUrl && (
              <div className="mb-4">
                <p className="text-sm text-green-600 font-bold text-center mb-2">👇 长按图片保存到相册</p>
                <img
                  src={shareImageUrl}
                  alt="分享图片"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">分享到朋友圈</h3>
              <button onClick={() => setShowShareModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* 分享卡片预览 - 隐藏用于生成图片 */}
            <div ref={shareCardRef} className={`bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-xl ${shareImageUrl ? 'hidden' : 'mb-4'}`}>
              <div className="text-center">
                {/* 顶部标题 */}
                <p className="text-[10px] text-white/70 font-bold tracking-wider mb-2">🔬 躺平光谱研究所 · 权威认证</p>

                {/* 标签+等级 最显眼 */}
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-4xl">{data.scores.level.emoji}</span>
                  <div className="text-left">
                    <h4 className="text-2xl font-black leading-tight">{data.scores.level.name}</h4>
                    <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">{data.scores.level.level}</span>
                  </div>
                </div>
                <p className="text-white/80 text-xs mb-3">"{data.scores.level.description}"</p>

                {/* 躺平指数 - 缩小 */}
                <div className="bg-white/20 backdrop-blur rounded-xl p-3 mb-3">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xs text-white/60">躺平指数</span>
                    <span className="text-3xl font-black">{data.scores.totalScore}</span>
                    <span className="text-sm opacity-60">/245</span>
                  </div>
                </div>

                {/* 亮点数据 */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-white/50 text-[10px]">最躺的方面</p>
                    <p className="font-bold text-sm">{data.scores.analysis.highestDim.nameCn}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-white/50 text-[10px]">还在卷的方面</p>
                    <p className="font-bold text-sm">{data.scores.analysis.lowestDim.nameCn}</p>
                  </div>
                </div>

                {/* 底部二维码引导 */}
                <div className="pt-3 border-t border-white/20 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-bold text-white/90">你是什么躺平段位？</p>
                    <p className="text-[10px] text-white/60">扫码测一测 →</p>
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent('https://lying.bettermee.cn')}&bgcolor=ffffff&color=000000`}
                    alt="扫码测试"
                    className="w-14 h-14 rounded-lg bg-white p-1"
                  />
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center mb-4">保存图片，配上文案发朋友圈</p>

            {/* 推荐文案 */}
            <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-600 font-bold mb-2">📝 推荐文案（点击复制）</p>
              <p
                className="text-sm text-amber-800 cursor-pointer hover:bg-amber-100 p-2 rounded-lg transition-colors"
                onClick={() => {
                  const texts = [
                    `测了一下躺平指数，我居然是「${data.scores.level.name}」😂 ${data.scores.level.description}，你们呢？`,
                    `躺平指数${data.scores.totalScore}分，官方认证的「${data.scores.level.name}」🛋️ 不服来测！`,
                    `原来我在${data.scores.analysis.highestDim.nameCn}方面已经彻底躺平了...你猜你最躺的是什么？`,
                  ];
                  const text = texts[Math.floor(Math.random() * texts.length)];
                  navigator.clipboard.writeText(text);
                  alert('文案已复制！');
                }}
              >
                测了一下躺平指数，我居然是「{data.scores.level.name}」😂 {data.scores.level.description}，你们呢？
              </p>
            </div>

            <button
              onClick={handleSaveImage}
              disabled={generatingImage}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {generatingImage ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {shareImageUrl ? '重新生成图片' : '生成分享图片'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
