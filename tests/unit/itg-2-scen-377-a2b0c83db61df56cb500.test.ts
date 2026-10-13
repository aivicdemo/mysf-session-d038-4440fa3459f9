import { validateStandardFunctionMappings, DataIntegrityViolation } from '../../src/logic/data-validation-rules';
import type { ValidateStandardFunctionMappingsInput, ValidateStandardFunctionMappingsOutput } from '../../src/logic/data-validation-rules';

describe('SCEN-377: エラー：マッピング対応状況とカスタマイズ内容の整合性に矛盾がある場合、データ整合性違反エラーが発生する', () => {
  it('should detect data integrity violation when non-corresponding mapping has customization content', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          existingSystemFunctionName: '請求書承認フロー',
          existingSystemFunctionDescription: '請求書の段階的承認プロセス',
          salesforceFunctionName: 'Approval Process',
          salesforceFunctionDescription: 'Salesforceの標準承認プロセス機能',
          mappingCorrespondenceStatus: '非対応',
          customizationRequired: false,
          customizationContent: 'カスタマイズ内容がある（矛盾）',
          priority: 3,
          riskEvaluation: '中',
        },
      ],
      projectContext: {
        projectId: 'PROJ-001',
        targetSystemId: 'SYS-ORACLE-BILLING',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(false);
    expect(result.validationResults[0].errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'DataIntegrityViolation',
        errorMessage: '標準機能マッピング定義のデータに矛盾があります。マッピング対応状況とカスタマイズ内容の整合性を確認してください。',
      }),
    );
    expect(result.summary.totalErrorsDetected).toBeGreaterThanOrEqual(1);
  });
});
