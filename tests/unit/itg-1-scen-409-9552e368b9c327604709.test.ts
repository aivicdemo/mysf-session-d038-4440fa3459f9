import { aggregateSalesPerformanceForDashboard, DataFetchFailure } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-409: DataFetchFailure error when fetchAllDealStages fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataFetchFailure error when fetchAllDealStages throws DataStoreError', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-15T10:30:00Z'),
      requestingUserId: 'user-001',
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValueOnce([
      { repId: 'rep-001', repName: '営業太郎', department: '営業部' },
      { repId: 'rep-002', repName: '営業花子', department: '営業部' },
    ]);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValueOnce([
      { repId: 'rep-001', activityDate: '2024-11-10', type: 'visit' },
      { repId: 'rep-001', activityDate: '2024-11-12', type: 'call' },
    ]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValueOnce([
      { dealId: 'deal-001', repId: 'rep-001', amount: 1000000, stage: 'proposal', status: 'open' },
    ]);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValueOnce([
      { repId: 'rep-001', targetAmount: 5000000, targetCount: 10 },
      { repId: 'rep-002', targetAmount: 5000000, targetCount: 10 },
    ]);

    const dataStoreError = new Error('DataStoreError');
    (dataPersistence.fetchAllDealStages as jest.Mock).mockRejectedValueOnce(dataStoreError);

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(DataFetchFailure);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      'ダッシュボード表示に必要なデータ取得に失敗しました。'
    );
  });
});
