import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';
import type { ValidateSalesforceObjectDefinitionsInput } from '../../src/logic/data-validation-rules';

describe('SCEN-338: FieldCountMismatchError for reference relationship inconsistency', () => {
  it('should report FieldCountMismatchError when reference fields are not aligned', async () => {
    const input: ValidateSalesforceObjectDefinitionsInput = {
      objectDefinitions: [
        {
          objectName: 'Invoice',
          objectDescription: '請求書オブジェクト',
          mappingTargetSalesforceObject: 'Invoice__c',
          fields: [
            { fieldName: 'invoiceNumber', dataType: 'Text', required: true },
            { fieldName: 'customerId', dataType: 'Text', required: true },
            { fieldName: 'invoiceAmount', dataType: 'Currency', required: true },
            { fieldName: 'invoiceId', dataType: 'Text', required: true },
          ],
          recordCount: 150,
        },
        {
          objectName: 'InvoiceLineItem',
          objectDescription: '請求明細オブジェクト',
          mappingTargetSalesforceObject: 'InvoiceLineItem__c',
          fields: [
            { fieldName: 'productCode', dataType: 'Text', required: true },
            { fieldName: 'quantity', dataType: 'Number', required: true },
            { fieldName: 'unitPrice', dataType: 'Currency', required: true },
          ],
          recordCount: 450,
        },
      ],
      projectContext: {
        projectId: 'PROJ-20250107-001',
        targetSystemId: 'ORACLE_ERP_BILLING',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    const validationResults = result.validationResults;
    const mismatchError = validationResults
      .flatMap((r) => r.errors)
      .find((e) => e.errorCode === 'FieldCountMismatchError');

    expect(mismatchError).toBeDefined();
    expect(mismatchError?.errorMessage).toBe(
      '請求書オブジェクトと請求明細オブジェクト間の参照フィールド定義が不整合です。両オブジェクトで対応するフィールドを確認してください。'
    );

    expect(result.isValid).toBe(false);
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1);
  });
});
