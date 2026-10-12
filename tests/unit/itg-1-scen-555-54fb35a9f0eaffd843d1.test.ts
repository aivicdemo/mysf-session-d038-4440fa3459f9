import { validateDashboardDataIntegrity } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import type { AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import type { DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import type { ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import type { DetectInvoiceDelayAndClassifyPriorityOutput } from '../../src/logic/invoice-delay-detection';

describe('SCEN-555: integrityStatusが inconsistent になる場合、isValidがfalseで、警告配列が空でない', () => {
  it('should return isValid=false, integrityStatus=inconsistent, and non-empty warnings when anomalies are detected', async () => {
    const aggregatedSalesPerformance: AggregateSalesPerformanceOutput = {
      targetPeriod: '2025-01',
      aggregationTimestamp: new Date('2025-01-15T10:30:00Z'),
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP-001',
          representativeName: 'Rep 1',
          totalActivityCount: 10,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementPercentage: 40,
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
          totalDealCount: 5,
          totalDealAmount: 500000,
          achievementPercentage: 80,
          achievementHighlightColor: 'green',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2025-01-15T10:30:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 1440,
        isFresh: true,
      },
    };

    const dataflowAnomalies: DetectDataflowAnomaliesOutput = {
      anomalyDetectionLogIds: ['LOG001', 'LOG002', 'LOG003'],
      totalAnomaliesDetected: 3,
      anomalySummaryByType: {
        amountMismatch: 1,
        unbilledDeal: 1,
        statusMismatch: 1,
      },
      detectionCompletedAt: new Date('2025-01-15T10:30:00Z'),
      anomalyMessages: [
        'Amount discrepancy detected',
        'Unbilled deals found',
        'Status inconsistency detected',
      ],
    };

    const invoiceStatusClassifications: ClassifyInvoiceStatusOutput[] = [
      {
        dealId: 'DEAL-001',
        invoiceStatus: 'unbilled',
        invoiceCount: 0,
        totalInvoiceAmount: 0,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 250000,
        amountConsistency: false,
      },
      {
        dealId: 'DEAL-002',
        invoiceStatus: 'partial_billing',
        invoiceCount: 1,
        totalInvoiceAmount: 250000,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 250000,
        amountConsistency: true,
      },
    ];

    const invoiceDelayDetections: DetectInvoiceDelayAndClassifyPriorityOutput[] = [
      {
        detectionResults: [
          {
            dealId: 'DEAL-001',
            dealName: 'Deal 1',
            customerId: 'CUST001',
            customerName: 'Customer 1',
            dealAmount: 250000,
            dealStatus: 'contracted',
            invoiceStatus: 'unbilled',
            issueType: 'unbilled',
            priority: 'high',
            expectedInvoiceDate: new Date('2025-01-10T00:00:00Z'),
            detectionReason: 'Invoice delayed',
            amountDifference: 250000,
            recommendedAction: 'Issue invoice',
            daysOverdue: 5,
          },
        ],
        totalUnbilledCount: 1,
        totalDelayedCount: 1,
        notificationSent: false,
      },
      {
        detectionResults: [
          {
            dealId: 'DEAL-002',
            dealName: 'Deal 2',
            customerId: 'CUST002',
            customerName: 'Customer 2',
            dealAmount: 250000,
            dealStatus: 'contracted',
            invoiceStatus: 'partial_billing',
            issueType: 'partiallyBilled',
            priority: 'medium',
            expectedInvoiceDate: new Date('2025-01-12T00:00:00Z'),
            detectionReason: 'Partial billing',
            amountDifference: 250000,
            recommendedAction: 'Complete remaining invoice',
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
      validationTimestamp: new Date('2025-01-15T10:30:00Z'),
    };

    const result = await validateDashboardDataIntegrity(input);

    expect(result.isValid).toBe(false);
    expect(result.integrityStatus).toBe('inconsistent');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.validationDetails).toBeDefined();
  });
});
