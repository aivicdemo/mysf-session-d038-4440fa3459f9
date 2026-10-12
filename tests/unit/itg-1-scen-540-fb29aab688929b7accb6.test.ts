import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-540: 経過時間が鮮度基準を100%超過するとき、freshnessStatusのisFreshがfalseになり全体のisFreshもfalseになる', () => {
  const dataTypes: ReadonlyArray<'activityMetrics' | 'dealStageProgress' | 'targetAchievementDifference' | 'anomalyDetectionLog' | 'invoiceStatusClassification' | 'invoiceDelayDetection' | 'dataflowAnomalies'> = [
    'activityMetrics',
    'dealStageProgress',
    'targetAchievementDifference',
    'anomalyDetectionLog',
    'invoiceStatusClassification',
    'invoiceDelayDetection',
    'dataflowAnomalies',
  ];

  const lastUpdateTime = new Date('2025-01-01T09:00:00Z');
  const currentDateTime = new Date('2025-01-01T10:30:00Z');

  it('should return isFresh: false for all data types when age exceeds threshold by 150%', async () => {
    const lastUpdateTimeByDataType = {
      activityMetrics: lastUpdateTime,
      dealStageProgress: lastUpdateTime,
      targetAchievementDifference: lastUpdateTime,
      anomalyDetectionLog: lastUpdateTime,
      invoiceStatusClassification: lastUpdateTime,
      invoiceDelayDetection: lastUpdateTime,
      dataflowAnomalies: lastUpdateTime,
    };

    const result = await validateDashboardDataFreshness({
      dashboardDataTypes: dataTypes,
      lastUpdateTimeByDataType,
      currentDateTime,
    });

    expect(result.isFresh).toBe(false);
    expect(result.freshnessStatus.activityMetrics.isFresh).toBe(false);
    expect(result.freshnessStatus.dealStageProgress.isFresh).toBe(false);
    expect(result.freshnessStatus.targetAchievementDifference.isFresh).toBe(false);
    expect(result.freshnessStatus.anomalyDetectionLog.isFresh).toBe(false);
    expect(result.freshnessStatus.invoiceStatusClassification.isFresh).toBe(false);
    expect(result.freshnessStatus.invoiceDelayDetection.isFresh).toBe(false);
    expect(result.freshnessStatus.dataflowAnomalies.isFresh).toBe(false);

    expect(result.freshnessStatus.activityMetrics.ageInSeconds).toBe(5400);
    expect(result.freshnessStatus.activityMetrics.thresholdInSeconds).toBe(3600);

    expect(result.warningContent).toBe('ダッシュボード表示データが営業部長の意思決定に必要な鮮度を満たしていません。再取得を促してください。');
  });
});
