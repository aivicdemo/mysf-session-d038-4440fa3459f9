import {
  optimizeDashboardPerformanceWithFallback,
} from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue(null),
}));

describe('SCEN-562: 60秒でタイムアウト判定に達し、キャッシュデータもないとき、エスカレーション要求を出して再試行案内を通知する', () => {
  it('タイムアウト超過時のエスカレーション', async () => {
    const requestInitiationTime = new Date('2026-01-15T10:00:00.000Z');
    const responseTimeoutThreshold = 60000;
    const userId = 'user-sales-manager-001';
    const targetPeriod = {
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-01-31T23:59:59.999Z'),
    };

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime,
      responseTimeoutThreshold,
      userId,
      targetPeriod,
    });

    expect(result.displayContent === null).toBe(true);

    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toContain('ダッシュボード表示がタイムアウトしました');
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.delayNotification?.suggestedAction).toContain('エスカレーション要求');

    expect(result.retryAvailable).toBe(true);
    expect(result.escalationRequired).toBe(true);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(61000);
  });
});
