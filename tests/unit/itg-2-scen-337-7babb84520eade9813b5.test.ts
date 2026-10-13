import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateSalesforceObjectDefinitionsInput } from '../../src/logic/data-validation-rules';

describe('SCEN-337: InvalidMappingTargetError when mappingTargetSalesforceObject is empty', () => {
  it('should report InvalidMappingTargetError when mappingTargetSalesforceObject is empty string', async () => {
    const input: ValidateSalesforceObjectDefinitionsInput = {
      objectDefinitions: [
        {
          objectName: 'Invoice',
          objectDescription: '請求書オブジェクト',
          mappingTargetSalesforceObject: '',
          fields: [
            { fieldName: 'invoiceNumber', dataType: 'Text', required: true },
            { fieldName: 'customerId', dataType: 'Text', required: true },
            { fieldName: 'invoiceAmount', dataType: 'Currency', required: true },
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

    const objectValidation = result.validationResults[0];
    expect(objectValidation.objectName).toBe('Invoice');
    expect(objectValidation.isValid).toBe(false);
    expect(objectValidation.errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'InvalidMappingTargetError',
        errorMessage: 'マッピング対象Salesforceオブジェクトが不正です。有効なSalesforceオブジェクト名を指定してください。',
      })
    );

    expect(result.summary.totalObjectsValidated).toBe(1);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(1);
  });
});
