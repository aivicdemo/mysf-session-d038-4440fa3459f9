import { fetchAllCustomers } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-842: 取引先テーブルが空のとき、空の配列と件数0を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty customers array and totalCount 0 when customer table is empty', async () => {
    (DataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllCustomers({});

    expect(result.customers).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
