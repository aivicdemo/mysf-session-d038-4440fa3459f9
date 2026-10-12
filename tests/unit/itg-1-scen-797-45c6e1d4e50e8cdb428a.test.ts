import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-797: fetchInvoicesForPeriod throws CustomerNotFound error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw CustomerNotFound error when specified customer does not exist', async () => {
    // Mock that the customer table returns empty results
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(
      fetchInvoicesForPeriod({
        periodStartDateTime: '2024-01-01T00:00:00Z',
        periodEndDateTime: '2024-01-31T23:59:59Z',
        salesRepresentativeIdFilter: null,
        customerIdFilter: '550e8400-e29b-41d4-a716-446655440000',
        invoiceStatusFilter: null,
        sortBy: 'updatedAt',
      })
    ).rejects.toThrow('指定された取引先が見つかりません。');
  });
});
