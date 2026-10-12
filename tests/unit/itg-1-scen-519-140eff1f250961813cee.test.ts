import { extractAndMapLegacySystemSpecification, TargetSystemSpecificationInvalidError } from '../../src/logic/legacy-system-mapping';

describe('SCEN-519: エラー系 移行対象システムの仕様定義が不正な場合', () => {
  it('必須項目が欠落している場合にTargetSystemSpecificationInvalidErrorを発生させる', async () => {
    const input = {
      salesforceEnvironmentContext: {
        instanceUrl: '',
        accessToken: '',
        invoiceCustomObjectName: 'Invoice__c',
        invoiceLineItemCustomObjectName: 'InvoiceLine__c',
      },
      targetSystemSpecification: {
        systemName: '移行対象システム',
        standardDataModel: {
          entities: [],
        },
        apiSpecification: {
          endpoints: [],
        },
        supportedFeatures: [],
      },
      executionContext: {
        userId: '005D0000001IZ3A',
        executionTimestamp: '2024-01-15T10:30:00Z',
        sessionId: 'session-123',
      },
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(TargetSystemSpecificationInvalidError);
    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow('移行対象システムの仕様定義が不正です。必須項目を確認してください。');
  });
});
