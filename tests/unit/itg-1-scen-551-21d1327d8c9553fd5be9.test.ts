import { validateDashboardDataIntegrity } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import type { AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import type { DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import type { ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import type { DetectInvoiceDelayAndClassifyPriorityOutput } from '../../src/logic/invoice-delay-detection';

describe('SCEN-551: 営業活動データまたは商談データが検証期間内に存在しない場合、検証がスキップされる', () => {
  it('should skip validation and return complete with skip message when data is empty', async () => {
    const aggregatedSalesPerformance: AggregateSalesPerformanceOutput = {
      targetPeriod: '2026-10',
      aggregationTimestamp: new Date('2026-10-07T10:00:00Z'),
      activityMetricsByRepresentative: [],
      dealStageProgressMetrics: [],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2026-10-07T10:00:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 1440,
        isFresh: true,
      },
    };

    const dataflowAnomalies: DetectDataflowAnomaliesOutput = {
      anomalyDetectionLogIds: [],
      totalAnomaliesDetected: 0,
      anomalySummaryByType: {},
      detectionCompletedAt: new Date('2026-10-07T10:00:00Z'),
    };

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance,
      dataflowAnomalies,
      invoiceStatusClassifications: [],
      invoiceDelayDetections: [],
      validationTimestamp: new Date('2026-10-07T10:00:00Z'),
    };

    const result = await validateDashboardDataIntegrity(input);

    expect(result.isValid).toBe(true);
    expect(result.integrityStatus).toBe('complete');
    expect(result.warnings.some((w) => w.message === '該当期間のデータがないため検証をスキップします')).toBe(true);
    expect(result.validationDetails).toBeDefined();
  });
});
