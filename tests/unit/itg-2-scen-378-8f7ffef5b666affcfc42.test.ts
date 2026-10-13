import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type { ValidateStandardFunctionMappingsInput, ValidateStandardFunctionMappingsOutput } from '../../src/logic/data-validation-rules';

describe('SCEN-378: 正常系：マッピング対応状況が部分対応でカスタマイズ内容が記入されている場合、検証を通過する', () => {
  it('should pass validation when partial correspondence has customization content', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          mappingId: 'mapping-001',
          existingSystemFunctionName: '請求書承認フロー',
          existingSystemFunctionDescription: 'Oracle ERP内での請求書多段階承認プロセス',
          salesforceFunctionName: 'Approval Process',
          salesforceFunctionDescription: 'Salesforceの標準承認プロセス機能',
          mappingCorrespondenceStatus: '部分対応',
          customizationRequired: true,
          customizationContent: '条件付きロジックの追加カスタマイズが必要。承認者の動的割り当てにはFlow/Process Builderの拡張が必須。',
          priority: 2,
          riskEvaluation: '中',
        },
      ],
      projectContext: {
        projectId: 'PROJ-2026-001',
        targetSystemId: 'ORACLE-ERP-01',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(true);
    expect(result.validationResults[0].errors).toHaveLength(0);
    expect(result.summary.totalErrorsDetected).toBe(0);
  });
});
