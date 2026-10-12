import { validateDashboardDataFreshness } from '../../src/logic/dashboard-data-freshness';

describe('SCEN-543: dashboardDataTypesが空配列のとき、isFreshがtrueで警告なしで返される', () => {
  it('空配列が指定されたとき、isFresh=true、freshnessStatus={}、warningContent=nullで返される', async () => {
    const input = {
      dashboardDataTypes: [] as const,
      lastUpdateTimeByDataType: {
        activityMetrics: new Date('2025-01-15T10:00:00Z'),
        dealStageProgress: new Date('2025-01-15T10:00:00Z'),
        targetAchievementDifference: new Date('2025-01-15T10:00:00Z'),
        anomalyDetectionLog: new Date('2025-01-15T10:00:00Z'),
        invoiceStatusClassification: new Date('2025-01-15T10:00:00Z'),
        invoiceDelayDetection: new Date('2025-01-15T10:00:00Z'),
        dataflowAnomalies: new Date('2025-01-15T10:00:00Z'),
      },
      currentDateTime: new Date('2025-01-15T10:05:00Z'),
    };

    const result = await validateDashboardDataFreshness(input);

    expect(result.isFresh).toBe(true);
    expect(result.freshnessStatus).toEqual({});
    expect(result.warningContent).toBeNull();
  });
});
