import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type {
  ValidateStandardFunctionMappingsInput,
  ValidateStandardFunctionMappingsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-373: エラー：既存システム機能説明またはSalesforce標準機能説明が空文字列である', () => {
  it('既存システム機能説明が空文字列の場合、InvalidFunctionDescriptionFormat エラーを返す', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          mappingId: 'mapping-001',
          existingSystemFunctionName: '請求書作成機能',
          existingSystemFunctionDescription: '',
          salesforceFunctionName: 'Invoice__c',
          salesforceFunctionDescription: 'カスタム請求書オブジェクト',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: null,
          priority: 1,
          riskEvaluation: '低',
        },
      ],
      projectContext: {
        projectId: 'proj-123',
        targetSystemId: 'sys-oracle',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'InvalidFunctionDescriptionFormat',
        errorMessage: '既存システム機能説明とSalesforce標準機能説明は空にできません。',
      })
    );
    expect(result.summary.totalErrorsDetected).toBeGreaterThanOrEqual(1);
  });
});
