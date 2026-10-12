import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { validateDashboardDataIntegrity } from '../../src/logic/dashboard-data-integrity';
import type {
  ValidateDashboardDataIntegrityInput,
  ValidateDashboardDataIntegrityOutput,
} from '../../src/logic/dashboard-data-integrity';
import * as salesPerformanceModule from '../../src/logic/sales-performance-aggregation';
import * as anomalyDetectionModule from '../../src/logic/dataflow-anomaly-detection';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';
import * as invoiceDelayModule from '../../src/logic/invoice-delay-detection';

describe('SCEN-545: validateDashboardDataIntegrity with complete and consistent data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isValid=true with integrityStatus=complete and no warnings when all data is complete and consistent', async () => {
    const mockAggregatedSalesPerformance = {
      targetPeriod: '2024-01-01 to 2024-01-31',
      aggregationTimestamp: new Date('2024-01-15T10:00:00Z'),
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP001',
          representativeName: 'Representative A',
          totalActivityCount: 25,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementHighlightColor: '#00FF00',
          isAnomalous: false,
        },
        {
          representativeId: 'REP002',
          representativeName: 'Representative B',
          totalActivityCount: 30,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementHighlightColor: '#00FF00',
          isAnomalous: false,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: 'STAGE001',
          stageName: '初期接触',
          stageOrder: 1,
          dealCountByRepresentative: [
            {
              representativeId: 'REP001',
              representativeName: 'Representative A',
              dealCount: 8,
              dealAmount: 2500000,
            },
            {
              representativeId: 'REP002',
              representativeName: 'Representative B',
              dealCount: 7,
              dealAmount: 2500000,
            },
          ],
          totalDealCount: 15,
          totalDealAmount: 5000000,
          achievementHighlightColor: '#00FF00',
        },
        {
          stageId: 'STAGE002',
          stageName: '提案中',
          stageOrder: 2,
          dealCountByRepresentative: [],
          totalDealCount: 8,
          totalDealAmount: 3000000,
          achievementHighlightColor: '#FFB300',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2024-01-15T10:00:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 60,
        isFresh: true,
      },
    };

    const mockDataflowAnomalies = {
      anomalyDetectionLogIds: [],
      totalAnomaliesDetected: 0,
      anomalySummaryByType: {},
      detectionCompletedAt: new Date('2024-01-15T10:00:00Z'),
    };

    const mockInvoiceStatusClassifications = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'billed' as const,
        invoiceCount: 1,
        totalInvoiceAmount: 2500000,
        totalPaidAmount: 2500000,
        invoiceDetails: [],
        dealAmount: 2500000,
        amountConsistency: true,
      },
      {
        dealId: 'DEAL002',
        invoiceStatus: 'billed' as const,
        invoiceCount: 1,
        totalInvoiceAmount: 1800000,
        totalPaidAmount: 1800000,
        invoiceDetails: [],
        dealAmount: 1800000,
        amountConsistency: true,
      },
      {
        dealId: 'DEAL003',
        invoiceStatus: 'billed' as const,
        invoiceCount: 1,
        totalInvoiceAmount: 3700000,
        totalPaidAmount: 3700000,
        invoiceDetails: [],
        dealAmount: 3700000,
        amountConsistency: true,
      },
    ];

    const mockInvoiceDelayDetections = [
      {
        detectionResults: [
          {
            dealId: 'DEAL001',
            dealName: 'Customer A Contract',
            customerId: 'CUST001',
            customerName: 'Customer A',
            dealAmount: 2500000,
            dealStatus: 'closed_won',
            invoiceStatus: 'billed',
            issueType: 'unbilled' as const,
            priority: 'low' as const,
            daysOverdue: 0,
            expectedInvoiceDate: new Date('2024-01-10T00:00:00Z'),
            detectionReason: 'Deal is invoiced on time',
            amountDifference: 0,
            recommendedAction: 'No action needed',
          },
          {
            dealId: 'DEAL002',
            dealName: 'Customer B Project',
            customerId: 'CUST002',
            customerName: 'Customer B',
            dealAmount: 1800000,
            dealStatus: 'closed_won',
            invoiceStatus: 'billed',
            issueType: 'unbilled' as const,
            priority: 'low' as const,
            daysOverdue: 0,
            expectedInvoiceDate: new Date('2024-01-11T00:00:00Z'),
            detectionReason: 'Deal is invoiced on time',
            amountDifference: 0,
            recommendedAction: 'No action needed',
          },
          {
            dealId: 'DEAL003',
            dealName: 'Customer C Project',
            customerId: 'CUST003',
            customerName: 'Customer C',
            dealAmount: 3700000,
            dealStatus: 'closed_won',
            invoiceStatus: 'billed',
            issueType: 'unbilled' as const,
            priority: 'low' as const,
            daysOverdue: 0,
            expectedInvoiceDate: new Date('2024-01-12T00:00:00Z'),
            detectionReason: 'Deal is invoiced on time',
            amountDifference: 0,
            recommendedAction: 'No action needed',
          },
        ],
        totalUnbilledCount: 0,
        totalDelayedCount: 0,
        notificationSent: false,
      },
    ];

    jest.spyOn(salesPerformanceModule, 'aggregateSalesPerformanceForDashboard').mockResolvedValue(
      mockAggregatedSalesPerformance,
    );
    jest.spyOn(anomalyDetectionModule, 'detectDataflowAnomalies').mockResolvedValue(mockDataflowAnomalies);
    jest.spyOn(invoiceStatusModule, 'classifyInvoiceStatus').mockResolvedValue(
      mockInvoiceStatusClassifications[0],
    );
    jest.spyOn(invoiceDelayModule, 'detectInvoiceDelayAndClassifyPriority').mockResolvedValue(
      mockInvoiceDelayDetections[0],
    );

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance: mockAggregatedSalesPerformance,
      dataflowAnomalies: mockDataflowAnomalies,
      invoiceStatusClassifications: mockInvoiceStatusClassifications,
      invoiceDelayDetections: mockInvoiceDelayDetections as any,
      validationTimestamp: new Date('2024-01-15T10:30:00Z'),
    };

    const result = await validateDashboardDataIntegrity(input);

    expect(result).toBeDefined();
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
  });
});
