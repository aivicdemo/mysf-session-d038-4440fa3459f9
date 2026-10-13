import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';

describe('SCEN-370: マッピング対応状況が定義済みの値以外のエラー', () => {
  it('マッピング対応状況が「無効な値」のとき、InvalidMappingCorrespondenceStatus エラーが発生する', async () => {
    const projectContext: any = {
      projectId: 'PROJ-001',
      targetSystemId: 'ORACLE-BILLING-001',
    };

    const standardFunctionMappings: any[] = [
      {
        existingSystemFunctionName: '請求書作成',
        existingSystemFunctionDescription: 'Oracle請求書作成機能',
        salesforceFunctionName: 'Invoice__c',
        salesforceFunctionDescription: 'Salesforceカスタムオブジェクト請求書',
        mappingCorrespondenceStatus: '無効な値',
        customizationRequired: false,
        customizationContent: '',
        priority: 1,
        riskEvaluation: '低',
        remarks: 'テスト用マッピング',
      },
    ];

    const input: any = {
      standardFunctionMappings,
      projectContext,
    };

    const result = await validateStandardFunctionMappings(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults.length).toBeGreaterThanOrEqual(1);

    const firstResult = result.validationResults[0];
    const hasInvalidCorrespondenceStatus = firstResult.errors.some(
      e =>
        e.errorCode === 'InvalidMappingCorrespondenceStatus' &&
        e.errorMessage === 'マッピング対応状況は「完全対応」「部分対応」「カスタマイズ必要」「非対応」のいずれかである必要があります。'
    );

    expect(hasInvalidCorrespondenceStatus).toBe(true);
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
