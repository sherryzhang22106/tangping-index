import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { Scores } from '../types';

// 注册中文字体
Font.register({
  family: 'NotoSansSC',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_Fn-BKbPzS5HE.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansSC',
    fontSize: 11,
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 10,
    marginBottom: 8,
    opacity: 0.8,
  },
  levelName: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
  },
  levelDesc: {
    fontSize: 11,
    opacity: 0.9,
  },
  scoreBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1e293b',
  },
  scoreMax: {
    fontSize: 14,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    border: '1 solid #e2e8f0',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1 solid #e2e8f0',
  },
  dimensionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottom: '1 solid #f1f5f9',
  },
  dimensionName: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  dimensionBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  dimensionFill: {
    height: 8,
    backgroundColor: '#f97316',
    borderRadius: 4,
  },
  dimensionValue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#f97316',
    width: 45,
    textAlign: 'right',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginRight: '2%',
  },
  infoLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1e293b',
  },
  aiSection: {
    marginTop: 10,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 16,
  },
  aiContent: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.8,
    textAlign: 'justify',
  },
  aiParagraph: {
    marginBottom: 12,
  },
  aiHeading: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
  },
  yangwoqizuo: {
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeft: '3 solid #f97316',
  },
  yangwoqizuoTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#c2410c',
    marginBottom: 4,
  },
  yangwoqizuoDesc: {
    fontSize: 10,
    color: '#9a3412',
  },
});

// 解析 AI 分析内容
const parseAIContent = (content: string) => {
  if (!content) return [];

  const lines = content.split('\n').filter(line => line.trim());
  const elements: { type: 'heading' | 'paragraph'; text: string }[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('##')) {
      elements.push({ type: 'heading', text: trimmed.replace(/^#+\s*/, '') });
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      elements.push({ type: 'heading', text: trimmed.replace(/\*\*/g, '') });
    } else if (trimmed && !trimmed.startsWith('#')) {
      // 清理 markdown 格式
      const cleanText = trimmed
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      if (cleanText) {
        elements.push({ type: 'paragraph', text: cleanText });
      }
    }
  });

  return elements;
};

// 获取躺平程度标签
const getTangpingLabel = (score: number) => {
  if (score <= 30) return '还在卷';
  if (score <= 50) return '半卷半躺';
  if (score <= 70) return '开始躺了';
  return '彻底躺平';
};

interface ReportPDFProps {
  scores: Scores;
  aiAnalysis?: string;
}

const ReportPDFDocument: React.FC<ReportPDFProps> = ({ scores, aiAnalysis }) => {
  const aiElements = parseAIContent(aiAnalysis || '');

  const dimensions = [
    { name: '打工人现状', value: scores.dimensions.work },
    { name: '社交电量', value: scores.dimensions.social },
    { name: '生活状态', value: scores.dimensions.life },
    { name: '精神状态', value: scores.dimensions.mental },
    { name: '价值观念', value: scores.dimensions.value },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>躺平指数测评报告</Text>
          <Text style={styles.levelName}>{scores.level.emoji} {scores.level.name}</Text>
          <Text style={styles.levelDesc}>"{scores.level.description}"</Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>躺平指数</Text>
            <Text>
              <Text style={styles.scoreValue}>{scores.totalScore}</Text>
              <Text style={styles.scoreMax}> / 245</Text>
            </Text>
          </View>
        </View>

        {/* 仰卧起坐型 */}
        {scores.yangWoQiZuo.type === 'yangwoqizuo' && (
          <View style={styles.yangwoqizuo}>
            <Text style={styles.yangwoqizuoTitle}>🔄 仰卧起坐型 - {scores.yangWoQiZuo.subtype}</Text>
            <Text style={styles.yangwoqizuoDesc}>{scores.yangWoQiZuo.description}</Text>
          </View>
        )}

        {/* 关键指标 */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>🔥 最躺的方面</Text>
            <Text style={styles.infoValue}>{scores.analysis.highestDim.nameCn}</Text>
            <Text style={{ fontSize: 10, color: '#f97316' }}>{scores.analysis.highestDim.score.toFixed(0)}% 躺平程度</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>💪 还在卷的方面</Text>
            <Text style={styles.infoValue}>{scores.analysis.lowestDim.nameCn}</Text>
            <Text style={{ fontSize: 10, color: '#10b981' }}>{scores.analysis.lowestDim.score.toFixed(0)}% 躺平程度</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>📊 维度落差</Text>
            <Text style={styles.infoValue}>{scores.analysis.gap.toFixed(0)}%</Text>
            <Text style={{ fontSize: 10, color: '#64748b' }}>{scores.analysis.gap > 30 ? '内心很矛盾' : '状态较均衡'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>🏆 躺平等级</Text>
            <Text style={styles.infoValue}>{scores.level.level}</Text>
            <Text style={{ fontSize: 10, color: '#64748b' }}>共6级，越高越躺</Text>
          </View>
        </View>

        {/* 五维度分析 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>五维度躺平图谱</Text>
          {dimensions.map((dim, index) => (
            <View key={index} style={styles.dimensionRow}>
              <Text style={styles.dimensionName}>{dim.name}</Text>
              <View style={styles.dimensionBar}>
                <View style={[styles.dimensionFill, { width: `${dim.value}%` }]} />
              </View>
              <Text style={styles.dimensionValue}>{dim.value.toFixed(0)}% {getTangpingLabel(dim.value)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>躺平光谱研究所 · 躺平指数测评 v1.0</Text>
      </Page>

      {/* AI 分析页面 */}
      {aiAnalysis && (
        <Page size="A4" style={styles.page}>
          <View style={styles.aiSection}>
            <Text style={styles.aiTitle}>AI 知己：你的躺平深度分析</Text>
            {aiElements.map((element, index) => (
              element.type === 'heading' ? (
                <Text key={index} style={styles.aiHeading}>{element.text}</Text>
              ) : (
                <Text key={index} style={styles.aiParagraph}>{element.text}</Text>
              )
            ))}
          </View>
          <Text style={styles.footer}>躺平光谱研究所 · 躺平指数测评 v1.0</Text>
        </Page>
      )}
    </Document>
  );
};

// 导出生成 PDF 的函数
export const generateReportPDF = async (scores: Scores, aiAnalysis?: string): Promise<Blob> => {
  const doc = <ReportPDFDocument scores={scores} aiAnalysis={aiAnalysis} />;
  const blob = await pdf(doc).toBlob();
  return blob;
};

// 导出下载 PDF 的函数
export const downloadReportPDF = async (scores: Scores, aiAnalysis?: string, filename?: string) => {
  try {
    const blob = await generateReportPDF(scores, aiAnalysis);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `躺平指数报告-${scores.level.name}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export default ReportPDFDocument;
