// 简单的兑换码存储
// 在 Vercel Serverless 环境中，使用环境变量或 KV 存储
// 这里使用一个简单的内存缓存 + 环境变量方案

export interface CodeRecord {
  code: string;
  packageType: string;
  status: 'UNUSED' | 'ACTIVATED' | 'USED' | 'REVOKED';
  createdAt: string;
  activatedAt?: string;
  expiresAt?: string;
  usedBy?: string;
}

// 内存缓存
let codesCache: CodeRecord[] = [];
let cacheInitialized = false;

// 从环境变量加载预设的兑换码
function loadPresetCodes(): CodeRecord[] {
  const presetCodes = process.env.PRESET_CODES;
  if (!presetCodes) return [];

  try {
    return JSON.parse(presetCodes);
  } catch {
    return [];
  }
}

// 初始化缓存
function initCache() {
  if (!cacheInitialized) {
    codesCache = loadPresetCodes();
    cacheInitialized = true;
  }
}

// 获取所有兑换码
export function getAllCodes(): CodeRecord[] {
  initCache();
  return [...codesCache];
}

// 添加兑换码
export function addCodes(codes: CodeRecord[]): void {
  initCache();
  codesCache = [...codesCache, ...codes];
}

// 查找兑换码
export function findCode(code: string): CodeRecord | undefined {
  initCache();
  return codesCache.find(c => c.code === code);
}

// 更新兑换码状态
export function updateCodeStatus(code: string, status: CodeRecord['status'], usedBy?: string): boolean {
  initCache();
  const index = codesCache.findIndex(c => c.code === code);
  if (index === -1) return false;

  codesCache[index] = {
    ...codesCache[index],
    status,
    activatedAt: status === 'ACTIVATED' ? new Date().toISOString() : codesCache[index].activatedAt,
    usedBy,
  };
  return true;
}

// 删除未使用的兑换码
export function deleteUnusedCodes(): number {
  initCache();
  const before = codesCache.length;
  codesCache = codesCache.filter(c => c.status !== 'UNUSED');
  return before - codesCache.length;
}

// 验证兑换码是否有效
export function validateCode(code: string): { valid: boolean; error?: string; codeRecord?: CodeRecord } {
  initCache();

  // 先检查内存中的兑换码
  const record = codesCache.find(c => c.code === code);

  if (record) {
    if (record.status === 'REVOKED') {
      return { valid: false, error: '兑换码已作废' };
    }
    if (record.status === 'USED') {
      return { valid: false, error: '兑换码已使用' };
    }
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return { valid: false, error: '兑换码已过期' };
    }
    return { valid: true, codeRecord: record };
  }

  // 如果不在内存中，检查是否符合特定格式（允许任意以特定前缀开头的码）
  const validPrefixes = ['TP-', 'LYING-', 'TEST-', 'VIP-'];
  const hasValidPrefix = validPrefixes.some(prefix => code.toUpperCase().startsWith(prefix));

  if (hasValidPrefix && code.length >= 6) {
    // 动态创建一个新的兑换码记录
    const newRecord: CodeRecord = {
      code: code.toUpperCase(),
      packageType: 'STANDARD',
      status: 'UNUSED',
      createdAt: new Date().toISOString(),
    };
    codesCache.push(newRecord);
    return { valid: true, codeRecord: newRecord };
  }

  return { valid: false, error: '无效的兑换码' };
}
