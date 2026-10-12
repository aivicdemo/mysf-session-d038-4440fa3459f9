import {
  optimizeDashboardPerformanceWithFallback,
} from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue(null),
}));

describe('SCEN-564: 応答時間計測の基準点から30秒以上60秒未満が経過し、データ集計がまだ進行中のとき、フォールバック判定が発動する', () => {
  it('キャッシュデータによるフォールバック', async () => {
    const requestInitiationTime = new Date('2026-01-15T10:00:00.000Z');
    const responseTimeoutThreshold = 30000;
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

    expect(result.displayContent.type).toBe('cached');
    expect(result.displayContent.data.period).toBe('2026-01-01 to 2026-01-14');
    expect(result.displayContent.data.summary).toBe('前月キャッシュデータ');
    expect(result.displayContent.generatedAt).toEqual(new Date('2026-01-14T15:30:00.000Z'));

    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toContain('最新データを読み込み中');
    expect(result.delayNotification?.severity).toBe('warning');

    expect(result.retryAvailable).toBe(true);
    expect(result.escalationRequired).toBe(false);
    expect(result.responseTimeMs).toBe(45000);
  });
});
