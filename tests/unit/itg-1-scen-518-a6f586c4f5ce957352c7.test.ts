import { extractAndMapLegacySystemSpecification, CustomObjectNotFoundError } from '../../src/logic/legacy-system-mapping';
import * as legacyMapping from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-518: エラー系 指定されたカスタムオブジェクトが見つからない場合', () => {
  it('カスタムオブジェクトが見つからない場合にCustomObjectNotFoundErrorを発生させる', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: 'https://test.salesforce.com',
        accessToken: 'valid_token_12345',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: '移行対象システム',
        standardDataModel: {
          entities: [
            { entityName: 'Account', attributes: ['id', 'name'] },
            { entityName: 'Contact', attributes: ['id', 'accountId'] },
            { entityName: 'Opportunity', attributes: ['id', 'amount'] },
          ],
        },
        apiSpecification: {
          endpoints: [
            { path: '/api/customers', method: 'GET', description: 'Get customers' },
          ],
        },
        supportedFeatures: ['CustomerMaster', 'OrderManagement'],
      },
      executionContext: {
        userId: 'user_001',
        executionTimestamp: '2026-10-07T10:30:00Z',
        sessionId: 'session-123',
      },
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(CustomObjectNotFoundError);
    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow('指定されたカスタムオブジェクト（請求書・請求明細）がSalesforce環境に見つかりません。');
  });
});
