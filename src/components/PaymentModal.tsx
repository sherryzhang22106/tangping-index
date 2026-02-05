import React, { useState } from 'react';
import { api } from '../services/api';

interface Props {
  type: 'test' | 'ai';
  price: number;
  visitorId: string;
  onPaymentSuccess: () => void;
  onCodeSuccess?: (code: string) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<Props> = ({
  type,
  price,
  visitorId,
  onPaymentSuccess,
  onCodeSuccess,
  onClose
}) => {
  const [mode, setMode] = useState<'payment' | 'code'>('payment');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = type === 'test'
    ? '解锁完整测评'
    : '解锁AI深度分析';

  const description = type === 'test'
    ? '付费解锁完整测评，查看你的躺平指数图谱'
    : '想了解你的躺平心理深度分析？解锁AI专属报告（含个性化建议）';

  const features = type === 'test'
    ? ['完整41道测评题目', '五维度躺平图谱', '躺平等级认证', '分享到朋友圈']
    : ['3000字深度分析', '个性化躺平建议', '心理状态解读', '专属改善方案'];

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // 调用支付API
      const result = await api.createPayment(visitorId, price, type === 'test' ? '躺平测评' : 'AI分析');

      if (result.success && result.payUrl) {
        // 跳转到支付页面
        window.location.href = result.payUrl;
      } else if (result.success && result.jsApiParams) {
        // 微信JSAPI支付
        if (typeof WeixinJSBridge !== 'undefined') {
          WeixinJSBridge.invoke('getBrandWCPayRequest', result.jsApiParams, (res: any) => {
            if (res.err_msg === 'get_brand_wcpay_request:ok') {
              onPaymentSuccess();
            } else {
              setError('支付取消或失败');
            }
          });
        } else {
          setError('请在微信中打开');
        }
      } else {
        setError(result.error || '创建支付失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!code.trim()) {
      setError('请输入兑换码');
      return;
    }

    setLoading(true);
    setError('');

    if (onCodeSuccess) {
      onCodeSuccess(code.trim().toUpperCase());
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
        {/* 关闭按钮 */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 价格展示 */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 mb-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm text-orange-600">¥</span>
            <span className="text-4xl font-black text-orange-600">{price}</span>
          </div>
          <p className="text-center text-xs text-orange-500 mt-1">一次付费，永久有效</p>
        </div>

        {/* 功能列表 */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-400 mb-2">包含内容：</p>
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 切换标签 */}
        {type === 'test' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('payment')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'payment' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              微信支付
            </button>
            <button
              onClick={() => setMode('code')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'code' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              兑换码
            </button>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 支付模式 */}
        {mode === 'payment' && (
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all disabled:opacity-50"
          >
            {loading ? '处理中...' : `立即支付 ¥${price}`}
          </button>
        )}

        {/* 兑换码模式 */}
        {mode === 'code' && (
          <div className="space-y-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="请输入兑换码"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-orange-500 outline-none text-center font-mono font-bold text-lg uppercase"
            />
            <button
              onClick={handleCodeSubmit}
              disabled={loading || !code.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all disabled:opacity-50"
            >
              {loading ? '验证中...' : '使用兑换码'}
            </button>
          </div>
        )}

        {/* 底部提示 */}
        <p className="text-center text-xs text-slate-400 mt-4">
          {type === 'test' ? '前10题免费体验，付费后解锁全部内容' : '基础报告免费，AI分析需额外付费'}
        </p>
      </div>
    </div>
  );
};

// 声明微信JS Bridge
declare global {
  interface Window {
    WeixinJSBridge: any;
  }
}
declare const WeixinJSBridge: any;

export default PaymentModal;
