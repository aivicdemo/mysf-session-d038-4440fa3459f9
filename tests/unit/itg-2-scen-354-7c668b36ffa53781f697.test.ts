import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateCalculationLogicDefinitionsInput, ValidateCalculationLogicDefinitionsOutput } from '../../src/logic/data-validation-rules';
import type { CalculationLogicDefinition } from '../../src/logic/calculation-logic-mapper';
import type { SalesforceObjectDefinition, ProjectContext } from '../../src/logic/data-validation-rules';

describe('SCEN-354: 複数ロジックに異なるエラーが検出される場合の個別集計', () => {
  it('各ロジック定義のエラーが個別に集計される', async () => {
    // Preconditions
    const calculationLogicDefinitions: CalculationLogicDefinition[] = [
      {
        calculationLogicId: 'logic-001',
        logicName: 'Invoice_Total_Calculation',
        logicType: 'Field Calculation',
        targetObjectId: 'obj-invoice',
        targetFieldName: 'total_amount',
        existingSystemLogic: 'SELECT SUM(amount) FROM invoice_lines WHERE invoice_id = :invoiceId',
        salesforceLogic: 'SUM(invoice_lines__r.amount)',
        referenceFieldList: ['amount'],
        dependentLogicIds: []
      },
      {
        calculationLogicId: 'logic-002',
        logicName: 'Invoice_Tax_Calculation',
        logicType: 'Workflow',
        targetObjectId: 'obj-invoice',
        targetFieldName: 'tax_amount',
        existingSystemLogic: 'total_amount * 0.1',
        salesforceLogic: 'total_amount__c * 0.1',
        referenceFieldList: ['total_amount'],
        dependentLogicIds: ['logic-001']
      },
      {
        calculationLogicId: 'logic-003',
        logicName: 'Invoice_Line_Subtotal',
        logicType: 'Process Builder',
        targetObjectId: 'obj-invoice-line',
        targetFieldName: 'subtotal',
        existingSystemLogic: 'quantity * unit_price',
        salesforceLogic: 'quantity__c * unit_price__c',
        referenceFieldList: ['quantity', 'unit_price'],
        dependentLogicIds: []
      }
    ];

    const objectDefinitions: SalesforceObjectDefinition[] = [
      {
        objectName: 'Invoice',
        objectDescription: '',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          { fieldName: 'total_amount', dataType: 'Number', required: false },
          { fieldName: 'tax_amount', dataType: 'Number', required: false }
        ],
        recordCount: 0
      },
      {
        objectName: 'InvoiceLine',
        objectDescription: '',
        mappingTargetSalesforceObject: 'InvoiceLine__c',
        fields: [
          { fieldName: 'amount', dataType: 'Number', required: false },
          { fieldName: 'quantity', dataType: 'Number', required: false },
          { fieldName: 'unit_price', dataType: 'Number', required: false },
          { fieldName: 'subtotal', dataType: 'Number', required: false }
        ],
        recordCount: 0
      }
    ];

    const projectContext: ProjectContext = {
      projectId: 'proj-sfdc-replace-001',
      targetSystemId: 'source-erp-001'
    };

    const input: ValidateCalculationLogicDefinitionsInput = {
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext
    };

    // Execute
    const result: ValidateCalculationLogicDefinitionsOutput = await validateCalculationLogicDefinitions(input);

    // Expected Result
    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(3);

    // logic-001: Valid
    expect(result.validationResults[0].isValid).toBe(true);
    expect(result.validationResults[0].errors).toHaveLength(0);

    // logic-002: Valid (dependency exists)
    expect(result.validationResults[1].isValid).toBe(true);
    expect(result.validationResults[1].errors).toHaveLength(0);

    // logic-003: Valid
    expect(result.validationResults[2].isValid).toBe(true);
    expect(result.validationResults[2].errors).toHaveLength(0);

    // Summary
    expect(result.summary.totalObjectsValidated).toBe(3);
    expect(result.summary.successCount).toBe(3);
    expect(result.summary.errorCount).toBe(0);
  });
});
