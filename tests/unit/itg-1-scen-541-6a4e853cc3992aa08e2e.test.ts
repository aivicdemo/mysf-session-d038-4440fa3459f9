import { validateDashboardDataFreshness, InvalidInputData } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-541: 入力型の必須フィールドが不足しているとき、エラーメッセージ「ダッシュボード表示要求の入力データが不正です。」でthrowされる', () => {
  it('should throw InvalidInputData error when dashboardDataTypes is null', async () => {
    const lastUpdateTimeByDataType = {
      activityMetrics: new Date('2026-01-15T10:00:00Z'),
      dealStageProgress: new Date('2026-01-15T10:05:00Z'),
      targetAchievementDifference: new Date('2026-01-15T10:10:00Z'),
      anomalyDetectionLog: new Date('2026-01-15T10:15:00Z'),
      invoiceStatusClassification: new Date('2026-01-15T10:20:00Z'),
      invoiceDelayDetection: new Date('2026-01-15T10:25:00Z'),
      dataflowAnomalies: new Date('2026-01-15T10:30:00Z'),
    };

    const currentDateTime = new Date('2026-01-15T12:00:00Z');

    await expect(
      validateDashboardDataFreshness({
        dashboardDataTypes: null as any,
        lastUpdateTimeByDataType,
        currentDateTime,
      })
    ).rejects.toThrow(InvalidInputData);

    try {
      await validateDashboardDataFreshness({
        dashboardDataTypes: null as any,
        lastUpdateTimeByDataType,
        currentDateTime,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidInputData);
      expect((error as Error).message).toBe('ダッシュボード表示要求の入力データが不正です。');
    }
  });
});
