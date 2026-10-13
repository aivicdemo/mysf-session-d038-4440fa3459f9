import { retrieveLegacyAndNewSystemInvoiceData, NewSystemDataRetrievalFailure } from '../../src/logic/legacy-new-system-data-retrieval';

jest.mock('../../src/platform/data-store');

describe('SCEN-568: 新システムのレコード件数が0件のとき、エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return NewSystemDataRetrievalFailure error when new system has no records', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    // One legacy system record, empty new system records
    listRecords.mockImplementation((table: string) => {
      if (table === 'legacy_invoices') {
        return Promise.resolve([
          {
            invoiceId: 'LEG-001',
            dealId: 'DEAL-001',
            invoiceAmount: 100000,
            invoiceStatus: '確定',
            generatedDateTime: '2025-01-15T10:00:00Z',
          },
        ]);
      }
      if (table === 'new_system_invoices') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      })
    ).rejects.toThrow(NewSystemDataRetrievalFailure);
  });
});
