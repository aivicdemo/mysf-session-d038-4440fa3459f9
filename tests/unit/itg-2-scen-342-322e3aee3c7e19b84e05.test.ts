import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-342: 計算ロジック式の構文が不正である場合、InvalidCalculationLogicSyntaxエラーが検出される', () => {
  it('should detect InvalidCalculationLogicSyntax error when formula syntax is invalid', async () => {
    const calculationLogicDefinitions = [
      {
        calculationLogicId: 'CALC-001',
        logicName: 'InvalidSyntaxFormula',
        logicType: 'FieldCalculation',
        targetObjectId: 'OBJ-001',
        targetFieldName: 'Amount',
        existingSystemLogic: 'Price * Qty',
        salesforceLogic: 'Price__c * Qty__c +',
        referencedFields: ['Price__c', 'Qty__c'],
        dependentLogicIds: [],
      },
    ];

    const objectDefinitions = [
      {
        objectId: 'OBJ-001',
        objectName: 'Invoice',
        fields: [
          { fieldName: 'Price__c', dataType: 'Number' },
          { fieldName: 'Qty__c', dataType: 'Number' },
          { fieldName: 'Amount', dataType: 'Number' },
        ],
      },
    ];

    const projectContext = {
      projectId: 'PROJ-001',
      migratedFromSystemId: 'LEGACY-SYSTEM-001',
    };

    const result = await validateCalculationLogicDefinitions({
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext,
    });

    expect(result.isValid).toBe(false);
    expect(result.validationResults.length).toBeGreaterThanOrEqual(1);

    const invalidSyntaxResult = result.validationResults.find(
      (r) => r.logicName === 'InvalidSyntaxFormula'
    );
    expect(invalidSyntaxResult).toBeDefined();
    expect(invalidSyntaxResult?.isValid).toBe(false);

    const syntaxError = invalidSyntaxResult?.errors.find(
      (e) => e.errorCode === 'InvalidCalculationLogicSyntax'
    );
    expect(syntaxError).toBeDefined();
    expect(syntaxError?.errorMessage).toMatch(/計算ロジック 'InvalidSyntaxFormula' の式が不正です/);

    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
