import { extractAndMapLegacySystemSpecification, CustomObjectNotFoundError } from '../../src/logic/legacy-system-mapping';

describe('SCEN-523: 業務ルール検証 br-tx_3-001 制約2 指定されたカスタムオブジェクトが存在しない場合', () => {
  it('指定されたカスタムオブジェクトが見つからない場合にCustomObjectNotFoundErrorを発生させる', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: 'https://test-org.salesforce.com',
        accessToken: 'valid-token',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
        standardDataModel: {
          entities: [
            { entityName: 'Customer', attributes: ['id', 'name'] },
            { entityName: 'Order', attributes: ['id', 'customerId'] },
            { entityName: 'OrderLine', attributes: ['id', 'orderId'] },
          ],
        },
        apiSpecification: {
          endpoints: [
            { path: 'POST /api/invoices', method: 'POST', description: 'Create invoices' },
            { path: 'GET /api/invoices/{id}', method: 'GET', description: 'Get invoice' },
          ],
        },
        supportedFeatures: [],
      },
      executionContext: {
        userId: 'user-789',
        executionTimestamp: '2026-10-07T06:22:11.338Z',
        sessionId: 'session-123',
      },
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(CustomObjectNotFoundError);
    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow('指定されたカスタムオブジェクトが見つかりません。API名を確認してください');
  });
});
