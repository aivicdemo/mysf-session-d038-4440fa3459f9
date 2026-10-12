import { fetchDealById, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-832: fetchDealById - DataStoreError on system failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError with correct message when data store read fails', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new Error('商談データの取得に失敗しました。')
    );

    await expect(fetchDealById({ dealId })).rejects.toThrow();
    await expect(fetchDealById({ dealId })).rejects.toThrow(
      '商談データの取得に失敗しました。'
    );
  });
});
