import {
  optimizeDashboardPerformanceWithFallback,
} from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue(null),
}));

describe('SCEN-563: 簡易版ダッシュボード生成処理が失敗し、キャッシュデータもないとき、エスカレーション要求を出す', () => {
  it('簡易版表示によるエスカレーション', async () => {
    const requestInitiationTime = new Date('2025-01-15T10:00:00.000Z');
    const responseTimeoutThreshold = 30000;
    const userId = 'user-sales-manager-001';
    const targetPeriod = {
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-01-31T23:59:59.999Z'),
    };

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime,
      responseTimeoutThreshold,
      userId,
      targetPeriod,
    });

    expect(result.displayContent.type).toBe('simplified');
    expect(result.displayContent.data.activityMetricsSummary).toHaveLength(1);
    expect(result.displayContent.data.activityMetricsSummary[0].representativeName).toBe('営業担当者A');
    expect(result.displayContent.data.dealStageProgressSummary).toHaveLength(1);
    expect(result.displayContent.data.dealStageProgressSummary[0].stageName).toBe('negotiation');
    expect(result.displayContent.generatedAt).toEqual(new Date('2025-01-15T10:01:05.000Z'));

    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.message).toContain('ダッシュボード表示がタイムアウトしました');
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.delayNotification?.suggestedAction).toContain('システム管理者に連絡');

    expect(result.retryAvailable).toBe(false);
    expect(result.escalationRequired).toBe(true);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(65000);
  });
});
