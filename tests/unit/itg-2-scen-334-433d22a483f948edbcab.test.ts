import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-334: 請求書オブジェクトで請求書番号・顧客ID・請求金額、または請求明細オブジェクトで商品コード・数量・単価が定義されていないとき、MissingFieldDefinitionError が報告される', () => {
  it('should report MissingFieldDefinitionError when required fields are missing', async () => {
    const input = {
      objectDefinitions: [
        {
          objectName: 'Invoice',
          objectDescription: '請求書カスタムオブジェクト',
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
          ],
          recordCount: 150,
        },
        {
          objectName: 'InvoiceDetail',
          objectDescription: '請求明細カスタムオブジェクト',
          mappingTargetSalesforceObject: 'InvoiceDetail__c',
          fields: [
            {
              fieldName: 'product_code',
              dataType: 'Text',
              required: true,
              description: undefined,
            },
            {
              fieldName: 'quantity',
              dataType: 'Number',
              required: true,
              description: undefined,
            },
          ],
          recordCount: 450,
        },
      ],
      projectContext: {
        projectId: 'PROJ-001',
        targetSystemId: 'ORACLE-ERP-2024',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(false);
    expect(result.validationResults).toHaveLength(2);
    const hasMissingFieldError = result.validationResults.some((vr) =>
      vr.errors.some((e) => e.errorCode === 'MissingFieldDefinitionError')
    );
    expect(hasMissingFieldError).toBe(true);
    expect(result.summary.totalObjectsValidated).toBe(2);
    expect(result.summary.successCount).toBe(0);
    expect(result.summary.errorCount).toBe(2);
  });
});
