import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-335: オブジェクト名が空文字列、特殊文字を含む、または予約語であるとき、InvalidObjectNameError が報告される', () => {
  it('should report InvalidObjectNameError when objectName is empty', async () => {
    const input = {
      objectDefinitions: [
        {
          objectName: '',
          objectDescription: '請求書オブジェクト',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            {
              fieldName: 'invoiceNumber',
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
    expect(result.validationResults.length).toBeGreaterThan(0);
    const validationResult = result.validationResults[0];
    const hasInvalidObjectNameError = validationResult.errors.some(
      (error) => error.errorCode === 'InvalidObjectNameError'
    );
    expect(hasInvalidObjectNameError).toBe(true);
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
