import { describe, it, expect } from '@jest/globals';
import { classifyGapsAndScore } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput, ClassifyGapsAndScoreOutput } from '../../src/logic/gap-classification-engine';

describe('SCEN-393: スコアリング内訳が計算過程と各要素の寄与度を詳細に記録する', () => {
  it('should return detailed scoringBreakdown with calculation process and element contributions', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: {
        functionName: '既存システム請求書生成機能',
        functionDescription: '商談から請求書を生成し、税金計算・割引適用・合計金額自動算出',
        implementationMethod: 'カスタムオブジェクト + Apex トリガー',
        constraints: ['税率は固定値（10%）のみ対応', '複数通貨非対応'],
      },
      standardFunctionality: {
        functionName: 'Salesforce標準請求書機能',
        functionDescription: '請求オブジェクトによる請求書生成、複数税率対応、複数通貨対応',
        provisionMethod: '標準オブジェクト + Flow',
        constraints: ['カスタム割引ロジック部分は標準では対応していない'],
      },
      gapClassificationCriteria: {
        completeMatch: {
          rule: '既存機能の全要件が標準機能で実装可能',
          scoreThreshold: 0,
        },
        partialMatch: {
          rule: '既存機能の50%以上80%未満が標準機能で実装可能、残りはカスタマイズで対応可能',
          scoreThreshold: '30～50',
        },
        customizationRequired: {
          rule: '既存機能の要件が標準機能では実装不可、カスタマイズが必須',
          scoreThreshold: '51～80',
        },
        notSupported: {
          rule: '既存機能の要件が標準機能でもカスタマイズでも実装不可',
          scoreThreshold: '81～100',
        },
      } as any,
      scoringParameters: {
        functionalityGapWeight: 0.4,
        performanceGapWeight: 0.35,
        constraintGapWeight: 0.25,
        customizationComplexityWeight: 0,
        scoringFormula: 'capabilityAlignment×0.4 + constraintCompatibility×0.35 + implementationComplexity×0.25',
        maxScore: 100,
      },
    };

    const result = await classifyGapsAndScore(input);

    expect(result).toBeDefined();
    expect(result.gapCategory).toBe('部分対応');
    expect(result.gapScore).toBeGreaterThanOrEqual(0);
    expect(result.gapScore).toBeLessThanOrEqual(100);

    expect(result.scoringBreakdown).toBeDefined();
    expect(result.scoringBreakdown.functionalityGapScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.performanceGapScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.constraintGapScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.customizationComplexityScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.totalScore).toBe(result.gapScore);
    expect(result.scoringBreakdown.calculationDetails).toBeDefined();

    expect(result.classificationReason).toBeDefined();
    expect(result.classificationReason).toContain('税金計算');
    expect(result.classificationReason).toContain('割引');
    expect(result.classificationReason).toContain('複数通貨');

    expect(result.recommendedMitigationApproach).toBeDefined();
    expect(result.recommendedMitigationApproach).toContain('標準請求オブジェクト');
  });
});
