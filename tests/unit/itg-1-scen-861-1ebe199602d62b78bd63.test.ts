import { fetchAllActivityResults, FetchAllActivityResultsInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-861: 有効なレコードが 0 件の場合、空の配列と件数 0 を返す', () => {
  it('活動結果マスタテーブルに有効フラグが true のレコードがない場合、空の配列と totalCount 0、ISO 8601 形式の fetchedAt を返す', async () => {
    const mockData: any[] = [];
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockData);

    const input: FetchAllActivityResultsInput = {};
    const result = await fetchAllActivityResults(input);

    expect(result.activityResults).toEqual([]);
    expect(result.totalCount).toBe(0);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });
});
