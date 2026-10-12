import { validateDashboardDataFreshness, InvalidInputData } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-534: データの最終更新時刻が現在時刻より未来のとき、エラーメッセージでthrowされる', () => {
  it('should throw InvalidInputData error when lastUpdateTime is in the future', async () => {
    const dashboardDataTypes = ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference', 'anomalyDetectionLog', 'invoiceStatusClassification', 'invoiceDelayDetection', 'dataflowAnomalies'] as const;
    const currentDateTime = new Date('2026-01-15T09:55:00Z');
    const lastUpdateTimeByDataType: Record<typeof dashboardDataTypes[number], Date> = {
      activityMetrics: new Date('2026-01-15T10:00:00Z'),
      dealStageProgress: new Date('2026-01-15T10:00:00Z'),
      targetAchievementDifference: new Date('2026-01-15T10:00:00Z'),
      anomalyDetectionLog: new Date('2026-01-15T10:00:00Z'),
      invoiceStatusClassification: new Date('2026-01-15T10:00:00Z'),
      invoiceDelayDetection: new Date('2026-01-15T10:00:00Z'),
      dataflowAnomalies: new Date('2026-01-15T10:00:00Z'),
    };

    await expect(
      validateDashboardDataFreshness({
        dashboardDataTypes,
        lastUpdateTimeByDataType,
        currentDateTime,
      })
    ).rejects.toThrow(InvalidInputData);

    await expect(
      validateDashboardDataFreshness({
        dashboardDataTypes,
        lastUpdateTimeByDataType,
        currentDateTime,
      })
    ).rejects.toThrow('データ更新時刻が不正です。システム管理者に連絡してください');
  });
});
