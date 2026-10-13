import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type { ValidateStandardFunctionMappingsInput, ValidateStandardFunctionMappingsOutput } from '../../src/logic/data-validation-rules';

describe('SCEN-381: 正常系：複数の標準機能マッピング定義が渡された場合、全件の検証結果を配列で返す', () => {
  it('should return validation results for all three mappings', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          mappingId: 'mapping-001',
          existingSystemFunctionName: '請求書作成',
          existingSystemFunctionDescription: '請求書を新規作成する機能',
          salesforceFunctionName: 'Invoice__c レコード作成',
          salesforceFunctionDescription: 'Salesforceカスタムオブジェクト請求書を作成',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 1,
          riskEvaluation: '低',
        },
        {
          mappingId: 'mapping-002',
          existingSystemFunctionName: '請求明細管理',
          existingSystemFunctionDescription: '請求書に紐付く明細行を管理',
          salesforceFunctionName: 'Invoice_Line_Item__c レコード管理',
          salesforceFunctionDescription: 'Salesforceカスタムオブジェクト請求明細を管理',
          mappingCorrespondenceStatus: '部分対応',
          customizationRequired: true,
          customizationContent: '数量単位の変換ロジックをカスタマイズ必要',
          priority: 2,
          riskEvaluation: '中',
        },
        {
          mappingId: 'mapping-003',
          existingSystemFunctionName: '承認フロー',
          existingSystemFunctionDescription: '請求書の承認プロセス',
          salesforceFunctionName: 'Approval Process',
          salesforceFunctionDescription: 'Salesforce標準承認プロセス機能',
          mappingCorrespondenceStatus: 'カスタマイズ必要',
          customizationRequired: true,
          customizationContent: '複数段階承認フローの設定、承認者の条件分岐ロジック',
          priority: 3,
          riskEvaluation: '高',
        },
      ],
      projectContext: {
        projectId: 'PROJECT-2026-01',
        targetSystemId: 'ORACLE-BILLING-V10',
      },
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(3);
    expect(result.validationResults[0].mappingId).toBe('mapping-001');
    expect(result.validationResults[0].isValid).toBe(true);
    expect(result.validationResults[1].mappingId).toBe('mapping-002');
    expect(result.validationResults[1].isValid).toBe(true);
    expect(result.validationResults[2].mappingId).toBe('mapping-003');
    expect(result.validationResults[2].isValid).toBe(true);
    expect(result.summary.totalErrorsDetected).toBe(0);
  });
});
