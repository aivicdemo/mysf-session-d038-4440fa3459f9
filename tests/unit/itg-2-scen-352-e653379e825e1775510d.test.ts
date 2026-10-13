import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateCalculationLogicDefinitionsInput, ValidateCalculationLogicDefinitionsOutput } from '../../src/logic/data-validation-rules';
import type { SalesforceObjectDefinition, ProjectContext } from '../../src/logic/data-validation-rules';

describe('SCEN-352: 空の計算ロジック定義配列の検証', () => {
  it('検証対象の計算ロジック定義が空の配列である場合、すべての検証に合格し、成功件数が0となる', async () => {
    // 前提条件の準備
    const projectContext: ProjectContext = {
      projectId: 'PROJ001',
      targetSystemId: 'SYS001',
    };

    const calculationLogicDefinitions: any[] = [];

    const objectDefinitions: SalesforceObjectDefinition[] = [
      {
        objectName: 'Invoice',
        objectDescription: 'Invoice object',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          {
            fieldName: 'Amount',
            dataType: 'Number',
            required: true,
          },
        ],
        recordCount: 0,
      },
    ];

    const input: ValidateCalculationLogicDefinitionsInput = {
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext,
    };

    // 関数を実行
    const result: ValidateCalculationLogicDefinitionsOutput = await validateCalculationLogicDefinitions(input);

    // 期待結果の検証
    expect(result.isValid).toBe(true);
    expect(result.validationResults).toEqual([]);

    expect(result.summary.totalObjectsValidated).toBe(0);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(0);
  });
});
