import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-349: 計算ロジック種別が許可された値に該当しない場合、InvalidLogicTypeエラーが検出される', () => {
  it('should detect InvalidLogicType error when logic type is not a valid value', async () => {
    const calculationLogicDefinitions = [
      {
        calculationLogicId: 'CALC-001',
        logicName: 'Invoice_Total_Amount',
        logicType: 'INVALID_TYPE',
        targetObjectId: 'OBJ-001',
        targetFieldName: 'Total_Amount__c',
        existingSystemLogic: 'SUM(line_items.amount)',
        salesforceLogic: 'SUM(Invoice_Line_Items__r.Amount__c)',
        referencedFields: [{ fieldName: 'Amount__c', objectName: 'Invoice_Line_Items__c' }],
        dependentLogicIds: [],
      },
    ];

    const objectDefinitions = [
      {
        objectId: 'OBJ-001',
        objectName: 'Invoice__c',
        fields: [
          { fieldName: 'Total_Amount__c', dataType: 'Currency' },
        ],
      },
      {
        objectId: 'OBJ-002',
        objectName: 'Invoice_Line_Items__c',
        fields: [
          { fieldName: 'Amount__c', dataType: 'Currency' },
        ],
      },
    ];

    const projectContext = {
      projectId: 'PROJ-001',
      targetSystemId: 'ORACLE-ERP',
    };

    const result = await validateCalculationLogicDefinitions({
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext,
    });

    expect(result.isValid).toBe(false);

    const validationResult = result.validationResults.find(
      (r) => r.logicName === 'Invoice_Total_Amount'
    );
    expect(validationResult).toBeDefined();
    expect(validationResult?.isValid).toBe(false);

    const invalidLogicTypeError = validationResult?.errors.find(
      (e) => e.errorCode === 'InvalidLogicType'
    );
    expect(invalidLogicTypeError).toBeDefined();
    expect(invalidLogicTypeError?.errorMessage).toBe(
      "計算ロジック 'Invoice_Total_Amount' のロジック種別 'INVALID_TYPE' は無効です。"
    );

    expect(result.summary.totalDetectedErrorCount).toBeGreaterThanOrEqual(1);
    expect(result.summary.successCount).toBe(0);
  });
});
