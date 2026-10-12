import { fetchAllActivityTypes, FetchAllActivityTypesInput, FetchAllActivityTypesOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-853: 活動タイプマスタに有効なレコードが 0 件の場合', () => {
  it('空の一覧と件数 0 と取得時刻を返す', async () => {
    const dataStore = require('../../src/platform/data-store');
    dataStore.listRecords = jest.fn().mockResolvedValue([]);

    const input: FetchAllActivityTypesInput = {};
    const result: FetchAllActivityTypesOutput = await fetchAllActivityTypes(input);

    expect(result.activityTypes).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
