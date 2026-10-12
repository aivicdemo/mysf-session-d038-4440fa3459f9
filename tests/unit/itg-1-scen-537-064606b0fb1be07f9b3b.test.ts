import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-537: 複数データ種別の経過時間が異なるとき、各種別ごとの経過時間秒とthresholdInSecondsがfreshnessStatusに個別に記録される', () => {
  it('複数データ種別の個別の鮮度ステータスが記録され、複数種別が鮮度基準を超過するため警告メッセージが返される', async () => {
    const input = {
      dashboardDataTypes: ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference', 'anomalyDetectionLog', 'invoiceStatusClassification', 'invoiceDelayDetection'] as const,
      lastUpdateTimeByDataType: {
        activityMetrics: new Date('2024-01-15T10:00:00Z'),
        dealStageProgress: new Date('2024-01-15T09:30:00Z'),
        targetAchievementDifference: new Date('2024-01-15T08:00:00Z'),
        anomalyDetectionLog: new Date('2024-01-15T11:00:00Z'),
        invoiceStatusClassification: new Date('2024-01-15T07:00:00Z'),
        invoiceDelayDetection: new Date('2024-01-15T10:30:00Z'),
        dataflowAnomalies: new Date('2024-01-15T12:00:00Z'),
      },
      currentDateTime: new Date('2024-01-15T12:30:00Z'),
    };

    const result = await validateDashboardDataFreshness(input);

    expect(result.isFresh).toBe(false);
    expect(result.freshnessStatus.activityMetrics).toEqual({ isFresh: true, ageInSeconds: 1800, thresholdInSeconds: 1800 });
    expect(result.freshnessStatus.dealStageProgress).toEqual({ isFresh: false, ageInSeconds: 3600, thresholdInSeconds: 900 });
    expect(result.freshnessStatus.targetAchievementDifference).toEqual({ isFresh: false, ageInSeconds: 16200, thresholdInSeconds: 1200 });
    expect(result.freshnessStatus.anomalyDetectionLog).toEqual({ isFresh: false, ageInSeconds: 5400, thresholdInSeconds: 600 });
    expect(result.freshnessStatus.invoiceStatusClassification).toEqual({ isFresh: false, ageInSeconds: 19800, thresholdInSeconds: 3600 });
    expect(result.freshnessStatus.invoiceDelayDetection).toEqual({ isFresh: false, ageInSeconds: 7200, thresholdInSeconds: 1500 });
    expect(result.freshnessStatus.dataflowAnomalies).toEqual({ isFresh: true, ageInSeconds: 1800, thresholdInSeconds: 1800 });
    expect(result.warningContent).toBe('ダッシュボード表示データが営業部長の意思決定に必要な鮮度を満たしていません。再取得を促してください。');
  });
});
