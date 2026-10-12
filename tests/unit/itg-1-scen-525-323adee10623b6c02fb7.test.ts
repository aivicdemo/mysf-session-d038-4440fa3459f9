import { extractAndMapLegacySystemSpecification, ExtractAndMapLegacySystemSpecificationOutput } from '../../src/logic/legacy-system-mapping';

describe('SCEN-525: 業務ルール検証 br-tx_3-001 制約4 参照関係の循環参照が検出された場合', () => {
  it('参照関係の循環参照が検出されたとき警告を発行して処理を続行する', async () => {
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
            { entityName: 'invoice', attributes: ['id', 'amount'] },
            { entityName: 'invoiceLine', attributes: ['id', 'amount'] },
          ],
        },
        apiSpecification: {
          endpoints: [
            { path: '/api/invoices', method: 'POST', description: 'Create invoices' },
          ],
        },
        supportedFeatures: ['invoiceManagement'],
      },
      executionContext: {
        userId: 'accounting-user-001',
        executionTimestamp: '2026-10-15T10:30:00Z',
        sessionId: 'session-123',
      },
    };

    const result = await extractAndMapLegacySystemSpecification(input);

    expect(result.mappingValidationResult.warnings).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('オブジェクト間に循環参照が存在します。移行時に注意が必要です'),
      })
    );
    expect(result.customObjectSpecificationDocument).toBeDefined();
    expect(result.functionMappingTable).toBeDefined();
    expect(result.mappingValidationResult).toBeDefined();
    expect(result.generatedAt).toBeInstanceOf(Date);
  });
});
