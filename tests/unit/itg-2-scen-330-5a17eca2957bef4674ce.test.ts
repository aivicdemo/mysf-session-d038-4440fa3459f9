import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-330: オブジェクト定義に必須フィールド（オブジェクト名、説明、マッピング対象Salesforceオブジェクト）が不足しているとき、InvalidObjectStructureError が報告される', () => {
  it('should report InvalidObjectStructureError when description is missing', async () => {
    const input = {
      objectDefinitions: [
        {
          objectName: 'Invoice',
          objectDescription: '',
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
        targetSystemId: 'ORACLE-ERP-001',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(1);
    const validationResult = result.validationResults[0];
    expect(validationResult.objectName).toBe('Invoice');
    expect(validationResult.errors.length).toBeGreaterThan(0);
    expect(validationResult.errors[0].errorCode).toBe('InvalidObjectStructureError');
    expect(validationResult.errors[0].errorMessage).toContain('Salesforceオブジェクト定義の必須フィールドが不足しています');
    expect(result.summary.totalObjectsValidated).toBe(1);
    expect(result.summary.successCount).toBe(0);
  });
});
