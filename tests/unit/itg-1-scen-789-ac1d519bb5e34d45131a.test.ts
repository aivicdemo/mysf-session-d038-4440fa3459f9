import { fetchDealsForPeriod, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-789: Data store access error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError with correct message when data store access fails', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockRejectedValue(
      new DataStoreError('Data store read failed')
    );

    try {
      await fetchDealsForPeriod({
        periodStartDateTime: '2026-01-01T00:00:00Z',
        periodEndDateTime: '2026-01-31T23:59:59Z',
        salesRepresentativeIdFilter: null,
        customerIdFilter: null,
        stageIdFilter: null,
        sortBy: 'updatedAt',
      });
      fail('Should have thrown DataStoreError');
    } catch (error) {
      expect(error).toBeInstanceOf(DataStoreError);
      expect((error as DataStoreError).message).toBe('商談データの取得に失敗しました。');
    }
  });
});
