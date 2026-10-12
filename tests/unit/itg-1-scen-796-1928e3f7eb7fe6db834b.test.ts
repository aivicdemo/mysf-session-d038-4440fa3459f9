import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-796: fetchInvoicesForPeriod throws SalesRepresentativeNotFound error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SalesRepresentativeNotFound error when specified sales representative does not exist', async () => {
    // Mock that the sales representative table returns empty results
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(
      fetchInvoicesForPeriod({
        periodStartDateTime: '2024-01-01T00:00:00Z',
        periodEndDateTime: '2024-01-31T23:59:59Z',
        salesRepresentativeIdFilter: '550e8400-e29b-41d4-a716-446655440000',
        customerIdFilter: null,
        invoiceStatusFilter: null,
        sortBy: 'updatedAt',
      })
    ).rejects.toThrow('指定された営業担当者が見つかりません。');
  });
});
