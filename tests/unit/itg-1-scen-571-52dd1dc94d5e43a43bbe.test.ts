import { optimizeDashboardPerformanceWithFallback } from '../../src/logic/dashboard-performance-optimization';
import * as salesAggregation from '../../src/logic/sales-performance-aggregation';

jest.mock('../../src/logic/sales-performance-aggregation');

describe('SCEN-571: 応答時間が30秒以内に完了したとき、実際の応答時間をミリ秒単位で正確に記録して返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('30秒以内に完了した場合、完全版ダッシュボードと正確な応答時間が返される', async () => {
    const requestInitiationTime = new Date('2026-01-15T10:00:00.000Z');
    const responseTimeoutThreshold = 30000;
    const userId = 'user-sales-mgr-001';
    const targetPeriod = {
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-01-31T23:59:59.999Z'),
    };
    const aggregatedAt = new Date('2026-01-15T10:00:15.234Z');
    const elapsedMs = 15234;

    const aggregationResult = {
      data: {
        sales: 15000000,
        opportunities: 42,
        closedOpportunities: 28,
        accounts: 35,
        activities: 156,
        pipeline: 8500000,
      },
      aggregatedAt,
    };

    (salesAggregation.aggregateSalesPerformanceForDashboard as jest.Mock).mockResolvedValue(
      aggregationResult
    );

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime,
      responseTimeoutThreshold,
      userId,
      targetPeriod,
    });

    expect(result.displayContent.type).toBe('complete');
    expect(result.displayContent.data).toHaveProperty('sales', 15000000);
    expect(result.displayContent.data).toHaveProperty('opportunities', 42);
    expect(result.displayContent.data).toHaveProperty('closedOpportunities', 28);
    expect(result.displayContent.data).toHaveProperty('accounts', 35);
    expect(result.displayContent.data).toHaveProperty('activities', 156);
    expect(result.displayContent.data).toHaveProperty('pipeline', 8500000);
    expect(result.displayContent.generatedAt).toEqual(aggregatedAt);
    expect(result.responseTimeMs).toBe(elapsedMs);
    expect(result.responseTimeMs).toBeLessThanOrEqual(30000);
    expect(result.delayNotification).toBeNull();
    expect(result.retryAvailable).toBe(false);
    expect(result.escalationRequired).toBe(false);

    expect(salesAggregation.aggregateSalesPerformanceForDashboard).toHaveBeenCalled();
  });
});
