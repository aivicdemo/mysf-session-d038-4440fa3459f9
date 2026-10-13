import { describe, it, expect } from '@jest/globals';
import { classifyGapsAndScore, InvalidExistingFunctionalityDefinition } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-388: 既存機能の必須項目が欠落または矛盾している場合、InvalidExistingFunctionalityDefinitionエラーが発生する', () => {
  it('should throw InvalidExistingFunctionalityDefinition when existingFunctionality has null description', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: {
        functionName: '請求書自動生成',
        functionDescription: null as any,
        implementationMethod: 'カスタムApex',
        constraints: [],
      },
      standardFunctionality: {
        functionName: '標準請求機能',
        functionDescription: 'Salesforce標準の請求書管理',
        provisionMethod: '標準オブジェクト',
        constraints: ['月次請求対応'],
      },
      gapClassificationCriteria: {
        perfectMatchThreshold: 0.95,
        partialMatchThreshold: 0.7,
        customizationThreshold: 0.5,
      } as any,
      scoringParameters: {
        functionalityGapWeight: 0.4,
        performanceGapWeight: 0.3,
        constraintGapWeight: 0.2,
        customizationComplexityWeight: 0.1,
        scoringFormula: 'weighted sum',
        maxScore: 100,
      },
    };

    await expect(classifyGapsAndScore(input)).rejects.toThrow(InvalidExistingFunctionalityDefinition);
    await expect(classifyGapsAndScore(input)).rejects.toThrow('既存機能の定義が不完全です。必須項目を確認してください。');
  });
});
