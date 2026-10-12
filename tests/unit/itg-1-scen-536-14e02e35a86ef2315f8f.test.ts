import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-536: 確認の文脈が月次締め、日次レビュー、臨時確認のいずれでもないとき、警告ログ「確認文脈が不明です。デフォルト（5分）で判定します」が出力され、デフォルト基準で判定が実行される', () => {
  it('警告ログが出力され、デフォルト基準（300秒）で判定されて全データ種別が鮮度を満たす', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const input = {
      dashboardDataTypes: ['activityMetrics', 'dealStageProgress', 'targetAchievementDifference'] as const,
      lastUpdateTimeByDataType: {
        activityMetrics: new Date('2025-01-15T09:00:00Z'),
        dealStageProgress: new Date('2025-01-15T09:00:00Z'),
        targetAchievementDifference: new Date('2025-01-15T09:00:00Z'),
        anomalyDetectionLog: new Date('2025-01-15T09:00:00Z'),
        invoiceStatusClassification: new Date('2025-01-15T09:00:00Z'),
        invoiceDelayDetection: new Date('2025-01-15T09:00:00Z'),
        dataflowAnomalies: new Date('2025-01-15T09:00:00Z'),
      },
      currentDateTime: new Date('2025-01-15T09:03:00Z'),
    };

    const result = await validateDashboardDataFreshness(input);

    expect(result.isFresh).toBe(true);
    expect(result.freshnessStatus.activityMetrics).toEqual({ isFresh: true, ageInSeconds: 180, thresholdInSeconds: 300 });
    expect(result.freshnessStatus.dealStageProgress).toEqual({ isFresh: true, ageInSeconds: 180, thresholdInSeconds: 300 });
    expect(result.freshnessStatus.targetAchievementDifference).toEqual({ isFresh: true, ageInSeconds: 180, thresholdInSeconds: 300 });
    expect(result.warningContent).toBeNull();

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls.some(call =>
      typeof call[0] === 'string' && call[0].includes('確認文脈が不明です。デフォルト（5分）で判定します')
    )).toBe(true);

    consoleSpy.mockRestore();
  });
});
