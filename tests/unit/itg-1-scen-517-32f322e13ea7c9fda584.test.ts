import { extractAndMapLegacySystemSpecification, SalesforceConnectionError } from '../../src/logic/legacy-system-mapping';

describe('SCEN-517: エラー系 Salesforce環境への接続情報が不正な場合', () => {
  it('不正な接続情報でSalesforceConnectionErrorを発生させる', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: 'https://invalid-instance.salesforce.com',
        accessToken: 'invalid_token_format',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: '移行対象システム',
        standardDataModel: {
          entities: [
            { entityName: 'Account', attributes: ['id', 'name', 'billingCity'] },
            { entityName: 'Opportunity', attributes: ['id', 'accountId', 'amount', 'stageName'] },
          ],
        },
        apiSpecification: {
          endpoints: [],
        },
        supportedFeatures: [],
      },
      executionContext: {
        userId: 'user-12345',
        executionTimestamp: '2026-10-07T10:30:00.000Z',
        sessionId: 'session-123',
      },
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(SalesforceConnectionError);
    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow('Salesforce環境に接続できません。接続情報を確認してください。');
  });
});
