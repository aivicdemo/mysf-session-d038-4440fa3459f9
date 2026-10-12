import { aggregateSalesPerformanceForDashboard, DataFetchFailure } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-406: DataFetchFailure error when fetchActivitiesByRepresentative fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataFetchFailure error when fetchActivitiesByRepresentative throws DataStoreError', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-15T10:30:00Z'),
      requestingUserId: 'user-sales-manager-001',
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValueOnce([
      { repId: 'rep-001', repName: '田中太郎', department: '営業部第一課', hireDate: '2020-04-01' },
      { repId: 'rep-002', repName: '佐藤花子', department: '営業部第二課', hireDate: '2021-06-15' },
    ]);

    const dataStoreError = new Error('DataStoreError');
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockRejectedValueOnce(dataStoreError);

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(DataFetchFailure);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      'ダッシュボード表示に必要なデータ取得に失敗しました。'
    );
  });
});
