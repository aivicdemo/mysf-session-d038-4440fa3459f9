import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-336: レコード件数が負の数または不正な値であるとき、InvalidRecordCountError が報告される', () => {
  it('should report InvalidRecordCountError when currentRecordCount is negative', async () => {
    const input = {
      objectDefinitions: [
        {
          objectName: 'Invoice__c',
          objectDescription: '請求書',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            {
              fieldName: 'InvoiceNumber__c',
              dataType: 'Text',
              required: true,
              description: undefined,
            },
          ],
          recordCount: -1,
        },
      ],
      projectContext: {
        projectId: 'PROJ-001',
        targetSystemId: 'SYS-001',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    const validationResult = result.validationResults[0];
    expect(validationResult.errors.length).toBeGreaterThan(0);
    const hasInvalidRecordCountError = validationResult.errors.some(
      (error) => error.errorCode === 'InvalidRecordCountError'
    );
    expect(hasInvalidRecordCountError).toBe(true);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(1);
  });
});
