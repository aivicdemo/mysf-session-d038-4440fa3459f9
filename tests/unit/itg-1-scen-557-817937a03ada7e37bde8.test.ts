import {
  optimizeDashboardPerformanceWithFallback,
} from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue({
    metrics: {
      revenue: 15000000,
      dealCount: 45,
      conversionRate: 0.62,
    },
    pipeline: {
      negotiation: 8500000,
      proposal: 4200000,
      prospecting: 2300000,
    },
    generatedAt: new Date('2026-10-07T10:00:15.500Z'),
  }),
}));

describe('SCEN-557: 完全なダッシュボードデータが30秒以内に集計完了したとき、完全版を即座に表示する', () => {
  it('完全版ダッシュボード表示', async () => {
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

    expect(result.displayContent.type).toBe('complete');
    expect(result.displayContent.data).toEqual({
      metrics: {
        revenue: 15000000,
        dealCount: 45,
        conversionRate: 0.62,
      },
      pipeline: {
        negotiation: 8500000,
        proposal: 4200000,
        prospecting: 2300000,
      },
      generatedAt: new Date('2026-10-07T10:00:15.500Z'),
    });
    expect(result.displayContent.generatedAt).toEqual(new Date('2026-10-07T10:00:15.500Z'));
    expect(result.delayNotification).toBeNull();
    expect(result.retryAvailable).toBe(false);
    expect(result.escalationRequired).toBe(false);
    expect(result.responseTimeMs).toBe(15500);
  });
});
