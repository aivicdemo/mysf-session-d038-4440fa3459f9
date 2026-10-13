import { describe, it, expect } from '@jest/globals';
import { classifyGapsAndScore, InvalidStandardFunctionalityDefinition } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-389: 標準機能の必須項目が欠落または矛盾している場合、InvalidStandardFunctionalityDefinitionエラーが発生する', () => {
  it('should throw InvalidStandardFunctionalityDefinition when standardFunctionality is null', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: {
        functionName: '請求書自動生成機能',
        functionDescription: '商談から請求書を自動生成',
        implementationMethod: 'Salesforceカスタムオブジェクト',
        constraints: ['月次請求のみ対応'],
      },
      standardFunctionality: null as any,
      gapClassificationCriteria: {
        completeMappingRules: '既存・標準の全機能が1対1対応',
        partialMappingRules: '既存・標準の機能が80%以上対応',
        customizationRequiredRules: '既存・標準の機能が50%以上80%未満対応',
        nonMappingRules: '既存・標準の機能が50%未満対応',
      } as any,
      scoringParameters: {
        functionalityGapWeight: 0.5,
        performanceGapWeight: 0.3,
        constraintGapWeight: 0.2,
        customizationComplexityWeight: 0,
        scoringFormula: 'weighted sum',
        maxScore: 100,
      },
    };

    await expect(classifyGapsAndScore(input)).rejects.toThrow(InvalidStandardFunctionalityDefinition);
    await expect(classifyGapsAndScore(input)).rejects.toThrow('標準機能の定義が不完全です。必須項目を確認してください。');
  });
});
