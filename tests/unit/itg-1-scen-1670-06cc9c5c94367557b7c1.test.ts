import { fetchDealsForPeriod, DataStoreError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  DataStore: {
    listRecords: jest.fn().mockRejectedValue(
      new DataStoreError('商談データの取得に失敗しました。')
    ),
  },
}));

describe('SCEN-1670: 旧システムのデータが空の場合、処理が中止される', () => {
  it('DataStoreError がスローされ、エラー文言は「商談データの取得に失敗しました。」である', async () => {
    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(DataStoreError);
    await expect(fetchDealsForPeriod(input)).rejects.toThrow('商談データの取得に失敗しました。');
  });
});
