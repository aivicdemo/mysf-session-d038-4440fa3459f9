import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type {
  ValidateStandardFunctionMappingsInput,
  ValidateStandardFunctionMappingsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-375: エラー：優先度が定義済みの範囲（1-5など）外である', () => {
  it('優先度が0（範囲外）の場合、InvalidPriorityValue エラーを返す', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          mappingId: 'mapping-001',
          existingSystemFunctionName: '請求書作成',
          existingSystemFunctionDescription: 'Oracle請求書マスタの作成機能',
          salesforceFunctionName: 'Invoice__c',
          salesforceFunctionDescription: 'Salesforceカスタムオブジェクト請求書',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: null,
          priority: 0,
          riskEvaluation: '低',
        },
      ],
      projectContext: {
        projectId: 'PROJ-001',
        targetSystemId: 'ORACLE-BILLING',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'InvalidPriorityValue',
        errorMessage: '優先度は定義済みの範囲内の値である必要があります。',
      })
    );
    expect(result.summary.totalErrorsDetected).toBeGreaterThanOrEqual(1);
  });
});
