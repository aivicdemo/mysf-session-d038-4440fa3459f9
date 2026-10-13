import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-343: 計算ロジックが参照するフィールドがオブジェクト定義に存在しない場合、ReferencedFieldNotFoundエラーが検出される', () => {
  it('should detect ReferencedFieldNotFound error when referenced field does not exist in object definition', async () => {
    const calculationLogicDefinitions = [
      {
        calculationLogicId: 'CALC-001',
        logicName: 'InvoiceLineAmountCalculation',
        logicType: 'フィールド計算式',
        targetObjectId: 'OBJ-INVOICE-LINE',
        targetFieldName: 'LineAmount',
        existingSystemLogic: 'quantity * unit_price',
        salesforceLogic: 'Quantity__c * UnitPrice__c',
        referencedFields: ['Quantity__c', 'UnitPrice__c', 'NonExistentField__c'],
        dependentLogicIds: [],
      },
    ];

    const objectDefinitions = [
      {
        objectId: 'OBJ-INVOICE-LINE',
        objectName: 'Invoice_Line__c',
        fields: [
          { fieldName: 'Quantity__c', dataType: 'Number', required: false },
          { fieldName: 'UnitPrice__c', dataType: 'Currency', required: false },
          { fieldName: 'LineAmount', dataType: 'Currency', required: false },
        ],
      },
    ];

    const projectContext = {
      projectId: 'PRJ-2026-001',
      sourceSystemId: 'ORACLE-BILLING',
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

    const referencedFieldError = validationResult.errors.find(
      (e) => e.errorCode === 'ReferencedFieldNotFound'
    );
    expect(referencedFieldError).toBeDefined();
    expect(referencedFieldError?.errorMessage).toBe(
      "計算ロジック 'InvoiceLineAmountCalculation' が参照するフィールド 'NonExistentField__c' がオブジェクト 'Invoice_Line__c' に見つかりません。"
    );

    expect(result.summary.validationTargetCount).toBe(1);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(1);
    expect(result.summary.totalDetectedErrorCount).toBe(1);
  });
});
