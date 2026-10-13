import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-345: 計算ロジックが依存する別のロジックIDが存在しない場合、DependentLogicNotFoundエラーが検出される', () => {
  it('should detect DependentLogicNotFound error when dependent logic ID does not exist', async () => {
    const calculationLogicDefinitions = [
      {
        calculationLogicId: 'LOGIC-001',
        logicName: 'InvoiceAmount',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice',
        targetFieldName: 'TotalAmount',
        existingSystemLogic: 'SELECT SUM(quantity * unit_price) FROM invoice_items',
        salesforceLogic: 'SUM(invoice_items__r.Amount)',
        referencedFields: [
          { fieldName: 'quantity', objectName: 'InvoiceLineItem' },
          { fieldName: 'unit_price', objectName: 'InvoiceLineItem' },
        ],
        dependentLogicIds: ['LOGIC-999'],
      },
    ];

    const objectDefinitions = [
      {
        objectId: 'Invoice',
        objectName: 'Invoice',
        fields: [
          { fieldName: 'TotalAmount', dataType: 'Currency' },
        ],
      },
      {
        objectId: 'InvoiceLineItem',
        objectName: 'InvoiceLineItem',
        fields: [
          { fieldName: 'quantity', dataType: 'Number' },
          { fieldName: 'unit_price', dataType: 'Currency' },
        ],
      },
    ];

    const projectContext = {
      projectId: 'PROJ-001',
      targetSystemId: 'SYS-ORACLE-BILLING',
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

    const dependentLogicError = validationResult.errors.find(
      (e) => e.errorCode === 'DependentLogicNotFound'
    );
    expect(dependentLogicError).toBeDefined();
    expect(dependentLogicError?.errorMessage).toBe(
      "計算ロジック 'InvoiceAmount' が依存するロジックID 'LOGIC-999' が見つかりません。"
    );

    expect(result.summary.totalDetectedErrorCount).toBe(1);
  });
});
