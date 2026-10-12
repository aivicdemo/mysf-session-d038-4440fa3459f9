import { fetchDealsForPeriod, NoDealsFoundError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1631: 商談IDが空または不正な形式の場合、エラーが発生し検証が中断される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定期間内に商談が存在しない場合、NoDealsFoundError が発生する', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    await expect(
      fetchDealsForPeriod({
        periodStartDateTime: '2024-01-15T10:00:00Z',
        periodEndDateTime: '2024-01-15T10:00:00Z',
        salesRepresentativeIdFilter: null,
        customerIdFilter: null,
        stageIdFilter: null,
        sortBy: 'updatedAt',
      })
    ).rejects.toThrow(NoDealsFoundError);
  });
});
