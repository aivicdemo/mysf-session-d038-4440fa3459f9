import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';

describe('SCEN-371: カスタマイズ必要がtrueなのにカスタマイズ内容が空のエラー', () => {
  it('customizationRequired が true で customizationContent が空のとき、InvalidCustomizationContentConsistency エラーが発生する', async () => {
    const projectContext: any = {
      projectId: 'PROJ-2025-001',
      targetSystemId: 'ORACLE-ERP-001',
    };

    const standardFunctionMappings: any[] = [
      {
        mappingId: 'mapping-001',
        existingSystemFunctionName: '請求書作成',
        existingSystemFunctionDescription: 'Oracle ERPでの請求書作成機能',
        salesforceFunctionName: 'レコード作成',
        salesforceFunctionDescription: 'Salesforceでのレコード作成機能',
        mappingCorrespondenceStatus: 'カスタマイズ必要',
        customizationRequired: true,
        customizationContent: '',
        priority: 1,
        riskEvaluation: '高',
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
    const hasInvalidCustomizationContent = firstResult.errors.some(
      e =>
        e.errorCode === 'InvalidCustomizationContentConsistency' &&
        e.errorMessage === 'カスタマイズが必要な場合、カスタマイズ内容を記入してください。'
    );

    expect(hasInvalidCustomizationContent).toBe(true);
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
