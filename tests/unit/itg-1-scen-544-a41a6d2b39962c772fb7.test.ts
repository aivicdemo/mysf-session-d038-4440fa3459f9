import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-544: 鮮度不足のデータ種別が複数あるとき、warningContentに複数の種別名が含まれた警告メッセージが返される', () => {
  it('鮮度不足のデータ種別（dealStageProgress、invoiceStatusClassification）が検出され、警告メッセージが返される', async () => {
    const input = {
      dashboardDataTypes: ['activityMetrics', 'dealStageProgress', 'invoiceStatusClassification'] as const,
      lastUpdateTimeByDataType: {
        activityMetrics: new Date('2024-01-15T10:00:00Z'),
        dealStageProgress: new Date('2024-01-15T09:50:00Z'),
        targetAchievementDifference: new Date('2024-01-15T10:30:00Z'),
        anomalyDetectionLog: new Date('2024-01-15T10:30:00Z'),
        invoiceStatusClassification: new Date('2024-01-15T08:00:00Z'),
        invoiceDelayDetection: new Date('2024-01-15T10:30:00Z'),
        dataflowAnomalies: new Date('2024-01-15T10:30:00Z'),
      },
      currentDateTime: new Date('2024-01-15T11:00:00Z'),
    };

    const result = await validateDashboardDataFreshness(input);

    expect(result.isFresh).toBe(false);
    expect(result.freshnessStatus.activityMetrics.isFresh).toBe(true);
    expect(result.freshnessStatus.dealStageProgress.isFresh).toBe(false);
    expect(result.freshnessStatus.invoiceStatusClassification.isFresh).toBe(false);
    expect(result.warningContent).toContain('ダッシュボード表示データが営業部長の意思決定に必要な鮮度を満たしていません。再取得を促してください。');
    expect(result.warningContent).toContain('dealStageProgress');
    expect(result.warningContent).toContain('invoiceStatusClassification');
  });
});
