import { extractAndMapLegacySystemSpecification, ExtractAndMapLegacySystemSpecificationOutput } from '../../src/logic/legacy-system-mapping';

describe('SCEN-524: 業務ルール検証 br-tx_3-001 制約3 計算式やワークフロー定義が取得できない場合', () => {
  it('一部の計算ロジック定義が取得できない場合に警告を発行して処理を続行する', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: 'https://test.salesforce.com',
        accessToken: 'valid-token-123',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
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
        supportedFeatures: ['invoiceGeneration', 'lineItemManagement'],
      },
      executionContext: {
        userId: 'user001',
        executionTimestamp: '2026-10-07T06:22:11.338Z',
        sessionId: 'session-123',
      },
    };

    const result = await extractAndMapLegacySystemSpecification(input);

    expect(result.mappingValidationResult.warnings).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('一部の計算ロジック定義が取得できませんでした。手動で確認してください'),
      })
    );
    expect(result.customObjectSpecificationDocument).toBeDefined();
    expect(result.functionMappingTable).toBeDefined();
  });
});
