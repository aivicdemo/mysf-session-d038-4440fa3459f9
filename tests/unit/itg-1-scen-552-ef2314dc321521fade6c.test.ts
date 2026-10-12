import { validateDashboardDataIntegrity } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import type { AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import type { DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import type { ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import type { DetectInvoiceDelayAndClassifyPriorityOutput } from '../../src/logic/invoice-delay-detection';

describe('SCEN-552: ダッシュボード表示値と実際の集計値の差異が金額で1万円以上の場合、警告が返される', () => {
  it('should return warning when amount difference is 1 million yen or more', async () => {
    const aggregatedSalesPerformance: AggregateSalesPerformanceOutput = {
      targetPeriod: '2026-10',
      aggregationTimestamp: new Date('2026-10-07T06:22:00Z'),
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP001',
          representativeName: 'Rep 1',
          totalActivityCount: 50,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementPercentage: 100,
          achievementHighlightColor: 'green',
          isAnomalous: false,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: '1',
          stageName: '商談化',
          stageOrder: 1,
          dealCountByRepresentative: [],
          totalDealCount: 20,
          totalDealAmount: 5000000,
          achievementPercentage: 80,
          achievementHighlightColor: 'green',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2026-10-07T06:22:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 1440,
        isFresh: true,
      },
    };

    const dataflowAnomalies: DetectDataflowAnomaliesOutput = {
      anomalyDetectionLogIds: ['LOG001'],
      totalAnomaliesDetected: 1,
      anomalySummaryByType: { amountMismatch: 1 },
      detectionCompletedAt: new Date('2026-10-07T06:22:00Z'),
      anomalyMessages: ['Amount mismatch detected: dashboard 4000000, actual 5000000, difference 1000000'],
    };

    const invoiceStatusClassifications: ClassifyInvoiceStatusOutput[] = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'billed',
        invoiceCount: 1,
        totalInvoiceAmount: 5000000,
        totalPaidAmount: 5000000,
        invoiceDetails: [],
        dealAmount: 5000000,
        amountConsistency: true,
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
            dealAmount: 5000000,
            dealStatus: 'contracted',
            invoiceStatus: 'billed',
            issueType: 'unbilled' as const,
            priority: 'low',
            expectedInvoiceDate: new Date('2026-10-05T00:00:00Z'),
            detectionReason: 'normal',
            amountDifference: 0,
            recommendedAction: 'none',
          },
        ],
        totalUnbilledCount: 0,
        totalDelayedCount: 0,
        notificationSent: false,
      },
    ];

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance,
      dataflowAnomalies,
      invoiceStatusClassifications,
      invoiceDelayDetections,
      validationTimestamp: new Date('2026-10-07T06:22:30.000Z'),
    };

    const result = await validateDashboardDataIntegrity(input);

    expect(result.isValid).toBe(false);
    expect(result.integrityStatus).toBe('inconsistent');
    expect(
      result.warnings.some((w) => w.message === '金額ズレが検出されました。経理・請求部門に確認してください')
    ).toBe(true);
  });
});
