import { validateStandardFunctionMappings, InvalidRiskEvaluationValue } from '../../src/logic/data-validation-rules';
import type { ValidateStandardFunctionMappingsInput, ValidateStandardFunctionMappingsOutput } from '../../src/logic/data-validation-rules';

describe('SCEN-376: エラー：リスク評価が定義済みの値（低・中・高など）以外である', () => {
  it('should detect invalid risk evaluation value', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          existingSystemFunctionName: '請求書承認',
          existingSystemFunctionDescription: 'Oracle請求書の承認フロー',
          salesforceFunctionName: 'Approval Process',
          salesforceFunctionDescription: 'Salesforce標準承認プロセス',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 1,
          riskEvaluation: '無効な値',
        },
      ],
      projectContext: {
        projectId: 'PROJ-2026-001',
        targetSystemId: 'ORACLE-ERP-001',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(false);
    expect(result.validationResults[0].errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'InvalidRiskEvaluationValue',
        errorMessage: 'リスク評価は「低」「中」「高」のいずれかである必要があります。',
      }),
    );
    expect(result.summary.totalErrorsDetected).toBeGreaterThanOrEqual(1);
  });
});
