import {
  optimizeDashboardPerformanceWithFallback,
} from '../../src/logic/dashboard-performance-optimization';

describe('SCEN-565: ダッシュボード表示要求の時刻が現在時刻より未来のとき、エラーを発生させる', () => {
  it('要求時刻が未来のとき例外をスロー', async () => {
    const requestInitiationTime = new Date('2026-10-07T12:00:00.000Z');
    const responseTimeoutThreshold = 30000;
    const userId = 'user-sales-manager-001';
    const targetPeriod = {
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2026-10-07T00:00:00.000Z'),
    };

    await expect(
      optimizeDashboardPerformanceWithFallback({
        requestInitiationTime,
        responseTimeoutThreshold,
        userId,
        targetPeriod,
      })
    ).rejects.toThrow();
  });
});
