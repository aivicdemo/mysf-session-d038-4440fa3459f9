import { optimizeDashboardPerformanceWithFallback } from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn(),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-569: 再試行が禁止されているときfalseで返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return retryAvailable=false when retry is disabled by policy', async () => {
    const { aggregateSalesPerformanceForDashboard } = require('../../src/logic/sales-performance-aggregation');
    const dataStore = require('../../src/platform/data-store');

    // 前提条件を設定：タイムアウト状態
    aggregateSalesPerformanceForDashboard.mockResolvedValue(null);

    // キャッシュデータを返す
    dataStore.listRecords.mockResolvedValue([
      {
        userId: 'user-001',
        cachedData: {
          totalRevenue: 5000000,
          dealCount: 45,
          conversionRate: 0.32,
          cachedAt: '2024-01-14T10:00:00.000Z',
        },
        generatedAt: new Date('2024-01-14T10:00:00.000Z'),
      },
    ]);

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime: new Date('2024-01-15T10:00:00.000Z'),
      responseTimeoutThreshold: 30000,
      userId: 'user-001',
      targetPeriod: {
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-31T23:59:59.999Z'),
      },
    });

    expect(result.displayContent.type).toBe('cached');
    expect(result.displayContent.data).toEqual({
      totalRevenue: 5000000,
      dealCount: 45,
      conversionRate: 0.32,
      cachedAt: '2024-01-14T10:00:00.000Z',
    });
    expect(result.displayContent.generatedAt).toEqual(new Date('2024-01-14T10:00:00.000Z'));
    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toContain('ダッシュボード表示に時間がかかっています');
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.retryAvailable).toBe(false);
    expect(result.escalationRequired).toBe(false);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(32000);
  });
});
