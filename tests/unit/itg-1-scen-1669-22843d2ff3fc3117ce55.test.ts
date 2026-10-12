import { fetchDealsForPeriod, DataStoreError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  DataStore: {
    listRecords: jest.fn().mockRejectedValue(
      new DataStoreError('商談データの取得に失敗しました。')
    ),
  },
}));

describe('SCEN-1669: 旧システムのデータが取得失敗した場合、処理が中止される', () => {
  it('DataStoreError がスローされ、エラーメッセージが「商談データの取得に失敗しました。」である', async () => {
    const input = {
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(DataStoreError);
    await expect(fetchDealsForPeriod(input)).rejects.toThrow('商談データの取得に失敗しました。');
  });
});
