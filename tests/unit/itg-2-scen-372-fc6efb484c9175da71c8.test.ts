import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type {
  ValidateStandardFunctionMappingsInput,
  ValidateStandardFunctionMappingsOutput,
} from '../../src/logic/data-validation-rules';

describe('SCEN-372: エラー：マッピング対応状況が部分対応またはカスタマイズ必要なのにカスタマイズ内容が空である', () => {
  it('部分対応のマッピングでカスタマイズ内容が空の場合、MissingCustomizationContent エラーを返す', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          mappingId: 'mapping-001',
          existingSystemFunctionName: '請求書承認フロー',
          existingSystemFunctionDescription: 'Oracle ERP内の請求書承認プロセス',
          salesforceFunctionName: '承認プロセス',
          salesforceFunctionDescription: 'Salesforceの標準承認プロセス機能',
          mappingCorrespondenceStatus: '部分対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 2,
          riskEvaluation: '中',
        },
      ],
      projectContext: {
        projectId: 'PROJ-2026-001',
        targetSystemId: 'SYS-ORACLE-ERP',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'MissingCustomizationContent',
        errorMessage: expect.stringContaining('部分対応またはカスタマイズ必要な場合、カスタマイズ内容の詳細を記入してください。'),
      })
    );
    expect(result.summary.totalErrorsDetected).toBeGreaterThanOrEqual(1);
  });
});
