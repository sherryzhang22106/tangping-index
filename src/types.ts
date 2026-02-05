
export type PackageType = 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

export interface RedemptionCode {
  code: string;
  package_type: PackageType;
  status: 'UNUSED' | 'ACTIVATED' | 'EXPIRED';
  created_at: string;
  activated_at?: string;
  user_id?: string;
}

export interface Question {
  id: number;
  text: string;
  type: 'SCALE' | 'CHOICE' | 'OPEN';
  module?: string;
  options?: { value: number; label: string }[];
  isBaseInfo?: boolean;
}

export interface AssessmentResponse {
  [questionId: number]: any;
}

export interface DimensionScores {
  work: number;
  social: number;
  life: number;
  mental: number;
  value: number;
}

export interface YangWoQiZuoResult {
  type: 'yangwoqizuo' | 'normal';
  subtype?: 'A-努力上行型' | 'B-摆烂下行型' | 'C-分裂矛盾型' | '标准仰卧起坐型';
  description?: string;
}

export interface LevelInfo {
  min: number;
  max: number;
  level: string;
  name: string;
  emoji: string;
  description: string;
}

export interface Scores {
  totalScore: number;
  level: LevelInfo;
  dimensions: DimensionScores;
  dimensionsRaw: {
    work: number;
    social: number;
    life: number;
    mental: number;
    value: number;
  };
  yangWoQiZuo: YangWoQiZuoResult;
  analysis: {
    highestDim: { name: string; nameCn: string; score: number };
    lowestDim: { name: string; nameCn: string; score: number };
    gap: number;
  };
}

export interface BaseInfo {
  city: string;
  career: string;
  sleep: string;
}

export interface OpenAnswers {
  idealDay: string;
  currentState: string;
  reasons: string;
}

export interface ReportData {
  scores: Scores;
  baseInfo?: BaseInfo;
  openAnswers?: OpenAnswers;
  aiStatus?: 'pending' | 'generating' | 'completed' | 'failed' | 'locked';
  aiAnalysis?: string;
  aiGeneratedAt?: string;
  aiWordCount?: number;
}
