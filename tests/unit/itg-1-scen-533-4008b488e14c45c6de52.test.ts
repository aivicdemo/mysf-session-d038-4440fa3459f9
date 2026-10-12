import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-533: validateDashboardDataFreshness - each data type age within criteria', () => {
  test('should have isFresh true in freshnessStatus for all data types when all ages within threshold', async () => {
    const dataTypes = ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference', 'anomalyDetectionLog', 'invoiceStatusClassification', 'invoiceDelayDetection', 'dataflowAnomalies'] as const;

    const lastUpdateTimes = {
      activityMetrics: new Date('2026-01-15T10:00:00Z'),
      dealStageProgress: new Date('2026-01-15T10:05:00Z'),
      targetAchievementDifference: new Date('2026-01-15T10:10:00Z'),
      anomalyDetectionLog: new Date('2026-01-15T10:02:00Z'),
      invoiceStatusClassification: new Date('2026-01-15T10:03:00Z'),
      invoiceDelayDetection: new Date('2026-01-15T10:04:00Z'),
      dataflowAnomalies: new Date('2026-01-15T10:01:00Z'),
    };

    const currentDateTime = new Date('2026-01-15T10:15:00Z');

    const result = await validateDashboardDataFreshness({
      dashboardDataTypes: dataTypes,
      lastUpdateTimeByDataType: lastUpdateTimes,
      currentDateTime,
    });

    expect(result.isFresh).toBe(true);
    expect(result.warningContent).toBeNull();

    expect(result.freshnessStatus.activityMetrics.isFresh).toBe(true);
    expect(result.freshnessStatus.activityMetrics.ageInSeconds).toBe(900);
    expect(result.freshnessStatus.activityMetrics.thresholdInSeconds).toBe(900);

    expect(result.freshnessStatus.dealStageProgress.isFresh).toBe(true);
    expect(result.freshnessStatus.dealStageProgress.ageInSeconds).toBe(600);
    expect(result.freshnessStatus.dealStageProgress.thresholdInSeconds).toBe(900);

    expect(result.freshnessStatus.targetAchievementDifference.isFresh).toBe(true);
    expect(result.freshnessStatus.targetAchievementDifference.ageInSeconds).toBe(300);
    expect(result.freshnessStatus.targetAchievementDifference.thresholdInSeconds).toBe(900);

    expect(result.freshnessStatus.anomalyDetectionLog.isFresh).toBe(true);
    expect(result.freshnessStatus.anomalyDetectionLog.ageInSeconds).toBe(780);
    expect(result.freshnessStatus.anomalyDetectionLog.thresholdInSeconds).toBe(900);

    expect(result.freshnessStatus.invoiceStatusClassification.isFresh).toBe(true);
    expect(result.freshnessStatus.invoiceStatusClassification.ageInSeconds).toBe(720);
    expect(result.freshnessStatus.invoiceStatusClassification.thresholdInSeconds).toBe(900);

    expect(result.freshnessStatus.invoiceDelayDetection.isFresh).toBe(true);
    expect(result.freshnessStatus.invoiceDelayDetection.ageInSeconds).toBe(660);
    expect(result.freshnessStatus.invoiceDelayDetection.thresholdInSeconds).toBe(900);

    expect(result.freshnessStatus.dataflowAnomalies.isFresh).toBe(true);
    expect(result.freshnessStatus.dataflowAnomalies.ageInSeconds).toBe(840);
    expect(result.freshnessStatus.dataflowAnomalies.thresholdInSeconds).toBe(900);
  });
});
