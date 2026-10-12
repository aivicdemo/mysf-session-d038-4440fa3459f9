import { extractAndMapLegacySystemSpecification, MappingValidationFailedError } from '../../src/logic/legacy-system-mapping';

describe('SCEN-520: エラー系 機能マッピングの検証に失敗した場合', () => {
  it('マッピング検証が失敗するとMappingValidationFailedErrorを発生させる', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: 'https://test.salesforce.com',
        accessToken: 'valid_token_12345',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: '移行対象システムA',
        standardDataModel: {
          entities: [
            {
              entityName: 'invoiceEntity',
              attributes: ['id', 'number', 'date', 'amount', 'status'],
            },
          ],
        },
        apiSpecification: {
          endpoints: [
            { path: '/invoices', method: 'POST', description: 'Create invoices' },
          ],
        },
        supportedFeatures: [],
      },
      executionContext: {
        userId: 'user_12345',
        executionTimestamp: '2026-10-07T10:30:00Z',
        sessionId: 'session-123',
      },
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(MappingValidationFailedError);
    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow('機能マッピングの検証に失敗しました。詳細はマッピング表を確認してください。');
  });
});
