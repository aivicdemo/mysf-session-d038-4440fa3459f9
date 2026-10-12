import { validateDashboardDataIntegrity } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import type { AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import type { ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import type { DetectInvoiceDelayAndClassifyPriorityOutput } from '../../src/logic/invoice-delay-detection';

describe('SCEN-554: integrityStatusが incomplete になる場合、isValidがfalseで、警告配列が空でない', () => {
  it('should return isValid=false, integrityStatus=incomplete, and non-empty warnings when anomaly detection log is null', async () => {
    const aggregatedSalesPerformance: AggregateSalesPerformanceOutput = {
      targetPeriod: '2026-10',
      aggregationTimestamp: new Date('2026-10-15T10:00:00Z'),
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP001',
          representativeName: 'Rep 1',
          totalActivityCount: 10,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementPercentage: 33,
          achievementHighlightColor: 'yellow',
          isAnomalous: false,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: '2',
          stageName: '提案',
          stageOrder: 2,
          dealCountByRepresentative: [],
          totalDealCount: 3,
          totalDealAmount: 300000,
          achievementPercentage: 75,
          achievementHighlightColor: 'green',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2026-10-15T10:00:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 1440,
        isFresh: true,
      },
    };

    const dataflowAnomalies = null;

    const invoiceStatusClassifications: ClassifyInvoiceStatusOutput[] = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'unbilled',
        invoiceCount: 0,
        totalInvoiceAmount: 0,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 100000,
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
            dealAmount: 100000,
            dealStatus: 'contracted',
            invoiceStatus: 'unbilled',
            issueType: 'unbilled',
            priority: 'critical',
            expectedInvoiceDate: new Date('2026-10-13T00:00:00Z'),
            detectionReason: 'Invoice delayed',
            amountDifference: 100000,
            recommendedAction: 'Issue invoice immediately',
            daysOverdue: 2,
          },
        ],
        totalUnbilledCount: 1,
        totalDelayedCount: 1,
        notificationSent: false,
      },
    ];

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance,
      dataflowAnomalies: dataflowAnomalies as any,
      invoiceStatusClassifications,
      invoiceDelayDetections,
      validationTimestamp: new Date('2026-10-15T10:00:00Z'),
    };

    const result = await validateDashboardDataIntegrity(input);

    expect(result.isValid).toBe(false);
    expect(result.integrityStatus).toBe('incomplete');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(
      result.warnings.some((w) => w.message === '異常検知ログの取得に失敗しました。')
    ).toBe(true);
  });
});
