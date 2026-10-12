import { validateDashboardDataIntegrity } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import type { AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import type { DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import type { ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import type { DetectInvoiceDelayAndClassifyPriorityOutput } from '../../src/logic/invoice-delay-detection';

describe('SCEN-550: ダッシュボードデータが過去24時間以内に更新されていない場合、警告が返される', () => {
  it('should return warning when dashboard data is older than 24 hours', async () => {
    const validationTimestamp = new Date('2026-10-07T10:00:00.000Z');
    const dataLastUpdatedAt = new Date('2026-10-05T09:00:00.000Z');

    const aggregatedSalesPerformance: AggregateSalesPerformanceOutput = {
      targetPeriod: '2026-10',
      aggregationTimestamp: dataLastUpdatedAt,
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP001',
          representativeName: 'Rep 1',
          totalActivityCount: 15,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementPercentage: 30,
          achievementHighlightColor: 'yellow',
          isAnomalous: false,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: '1',
          stageName: '商談開始',
          stageOrder: 1,
          dealCountByRepresentative: [],
          totalDealCount: 5,
          totalDealAmount: 500000,
          achievementPercentage: 50,
          achievementHighlightColor: 'yellow',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: dataLastUpdatedAt,
        dataAgeMinutes: 1500,
        freshnessThresholdMinutes: 1440,
        isFresh: false,
        freshnessWarning: 'Data is stale',
      },
    };

    const dataflowAnomalies: DetectDataflowAnomaliesOutput = {
      anomalyDetectionLogIds: [],
      totalAnomaliesDetected: 0,
      anomalySummaryByType: {},
      detectionCompletedAt: new Date('2026-10-05T09:00:00Z'),
    };

    const invoiceStatusClassifications: ClassifyInvoiceStatusOutput[] = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'unbilled',
        invoiceCount: 0,
        totalInvoiceAmount: 0,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 500000,
        amountConsistency: false,
      },
    ];

    const invoiceDelayDetections: DetectInvoiceDelayAndClassifyPriorityOutput[] = [
      {
        detectionResults: [
          {
            dealId: 'DEAL001',
            dealName: 'Deal 1',
            customerId: 'CUST001',
            customerName: 'Customer 1',
            dealAmount: 500000,
            dealStatus: 'contracted',
            invoiceStatus: 'unbilled',
            issueType: 'unbilled',
            priority: 'high',
            expectedInvoiceDate: new Date('2026-10-06T00:00:00Z'),
            detectionReason: 'Unbilled deal',
            amountDifference: 500000,
            recommendedAction: 'Issue invoice',
          },
        ],
        totalUnbilledCount: 1,
        totalDelayedCount: 0,
        notificationSent: false,
      },
    ];

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance,
      dataflowAnomalies,
      invoiceStatusClassifications,
      invoiceDelayDetections,
      validationTimestamp,
    };

    const result = await validateDashboardDataIntegrity(input);

    expect(result.isValid).toBe(false);
    expect(['incomplete', 'inconsistent']).toContain(result.integrityStatus);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(
      result.warnings.some(
        (w) => w.message === 'ダッシュボード表示が古い可能性があります。データを更新してください'
      )
    ).toBe(true);
  });
});
