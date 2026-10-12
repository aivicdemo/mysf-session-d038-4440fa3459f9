import { optimizeDashboardPerformanceWithFallback, InvalidElapsedTimeError } from '../../src/logic/dashboard-performance-optimization';

describe('SCEN-566: 応答時間計測の結果が負の値になったとき、エラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('応答時間が負の値の場合、時刻計算エラーを throw する', async () => {
    const requestInitiationTime = new Date('2026-10-07T10:00:00.000Z');
    const responseTimeoutThreshold = 30000;
    const userId = 'user-001';
    const targetPeriod = {
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2026-10-07T23:59:59.999Z'),
    };

    await expect(
      optimizeDashboardPerformanceWithFallback({
        requestInitiationTime,
        responseTimeoutThreshold,
        userId,
        targetPeriod,
      })
    ).rejects.toThrow('時刻計算エラーが発生しました');
  });
});
