import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-414: aggregateSalesPerformanceForDashboard - error when fiscal year start month is 13', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when fiscal year start month is 13 (invalid)', async () => {
    const targetPeriod = '2024-03';
    const currentDate = new Date('2024-03-15T09:30:00Z');
    const requestingUserId = 'user-001';

    // Mock to simulate invalid fiscal year start month configuration
    jest.mocked(dataPersistence.fetchAllSalesRepresentatives).mockImplementation(() => {
      const error = new Error('会計年度開始月の設定が不正です。1～12の値を指定してください。');
      error.name = 'InvalidConfigurationError';
      return Promise.reject(error);
    });

    await expect(
      aggregateSalesPerformanceForDashboard({
        targetPeriod,
        currentDate,
        requestingUserId,
      })
    ).rejects.toThrow('会計年度開始月の設定が不正です。1～12の値を指定してください。');
  });
});
