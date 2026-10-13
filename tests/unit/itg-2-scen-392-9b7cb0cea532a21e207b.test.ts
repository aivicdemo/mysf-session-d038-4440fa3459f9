import { describe, it, expect } from '@jest/globals';
import { classifyGapsAndScore, GapClassificationFailed } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-392: ギャップ分類ロジック実行中に予期しないエラーが発生した場合、GapClassificationFailedエラーが発生する', () => {
  it('should throw GapClassificationFailed when unexpected error occurs during gap classification logic', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: {
        functionName: '既存請求書承認フロー',
        functionDescription: '承認者による多段階承認と承認履歴の記録',
        implementationMethod: 'Salesforceカスタムフロー',
        constraints: ['最大5段階の承認、各段階で条件分岐あり'],
      },
      standardFunctionality: {
        functionName: '標準請求書承認フロー',
        functionDescription: '2段階の固定承認フロー',
        provisionMethod: '標準ワークフロー機能',
        constraints: ['2段階の固定構成、条件分岐なし'],
      },
      gapClassificationCriteria: {
        completeCoverageRule: '既存と標準が同一機能・制約で完全一致',
        partialCoverageRule: '標準が既存の機能を70%以上カバーしているが制約に差異あり',
        customizationRequiredRule: '標準が既存の機能を50%以上70%未満でカバー',
        nonCoverageRule: '標準が既存の機能を50%未満でカバー',
      } as any,
      scoringParameters: {
        functionalityGapWeight: 0.4,
        performanceGapWeight: 0.3,
        constraintGapWeight: 0.2,
        customizationComplexityWeight: 0.1,
        scoringFormula: 'invalid formula',
        maxScore: 100,
      },
    };

    await expect(classifyGapsAndScore(input)).rejects.toThrow(GapClassificationFailed);
    await expect(classifyGapsAndScore(input)).rejects.toThrow('ギャップ分類処理に失敗しました。入力データと基準を確認してください。');
  });
});
