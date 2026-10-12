import { aggregateSalesPerformanceForDashboard, DataFetchFailure } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-407: DataFetchFailure error when fetchDealsForPeriod fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataFetchFailure error when fetchDealsForPeriod throws DataStoreError', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-15T10:30:00Z'),
      requestingUserId: 'user-001',
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValueOnce([
      { rep_id: 'rep-001', rep_name: '営業太郎', department: '営業部' },
    ]);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValueOnce([
      { activity_id: 'act-001', rep_id: 'rep-001', activity_date: '2024-11-01', activity_type: '訪問' },
    ]);

    const dataStoreError = new Error('DataStoreError');
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockRejectedValueOnce(dataStoreError);

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(DataFetchFailure);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      'ダッシュボード表示に必要なデータ取得に失敗しました。'
    );
  });
});
