import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type {
  ValidateStandardFunctionMappingsInput,
  ValidateStandardFunctionMappingsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-374: エラー：同一プロジェクト内で既存システム機能名とSalesforce標準機能名の組み合わせが重複している', () => {
  it('同一の既存システム機能名とSalesforce標準機能名の組み合わせが2つある場合、DuplicateMappingDefinition エラーを返す', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          existingSystemFunctionName: '請求書承認フロー',
          existingSystemFunctionDescription: 'Oracle ERP内での請求書承認ワークフロー',
          salesforceFunctionName: 'Approval Process',
          salesforceFunctionDescription: 'Salesforceの標準承認プロセス機能',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 1,
          riskEvaluation: '低',
        },
        {
          existingSystemFunctionName: '請求書承認フロー',
          existingSystemFunctionDescription: 'Oracle ERP内での請求書承認ワークフロー',
          salesforceFunctionName: 'Approval Process',
          salesforceFunctionDescription: 'Salesforceの標準承認プロセス機能',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 1,
          riskEvaluation: '低',
        },
      ],
      projectContext: {
        projectId: 'PRJ-2024-001',
        targetSystemId: 'SYSTEM-ORACLE-ERP',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults.some((vr) =>
      vr.errors.some((e) => e.errorCode === 'DuplicateMappingDefinition')
    )).toBe(true);
    const duplicateError = result.validationResults
      .flatMap((vr) => vr.errors)
      .find((e) => e.errorCode === 'DuplicateMappingDefinition');
    expect(duplicateError?.errorMessage).toBe('同じ既存システム機能とSalesforce標準機能の組み合わせは既に登録されています。');
  });
});
