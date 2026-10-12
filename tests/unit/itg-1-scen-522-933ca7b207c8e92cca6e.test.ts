import { extractAndMapLegacySystemSpecification, SalesforceConnectionError } from '../../src/logic/legacy-system-mapping';

describe('SCEN-522: 業務ルール検証 br-tx_3-001 制約1 接続認証が失敗した場合', () => {
  it('Salesforce組織への接続認証が失敗するとSalesforceConnectionErrorを発生させる', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: '',
        accessToken: 'invalid_token_xyz',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: '移行対象ERP',
        standardDataModel: {
          entities: [
            { entityName: 'invoiceEntity', attributes: ['id', 'invoiceNumber', 'customerId'] },
          ],
        },
        apiSpecification: {
          endpoints: [
            { path: '/api/invoices', method: 'POST', description: 'Create invoices' },
          ],
        },
        supportedFeatures: [],
      },
      executionContext: {
        userId: 'migration_operator@company.example.com',
        executionTimestamp: '2024-10-07T10:30:00Z',
        sessionId: 'session-123',
      },
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(SalesforceConnectionError);
    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow('Salesforce環境に接続できません。接続情報を確認してください。');
  });
});
