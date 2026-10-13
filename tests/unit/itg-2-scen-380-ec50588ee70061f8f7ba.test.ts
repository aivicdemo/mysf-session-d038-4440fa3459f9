import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type { ValidateStandardFunctionMappingsInput, ValidateStandardFunctionMappingsOutput } from '../../src/logic/data-validation-rules';

describe('SCEN-380: 正常系：マッピング対応状況が完全対応の場合、カスタマイズ内容がなくても検証を通過する', () => {
  it('should pass validation when fully corresponding mapping has no customization content', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          mappingId: 'mapping-001',
          existingSystemFunctionName: '請求書作成',
          existingSystemFunctionDescription: '移行対象システムの請求書作成機能',
          salesforceFunctionName: 'Invoice__c',
          salesforceFunctionDescription: 'Salesforceカスタムオブジェクト請求書',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 1,
          riskEvaluation: '低',
        },
        {
          mappingId: 'mapping-002',
          existingSystemFunctionName: '請求明細照会',
          existingSystemFunctionDescription: '移行対象システムの請求明細照会機能',
          salesforceFunctionName: 'InvoiceLineItem__c',
          salesforceFunctionDescription: 'Salesforceカスタムオブジェクト請求明細',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 2,
          riskEvaluation: '低',
        },
      ],
      projectContext: {
        projectId: 'PROJ-2026-001',
        targetSystemId: 'ORACLE-BILLING-001',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(2);
    expect(result.validationResults[0].isValid).toBe(true);
    expect(result.validationResults[0].errors).toHaveLength(0);
    expect(result.validationResults[1].isValid).toBe(true);
    expect(result.validationResults[1].errors).toHaveLength(0);
    expect(result.summary.totalErrorsDetected).toBe(0);
  });
});
