import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-331: フィールドのデータ型が未定義または不一致しているとき、InvalidFieldDataTypeError が報告される', () => {
  it('should report InvalidFieldDataTypeError when field dataType is invalid', async () => {
    const input = {
      objectDefinitions: [
        {
          objectName: 'Invoice',
          objectDescription: '請求書オブジェクト',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            {
              fieldName: 'invoice_number',
              dataType: 'undefined_type',
              required: true,
              description: undefined,
            },
            {
              fieldName: 'customer_id',
              dataType: 'Text',
              required: true,
              description: undefined,
            },
            {
              fieldName: 'invoice_amount',
              dataType: 'Text',
              required: true,
              description: undefined,
            },
          ],
          recordCount: 100,
        },
      ],
      projectContext: {
        projectId: 'PROJ-001',
        targetSystemId: 'SYS-ORACLE-001',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    const validationResult = result.validationResults[0];
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors.length).toBeGreaterThan(0);
    const hasInvalidFieldDataTypeError = validationResult.errors.some(
      (error) => error.errorCode === 'InvalidFieldDataTypeError'
    );
    expect(hasInvalidFieldDataTypeError).toBe(true);
    expect(result.summary.totalObjectsValidated).toBe(1);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(1);
  });
});
