import { fetchSalesTargets } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-949: 営業目標マスタテーブルが空の場合、空配列と件数0を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業目標マスタテーブルが空の場合、空配列と件数0を返す', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchSalesTargets({});

    expect(result.salesTargets).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    expect(dataStore.listRecords).toHaveBeenCalledWith('営業目標');
  });
});
