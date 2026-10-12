import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-538: 経過時間が鮮度基準の50%以下のとき、freshnessStatusのisFreshがtrueになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set isFresh=true when data age is 50% or less of threshold', async () => {
    const dashboardDataTypes = ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference', 'anomalyDetectionLog', 'invoiceStatusClassification', 'invoiceDelayDetection', 'dataflowAnomalies'] as const;
    const currentDateTime = new Date('2026-01-15T10:02:30Z');
    const lastUpdateTimeByDataType: Record<typeof dashboardDataTypes[number], Date> = {
      activityMetrics: new Date('2026-01-15T10:00:00Z'),
      dealStageProgress: new Date('2026-01-15T10:00:00Z'),
      targetAchievementDifference: new Date('2026-01-15T10:00:00Z'),
      anomalyDetectionLog: new Date('2026-01-15T10:00:00Z'),
      invoiceStatusClassification: new Date('2026-01-15T10:00:00Z'),
      invoiceDelayDetection: new Date('2026-01-15T10:00:00Z'),
      dataflowAnomalies: new Date('2026-01-15T10:00:00Z'),
    };

    const result = await validateDashboardDataFreshness({
      dashboardDataTypes,
      lastUpdateTimeByDataType,
      currentDateTime,
    });

    expect(result.isFresh).toBe(true);
    expect(result.freshnessStatus.activityMetrics).toEqual({ isFresh: true, ageInSeconds: 150, thresholdInSeconds: 300 });
    expect(result.freshnessStatus.dealStageProgress).toEqual({ isFresh: true, ageInSeconds: 150, thresholdInSeconds: 300 });
    expect(result.freshnessStatus.targetAchievementDifference).toEqual({ isFresh: true, ageInSeconds: 150, thresholdInSeconds: 300 });
    expect(result.freshnessStatus.anomalyDetectionLog).toEqual({ isFresh: true, ageInSeconds: 150, thresholdInSeconds: 300 });
    expect(result.freshnessStatus.invoiceStatusClassification).toEqual({ isFresh: true, ageInSeconds: 150, thresholdInSeconds: 300 });
    expect(result.freshnessStatus.invoiceDelayDetection).toEqual({ isFresh: true, ageInSeconds: 150, thresholdInSeconds: 300 });
    expect(result.freshnessStatus.dataflowAnomalies).toEqual({ isFresh: true, ageInSeconds: 150, thresholdInSeconds: 300 });
    expect(result.warningContent).toBeNull();
  });
});
