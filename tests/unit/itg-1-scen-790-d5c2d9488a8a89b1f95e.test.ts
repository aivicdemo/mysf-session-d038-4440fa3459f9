import { fetchDealsForPeriod, NoDealsFoundError } from '../../src/logic/data-persistence';
import { listRecords } from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-790: 指定された期間およびフィルタ条件に合致する商談が存在しない場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoDealsFoundError when no deals are found in the period', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;
    mockListRecords.mockResolvedValue([]);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(NoDealsFoundError);
    await expect(fetchDealsForPeriod(input)).rejects.toThrow('指定された条件に合致する商談が見つかりません。');
  });
});
