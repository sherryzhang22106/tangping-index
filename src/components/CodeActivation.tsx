
import React, { useState, useEffect } from 'react';

interface Props {
  onActivate: (code: string) => void;
  onPaymentSuccess: (visitorId: string) => void;
  onBack: () => void;
  loading: boolean;
  visitorId: string;
}

// 检测是否在微信内打开
const isWechat = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

// 声明微信JS-SDK类型
declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke: (api: string, params: any, callback: (res: any) => void) => void;
    };
  }
}

const CodeActivation: React.FC<Props> = ({ onActivate, onPaymentSuccess, onBack, loading, visitorId }) => {
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'pay'>('pay');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [inWechat] = useState(isWechat());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onActivate(code.trim().toUpperCase());
    }
  };

  // 微信内 JSAPI 支付
  const handleWechatPay = async () => {
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      // 检查URL中是否有微信授权返回的code
      const urlParams = new URLSearchParams(window.location.search);
      const wxCode = urlParams.get('code');

      if (!wxCode) {
        // 没有code，需要先获取授权
        const currentUrl = window.location.href.split('?')[0];
        const redirectUrl = `${currentUrl}?pay=1`;

        const response = await fetch(`/api/payment?action=oauth&redirect=${encodeURIComponent(redirectUrl)}`);
        const result = await response.json();

        if (result.success && result.data.url) {
          // 跳转到微信授权页面
          window.location.href = result.data.url;
          return;
        } else {
          throw new Error('获取授权链接失败');
        }
      }

      // 有code，创建JSAPI支付订单
      const response = await fetch('/api/payment?action=jsapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, code: wxCode })
      });

      const result = await response.json();

      if (result.success && result.data) {
        const payData = result.data;
        setOrderNo(payData.orderNo);

        // 清除URL中的code参数
        window.history.replaceState({}, '', window.location.pathname);

        // 调用微信支付
        if (window.WeixinJSBridge) {
          window.WeixinJSBridge.invoke(
            'getBrandWCPayRequest',
            {
              appId: payData.appId,
              timeStamp: payData.timeStamp,
              nonceStr: payData.nonceStr,
              package: payData.package,
              signType: payData.signType,
              paySign: payData.paySign
            },
            (res: any) => {
              if (res.err_msg === 'get_brand_wcpay_request:ok') {
                // 支付成功
                onPaymentSuccess(visitorId);
              } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
                setPaymentError('支付已取消');
              } else {
                setPaymentError('支付失败，请重试');
              }
              setPaymentLoading(false);
            }
          );
        } else {
          setPaymentError('请在微信中打开');
          setPaymentLoading(false);
        }
      } else {
        throw new Error(result.error || '创建支付订单失败');
      }
    } catch (error: any) {
      setPaymentError(error.message || '支付失败，请重试');
      setPaymentLoading(false);
    }
  };

  // PC端扫码支付
  const handleCreatePayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch('/api/payment?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      });

      const result = await response.json();

      if (result.success && result.data.codeUrl) {
        setQrCodeUrl(result.data.codeUrl);
        setOrderNo(result.data.orderNo);
      } else {
        setPaymentError(result.error || '创建支付订单失败');
      }
    } catch (error) {
      setPaymentError('网络错误，请重试');
    } finally {
      setPaymentLoading(false);
    }
  };

  // 页面加载时检查是否是微信授权回调
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPay = urlParams.get('pay');
    const wxCode = urlParams.get('code');

    if (inWechat && isPay && wxCode) {
      // 是微信授权回调，自动发起支付
      handleWechatPay();
    }
  }, []);

  // 轮询检查支付状态（PC端扫码支付用）
  useEffect(() => {
    if (!orderNo || !qrCodeUrl || inWechat) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment?action=query&orderNo=${orderNo}`);
        const result = await response.json();

        if (result.success && result.data.paid) {
          setCheckingPayment(false);
          onPaymentSuccess(visitorId);
        }
      } catch (error) {
        console.error('检查支付状态失败:', error);
      }
    };

    setCheckingPayment(true);
    const interval = setInterval(checkPaymentStatus, 3000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setCheckingPayment(false);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [orderNo, qrCodeUrl, visitorId, onPaymentSuccess, inWechat]);

  // 生成二维码图片URL
  const getQrCodeImageUrl = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-400 font-bold hover:text-orange-600 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </button>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-orange-100 border border-orange-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>

          {/* 标签切换 */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-8 relative z-10">
            <button
              onClick={() => setActiveTab('pay')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'pay'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              💳 在线支付
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'code'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🎫 兑换码
            </button>
          </div>

          {/* 在线支付 */}
          {activeTab === 'pay' && (
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5C7.45 15.83 8.45 16 9.5 16c4.14 0 7.5-2.69 7.5-6S13.64 4 9.5 4zm6.5 6c0 2.21-2.69 4-6 4-.65 0-1.27-.07-1.85-.2l-2.15 1.3.45-1.8C4.95 12.35 4 11.25 4 10c0-2.21 2.69-4 6-4s6 1.79 6 4z"/>
                    <path d="M22 14c0-2.21-2.69-4-6-4-.35 0-.69.03-1.02.08.65.91 1.02 1.96 1.02 3.08 0 1.12-.37 2.17-1.02 3.08.33.05.67.08 1.02.08.65 0 1.27-.07 1.85-.2l2.15 1.3-.45-1.8c1.05-.95 2-2.05 2-3.3z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900">微信支付</h3>
                <p className="text-slate-500 mt-2">
                  {inWechat ? '点击按钮直接支付' : '扫码支付，即刻开启测评'}
                </p>
              </div>

              {/* 价格展示 */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 mb-6 text-center">
                <p className="text-sm text-slate-500 mb-1">测评价格</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-orange-600 font-bold">¥</span>
                  <span className="text-4xl font-black text-orange-600">0.1</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">41道专业测评题 + AI深度分析报告</p>
              </div>

              {/* 微信内：直接支付按钮 */}
              {inWechat ? (
                <button
                  onClick={handleWechatPay}
                  disabled={paymentLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-200 disabled:opacity-50 hover:shadow-green-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {paymentLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      处理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5C7.45 15.83 8.45 16 9.5 16c4.14 0 7.5-2.69 7.5-6S13.64 4 9.5 4z"/>
                      </svg>
                      立即支付 ¥0.1
                    </>
                  )}
                </button>
              ) : (
                /* PC端：二维码支付 */
                <>
                  {qrCodeUrl ? (
                    <div className="text-center">
                      <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 inline-block mb-4">
                        <img
                          src={getQrCodeImageUrl(qrCodeUrl)}
                          alt="微信支付二维码"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-sm text-slate-500 mb-2">
                        {checkingPayment ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            等待支付中...
                          </span>
                        ) : '请使用微信扫码支付'}
                      </p>
                      <button
                        onClick={handleCreatePayment}
                        className="text-sm text-orange-600 hover:text-orange-700 font-bold"
                      >
                        刷新二维码
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleCreatePayment}
                      disabled={paymentLoading}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-200 disabled:opacity-50 hover:shadow-green-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      {paymentLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          生成支付码...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5C7.45 15.83 8.45 16 9.5 16c4.14 0 7.5-2.69 7.5-6S13.64 4 9.5 4z"/>
                          </svg>
                          立即支付 ¥0.1
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {paymentError && (
                <p className="text-red-500 text-sm text-center mt-4">{paymentError}</p>
              )}
            </div>
          )}

          {/* 兑换码 */}
          {activeTab === 'code' && (
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900">输入兑换码</h3>
                <p className="text-slate-500 mt-2">输入激活码开启测评</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="请输入激活码"
                    className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-orange-500 transition-all uppercase font-mono text-xl tracking-widest text-center outline-none bg-slate-50/50 focus:bg-white"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-200 disabled:opacity-50 hover:shadow-orange-300 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      正在验证...
                    </span>
                  ) : '开启 41 题躺平测评'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[10px] text-slate-300 font-black tracking-widest uppercase">
                  测试激活码: <span className="text-orange-400 font-mono">TANGPING</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-slate-400 text-xs font-medium space-y-2">
          <p>支付遇到问题？请联系客服</p>
          <p className="text-[10px] tracking-widest uppercase text-orange-300">躺平光谱研究所 · 专业测评</p>
        </div>
      </div>
    </div>
  );
};

export default CodeActivation;
