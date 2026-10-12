import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-532: いずれかのデータ種別が鮮度基準を超過しているとき、isFreshがfalseで警告メッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isFresh=false and warning message when some data types exceed freshness threshold', async () => {
    const dashboardDataTypes = ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference', 'anomalyDetectionLog', 'invoiceStatusClassification', 'invoiceDelayDetection', 'dataflowAnomalies'] as const;
    const currentDateTime = new Date('2026-10-07T12:00:00Z');
    const lastUpdateTimeByDataType: Record<typeof dashboardDataTypes[number], Date> = {
      activityMetrics: new Date('2026-10-07T11:50:00Z'),
      dealStageProgress: new Date('2026-10-07T11:55:00Z'),
      targetAchievementDifference: new Date('2026-10-07T11:45:00Z'),
      anomalyDetectionLog: new Date('2026-10-07T11:40:00Z'),
      invoiceStatusClassification: new Date('2026-10-07T11:30:00Z'),
      invoiceDelayDetection: new Date('2026-10-07T11:20:00Z'),
      dataflowAnomalies: new Date('2026-10-07T10:55:00Z'),
    };

    const result = await validateDashboardDataFreshness({
      dashboardDataTypes,
      lastUpdateTimeByDataType,
      currentDateTime,
    });

    expect(result.isFresh).toBe(false);
    expect(result.freshnessStatus).toBeDefined();
    expect(result.freshnessStatus.invoiceStatusClassification.isFresh).toBe(false);
    expect(result.freshnessStatus.invoiceStatusClassification.ageInSeconds).toBe(1800);
    expect(result.freshnessStatus.invoiceStatusClassification.thresholdInSeconds).toBe(600);
    expect(result.freshnessStatus.invoiceDelayDetection.isFresh).toBe(false);
    expect(result.freshnessStatus.invoiceDelayDetection.ageInSeconds).toBe(2400);
    expect(result.freshnessStatus.invoiceDelayDetection.thresholdInSeconds).toBe(600);
    expect(result.freshnessStatus.dataflowAnomalies.isFresh).toBe(false);
    expect(result.freshnessStatus.dataflowAnomalies.ageInSeconds).toBe(3000);
    expect(result.freshnessStatus.dataflowAnomalies.thresholdInSeconds).toBe(600);
    expect(result.warningContent).toBe('ダッシュボード表示データが営業部長の意思決定に必要な鮮度を満たしていません。再取得を促してください。');
  });
});
