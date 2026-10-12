import { fetchAllDealStages } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-848: 商談ステージマスタが0件のとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty stages array and totalCount 0', async () => {
    (DataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllDealStages({});

    expect(result.stages).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
