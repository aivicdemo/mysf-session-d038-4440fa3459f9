import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-531: validateDashboardDataFreshness - all data types within freshness criteria', () => {
  test('should return isFresh true with no warnings when all data types meet freshness criteria', async () => {
    const dataTypes = ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference', 'anomalyDetectionLog', 'invoiceStatusClassification', 'invoiceDelayDetection', 'dataflowAnomalies'] as const;

    const lastUpdateTimes = {
      activityMetrics: new Date('2025-01-15T10:00:00Z'),
      dealStageProgress: new Date('2025-01-15T10:02:00Z'),
      targetAchievementDifference: new Date('2025-01-15T10:01:00Z'),
      anomalyDetectionLog: new Date('2025-01-15T10:03:00Z'),
      invoiceStatusClassification: new Date('2025-01-15T09:58:00Z'),
      invoiceDelayDetection: new Date('2025-01-15T10:00:30Z'),
      dataflowAnomalies: new Date('2025-01-15T10:02:30Z'),
    };

    const currentDateTime = new Date('2025-01-15T10:05:00Z');

    const result = await validateDashboardDataFreshness({
      dashboardDataTypes: dataTypes,
      lastUpdateTimeByDataType: lastUpdateTimes,
      currentDateTime,
    });

    expect(result.isFresh).toBe(true);
    expect(result.warningContent).toBeNull();

    expect(result.freshnessStatus.activityMetrics.isFresh).toBe(true);
    expect(result.freshnessStatus.activityMetrics.ageInSeconds).toBe(300);
    expect(result.freshnessStatus.activityMetrics.thresholdInSeconds).toBe(300);

    expect(result.freshnessStatus.dealStageProgress.isFresh).toBe(true);
    expect(result.freshnessStatus.dealStageProgress.ageInSeconds).toBe(180);
    expect(result.freshnessStatus.dealStageProgress.thresholdInSeconds).toBe(300);

    expect(result.freshnessStatus.targetAchievementDifference.isFresh).toBe(true);
    expect(result.freshnessStatus.targetAchievementDifference.ageInSeconds).toBe(240);
    expect(result.freshnessStatus.targetAchievementDifference.thresholdInSeconds).toBe(300);

    expect(result.freshnessStatus.anomalyDetectionLog.isFresh).toBe(true);
    expect(result.freshnessStatus.anomalyDetectionLog.ageInSeconds).toBe(120);
    expect(result.freshnessStatus.anomalyDetectionLog.thresholdInSeconds).toBe(300);

    expect(result.freshnessStatus.invoiceStatusClassification.isFresh).toBe(true);
    expect(result.freshnessStatus.invoiceStatusClassification.ageInSeconds).toBe(420);
    expect(result.freshnessStatus.invoiceStatusClassification.thresholdInSeconds).toBe(300);

    expect(result.freshnessStatus.invoiceDelayDetection.isFresh).toBe(true);
    expect(result.freshnessStatus.invoiceDelayDetection.ageInSeconds).toBe(270);
    expect(result.freshnessStatus.invoiceDelayDetection.thresholdInSeconds).toBe(300);

    expect(result.freshnessStatus.dataflowAnomalies.isFresh).toBe(true);
    expect(result.freshnessStatus.dataflowAnomalies.ageInSeconds).toBe(150);
    expect(result.freshnessStatus.dataflowAnomalies.thresholdInSeconds).toBe(300);
  });
});
