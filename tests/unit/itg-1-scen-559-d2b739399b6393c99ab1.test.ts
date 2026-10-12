import { optimizeDashboardPerformanceWithFallback } from '../../src/logic/dashboard-performance-optimization';
import * as salesAggregation from '../../src/logic/sales-performance-aggregation';

jest.mock('../../src/logic/sales-performance-aggregation');

describe('SCEN-559: データ集計処理がタイムアウトし、キャッシュデータがないとき、簡易版を代替表示して遅延通知を出す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('タイムアウト発生、キャッシュなしの場合、簡易版ダッシュボードと遅延通知が返される', async () => {
    const requestInitiationTime = new Date('2026-10-07T10:00:00.000Z');
    const responseTimeoutThreshold = 30000;
    const userId = 'user-sales-dept-001';
    const targetPeriod = {
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2026-10-31T23:59:59.999Z'),
    };

    (salesAggregation.aggregateSalesPerformanceForDashboard as jest.Mock).mockResolvedValue(null);

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime,
      responseTimeoutThreshold,
      userId,
      targetPeriod,
    });

    expect(result.displayContent.type).toBe('simplified');
    expect(result.displayContent.data).toHaveProperty('activityMetricsSummary');
    expect(result.displayContent.data).toHaveProperty('dealStageProgressSummary');
    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toContain('ダッシュボード表示に時間がかかっています');
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.delayNotification?.suggestedAction).toContain('再試行');
    expect(result.retryAvailable).toBe(true);
    expect(result.escalationRequired).toBe(false);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(30000);

    expect(salesAggregation.aggregateSalesPerformanceForDashboard).toHaveBeenCalled();
  });
});
