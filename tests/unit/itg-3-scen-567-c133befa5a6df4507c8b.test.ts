import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

jest.mock('../../src/platform/data-store');

describe('SCEN-567: 旧システムのレコード件数が0件のとき、エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return DataNormalizationFailure error when normalization fails', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    // Empty legacy system records, one new system record
    listRecords.mockImplementation((table: string) => {
      if (table === 'legacy_invoices') {
        return Promise.resolve([]);
      }
      if (table === 'new_system_invoices') {
        return Promise.resolve([
          {
            invoiceId: 'INV-2024-001',
            dealId: 'DEAL-001',
            invoiceAmount: 100000,
            invoiceStatus: '確定',
            generatedDateTime: '2024-01-15T10:00:00Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        dealIdRange: undefined,
      })
    ).rejects.toThrow(DataNormalizationFailure);
  });
});
