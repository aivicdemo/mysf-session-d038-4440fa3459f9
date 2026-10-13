import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';
import type { ValidateStandardFunctionMappingsInput, ValidateStandardFunctionMappingsOutput } from '../../src/logic/data-validation-rules';

describe('SCEN-383: 正常系：検証結果の集計サマリーに成功件数・失敗件数が正しく反映される', () => {
  it('should correctly reflect success and failure counts in summary', async () => {
    const input: ValidateStandardFunctionMappingsInput = {
      standardFunctionMappings: [
        {
          mappingId: 'mapping-001',
          existingSystemFunctionName: '請求書作成',
          existingSystemFunctionDescription: 'Oracle ERP内での請求書作成機能',
          salesforceFunctionName: 'Invoice__c',
          salesforceFunctionDescription: 'Salesforce請求書カスタムオブジェクト',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 1,
          riskEvaluation: '低',
        },
        {
          mappingId: 'mapping-002',
          existingSystemFunctionName: '請求明細参照',
          existingSystemFunctionDescription: 'Oracle ERP内での請求明細参照機能',
          salesforceFunctionName: 'InvoiceLineItem__c',
          salesforceFunctionDescription: 'Salesforce請求明細カスタムオブジェクト',
          mappingCorrespondenceStatus: '部分対応',
          customizationRequired: true,
          customizationContent: '税計算ロジックをカスタマイズして実装が必要',
          priority: 2,
          riskEvaluation: '中',
        },
        {
          mappingId: 'mapping-003',
          existingSystemFunctionName: '承認フロー',
          existingSystemFunctionDescription: 'Oracle ERPでの多段階承認ワークフロー',
          salesforceFunctionName: 'ApprovalProcess',
          salesforceFunctionDescription: 'Salesforce標準承認プロセス',
          mappingCorrespondenceStatus: 'カスタマイズ必要',
          customizationRequired: true,
          customizationContent: '複雑な承認ルールをフロー定義で実装',
          priority: 3,
          riskEvaluation: '高',
        },
        {
          mappingId: 'mapping-004',
          existingSystemFunctionName: 'レポート出力',
          existingSystemFunctionDescription: 'Oracle ERPでの複合レポート出力機能',
          salesforceFunctionName: 'Lightning Reports',
          salesforceFunctionDescription: 'Salesforce標準レポート機能',
          mappingCorrespondenceStatus: '非対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 4,
          riskEvaluation: '低',
        },
        {
          mappingId: 'mapping-005',
          existingSystemFunctionName: '通知機能',
          existingSystemFunctionDescription: 'Oracle ERP内でのメール通知',
          salesforceFunctionName: 'EmailAlert',
          salesforceFunctionDescription: 'Salesforce標準メールアラート',
          mappingCorrespondenceStatus: '完全対応',
          customizationRequired: false,
          customizationContent: '',
          priority: 2,
          riskEvaluation: '低',
        },
      ],
      projectContext: {
        projectId: 'PROJ-2026-001',
        targetSystemId: 'ORACLE-ERP-001',
        projectName: 'Salesforce リプレース移行',
        targetSystemName: 'Oracle ERP',
      } as any,
    };

    const result: ValidateStandardFunctionMappingsOutput = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(5);
    expect(result.summary.successCount).toBe(5);
    expect(result.summary.errorCount).toBe(0);
    expect(result.summary.totalErrorsDetected).toBe(0);
    result.validationResults.forEach((validationResult) => {
      expect(validationResult.isValid).toBe(true);
    });
  });
});
