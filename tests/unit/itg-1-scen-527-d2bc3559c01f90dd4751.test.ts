import { extractAndMapLegacySystemSpecification, CustomObjectNotFoundError } from '../../src/logic/legacy-system-mapping';

describe('SCEN-527: 業務ルール検証 br-tx_10-001 制約1 取引先オブジェクトのスキーマが取得できない場合', () => {
  it('取引先オブジェクトの定義が見つからないときCustomObjectNotFoundErrorを発生させる', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: 'https://test.salesforce.com',
        accessToken: 'valid_token_12345',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: 'NextGen ERP System',
        standardDataModel: {
          entities: [
            { entityName: 'customer', attributes: ['id', 'name', 'type'] },
          ],
        },
        apiSpecification: {
          endpoints: [
            { path: '/api/customers', method: 'GET', description: 'Get customers' },
          ],
        },
        supportedFeatures: ['CustomerMaster', 'OrderManagement', 'InvoiceGeneration'],
      },
      executionContext: {
        userId: 'system_user_001',
        executionTimestamp: '2026-10-07T10:30:00Z',
        sessionId: 'session-123',
      },
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(CustomObjectNotFoundError);
    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow('取引先オブジェクトの定義が見つかりません。Salesforce環境を確認してください');
  });
});
