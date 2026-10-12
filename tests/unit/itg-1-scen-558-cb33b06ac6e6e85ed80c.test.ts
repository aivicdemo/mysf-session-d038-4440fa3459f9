import {
  optimizeDashboardPerformanceWithFallback,
} from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue(null),
}));

describe('SCEN-558: データ集計処理がタイムアウトし、キャッシュデータが存在するとき、キャッシュ版を代替表示して遅延通知を出す', () => {
  it('キャッシュ版ダッシュボード表示と遅延通知', async () => {
    const requestInitiationTime = new Date('2026-10-07T10:00:00.000Z');
    const responseTimeoutThreshold = 30000;
    const userId = 'user-sales-dept-001';
    const targetPeriod = {
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2026-10-07T23:59:59.999Z'),
    };

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime,
      responseTimeoutThreshold,
      userId,
      targetPeriod,
    });

    expect(result.displayContent.type).toBe('cached');
    expect((result.displayContent.data as any).metrics.totalAmount).toBe(15000000);
    expect((result.displayContent.data as any).metrics.dealCount).toBe(45);
    expect((result.displayContent.data as any).metrics.conversionRate).toBe(0.68);
    expect((result.displayContent.data as any).topPerformers[0].name).toBe('山田太郎');
    expect(result.displayContent.generatedAt).toEqual(new Date('2026-10-06T15:30:00.000Z'));

    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toBe('ダッシュボード表示に時間がかかっています。キャッシュデータまたは簡易版を表示します。');
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.delayNotification?.suggestedAction).toContain('再度試して');

    expect(result.retryAvailable).toBe(true);
    expect(result.escalationRequired).toBe(false);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(30000);
  });
});
