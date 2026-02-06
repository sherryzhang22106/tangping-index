
import React from 'react';

interface Props {
  onStart: () => void;
}

// 动态躺平人偶组件
const LyingFigure: React.FC<{ level: number }> = ({ level }) => {
  // Lv.1: 站着刷手机，一脸认真
  if (level === 1) {
    return (
      <div className="relative w-16 h-20 flex items-end justify-center">
        {/* 人物 - 站立 */}
        <div className="relative animate-bounce-subtle">
          {/* 头 */}
          <div className="w-6 h-6 bg-emerald-400 rounded-full absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <span className="text-[8px]">😤</span>
          </div>
          {/* 身体 */}
          <div className="w-4 h-8 bg-emerald-300 rounded-t-lg mx-auto"></div>
          {/* 手机 */}
          <div className="absolute top-2 -right-3 w-2 h-3 bg-slate-700 rounded-sm animate-pulse"></div>
          {/* 腿 */}
          <div className="flex gap-1 justify-center">
            <div className="w-1.5 h-4 bg-emerald-400 rounded-b"></div>
            <div className="w-1.5 h-4 bg-emerald-400 rounded-b"></div>
          </div>
        </div>
      </div>
    );
  }

  // Lv.2: 仰卧起坐动图 - 核心亮点！
  if (level === 2) {
    return (
      <div className="relative w-20 h-16 flex items-center justify-center overflow-hidden">
        <div className="animate-situp origin-bottom">
          {/* 头 */}
          <div className="w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center mb-0.5">
            <span className="text-[8px] animate-expression">😫</span>
          </div>
          {/* 上半身 */}
          <div className="w-4 h-6 bg-lime-300 rounded-t-lg origin-bottom"></div>
        </div>
        {/* 下半身固定 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="w-8 h-2 bg-lime-400 rounded-full"></div>
        </div>
        {/* 汗水 */}
        <div className="absolute top-1 right-2 text-[10px] animate-ping">💦</div>
      </div>
    );
  }

  // Lv.3: 坐着瘫，半睡半醒
  if (level === 3) {
    return (
      <div className="relative w-16 h-16 flex items-end justify-center">
        {/* 沙发 */}
        <div className="absolute bottom-0 w-14 h-4 bg-yellow-200 rounded-t-lg"></div>
        {/* 人物 - 瘫坐 */}
        <div className="relative bottom-3 animate-sway">
          {/* 头 - 歪着 */}
          <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center rotate-12">
            <span className="text-[8px]">😪</span>
          </div>
          {/* 身体 - 弯曲 */}
          <div className="w-4 h-5 bg-yellow-300 rounded-lg -mt-1 rotate-6"></div>
        </div>
        {/* Zzz */}
        <div className="absolute top-0 right-1 text-[10px] animate-float">💤</div>
      </div>
    );
  }

  // Lv.4: 侧躺刷手机，偶尔翻身
  if (level === 4) {
    return (
      <div className="relative w-20 h-14 flex items-center justify-center">
        {/* 床 */}
        <div className="absolute bottom-0 w-18 h-2 bg-orange-100 rounded-full"></div>
        {/* 人物 - 侧躺 */}
        <div className="relative animate-roll">
          {/* 头 */}
          <div className="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center absolute left-0 top-0">
            <span className="text-[8px]">😑</span>
          </div>
          {/* 身体 - 横躺 */}
          <div className="w-8 h-4 bg-orange-300 rounded-full ml-4 mt-1"></div>
          {/* 手机 */}
          <div className="absolute left-6 -top-2 w-2 h-3 bg-slate-600 rounded-sm animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Lv.5: 平躺，手机掉在脸上
  if (level === 5) {
    return (
      <div className="relative w-20 h-12 flex items-center justify-center">
        {/* 床 */}
        <div className="absolute bottom-0 w-18 h-2 bg-red-100 rounded-full"></div>
        {/* 人物 - 平躺 */}
        <div className="relative">
          {/* 身体 - 完全平躺 */}
          <div className="w-12 h-3 bg-red-300 rounded-full"></div>
          {/* 头 */}
          <div className="w-4 h-4 bg-red-400 rounded-full flex items-center justify-center absolute -left-3 top-0">
            <span className="text-[8px]">😵</span>
          </div>
          {/* 手机掉在脸上 */}
          <div className="absolute -left-2 -top-1 w-3 h-2 bg-slate-700 rounded-sm animate-phone-drop"></div>
        </div>
        {/* 星星 */}
        <div className="absolute top-0 left-2 text-[8px] animate-spin-slow">⭐</div>
      </div>
    );
  }

  // Lv.6: 摊成一滩水，和沙发融为一体
  if (level === 6) {
    return (
      <div className="relative w-20 h-14 flex items-end justify-center">
        {/* 沙发 */}
        <div className="absolute bottom-0 w-16 h-5 bg-purple-200 rounded-t-2xl"></div>
        {/* 人物 - 融化状态 */}
        <div className="relative bottom-1 animate-melt">
          {/* 融化的身体 */}
          <div className="w-14 h-3 bg-purple-300/80 rounded-full blur-[1px]"></div>
          {/* 头 - 也在融化 */}
          <div className="w-5 h-4 bg-purple-400/80 rounded-full flex items-center justify-center absolute -left-1 -top-2 blur-[0.5px]">
            <span className="text-[8px]">🫠</span>
          </div>
        </div>
        {/* 灵魂出窍 */}
        <div className="absolute -top-1 right-2 text-[10px] animate-float-up">👻</div>
      </div>
    );
  }

  return null;
};

const Landing: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="space-y-24 pb-20 animate-in fade-in duration-700">
      {/* 自定义动画样式 */}
      <style>{`
        @keyframes situp {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-70deg); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes roll {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(-1); }
        }
        @keyframes phone-drop {
          0%, 70%, 100% { transform: translateY(0) rotate(0deg); }
          80% { transform: translateY(-3px) rotate(-10deg); }
          90% { transform: translateY(2px) rotate(5deg); }
        }
        @keyframes melt {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(0.8) scaleX(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-5px); opacity: 0.7; }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes expression {
          0%, 40%, 100% { content: '😫'; }
          50%, 90% { content: '😤'; }
        }
        .animate-situp { animation: situp 1.5s ease-in-out infinite; }
        .animate-sway { animation: sway 3s ease-in-out infinite; }
        .animate-roll { animation: roll 4s ease-in-out infinite; }
        .animate-phone-drop { animation: phone-drop 3s ease-in-out infinite; }
        .animate-melt { animation: melt 4s ease-in-out infinite; }
        .animate-float { animation: float 2s ease-in-out infinite; }
        .animate-float-up { animation: float-up 3s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 1s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
      `}</style>

      {/* 1. Hero */}
      <section className="relative pt-12 text-center space-y-8 animate-in slide-in-from-top-10 duration-1000">
        <div className="inline-block px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          2025年度最真实的自我诊断
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-4xl mx-auto">
          你的躺平指数 <br />
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent italic">到底有多高？</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-loose">
          41道灵魂拷问，5大维度深度扫描
          <br className="hidden md:block" />
          测测你是"卷王本王"还是"躺平祖师爷"
        </p>
        <div className="pt-8">
          <button
            onClick={onStart}
            className="px-10 py-5 bg-orange-500 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
          >
            开始测试
          </button>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[800px] h-[800px] bg-gradient-to-b from-orange-50/50 to-transparent rounded-full blur-3xl opacity-50"></div>
      </section>

      {/* 2. 躺平光谱 */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">你在躺平光谱的哪个位置？</h2>
          <p className="text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto">
            躺平不是非黑即白，而是一个<span className="text-orange-600 font-bold">连续的光谱</span>。
            有人是"卷王本王"，有人是"躺平祖师爷"，
            更多人是在两者之间<span className="text-orange-600 font-bold">反复横跳的"仰卧起坐型"</span>。
          </p>
        </div>

        {/* 躺平等级卡片 - 带动态人偶 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Lv.1 卷王本王 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all group">
            <div className="flex items-start gap-4">
              {/* 动态人偶 */}
              <div className="shrink-0 w-20 h-20 bg-emerald-50 rounded-xl flex items-center justify-center overflow-hidden">
                <LyingFigure level={1} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-black">Lv.1</span>
                  <span className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors">卷王本王</span>
                </div>
                <span className="text-xs text-slate-400">35-70分</span>
                <p className="text-sm text-slate-600 mt-2"><span className="font-bold text-emerald-600">全力以赴</span></p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">还在相信"努力就有回报"的稀有物种</p>
              </div>
            </div>
          </div>

          {/* Lv.2 仰卧起坐型 */}
          <div className="bg-gradient-to-br from-lime-50 to-yellow-50 rounded-2xl p-5 border-2 border-lime-300 hover:shadow-lg hover:shadow-lime-100 transition-all group relative overflow-hidden">
            <div className="flex items-start gap-4">
              {/* 动态人偶 - 仰卧起坐 */}
              <div className="shrink-0 w-20 h-20 bg-lime-100 rounded-xl flex items-center justify-center overflow-hidden">
                <LyingFigure level={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-lime-200 text-lime-700 rounded text-xs font-black">Lv.2</span>
                  <span className="font-black text-slate-800 group-hover:text-lime-600 transition-colors">仰卧起坐型</span>
                </div>
                <span className="text-xs text-slate-400">71-105分</span>
                <p className="text-sm text-slate-600 mt-2"><span className="font-bold text-lime-600">时卷时躺</span></p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">在努力和放弃之间反复横跳</p>
              </div>
            </div>
          </div>

          {/* Lv.3 佛系青年 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-yellow-200 hover:shadow-lg hover:shadow-yellow-50 transition-all group">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-20 h-20 bg-yellow-50 rounded-xl flex items-center justify-center overflow-hidden">
                <LyingFigure level={3} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-black">Lv.3</span>
                  <span className="font-black text-slate-800 group-hover:text-yellow-600 transition-colors">佛系青年</span>
                </div>
                <span className="text-xs text-slate-400">106-140分</span>
                <p className="text-sm text-slate-600 mt-2"><span className="font-bold text-yellow-600">顺其自然</span></p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">"都行、可以、没事"三连本尊</p>
              </div>
            </div>
          </div>

          {/* Lv.4 躺平预备役 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all group">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden">
                <LyingFigure level={4} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-black">Lv.4</span>
                  <span className="font-black text-slate-800 group-hover:text-orange-600 transition-colors">躺平预备役</span>
                </div>
                <span className="text-xs text-slate-400">141-175分</span>
                <p className="text-sm text-slate-600 mt-2"><span className="font-bold text-orange-600">被动抵抗</span></p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">"下辈子当猫吧"挂嘴边</p>
              </div>
            </div>
          </div>

          {/* Lv.5 资深躺平家 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-50 transition-all group">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-20 h-20 bg-red-50 rounded-xl flex items-center justify-center overflow-hidden">
                <LyingFigure level={5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-black">Lv.5</span>
                  <span className="font-black text-slate-800 group-hover:text-red-600 transition-colors">资深躺平家</span>
                </div>
                <span className="text-xs text-slate-400">176-210分</span>
                <p className="text-sm text-slate-600 mt-2"><span className="font-bold text-red-600">精神退休</span></p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">已在精神上退休，肉身还在苦苦支撑</p>
              </div>
            </div>
          </div>

          {/* Lv.6 躺平祖师爷 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-50 transition-all group">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-20 h-20 bg-purple-50 rounded-xl flex items-center justify-center overflow-hidden">
                <LyingFigure level={6} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-black">Lv.6</span>
                  <span className="font-black text-slate-800 group-hover:text-purple-600 transition-colors">躺平祖师爷</span>
                </div>
                <span className="text-xs text-slate-400">211-245分</span>
                <p className="text-sm text-slate-600 mt-2"><span className="font-bold text-purple-600">彻底觉醒</span></p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">人生赢家（指赢麻了的麻）</p>
              </div>
            </div>
          </div>
        </div>

        {/* 五大维度说明 */}
        <div className="mt-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8">
          <h3 className="text-lg font-black text-slate-800 mb-6 text-center">五大维度深度扫描</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-lg">💼</span>
              </div>
              <p className="text-xs font-bold text-slate-700">打工人现状</p>
              <p className="text-[10px] text-slate-400 mt-1">工作态度</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-lg">👥</span>
              </div>
              <p className="text-xs font-bold text-slate-700">社交电量</p>
              <p className="text-[10px] text-slate-400 mt-1">人际能量</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-lg">🏠</span>
              </div>
              <p className="text-xs font-bold text-slate-700">生活状态</p>
              <p className="text-[10px] text-slate-400 mt-1">日常质量</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-lg">🧠</span>
              </div>
              <p className="text-xs font-bold text-slate-700">精神状态</p>
              <p className="text-[10px] text-slate-400 mt-1">心理健康</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-lg">💎</span>
              </div>
              <p className="text-xs font-bold text-slate-700">价值观念</p>
              <p className="text-[10px] text-slate-400 mt-1">人生信念</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 症状检测 */}
      <section className="bg-slate-900 text-white py-24 rounded-[3rem] mx-4 overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12 relative z-10">
          <h3 className="text-3xl font-black italic">你是否也有这些症状？</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-bold">
            <span className="px-6 py-3 bg-white/10 rounded-full border border-white/20">早上闹钟响了想当场去世</span>
            <span className="px-6 py-3 bg-white/10 rounded-full border border-white/20">领导画饼我就想辞职</span>
            <span className="px-6 py-3 bg-white/10 rounded-full border border-white/20">周末除了上厕所都在床上</span>
            <span className="px-6 py-3 bg-white/10 rounded-full border border-white/20">朋友圈设置三天可见了</span>
            <span className="px-6 py-3 bg-white/10 rounded-full border border-white/20">口头禅是"麻了""摆了"</span>
            <span className="px-6 py-3 bg-white/10 rounded-full border border-white/20">购物车空了，无欲无求</span>
          </div>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.4em]">如果你中了3条以上，是时候测测你的躺平指数了</p>
        </div>
      </section>

      <div className="text-center">
         <button
            onClick={onStart}
            className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-200"
          >
            开始41道灵魂拷问
          </button>
      </div>
    </div>
  );
};

export default Landing;
