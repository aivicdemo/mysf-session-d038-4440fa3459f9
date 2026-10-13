import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateCalculationLogicDefinitionsInput, ValidateCalculationLogicDefinitionsOutput } from '../../src/logic/data-validation-rules';
import type { CalculationLogicDefinition } from '../../src/logic/calculation-logic-mapper';
import type { SalesforceObjectDefinition, ProjectContext } from '../../src/logic/data-validation-rules';

describe('SCEN-351: DuplicateLogicNameInProjectエラー検出', () => {
  it('同一プロジェクト内で同じロジック名を持つ計算ロジック定義が複数存在する場合、DuplicateLogicNameInProjectエラーが検出される', async () => {
    // 前提条件の準備
    const projectContext: ProjectContext = {
      projectId: 'PROJ-001',
      targetSystemId: 'SYS-ORACLE-001',
    };

    const calculationLogicDefinitions: CalculationLogicDefinition[] = [
      {
        calculationLogicId: 'LOGIC-001',
        logicName: 'InvoiceAmount',
        logicType: 'FieldCalculation',
        targetObjectId: 'OBJ-INVOICE',
        targetFieldName: 'TotalAmount',
        existingSystemLogic: 'SELECT SUM(line_amount) FROM invoice_lines',
        salesforceLogic: 'Amount__c.sum()',
        referenceFieldList: ['Amount__c'],
        dependentLogicIds: [],
      },
      {
        calculationLogicId: 'LOGIC-002',
        logicName: 'InvoiceAmount',
        logicType: 'Workflow',
        targetObjectId: 'OBJ-INVOICE',
        targetFieldName: 'Status__c',
        existingSystemLogic: "IF total_amount > 0 THEN status = 'Active'",
        salesforceLogic: "IF(Amount__c > 0, 'Active', 'Inactive')",
        referenceFieldList: ['Amount__c'],
        dependentLogicIds: ['LOGIC-001'],
      },
    ];

    const objectDefinitions: SalesforceObjectDefinition[] = [
      {
        objectName: 'Invoice__c',
        objectDescription: 'Invoice object',
        mappingTargetSalesforceObject: 'Invoice__c',
        fields: [
          {
            fieldName: 'TotalAmount',
            dataType: 'Number',
            required: true,
          },
          {
            fieldName: 'Status__c',
            dataType: 'Text',
            required: false,
          },
          {
            fieldName: 'Amount__c',
            dataType: 'Currency',
            required: true,
          },
        ],
        recordCount: 0,
      },
    ];

    const input: ValidateCalculationLogicDefinitionsInput = {
      calculationLogicDefinitions,
      objectDefinitions,
      projectContext,
    };

    // 関数を実行
    const result: ValidateCalculationLogicDefinitionsOutput = await validateCalculationLogicDefinitions(input);

    // 期待結果の検証
    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(2);

    // 両方の検証結果がエラーを含むことを確認
    const logic001Result = result.validationResults[0];
    const logic002Result = result.validationResults[1];

    expect(logic001Result.logicName).toBe('InvoiceAmount');
    expect(logic001Result.isValid).toBe(false);
    const logic001DuplicateError = logic001Result.errors.find(e => e.errorCode === 'DuplicateLogicNameInProject');
    expect(logic001DuplicateError).toBeDefined();
    expect(logic001DuplicateError!.errorMessage).toContain('プロジェクト内でロジック名');
    expect(logic001DuplicateError!.errorMessage).toContain('InvoiceAmount');
    expect(logic001DuplicateError!.errorMessage).toContain('重複');

    expect(logic002Result.logicName).toBe('InvoiceAmount');
    expect(logic002Result.isValid).toBe(false);
    const logic002DuplicateError = logic002Result.errors.find(e => e.errorCode === 'DuplicateLogicNameInProject');
    expect(logic002DuplicateError).toBeDefined();
    expect(logic002DuplicateError!.errorMessage).toContain('プロジェクト内でロジック名');
    expect(logic002DuplicateError!.errorMessage).toContain('InvoiceAmount');
    expect(logic002DuplicateError!.errorMessage).toContain('重複');

    expect(result.summary.errorCount).toBeGreaterThanOrEqual(2);
  });
});
