import { aggregateSalesPerformanceForDashboard, DataFetchFailure } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-405: DataFetchFailure error when fetchAllSalesRepresentatives fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataFetchFailure error when fetchAllSalesRepresentatives throws DataStoreError', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-15T10:30:00Z'),
      requestingUserId: 'user-001',
    };

    const dataStoreError = new Error('DataStoreError');
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockRejectedValueOnce(dataStoreError);

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(DataFetchFailure);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      'ダッシュボード表示に必要なデータ取得に失敗しました。'
    );
  });
});
