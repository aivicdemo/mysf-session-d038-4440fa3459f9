import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-799: fetchInvoicesForPeriod throws DataStoreError on access failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when invoice table access fails', async () => {
    (dataStore.listRecords as jest.Mock).mockRejectedValue(new Error('DataStore access failed'));

    await expect(
      fetchInvoicesForPeriod({
        periodStartDateTime: '2024-01-01T00:00:00Z',
        periodEndDateTime: '2024-01-31T23:59:59Z',
        salesRepresentativeIdFilter: null,
        customerIdFilter: null,
        invoiceStatusFilter: null,
        sortBy: 'updatedAt',
      })
    ).rejects.toThrow('請求書データの取得に失敗しました。');
  });
});
