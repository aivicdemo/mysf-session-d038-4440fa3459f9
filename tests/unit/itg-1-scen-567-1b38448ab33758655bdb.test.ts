import { optimizeDashboardPerformanceWithFallback } from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn(),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-567: キャッシュが24時間以上前のとき警告を含める', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include warning message when cached data is older than 24 hours', async () => {
    const { aggregateSalesPerformanceForDashboard } = require('../../src/logic/sales-performance-aggregation');
    const dataStore = require('../../src/platform/data-store');

    // 前提条件を設定：タイムアウト状態（集計処理が null を返す）
    aggregateSalesPerformanceForDashboard.mockResolvedValue(null);

    // キャッシュが24時間以上前のデータを返す（generatedAt: 2024-01-14T08:30:00Z）
    // 要求時刻: 2024-01-15T10:00:00Z なので、差分は38時間30分
    dataStore.listRecords.mockResolvedValue([
      {
        userId: 'user-sales-manager-001',
        cachedData: {
          salesPerformance: {
            totalRevenue: 5000000,
            dealCount: 25,
            conversionRate: 0.42,
          },
          topPerformers: [
            {
              employeeId: 'emp-001',
              name: '営業担当者A',
              revenue: 1200000,
            },
          ],
        },
        generatedAt: new Date('2024-01-14T08:30:00Z'),
      },
    ]);

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime: new Date('2024-01-15T10:00:00Z'),
      responseTimeoutThreshold: 30000,
      userId: 'user-sales-manager-001',
      targetPeriod: {
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-15T23:59:59Z'),
      },
    });

    expect(result.displayContent.type).toBe('cached');
    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toContain('表示されているデータは古い可能性があります');
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.delayNotification?.suggestedAction).toContain('最新データの読み込みを再試行してください');
    expect(result.retryAvailable).toBe(true);
    expect(result.escalationRequired).toBe(false);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(30000);
  });
});
