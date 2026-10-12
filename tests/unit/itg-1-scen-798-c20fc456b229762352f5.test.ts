import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-798: fetchInvoicesForPeriod throws InvalidInvoiceStatus error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidInvoiceStatus error when invoice status filter is invalid', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    await expect(
      fetchInvoicesForPeriod({
        periodStartDateTime: '2024-01-01T00:00:00Z',
        periodEndDateTime: '2024-01-31T23:59:59Z',
        salesRepresentativeIdFilter: null,
        customerIdFilter: null,
        invoiceStatusFilter: 'invalid_status_value',
        sortBy: 'updatedAt',
      })
    ).rejects.toThrow('指定された請求ステータスは無効です。');
  });
});
