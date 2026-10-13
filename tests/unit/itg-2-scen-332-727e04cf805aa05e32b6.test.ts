import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-332: 同一プロジェクト内で同じオブジェクト名の定義が複数存在するとき、DuplicateObjectDefinitionError が報告される', () => {
  it('should report DuplicateObjectDefinitionError when same objectName appears multiple times', async () => {
    const input = {
      objectDefinitions: [
        {
          objectName: 'Invoice',
          objectDescription: '請求書オブジェクト',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            {
              fieldName: 'invoice_number',
              dataType: 'Text',
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
              fieldName: 'billing_amount',
              dataType: 'Currency',
              required: true,
              description: undefined,
            },
          ],
          recordCount: 1500,
        },
        {
          objectName: 'Invoice',
          objectDescription: '請求書オブジェクト（別定義）',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            {
              fieldName: 'invoice_id',
              dataType: 'Text',
              required: true,
              description: undefined,
            },
            {
              fieldName: 'account_id',
              dataType: 'Text',
              required: true,
              description: undefined,
            },
            {
              fieldName: 'total_amount',
              dataType: 'Currency',
              required: true,
              description: undefined,
            },
          ],
          recordCount: 2000,
        },
      ],
      projectContext: {
        projectId: 'PROJ-2026-001',
        targetSystemId: 'TARGET-ORACLE-001',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(false);
    const hasDuplicateError = result.validationResults.some((vr) =>
      vr.errors.some((e) => e.errorCode === 'DuplicateObjectDefinitionError')
    );
    expect(hasDuplicateError).toBe(true);
    expect(result.summary.totalObjectsValidated).toBe(2);
    expect(result.summary.errorCount).toBe(2);
  });
});
