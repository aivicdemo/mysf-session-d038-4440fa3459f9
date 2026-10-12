import { fetchAllSalesRepresentatives } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-845: 営業担当者テーブルが空の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty sales representatives array and totalCount 0', async () => {
    (DataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllSalesRepresentatives({});

    expect(result.salesRepresentatives).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
