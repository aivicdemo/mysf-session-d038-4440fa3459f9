import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-539: 経過時間が鮮度基準の50%を超え100%以下のとき、freshnessStatusのisFreshがfalseになり全体のisFreshもfalseになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set isFresh=false when data age is between 50% and 100% of threshold', async () => {
    const dashboardDataTypes = ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference', 'anomalyDetectionLog', 'invoiceStatusClassification', 'invoiceDelayDetection', 'dataflowAnomalies'] as const;
    const currentDateTime = new Date('2025-01-15T10:07:30Z');
    const lastUpdateTimeByDataType: Record<typeof dashboardDataTypes[number], Date> = {
      activityMetrics: new Date('2025-01-15T10:00:00Z'),
      dealStageProgress: new Date('2025-01-15T10:00:00Z'),
      targetAchievementDifference: new Date('2025-01-15T10:00:00Z'),
      anomalyDetectionLog: new Date('2025-01-15T10:00:00Z'),
      invoiceStatusClassification: new Date('2025-01-15T10:00:00Z'),
      invoiceDelayDetection: new Date('2025-01-15T10:00:00Z'),
      dataflowAnomalies: new Date('2025-01-15T10:00:00Z'),
    };

    const result = await validateDashboardDataFreshness({
      dashboardDataTypes,
      lastUpdateTimeByDataType,
      currentDateTime,
    });

    expect(result.isFresh).toBe(false);
    expect(result.freshnessStatus.activityMetrics.isFresh).toBe(false);
    expect(result.freshnessStatus.activityMetrics.ageInSeconds).toBe(450);
    expect(result.freshnessStatus.activityMetrics.thresholdInSeconds).toBe(600);
    expect(result.freshnessStatus.dealStageProgress.isFresh).toBe(false);
    expect(result.freshnessStatus.dealStageProgress.ageInSeconds).toBe(450);
    expect(result.freshnessStatus.dealStageProgress.thresholdInSeconds).toBe(600);
    expect(result.freshnessStatus.targetAchievementDifference.isFresh).toBe(false);
    expect(result.freshnessStatus.targetAchievementDifference.ageInSeconds).toBe(450);
    expect(result.freshnessStatus.targetAchievementDifference.thresholdInSeconds).toBe(600);
    expect(result.freshnessStatus.anomalyDetectionLog.isFresh).toBe(false);
    expect(result.freshnessStatus.anomalyDetectionLog.ageInSeconds).toBe(450);
    expect(result.freshnessStatus.anomalyDetectionLog.thresholdInSeconds).toBe(600);
    expect(result.freshnessStatus.invoiceStatusClassification.isFresh).toBe(false);
    expect(result.freshnessStatus.invoiceStatusClassification.ageInSeconds).toBe(450);
    expect(result.freshnessStatus.invoiceStatusClassification.thresholdInSeconds).toBe(600);
    expect(result.freshnessStatus.invoiceDelayDetection.isFresh).toBe(false);
    expect(result.freshnessStatus.invoiceDelayDetection.ageInSeconds).toBe(450);
    expect(result.freshnessStatus.invoiceDelayDetection.thresholdInSeconds).toBe(600);
    expect(result.freshnessStatus.dataflowAnomalies.isFresh).toBe(false);
    expect(result.freshnessStatus.dataflowAnomalies.ageInSeconds).toBe(450);
    expect(result.freshnessStatus.dataflowAnomalies.thresholdInSeconds).toBe(600);
    expect(result.warningContent).toBe('ダッシュボード表示データが営業部長の意思決定に必要な鮮度を満たしていません。再取得を促してください。');
  });
});
