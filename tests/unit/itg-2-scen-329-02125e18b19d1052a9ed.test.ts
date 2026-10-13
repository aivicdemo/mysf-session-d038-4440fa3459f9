import { validateSalesforceObjectDefinitions } from '../../src/logic/data-validation-rules';

describe('SCEN-329: 有効なオブジェクト定義の配列が与えられたとき、すべての検証に合格し isValid=true となる', () => {
  it('should validate successfully with valid invoice and invoice line item definitions', async () => {
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
            {
              fieldName: 'invoice_date',
              dataType: 'Date',
              required: true,
              description: undefined,
            },
            {
              fieldName: 'invoice_id',
              dataType: 'Text',
              required: true,
              description: undefined,
            },
          ],
          recordCount: 100,
        },
        {
          objectName: 'InvoiceLineItem',
          objectDescription: '請求明細オブジェクト',
          mappingTargetSalesforceObject: 'InvoiceLineItem__c',
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
            {
              fieldName: 'unit_price',
              dataType: 'Currency',
              required: true,
              description: undefined,
            },
            {
              fieldName: 'invoice_id',
              dataType: 'Text',
              required: true,
              description: undefined,
            },
          ],
          recordCount: 0,
        },
      ],
      projectContext: {
        projectId: 'PROJ-2024-001',
        targetSystemId: 'SYS-BILLING-ORACLE',
      },
    };

    const result = await validateSalesforceObjectDefinitions(input);

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toHaveLength(2);
    expect(result.validationResults[0].errors).toEqual([]);
    expect(result.validationResults[1].errors).toEqual([]);
    expect(result.summary.successCount).toBe(2);
    expect(result.summary.errorCount).toBe(0);
  });
});
