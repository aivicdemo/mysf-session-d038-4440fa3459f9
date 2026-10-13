import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-333: フィールド名が空文字列、特殊文字を含む、または予約語であるとき、InvalidFieldNameFormatError が報告される', () => {
  it('should report InvalidFieldNameFormatError when field name is empty', async () => {
    const input = {
      objectDefinitions: [
        {
          objectName: 'Invoice',
          objectDescription: '請求書オブジェクト',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            {
              fieldName: '',
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
        targetSystemId: 'ORACLE-BILLING',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    const validationResult = result.validationResults[0];
    expect(validationResult.errors.length).toBeGreaterThan(0);
    const hasInvalidFieldNameError = validationResult.errors.some(
      (error) => error.errorCode === 'InvalidFieldNameFormatError'
    );
    expect(hasInvalidFieldNameError).toBe(true);
    expect(result.summary.totalObjectsValidated).toBe(1);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(1);
  });
});
