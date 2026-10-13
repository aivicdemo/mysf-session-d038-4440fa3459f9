import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-346: 計算ロジックの対象オブジェクトIDがオブジェクト定義一覧に存在しない場合、TargetObjectNotFoundエラーが検出される', () => {
  it('should detect TargetObjectNotFound error when target object ID does not exist in object definitions', async () => {
    const calculationLogicDefinitions = [
      {
        calculationLogicId: 'CALC-001',
        logicName: 'Invoice_Total_Amount',
        logicType: 'FieldFormula',
        targetObjectId: 'OBJ-999',
        targetFieldName: 'total_amount',
        existingSystemLogic: 'SUM(line_items.amount)',
        salesforceLogic: 'SUMPRODUCT(related_list:line_items.amount)',
        referencedFields: [{ fieldName: 'line_item_amount', objectId: 'OBJ-LINES' }],
        dependentLogicIds: [],
      },
    ];

    const objectDefinitions = [
      {
        objectId: 'OBJ-INVOICE',
        objectName: 'Invoice',
        fields: [
          { fieldName: 'id', dataType: 'String' },
          { fieldName: 'total_amount', dataType: 'Decimal' },
        ],
      },
      {
        objectId: 'OBJ-LINES',
        objectName: 'InvoiceLine',
        fields: [
          { fieldName: 'line_item_amount', dataType: 'Decimal' },
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
    expect(result.validationResults.length).toBeGreaterThanOrEqual(1);

    const validationResult = result.validationResults[0];
    expect(validationResult.isValid).toBe(false);

    const targetObjectError = validationResult.errors.find(
      (e) => e.errorCode === 'TargetObjectNotFound'
    );
    expect(targetObjectError).toBeDefined();
    expect(targetObjectError?.errorMessage).toBe(
      "計算ロジック 'Invoice_Total_Amount' の対象オブジェクトID 'OBJ-999' が見つかりません。"
    );

    expect(result.summary.validationTargetCount).toBe(1);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(1);
    expect(result.summary.totalDetectedErrorCount).toBe(1);
  });
});
