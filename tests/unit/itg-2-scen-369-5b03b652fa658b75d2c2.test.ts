import { validateStandardFunctionMappings } from '../../src/logic/data-validation-rules';

describe('SCEN-369: 必須フィールド不足エラーが発生する', () => {
  it('Salesforce標準機能名が空のとき、InvalidMappingDefinitionStructure エラーが発生する', async () => {
    const projectContext: any = {
      projectId: 'PROJ-2025-001',
      targetSystemId: 'ORACLE-BILLING',
    };

    const standardFunctionMappings: any[] = [
      {
        mappingId: 'mapping-001',
        existingSystemFunctionName: '請求書作成',
        existingSystemFunctionDescription: 'Oracle請求書作成機能',
        salesforceFunctionName: '',
        salesforceFunctionDescription: 'Salesforce請求書オブジェクト',
        mappingCorrespondenceStatus: '完全対応',
        customizationRequired: false,
        customizationContent: '',
        priority: 1,
        riskEvaluation: '低',
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
    const hasInvalidMappingDefinitionStructure = firstResult.errors.some(
      e =>
        e.errorCode === 'InvalidMappingDefinitionStructure' &&
        e.errorMessage === '標準機能マッピング定義の必須フィールドが不足しています。既存システム機能名、Salesforce標準機能名、マッピング対応状況は必須です。'
    );

    expect(hasInvalidMappingDefinitionStructure).toBe(true);
    expect(result.summary.isValid).toBe(false);
  });
});
