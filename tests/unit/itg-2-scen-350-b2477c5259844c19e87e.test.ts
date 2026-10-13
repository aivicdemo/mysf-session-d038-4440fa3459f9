import { validateCalculationLogicDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateCalculationLogicDefinitionsInput, ValidateCalculationLogicDefinitionsOutput } from '../../src/logic/data-validation-rules';
import type { CalculationLogicDefinition } from '../../src/logic/calculation-logic-mapper';
import type { SalesforceObjectDefinition, ProjectContext } from '../../src/logic/data-validation-rules';

describe('SCEN-350: ReferencedFieldDataTypeMismatchエラー検出', () => {
  it('計算ロジックが参照するフィールドのデータ型が期待されるデータ型と不一致である場合、ReferencedFieldDataTypeMismatchエラーが検出される', async () => {
    // 前提条件の準備
    const projectContext: ProjectContext = {
      projectId: 'PROJ-001',
      targetSystemId: 'SYS-LEGACY-BILLING',
    };

    const calculationLogicDefinitions: CalculationLogicDefinition[] = [
      {
        calculationLogicId: 'LOGIC-001',
        logicName: 'Logic001',
        logicType: 'フィールド計算式',
        targetObjectId: 'OBJ-INVOICE',
        targetFieldName: 'TotalAmount',
        existingSystemLogic: 'SELECT SUM(amount) FROM invoice_details WHERE invoice_id = :invoiceId',
        salesforceLogic: 'InvoiceDetail__r.Amount__c + InvoiceDetail__r.Tax__c',
        referenceFieldList: ['Amount__c', 'Tax__c'],
        dependentLogicIds: [],
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
            dataType: 'Currency',
            required: true,
          },
        ],
        recordCount: 0,
      },
      {
        objectName: 'InvoiceDetail__c',
        objectDescription: 'Invoice Detail object',
        mappingTargetSalesforceObject: 'InvoiceDetail__c',
        fields: [
          {
            fieldName: 'Amount__c',
            dataType: 'Text',
            required: true,
          },
          {
            fieldName: 'Tax__c',
            dataType: 'Currency',
            required: false,
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
    expect(result.validationResults).toHaveLength(1);

    const validationResult = result.validationResults[0];
    expect(validationResult.logicName).toBe('Logic001');
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors.length).toBeGreaterThanOrEqual(1);

    const mismatchError = validationResult.errors.find(e => e.errorCode === 'ReferencedFieldDataTypeMismatch');
    expect(mismatchError).toBeDefined();
    expect(mismatchError!.errorMessage).toContain('計算ロジック');
    expect(mismatchError!.errorMessage).toContain('Logic001');
    expect(mismatchError!.errorMessage).toContain('Amount__c');
    expect(mismatchError!.errorMessage).toContain('Text');
    expect(mismatchError!.errorMessage).toContain('Currency');

    expect(result.summary.totalObjectsValidated).toBe(1);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(1);
  });
});
