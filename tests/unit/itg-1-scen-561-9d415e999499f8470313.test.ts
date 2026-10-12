import { optimizeDashboardPerformanceWithFallback, NoCachedDataAndTimeoutExceeded } from '../../src/logic/dashboard-performance-optimization';
import * as salesAggregation from '../../src/logic/sales-performance-aggregation';

jest.mock('../../src/logic/sales-performance-aggregation');

describe('SCEN-561: データ集計処理でシステムエラーが発生し、キャッシュデータがないとき、簡易版を代替表示してエラー通知を出す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('システムエラー発生、60秒以上経過、キャッシュなしの場合、簡易版ダッシュボードとエラー通知が返される', async () => {
    const requestInitiationTime = new Date('2024-01-15T10:00:00.000Z');
    const responseTimeoutThreshold = 30000;
    const userId = 'user-sales-001';
    const targetPeriod = {
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: new Date('2024-01-31T23:59:59.999Z'),
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
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.delayNotification?.message).toContain('ダッシュボード表示がタイムアウトしました');
    expect(result.delayNotification?.message).toContain('システム管理者への報告を促します');
    expect(result.retryAvailable).toBe(true);
    expect(result.escalationRequired).toBe(true);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(62000);

    expect(salesAggregation.aggregateSalesPerformanceForDashboard).toHaveBeenCalled();
  });
});
