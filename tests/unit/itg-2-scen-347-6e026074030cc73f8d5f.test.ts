import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-347: 計算ロジックの対象フィールド名が対象オブジェクト内に存在しない場合、TargetFieldNotFoundInObjectエラーが検出される', () => {
  it('should detect TargetFieldNotFoundInObject error when target field does not exist in target object', async () => {
    const calculationLogicDefinitions = [
      {
        calculationLogicId: 'CALC-001',
        logicName: 'Invoice_Total_Amount',
        logicType: 'FieldFormula',
        targetObjectId: 'OBJ-INV',
        targetFieldName: 'Total_Amount__c',
        existingSystemLogic: 'SUM(line_item_amounts)',
        salesforceLogic: 'Amount__c + Tax__c',
        referencedFields: ['Amount__c', 'Tax__c'],
        dependentLogicIds: [],
      },
    ];

    const objectDefinitions = [
      {
        objectId: 'OBJ-INV',
        objectName: 'Invoice__c',
        fields: [
          { fieldName: 'Amount__c', dataType: 'Currency', required: false },
          { fieldName: 'Tax__c', dataType: 'Currency', required: false },
        ],
      },
    ];

    const projectContext = {
      projectId: 'PROJ-2025-001',
      targetSystemId: 'LEGACY-SYS-001',
    };

    const result = await validateCalculationLogicDefinitions({
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationResults.length).toBeGreaterThanOrEqual(1);

    const validationResult = result.validationResults[0];
    expect(validationResult.isValid).toBe(false);

    const targetFieldError = validationResult.errors.find(
      (e) => e.errorCode === 'TargetFieldNotFoundInObject'
    );
    expect(targetFieldError).toBeDefined();
    expect(targetFieldError?.errorMessage).toBe(
      "計算ロジック 'Invoice_Total_Amount' の対象フィールド 'Total_Amount__c' がオブジェクト 'Invoice__c' に見つかりません。"
    );

    expect(result.summary.validationTargetCount).toBe(1);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(1);
    expect(result.summary.totalDetectedErrorCount).toBe(1);
  });
});
