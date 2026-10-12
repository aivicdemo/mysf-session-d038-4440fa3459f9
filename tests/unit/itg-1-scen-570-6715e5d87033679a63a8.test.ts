import { optimizeDashboardPerformanceWithFallback } from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn(),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-570: タイムアウト判定に達したときエスカレーションをtrueで返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return escalationRequired=true when timeout exceeded and no cache available', async () => {
    const { aggregateSalesPerformanceForDashboard } = require('../../src/logic/sales-performance-aggregation');
    const dataStore = require('../../src/platform/data-store');

    // 前提条件を設定：タイムアウト状態
    aggregateSalesPerformanceForDashboard.mockResolvedValue(null);

    // キャッシュが無い場合
    dataStore.listRecords.mockResolvedValue([]);

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime: new Date('2024-01-15T10:00:00.000Z'),
      responseTimeoutThreshold: 30000,
      userId: 'user-sales-manager-001',
      targetPeriod: {
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-31T23:59:59.999Z'),
      },
    });

    expect(result.displayContent.type).toBe('simplified');
    expect(result.escalationRequired).toBe(true);
    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toContain('ダッシュボード表示がタイムアウトしました');
    expect(result.delayNotification?.message).toContain('システム管理者への報告を促します');
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.retryAvailable).toBe(false);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(30000);
  });
});
