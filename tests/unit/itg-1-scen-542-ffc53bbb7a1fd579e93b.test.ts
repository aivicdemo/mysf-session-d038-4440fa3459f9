import { validateDashboardDataFreshness, InvalidInputData } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-542: currentDateTimeがnullまたは無効なDate型のとき、エラーメッセージ「ダッシュボード表示要求の入力データが不正です。」でthrowされる', () => {
  it('currentDateTimeがnullのとき、InvalidInputDataエラーが投げられる', async () => {
    const input = {
      dashboardDataTypes: ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference', 'anomalyDetectionLog', 'invoiceStatusClassification', 'invoiceDelayDetection', 'dataflowAnomalies'] as const,
      lastUpdateTimeByDataType: {
        activityMetrics: new Date('2026-10-07T10:00:00Z'),
        dealStageProgress: new Date('2026-10-07T10:05:00Z'),
        targetAchievementDifference: new Date('2026-10-07T10:10:00Z'),
        anomalyDetectionLog: new Date('2026-10-07T10:15:00Z'),
        invoiceStatusClassification: new Date('2026-10-07T10:20:00Z'),
        invoiceDelayDetection: new Date('2026-10-07T10:25:00Z'),
        dataflowAnomalies: new Date('2026-10-07T10:30:00Z'),
      },
      currentDateTime: null as any,
    };

    await expect(validateDashboardDataFreshness(input)).rejects.toThrow(InvalidInputData);
    await expect(validateDashboardDataFreshness(input)).rejects.toThrow('ダッシュボード表示要求の入力データが不正です。');
  });
});
