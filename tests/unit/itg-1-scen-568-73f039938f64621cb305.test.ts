import { optimizeDashboardPerformanceWithFallback } from '../../src/logic/dashboard-performance-optimization';

jest.mock('../../src/logic/sales-performance-aggregation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation')>('../../src/logic/sales-performance-aggregation'),
  aggregateSalesPerformanceForDashboard: jest.fn(),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-568: 再試行が許可されているときtrueで返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return retryAvailable=true when retry is allowed by strategy', async () => {
    const { aggregateSalesPerformanceForDashboard } = require('../../src/logic/sales-performance-aggregation');
    const dataStore = require('../../src/platform/data-store');

    // 前提条件を設定：タイムアウト状態
    aggregateSalesPerformanceForDashboard.mockResolvedValue(null);

    // キャッシュデータを返す（1時間以内の新しいキャッシュ）
    dataStore.listRecords.mockResolvedValue([
      {
        userId: 'user-12345',
        cachedData: {
          deals: [
            {
              id: 'deal-001',
              name: 'A社との新規契約',
              amount: 5000000,
              stage: '商談成立',
            },
          ],
        },
        generatedAt: new Date('2026-10-07T09:00:00.000Z'),
      },
    ]);

    const result = await optimizeDashboardPerformanceWithFallback({
      requestInitiationTime: new Date('2026-10-07T10:00:00.000Z'),
      responseTimeoutThreshold: 30000,
      userId: 'user-12345',
      targetPeriod: {
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-10-31T23:59:59.999Z'),
      },
    });

    expect(result.displayContent.type).toBe('cached');
    expect(result.displayContent.data).toEqual({
      deals: [
        {
          id: 'deal-001',
          name: 'A社との新規契約',
          amount: 5000000,
          stage: '商談成立',
        },
      ],
    });
    expect(result.displayContent.generatedAt).toEqual(new Date('2026-10-07T09:00:00.000Z'));
    expect(result.retryAvailable).toBe(true);
    expect(result.delayNotification).not.toBeNull();
    expect(result.delayNotification?.severity).toBe('warning');
    expect(result.delayNotification?.message).toContain('ダッシュボード表示に時間がかかっています');
    expect(result.escalationRequired).toBe(false);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(30000);
  });
});
