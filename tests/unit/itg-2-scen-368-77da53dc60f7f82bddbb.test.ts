import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';

describe('SCEN-368: 正常系で全ての必須フィールドが正しく定義された標準機能マッピングが検証を通過する', () => {
  it('3件の有効な標準機能マッピングが検証を通過する', async () => {
    const projectContext: any = {
      projectId: 'proj-salesforce-001',
      targetSystemId: 'oracle-erp-01',
    };

    const standardFunctionMappings: any[] = [
      {
        mappingId: 'mapping-001',
        existingSystemFunctionName: '請求書作成',
        existingSystemFunctionDescription: 'Oracle ERP請求書作成機能',
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
        existingSystemFunctionName: '請求明細計算',
        existingSystemFunctionDescription: 'Oracle請求明細の金額計算機能',
        salesforceFunctionName: 'InvoiceLineItem__c',
        salesforceFunctionDescription: 'Salesforceカスタムオブジェクト請求明細',
        mappingCorrespondenceStatus: '部分対応',
        customizationRequired: true,
        customizationContent: 'ロールアップ集計機能をカスタマイズで実装',
        priority: 2,
        riskEvaluation: '中',
      },
      {
        mappingId: 'mapping-003',
        existingSystemFunctionName: '承認フロー',
        existingSystemFunctionDescription: 'Oracle請求承認ワークフロー',
        salesforceFunctionName: 'Approval',
        salesforceFunctionDescription: 'Salesforce標準承認プロセス',
        mappingCorrespondenceStatus: 'カスタマイズ必要',
        customizationRequired: true,
        customizationContent: '複数段階承認ロジックをフロー/プロセスビルダーで構築',
        priority: 3,
        riskEvaluation: '高',
      },
    ];

    const input: any = {
      standardFunctionMappings,
      projectContext,
    };

    const result = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults.length).toBe(3);
    expect(result.validationResults.every(vr => vr.isValid)).toBe(true);
    expect(result.summary).toBeDefined();
  });
});
