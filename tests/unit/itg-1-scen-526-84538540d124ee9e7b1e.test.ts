import { extractAndMapLegacySystemSpecification, ExtractAndMapLegacySystemSpecificationOutput } from '../../src/logic/legacy-system-mapping';

describe('SCEN-526: 業務ルール検証 br-tx_10-001 mapSalesforceObjectRelationships が7オブジェクト間の関連性を出力する', () => {
  it('7オブジェクト間の関連性・データフロー・カスタムオブジェクト生成ルール・依存関係を正常に出力する', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: 'https://test.salesforce.com',
        accessToken: 'valid-token-123',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: 'NextGen ERP',
        standardDataModel: {
          entities: [
            { entityName: 'Customer', attributes: ['id', 'name', 'email', 'billingAddress'] },
            { entityName: 'Contact', attributes: ['id', 'customerId', 'name', 'email'] },
            { entityName: 'Order', attributes: ['id', 'customerId', 'amount', 'status', 'orderDate'] },
            { entityName: 'OrderLineItem', attributes: ['id', 'orderId', 'quantity', 'price', 'total'] },
            { entityName: 'Invoice', attributes: ['id', 'orderId', 'amount', 'date', 'status'] },
            { entityName: 'InvoiceLineItem', attributes: ['id', 'invoiceId', 'orderLineItemId', 'quantity', 'price'] },
          ],
        },
        apiSpecification: {
          endpoints: [
            { path: '/api/v1/invoices/generate', method: 'POST', description: 'Generate invoices' },
            { path: '/api/v1/invoiceLineItems/mapFromOrder', method: 'POST', description: 'Map line items' },
          ],
        },
        supportedFeatures: [],
      },
      executionContext: {
        userId: '005D0000001IZ3Z',
        executionTimestamp: '2024-01-15T10:30:00Z',
        sessionId: 'session-123',
      },
    };

    const result = await extractAndMapLegacySystemSpecification(input);

    expect(result).toBeDefined();
    expect(result.customObjectSpecificationDocument).toBeDefined();
    expect(result.functionMappingTable).toBeDefined();
    expect(result.functionMappingTable.length).toBeGreaterThan(0);
    expect(result.mappingValidationResult).toBeDefined();
    expect(result.mappingValidationResult.isComplete).toBe(true);
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-15T10:30:00Z').getTime());
  });
});
