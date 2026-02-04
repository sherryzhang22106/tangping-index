
import React from 'react';

interface Props {
  onStart: () => void;
}

const CoreDimension = ({ icon, title, desc, colorClass }: { icon: React.ReactNode, title: string, desc: string, colorClass: string }) => (
  <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-orange-100 hover:shadow-[0_20px_50px_rgba(251,146,60,0.1)] transition-all duration-500">
    <div className={`w-16 h-16 ${colorClass} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
      {icon}
    </div>
    <h4 className="text-lg font-black text-slate-800 mb-3 group-hover:text-orange-600 transition-colors">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const Landing: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="space-y-24 pb-20 animate-in fade-in duration-700">
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
      <section className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="w-full aspect-square bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-orange-100/50 flex items-center justify-center p-8 border border-slate-50">
            <div className="w-full space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💪</span>
                <div className="flex-1 h-8 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full flex items-center px-4">
                  <span className="text-xs font-black text-white">Lv.1 卷王本王</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div className="flex-1 h-8 bg-gradient-to-r from-lime-400 to-lime-300 rounded-full flex items-center px-4">
                  <span className="text-xs font-black text-white">Lv.2 奋斗挣扎型</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧘</span>
                <div className="flex-1 h-8 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full flex items-center px-4">
                  <span className="text-xs font-black text-slate-700">Lv.3 佛系青年</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">😑</span>
                <div className="flex-1 h-8 bg-gradient-to-r from-orange-400 to-orange-300 rounded-full flex items-center px-4">
                  <span className="text-xs font-black text-white">Lv.4 躺平预备役</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛌</span>
                <div className="flex-1 h-8 bg-gradient-to-r from-red-400 to-red-300 rounded-full flex items-center px-4">
                  <span className="text-xs font-black text-white">Lv.5 资深躺平家</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏖️</span>
                <div className="flex-1 h-8 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full flex items-center px-4">
                  <span className="text-xs font-black text-white">Lv.6 躺平祖师爷</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">你在躺平光谱的哪个位置？</h2>
          <p className="text-slate-500 leading-relaxed font-medium">
            躺平不是非黑即白，而是一个<span className="text-orange-600 font-bold">连续的光谱</span>。
            有人是"卷王本王"，有人是"躺平祖师爷"，
            更多人是在两者之间<span className="text-orange-600 font-bold">反复横跳的"仰卧起坐型"</span>。
          </p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">01</div>
              <p className="text-sm text-slate-600 font-bold">打工人现状：你对工作的真实态度</p>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">02</div>
              <p className="text-sm text-slate-600 font-bold">社交电量：你的人际关系能量值</p>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">03</div>
              <p className="text-sm text-slate-600 font-bold">生活状态：你的日常生活质量</p>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">04</div>
              <p className="text-sm text-slate-600 font-bold">精神状态：你的心理健康指数</p>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">05</div>
              <p className="text-sm text-slate-600 font-bold">价值观念：你对人生的底层信念</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 五大维度 */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h3 className="text-4xl font-black text-slate-900">五大维度深度扫描</h3>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">全方位诊断你的躺平程度</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <CoreDimension
            colorClass="bg-blue-50 text-blue-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            title="打工人现状"
            desc="早上闹钟响了你是冲还是躺？领导@你是秒回还是已读不回？"
          />
          <CoreDimension
            colorClass="bg-pink-50 text-pink-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            title="社交电量"
            desc="朋友约你出去玩是开心赴约还是能在微信聊就别见面了？"
          />
          <CoreDimension
            colorClass="bg-emerald-50 text-emerald-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            title="生活状态"
            desc="你的一日三餐是好好吃还是外卖随便对付？周末是充实还是躺尸？"
          />
          <CoreDimension
            colorClass="bg-purple-50 text-purple-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
            title="精神状态"
            desc={'你的口头禅是"冲！"还是"麻了""摆了""毁灭吧"？'}
          />
          <CoreDimension
            colorClass="bg-amber-50 text-amber-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            title="价值观念"
            desc="你相信努力一定成功吗？还是觉得不努力一定很轻松？"
          />
          <CoreDimension
            colorClass="bg-orange-50 text-orange-600"
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            title="仰卧起坐型"
            desc="时而充满干劲，时而彻底摆烂，在努力和躺平之间反复横跳"
          />
        </div>
      </section>

      {/* 4. 症状检测 */}
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
