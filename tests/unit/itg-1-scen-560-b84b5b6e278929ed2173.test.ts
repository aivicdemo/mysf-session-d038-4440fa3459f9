import {
  optimizeDashboardPerformanceWithFallback,
} from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue({
    success: false,
    error: 'Database connection timeout',
    data: null,
  }),
}));

describe('SCEN-560: データ集計処理でシステムエラーが発生し、キャッシュデータが存在するとき、キャッシュ版を代替表示してエラー通知を出す', () => {
  it('システムエラー時のキャッシュ版表示', async () => {
    const requestInitiationTime = new Date('2026-10-07T10:00:00.000Z');
    const responseTimeoutThreshold = 30000;
    const userId = 'user-sales-manager-001';
    const targetPeriod = {
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2026-10-31T23:59:59.999Z'),
    };

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime,
      responseTimeoutThreshold,
      userId,
      targetPeriod,
    });

    expect(result.displayContent.type).toBe('cached');
    expect((result.displayContent.data as any).salesMetrics.totalAmount).toBe(5000000);
    expect((result.displayContent.data as any).salesMetrics.dealCount).toBe(15);
    expect((result.displayContent.data as any).salesMetrics.conversionRate).toBe(0.45);
    expect((result.displayContent.data as any).salesRepresentatives[0].name).toBe('営業担当者A');

    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toContain('ダッシュボード表示処理中にエラーが発生しました');
    expect(result.delayNotification?.severity).toBe('warning');

    expect(result.retryAvailable).toBe(true);
    expect(result.escalationRequired).toBe(false);
    expect(result.responseTimeMs).toBeLessThanOrEqual(15000);
  });
});
