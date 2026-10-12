import { validateDashboardDataFreshness, InvalidInputData } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-535: 鮮度基準が0分以下に設定されているとき、エラーメッセージ「鮮度要件の設定が不正です。1分以上を指定してください」でthrowされる', () => {
  it('InvalidInputData エラーが鮮度要件の不正を示すメッセージでthrowされる', async () => {
    const input = {
      dashboardDataTypes: ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference'] as const,
      lastUpdateTimeByDataType: {
        activityMetrics: new Date('2024-01-15T10:00:00Z'),
        dealStageProgress: new Date('2024-01-15T10:05:00Z'),
        targetAchievementDifference: new Date('2024-01-15T10:10:00Z'),
        anomalyDetectionLog: new Date('2024-01-15T10:15:00Z'),
        invoiceStatusClassification: new Date('2024-01-15T10:20:00Z'),
        invoiceDelayDetection: new Date('2024-01-15T10:25:00Z'),
        dataflowAnomalies: new Date('2024-01-15T10:30:00Z'),
      },
      currentDateTime: new Date('2024-01-15T10:35:00Z'),
    };

    await expect(validateDashboardDataFreshness(input)).rejects.toThrow(InvalidInputData);
    await expect(validateDashboardDataFreshness(input)).rejects.toThrow('鮮度要件の設定が不正です。1分以上を指定してください');
  });
});
