import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';
import type {
  ValidateCalculationLogicDefinitionsInput,
  SalesforceObjectDefinition,
} from '../../src/logic/data-validation-rules';
import type { CalculationLogicDefinition } from '../../src/logic/calculation-logic-mapper';

describe('SCEN-341: All calculation logic definitions are valid and consistent', () => {
  it('should validate all calculation logic definitions with no errors', async () => {
    const objectDefinitions: SalesforceObjectDefinition[] = [
      {
        objectName: 'Invoice__c',
        objectDescription: '請求書オブジェクト',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          { fieldName: 'Total_Amount__c', dataType: 'Currency', required: false },
          { fieldName: 'Tax_Amount__c', dataType: 'Currency', required: false },
        ],
        recordCount: 100,
      },
      {
        objectName: 'Invoice_Line_Item__c',
        objectDescription: '請求明細オブジェクト',
        mappingTargetSalesforceObject: 'Invoice_Line_Item__c',
        fields: [
          { fieldName: 'Amount__c', dataType: 'Currency', required: false },
          { fieldName: 'Quantity__c', dataType: 'Number', required: true },
          { fieldName: 'Unit_Price__c', dataType: 'Currency', required: true },
          { fieldName: 'Extended_Price__c', dataType: 'Currency', required: false },
        ],
        recordCount: 300,
      },
    ];

    const calculationLogicDefinitions: CalculationLogicDefinition[] = [
      {
        calculationLogicId: 'CL-001',
        logicName: 'Invoice_Total_Amount',
        logicType: 'field_calculation',
        targetObjectId: 'OBJ-INV',
        targetFieldName: 'Total_Amount__c',
        existingSystemLogic: 'SUM(line_items.amount)',
        salesforceLogic: 'ROLLUP(Invoice_Line_Item__r, SUM, Amount__c)',
        referenceFieldList: ['Invoice_Line_Item__r.Amount__c'],
        dependentLogicIds: [],
      },
      {
        calculationLogicId: 'CL-002',
        logicName: 'Line_Item_Extended_Price',
        logicType: 'field_calculation',
        targetObjectId: 'OBJ-INVLINE',
        targetFieldName: 'Extended_Price__c',
        existingSystemLogic: 'quantity * unit_price',
        salesforceLogic: 'Quantity__c * Unit_Price__c',
        referenceFieldList: ['Quantity__c', 'Unit_Price__c'],
        dependentLogicIds: [],
      },
      {
        calculationLogicId: 'CL-003',
        logicName: 'Invoice_Tax_Amount',
        logicType: 'workflow_rule',
        targetObjectId: 'OBJ-INV',
        targetFieldName: 'Tax_Amount__c',
        existingSystemLogic: 'Total_Amount * tax_rate',
        salesforceLogic: 'Total_Amount__c * 0.1',
        referenceFieldList: ['Total_Amount__c'],
        dependentLogicIds: ['CL-001'],
      },
    ];

    const input: ValidateCalculationLogicDefinitionsInput = {
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext: {
        projectId: 'PROJ-2026-SF-REPLACE',
        targetSystemId: 'SYS-LEGACY-ERP',
      },
    };

    const result = await validateCalculationLogicDefinitions(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(3);

    result.validationResults.forEach((validation) => {
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings || []).toHaveLength(0);
    });

    expect(result.summary.totalObjectsValidated).toBe(3);
    expect(result.summary.successCount).toBe(3);
    expect(result.summary.errorCount).toBe(0);
    expect(result.summary.totalErrorsDetected).toBe(0);
  });
});
