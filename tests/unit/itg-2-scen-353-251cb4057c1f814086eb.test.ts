import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateCalculationLogicDefinitionsInput, ValidateCalculationLogicDefinitionsOutput } from '../../src/logic/data-validation-rules';
import type { CalculationLogicDefinition } from '../../src/logic/calculation-logic-mapper';
import type { SalesforceObjectDefinition, ProjectContext } from '../../src/logic/data-validation-rules';

describe('SCEN-353: 複数エラーが同一ロジック定義に検出される場合', () => {
  it('複数エラーを個別に集計して返す', async () => {
    // Preconditions
    const calculationLogicDefinitions: CalculationLogicDefinition[] = [
      {
        calculationLogicId: 'LOGIC-001',
        logicName: 'Invoice_Total_Amount',
        logicType: 'FieldFormula',
        targetObjectId: 'OBJ-001',
        targetFieldName: 'TotalAmount',
        existingSystemLogic: 'SUM(LineItems.Amount)',
        salesforceLogic: 'SUM(InvoiceLineItems__r.Amount__c)',
        referenceFieldList: ['Amount__c'],
        dependentLogicIds: []
      },
      {
        calculationLogicId: 'LOGIC-002',
        logicName: 'Invoice_Total_Amount', // Duplicate
        logicType: 'WorkflowRule',
        targetObjectId: 'OBJ-001',
        targetFieldName: 'TotalAmount',
        existingSystemLogic: 'SUM(LineItems.Amount)',
        salesforceLogic: 'SUM(InvoiceLineItems__r.Amount__c)',
        referenceFieldList: ['Amount__c'],
        dependentLogicIds: []
      },
      {
        calculationLogicId: 'LOGIC-003',
        logicName: 'LineItem_Tax_Calculation',
        logicType: 'ProcessBuilder',
        targetObjectId: 'OBJ-002',
        targetFieldName: 'TaxAmount__c',
        existingSystemLogic: 'Amount * 0.1',
        salesforceLogic: 'Amount__c * 0.10',
        referenceFieldList: ['NonExistentField__c'], // Field not found
        dependentLogicIds: ['LOGIC-999'] // Dependent logic not found
      }
    ];

    const objectDefinitions: SalesforceObjectDefinition[] = [
      {
        objectName: 'Invoice__c',
        objectDescription: '',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          { fieldName: 'TotalAmount', dataType: 'Number', required: false },
          { fieldName: 'Status__c', dataType: 'Picklist', required: false }
        ],
        recordCount: 0
      },
      {
        objectName: 'InvoiceLineItem__c',
        objectDescription: '',
        mappingTargetSalesforceObject: 'InvoiceLineItem__c',
        fields: [
          { fieldName: 'Amount__c', dataType: 'Number', required: false },
          { fieldName: 'LineNumber__c', dataType: 'Number', required: false }
        ],
        recordCount: 0
      }
    ];

    const projectContext: ProjectContext = {
      projectId: 'PROJ-001',
      targetSystemId: 'SYSTEM-ORACLE'
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
    expect(result.validationResults).toHaveLength(3);

    // LOGIC-001: Valid
    expect(result.validationResults[0].isValid).toBe(true);
    expect(result.validationResults[0].errors).toHaveLength(0);

    // LOGIC-002: Has DuplicateLogicNameInProject error
    expect(result.validationResults[1].isValid).toBe(false);
    expect(result.validationResults[1].errors.length).toBeGreaterThan(0);
    const logic2Errors = result.validationResults[1].errors;
    const hasDuplicateError = logic2Errors.some(e => e.errorCode === 'DuplicateLogicNameInProject');
    expect(hasDuplicateError).toBe(true);

    // LOGIC-003: Has multiple errors (ReferencedFieldNotFound and DependentLogicNotFound)
    expect(result.validationResults[2].isValid).toBe(false);
    expect(result.validationResults[2].errors.length).toBeGreaterThanOrEqual(2);
    const logic3Errors = result.validationResults[2].errors;
    const hasReferencedFieldNotFoundError = logic3Errors.some(e => e.errorCode === 'ReferencedFieldNotFound');
    const hasDependentLogicNotFoundError = logic3Errors.some(e => e.errorCode === 'DependentLogicNotFound');
    expect(hasReferencedFieldNotFoundError).toBe(true);
    expect(hasDependentLogicNotFoundError).toBe(true);

    // Summary
    expect(result.summary.totalObjectsValidated).toBe(3);
    expect(result.summary.successCount).toBe(1);
    expect(result.summary.errorCount).toBe(2);
    expect(result.summary.totalErrorsDetected).toBe(3);
  });
});
