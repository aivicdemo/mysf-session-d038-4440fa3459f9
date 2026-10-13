import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type { ValidateStandardFunctionMappingsInput, ValidateStandardFunctionMappingsOutput } from '../../src/logic/data-validation-rules';

describe('SCEN-379: 正常系：マッピング対応状況がカスタマイズ必要でカスタマイズ内容が記入されている場合、検証を通過する', () => {
  it('should pass validation when customization required has detailed customization content', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          mappingId: 'mapping-001',
          existingSystemFunctionName: '請求書承認フロー',
          existingSystemFunctionDescription: '既存システムにおける請求書の承認ワークフロー機能',
          salesforceFunctionName: 'Approval Process',
          salesforceFunctionDescription: 'Salesforceの標準承認プロセス機能',
          mappingCorrespondenceStatus: 'カスタマイズ必要',
          customizationRequired: true,
          customizationContent: 'Salesforce標準承認プロセスでは条件付き承認パスが限定的であるため、Flow Builderを使用した複数承認経路の実装が必要。既存システムの4段階承認（部門長→課長→財務部長→CFO）をFlowで再現し、各段階で異なる承認条件を設定する。',
          priority: 1,
          riskEvaluation: '高',
          remarks: '既存システムの複雑な承認ロジックをSalesforceで実現するにはカスタマイズが不可欠',
        },
      ],
      projectContext: {
        projectId: 'PROJ-2026-001',
        targetSystemId: 'LEGACY-ERP-ORACLE',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0].isValid).toBe(true);
    expect(result.validationResults[0].errors).toHaveLength(0);
    expect(result.summary.totalErrorsDetected).toBe(0);
    expect(result.summary.successCount).toBeGreaterThanOrEqual(1);
  });
});
