import { fetchDealsForPeriod, DataStoreError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  DataStore: {
    listRecords: jest.fn().mockRejectedValue(
      new DataStoreError('商談データの取得に失敗しました。')
    ),
  },
}));

describe('SCEN-1671: 新システムのデータが取得失敗した場合、処理が中止される', () => {
  it('DataStoreError がスローされ、エラー文言として「商談データの取得に失敗しました。」が含まれる', async () => {
    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(DataStoreError);
    await expect(fetchDealsForPeriod(input)).rejects.toThrow(/商談データの取得に失敗しました。/);
  });
});
