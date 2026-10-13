import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateCalculationLogicDefinitionsInput, ValidateCalculationLogicDefinitionsOutput } from '../../src/logic/data-validation-rules';
import type { CalculationLogicDefinition } from '../../src/logic/calculation-logic-mapper';
import type { SalesforceObjectDefinition, ProjectContext } from '../../src/logic/data-validation-rules';

describe('SCEN-348: 計算ロジック定義に必須項目が不足している場合のエラー検出', () => {
  it('必須項目不足のロジック定義を検出', async () => {
    // Preconditions
    const calculationLogicDefinitions: CalculationLogicDefinition[] = [
      {
        calculationLogicId: 'logic-001',
        logicName: 'Invoice_Total_Calculation',
        logicType: 'FieldFormula',
        targetObjectId: 'obj-invoice',
        targetFieldName: 'Total_Amount',
        existingSystemLogic: 'SUM(line_items.amount)',
        salesforceLogic: 'SUM(line_items.amount)',
        referenceFieldList: ['line_items.amount'],
        dependentLogicIds: []
      },
      {
        calculationLogicId: 'logic-002',
        logicName: null as any,
        logicType: 'ProcessBuilder',
        targetObjectId: 'obj-invoice',
        targetFieldName: 'Status',
        existingSystemLogic: "IF status = 'approved' THEN 'ready_to_invoice'",
        salesforceLogic: "IF(Status__c = 'Approved', 'Ready_to_Invoice', Status__c)",
        referenceFieldList: ['Status'],
        dependentLogicIds: []
      },
      {
        calculationLogicId: 'logic-003',
        logicName: 'Tax_Calculation',
        logicType: 'Workflow',
        targetObjectId: 'obj-invoice-line',
        targetFieldName: null as any,
        existingSystemLogic: 'amount * 0.1',
        salesforceLogic: 'Amount__c * 0.1',
        referenceFieldList: ['Amount'],
        dependentLogicIds: []
      },
      {
        calculationLogicId: 'logic-004',
        logicName: 'Discount_Application',
        logicType: null as any,
        targetObjectId: 'obj-invoice',
        targetFieldName: 'Discount_Amount',
        existingSystemLogic: 'Total_Amount * discount_rate',
        salesforceLogic: 'Total_Amount__c * Discount_Rate__c',
        referenceFieldList: ['Total_Amount', 'Discount_Rate'],
        dependentLogicIds: []
      },
      {
        calculationLogicId: 'logic-005',
        logicName: 'Line_Item_Net_Amount',
        logicType: 'FieldFormula',
        targetObjectId: 'obj-invoice-line',
        targetFieldName: 'Net_Amount',
        existingSystemLogic: '(quantity * unit_price) - line_discount',
        salesforceLogic: '(Quantity__c * Unit_Price__c) - Line_Discount__c',
        referenceFieldList: [],
        dependentLogicIds: []
      }
    ];

    const objectDefinitions: SalesforceObjectDefinition[] = [
      {
        objectName: 'Invoice',
        objectDescription: '',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          { fieldName: 'Total_Amount', dataType: 'Number', required: false },
          { fieldName: 'Status', dataType: 'Text', required: false },
          { fieldName: 'Discount_Amount', dataType: 'Number', required: false }
        ],
        recordCount: 0
      },
      {
        objectName: 'InvoiceLine',
        objectDescription: '',
        mappingTargetSalesforceObject: 'InvoiceLine__c',
        fields: [
          { fieldName: 'Amount', dataType: 'Number', required: false },
          { fieldName: 'Net_Amount', dataType: 'Number', required: false },
          { fieldName: 'Quantity', dataType: 'Number', required: false },
          { fieldName: 'Unit_Price', dataType: 'Number', required: false },
          { fieldName: 'Line_Discount', dataType: 'Number', required: false }
        ],
        recordCount: 0
      }
    ];

    const projectContext: ProjectContext = {
      projectId: 'proj-sfdc-migration-001',
      targetSystemId: 'sys-oracle-erp'
    };

    const input: ValidateCalculationLogicDefinitionsInput = {
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext
    };

    // Execute
    const result: ValidateCalculationLogicDefinitionsOutput = await validateCalculationLogicDefinitions(input);

    // Expected Result
    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(5);

    // logic-001: should be valid
    expect(result.validationResults[0].isValid).toBe(true);
    expect(result.validationResults[0].errors).toHaveLength(0);

    // logic-002: logicName is null
    expect(result.validationResults[1].isValid).toBe(false);
    expect(result.validationResults[1].errors.length).toBeGreaterThan(0);
    expect(result.validationResults[1].errors[0].errorCode).toBe('MissingRequiredLogicDefinition');

    // logic-003: targetFieldName is null
    expect(result.validationResults[2].isValid).toBe(false);
    expect(result.validationResults[2].errors.length).toBeGreaterThan(0);
    expect(result.validationResults[2].errors[0].errorCode).toBe('MissingRequiredLogicDefinition');

    // logic-004: logicType is null
    expect(result.validationResults[3].isValid).toBe(false);
    expect(result.validationResults[3].errors.length).toBeGreaterThan(0);
    expect(result.validationResults[3].errors[0].errorCode).toBe('MissingRequiredLogicDefinition');

    // logic-005: referencedFields is empty
    expect(result.validationResults[4].isValid).toBe(false);
    expect(result.validationResults[4].errors.length).toBeGreaterThan(0);
    expect(result.validationResults[4].errors[0].errorCode).toBe('MissingRequiredLogicDefinition');

    // Summary
    expect(result.summary.totalObjectsValidated).toBe(5);
    expect(result.summary.successCount).toBe(1);
    expect(result.summary.errorCount).toBe(4);
    expect(result.summary.totalErrorsDetected).toBe(4);
  });
});
