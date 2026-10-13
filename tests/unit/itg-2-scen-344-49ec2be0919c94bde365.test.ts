import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-344: 計算ロジック間に循環依存が存在する場合、CircularDependencyDetectedエラーが検出される', () => {
  it('should detect CircularDependencyDetected error when circular dependency exists among calculation logics', async () => {
    const calculationLogicDefinitions = [
      {
        calculationLogicId: 'LOGIC-001',
        logicName: 'InvoiceAmountCalculation',
        logicType: 'FieldCalculation',
        targetObjectId: 'OBJ-INVOICE',
        targetFieldName: 'TotalAmount',
        existingSystemLogic: 'SUM(line_items.amount)',
        salesforceLogic: 'SUM(Invoice_Line_Items__r.Amount__c)',
        referencedFields: ['Invoice_Line_Items__r.Amount__c'],
        dependentLogicIds: ['LOGIC-002'],
      },
      {
        calculationLogicId: 'LOGIC-002',
        logicName: 'LineItemTaxCalculation',
        logicType: 'FieldCalculation',
        targetObjectId: 'OBJ-INVOICE-LINE',
        targetFieldName: 'TaxAmount',
        existingSystemLogic: 'line_item.amount * 0.1',
        salesforceLogic: 'Amount__c * 0.1',
        referencedFields: ['Amount__c'],
        dependentLogicIds: ['LOGIC-003'],
      },
      {
        calculationLogicId: 'LOGIC-003',
        logicName: 'DiscountCalculation',
        logicType: 'ProcessBuilder',
        targetObjectId: 'OBJ-INVOICE-LINE',
        targetFieldName: 'DiscountAmount',
        existingSystemLogic: 'line_item.amount * discount_rate',
        salesforceLogic: 'Amount__c * Discount_Rate__c',
        referencedFields: ['Amount__c', 'Discount_Rate__c'],
        dependentLogicIds: ['LOGIC-001'],
      },
    ];

    const objectDefinitions = [
      {
        objectId: 'OBJ-INVOICE',
        objectName: 'Invoice__c',
        fields: [
          { fieldName: 'TotalAmount', dataType: 'Currency', required: false },
          { fieldName: 'Invoice_Line_Items__r', dataType: 'Lookup', required: false },
        ],
      },
      {
        objectId: 'OBJ-INVOICE-LINE',
        objectName: 'Invoice_Line_Item__c',
        fields: [
          { fieldName: 'Amount__c', dataType: 'Currency', required: true },
          { fieldName: 'TaxAmount', dataType: 'Currency', required: false },
          { fieldName: 'DiscountAmount', dataType: 'Currency', required: false },
          { fieldName: 'Discount_Rate__c', dataType: 'Percent', required: false },
        ],
      },
    ];

    const projectContext = {
      projectId: 'PROJECT-BILLING-001',
      targetSystemId: 'LEGACY-ERP-001',
    };

    const result = await validateCalculationLogicDefinitions({
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationResults.length).toBeGreaterThanOrEqual(3);

    const circularDependencyErrors = result.validationResults
      .flatMap((vr) => vr.errors)
      .filter((e) => e.errorCode === 'CircularDependencyDetected');

    expect(circularDependencyErrors.length).toBeGreaterThanOrEqual(1);

    const circularErrorMessage = circularDependencyErrors[0]?.errorMessage || '';
    expect(circularErrorMessage).toContain('計算ロジック間に循環依存が検出されました');
    expect(circularErrorMessage).toContain('LOGIC-001');
    expect(circularErrorMessage).toContain('LOGIC-002');
    expect(circularErrorMessage).toContain('LOGIC-003');

    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
