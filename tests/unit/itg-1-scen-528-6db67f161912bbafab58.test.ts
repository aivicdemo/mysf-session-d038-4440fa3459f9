import { extractAndMapLegacySystemSpecification, ExtractAndMapLegacySystemSpecificationOutput } from '../../src/logic/legacy-system-mapping';

describe('SCEN-528: 業務ルール検証 br-tx_10-001 制約2 請求書カスタムオブジェクトが商談への参照関係を持たない場合', () => {
  it('請求書が商談と紐付いていない場合に警告を発行して処理を続行する', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: 'https://test.salesforce.com',
        accessToken: 'valid-token-123',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: '移行対象システム',
        standardDataModel: {
          entities: [
            { entityName: 'Account', attributes: ['id', 'name'] },
            { entityName: 'Contact', attributes: ['id', 'name'] },
            { entityName: 'Opportunity', attributes: ['id', 'amount'] },
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
        userId: 'sys-user-001',
        executionTimestamp: '2026-01-15T09:30:00Z',
        sessionId: 'session-123',
      },
    };

    const result = await extractAndMapLegacySystemSpecification(input);

    expect(result.mappingValidationResult.warnings).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('請求書が商談と紐付いていません。カスタマイズ構成を確認してください'),
      })
    );
    expect(result.customObjectSpecificationDocument).toBeDefined();
    expect(result.functionMappingTable).toBeDefined();
  });
});
