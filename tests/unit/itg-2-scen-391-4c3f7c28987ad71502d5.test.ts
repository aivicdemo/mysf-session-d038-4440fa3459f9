import { describe, it, expect } from '@jest/globals';
import { classifyGapsAndScore, InvalidScoringParameters } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-391: スコア計算パラメータが負数や範囲外などの不正な値を含む場合、InvalidScoringParametersエラーが発生する', () => {
  it('should throw InvalidScoringParameters when scoringParameters contains negative weight', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: {
        functionName: '既存システムの請求書作成機能',
        functionDescription: 'カスタムオブジェクトを使用した請求書生成',
        implementationMethod: 'Apex トリガー + カスタムフィールド',
        constraints: ['月次バッチ処理で実行'],
      },
      standardFunctionality: {
        functionName: 'Salesforce標準の請求機能',
        functionDescription: '標準オブジェクトを使用した請求書管理',
        provisionMethod: 'Salesforce Billing',
        constraints: ['リアルタイム処理対応'],
      },
      gapClassificationCriteria: {
        completeMatch: {
          functionCoverageRate: 0.95,
          constraintCompatibility: true,
        },
        partialMatch: {
          functionCoverageRate: 0.7,
          constraintCompatibility: false,
        },
        customizationRequired: {
          functionCoverageRate: 0.5,
          constraintCompatibility: false,
        },
        nonSupport: {
          functionCoverageRate: 0,
          constraintCompatibility: false,
        },
      } as any,
      scoringParameters: {
        functionalityGapWeight: -0.3,
        performanceGapWeight: 0.5,
        constraintGapWeight: 0.8,
        customizationComplexityWeight: 0,
        scoringFormula: 'weighted sum',
        maxScore: 100,
      },
    };

    await expect(classifyGapsAndScore(input)).rejects.toThrow(InvalidScoringParameters);
    await expect(classifyGapsAndScore(input)).rejects.toThrow('スコア計算パラメータが無効です。パラメータの値を確認してください。');
  });
});
