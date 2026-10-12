import { validateDashboardDataIntegrity } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import type { AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import type { DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import type { ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import type { DetectInvoiceDelayAndClassifyPriorityOutput } from '../../src/logic/invoice-delay-detection';

describe('SCEN-553: 商談ステータスがダッシュボードと営業活動データで矛盾している場合、警告が返される', () => {
  it('should return warning when deal status is inconsistent between dashboard and activity data', async () => {
    const aggregatedSalesPerformance: AggregateSalesPerformanceOutput = {
      targetPeriod: '2026-10',
      aggregationTimestamp: new Date('2026-10-07T10:00:00Z'),
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP001',
          representativeName: 'Rep 1',
          totalActivityCount: 10,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementPercentage: 50,
          achievementHighlightColor: 'yellow',
          isAnomalous: false,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: 'STAGE_NEGOTIATION',
          stageName: '交渉中',
          stageOrder: 3,
          dealCountByRepresentative: [],
          totalDealCount: 5,
          totalDealAmount: 500000,
          achievementPercentage: 75,
          achievementHighlightColor: 'green',
        },
      ],
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
      anomalyDetectionLogIds: ['LOG001'],
      totalAnomaliesDetected: 1,
      anomalySummaryByType: { statusMismatch: 1 },
      detectionCompletedAt: new Date('2026-10-07T10:00:00Z'),
      anomalyMessages: ['Status mismatch detected: DEAL001 dashboard=交渉中 source=検討中'],
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
            dealStatus: 'negotiation',
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
      validationTimestamp: new Date('2026-10-07T10:00:00Z'),
    };

    const result = await validateDashboardDataIntegrity(input);

    expect(result.isValid).toBe(false);
    expect(result.integrityStatus).toBe('inconsistent');
    expect(
      result.warnings.some((w) => w.message === 'ステータス不整合が検出されました。営業担当者に確認してください')
    ).toBe(true);
    expect(result.validationDetails).toBeDefined();
  });
});
