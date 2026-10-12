import { fetchDealsForPeriod, NoDealsFoundError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  DataStore: {
    listRecords: jest.fn().mockResolvedValue([]),
  },
}));

describe('SCEN-1672: 新システムのデータが空の場合、処理が中止される', () => {
  it('NoDealsFoundError がスローされ、エラーメッセージが「指定された条件に合致する商談が見つかりません。」である', async () => {
    const input = {
      periodStartDateTime: '2026-01-01T00:00:00Z',
      periodEndDateTime: '2026-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(NoDealsFoundError);
    await expect(fetchDealsForPeriod(input)).rejects.toThrow('指定された条件に合致する商談が見つかりません。');
  });
});
