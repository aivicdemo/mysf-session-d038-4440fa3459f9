import { describe, it, expect } from '@jest/globals';
import { classifyGapsAndScore, InvalidGapClassificationCriteria } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-390: ギャップ分類基準が定義されていない、または基準値が矛盾している場合、InvalidGapClassificationCriteriaエラーが発生する', () => {
  it('should throw InvalidGapClassificationCriteria when gapClassificationCriteria is null', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: {
        functionName: '請求書承認フロー',
        functionDescription: '請求書の作成後、承認プロセスを経て確定する',
        implementationMethod: 'Salesforceプロセスビルダー',
        constraints: ['最大3段階の承認ステップ', '承認時間制限なし'],
      },
      standardFunctionality: {
        functionName: '請求書承認フロー',
        functionDescription: '移行対象システムの標準承認ワークフロー',
        provisionMethod: '標準ワークフロー機能',
        constraints: ['最大5段階の承認ステップ', '24時間以内の承認期限設定可能'],
      },
      gapClassificationCriteria: null as any,
      scoringParameters: {
        functionalityGapWeight: 0.4,
        performanceGapWeight: 0.3,
        constraintGapWeight: 0.2,
        customizationComplexityWeight: 0.1,
        scoringFormula: 'weighted sum',
        maxScore: 100,
      },
    };

    await expect(classifyGapsAndScore(input)).rejects.toThrow(InvalidGapClassificationCriteria);
    await expect(classifyGapsAndScore(input)).rejects.toThrow('ギャップ分類基準が無効です。基準の定義を確認してください。');
  });
});
