import { validateDashboardDataIntegrity } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import type { AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import type { DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import type { ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import type { DetectInvoiceDelayAndClassifyPriorityOutput } from '../../src/logic/invoice-delay-detection';

describe('SCEN-556: validationDetailsが検証の詳細結果を含む', () => {
  it('should include validationDetails with complete validation information', async () => {
    const aggregatedSalesPerformance: AggregateSalesPerformanceOutput = {
      targetPeriod: '2024-01',
      aggregationTimestamp: new Date('2024-01-15T10:00:00Z'),
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP001',
          representativeName: 'Rep 1',
          totalActivityCount: 25,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementPercentage: 100,
          achievementHighlightColor: 'green',
          isAnomalous: false,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: '2',
          stageName: '提案',
          stageOrder: 2,
          dealCountByRepresentative: [],
          totalDealCount: 10,
          totalDealAmount: 5000000,
          achievementPercentage: 85,
          achievementHighlightColor: 'green',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2024-01-15T10:00:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 1440,
        isFresh: true,
      },
    };

    const dataflowAnomalies: DetectDataflowAnomaliesOutput = {
      anomalyDetectionLogIds: [],
      totalAnomaliesDetected: 0,
      anomalySummaryByType: {},
      detectionCompletedAt: new Date('2024-01-15T10:00:00Z'),
    };

    const invoiceStatusClassifications: ClassifyInvoiceStatusOutput[] = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'billed',
        invoiceCount: 1,
        totalInvoiceAmount: 1000000,
        totalPaidAmount: 1000000,
        invoiceDetails: [],
        dealAmount: 1000000,
        amountConsistency: true,
      },
      {
        dealId: 'DEAL002',
        invoiceStatus: 'partial_billing',
        invoiceCount: 1,
        totalInvoiceAmount: 500000,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 500000,
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
            dealAmount: 1000000,
            dealStatus: 'contracted',
            invoiceStatus: 'billed',
            issueType: 'unbilled' as const,
            priority: 'low',
            expectedInvoiceDate: new Date('2024-01-10T00:00:00Z'),
            detectionReason: 'normal',
            amountDifference: 0,
            recommendedAction: 'none',
          },
        ],
        totalUnbilledCount: 0,
        totalDelayedCount: 0,
        notificationSent: false,
      },
      {
        detectionResults: [
          {
            dealId: 'DEAL002',
            dealName: 'Deal 2',
            customerId: 'CUST002',
            customerName: 'Customer 2',
            dealAmount: 500000,
            dealStatus: 'contracted',
            invoiceStatus: 'partial_billing',
            issueType: 'delayed',
            priority: 'high',
            daysOverdue: 3,
            expectedInvoiceDate: new Date('2024-01-12T00:00:00Z'),
            detectionReason: 'Delayed partial billing',
            amountDifference: 500000,
            recommendedAction: 'Complete remaining invoice',
          },
        ],
        totalUnbilledCount: 0,
        totalDelayedCount: 1,
        notificationSent: false,
      },
    ];

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance,
      dataflowAnomalies,
      invoiceStatusClassifications,
      invoiceDelayDetections,
      validationTimestamp: new Date('2024-01-15T10:30:00Z'),
    };

    const result = await validateDashboardDataIntegrity(input);

    expect(result.isValid).toBe(true);
    expect(result.integrityStatus).toBe('complete');
    expect(result.warnings).toEqual([]);
    expect(result.validationDetails).toBeDefined();
    expect(result.validationDetails.activityMetricsValidation).toBeDefined();
    expect(result.validationDetails.dealStageProgressValidation).toBeDefined();
    expect(result.validationDetails.targetAchievementValidation).toBeDefined();
    expect(result.validationDetails.anomalyDetectionValidation).toBeDefined();
    expect(result.validationDetails.invoiceStatusValidation).toBeDefined();
    expect(result.validationDetails.invoiceDelayValidation).toBeDefined();
    expect(result.validationDetails.crossDataConsistency).toBeDefined();
    expect(result.validationDetails.validationTimestamp).toBeDefined();
  });
});
