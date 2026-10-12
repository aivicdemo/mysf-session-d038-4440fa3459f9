import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { validateDashboardDataIntegrity, DataInconsistencyDetected } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import * as salesPerformanceModule from '../../src/logic/sales-performance-aggregation';
import * as anomalyDetectionModule from '../../src/logic/dataflow-anomaly-detection';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';
import * as invoiceDelayModule from '../../src/logic/invoice-delay-detection';

describe('SCEN-547: validateDashboardDataIntegrity detects data inconsistency between activity metrics and deal stage progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataInconsistencyDetected when activity metrics and deal stage progress contradict for the same representative', async () => {
    const mockAggregatedSalesPerformance = {
      targetPeriod: '2026-10-01 to 2026-10-08',
      aggregationTimestamp: new Date('2026-10-08T10:00:00Z'),
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP001',
          representativeName: 'Rep A',
          totalActivityCount: 15,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementHighlightColor: '#FF0000',
          isAnomalous: true,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: 'STAGE001',
          stageName: '提案中',
          stageOrder: 2,
          dealCountByRepresentative: [
            {
              representativeId: 'REP001',
              representativeName: 'Rep A',
              dealCount: 8,
              dealAmount: 2000000,
            },
          ],
          totalDealCount: 8,
          totalDealAmount: 2000000,
          achievementHighlightColor: '#FFB300',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2026-10-08T10:00:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 60,
        isFresh: true,
      },
    };

    const mockDataflowAnomalies = {
      anomalyDetectionLogIds: ['ANOMALY001'],
      totalAnomaliesDetected: 1,
      anomalySummaryByType: {
        amountDiscrepancy: 1,
      },
      detectionCompletedAt: new Date('2026-10-08T10:00:00Z'),
      anomalyMessages: ['活動実績と商談進捗の件数が矛盾'],
    };

    const mockInvoiceStatusClassifications = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'billed' as const,
        invoiceCount: 1,
        totalInvoiceAmount: 500000,
        totalPaidAmount: 500000,
        invoiceDetails: [],
        dealAmount: 500000,
        amountConsistency: true,
      },
    ];

    const mockInvoiceDelayDetections = [
      {
        detectionResults: [
          {
            dealId: 'DEAL001',
            dealName: 'Deal A',
            customerId: 'CUST001',
            customerName: 'Customer A',
            dealAmount: 500000,
            dealStatus: 'closed_won',
            invoiceStatus: 'billed',
            issueType: 'unbilled' as const,
            priority: 'low' as const,
            daysOverdue: 0,
            expectedInvoiceDate: new Date('2026-10-05T00:00:00Z'),
            detectionReason: 'On time',
            amountDifference: 0,
            recommendedAction: 'No action',
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
      validationTimestamp: new Date('2026-10-08T10:00:00Z'),
    };

    await expect(validateDashboardDataIntegrity(input)).rejects.toThrow(DataInconsistencyDetected);
  });

  it('should include error message with inconsistency details when activity metrics and deal stage progress contradict', async () => {
    const mockAggregatedSalesPerformance = {
      targetPeriod: '2026-10-01 to 2026-10-08',
      aggregationTimestamp: new Date('2026-10-08T10:00:00Z'),
      activityMetricsByRepresentative: [
        {
          representativeId: 'REP001',
          representativeName: 'Rep A',
          totalActivityCount: 15,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementHighlightColor: '#FF0000',
          isAnomalous: true,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: 'STAGE001',
          stageName: '提案中',
          stageOrder: 2,
          dealCountByRepresentative: [
            {
              representativeId: 'REP001',
              representativeName: 'Rep A',
              dealCount: 8,
              dealAmount: 2000000,
            },
          ],
          totalDealCount: 8,
          totalDealAmount: 2000000,
          achievementHighlightColor: '#FFB300',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2026-10-08T10:00:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 60,
        isFresh: true,
      },
    };

    const mockDataflowAnomalies = {
      anomalyDetectionLogIds: ['ANOMALY001'],
      totalAnomaliesDetected: 1,
      anomalySummaryByType: {
        amountDiscrepancy: 1,
      },
      detectionCompletedAt: new Date('2026-10-08T10:00:00Z'),
      anomalyMessages: ['活動実績と商談進捗の件数が矛盾'],
    };

    const mockInvoiceStatusClassifications = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'billed' as const,
        invoiceCount: 1,
        totalInvoiceAmount: 500000,
        totalPaidAmount: 500000,
        invoiceDetails: [],
        dealAmount: 500000,
        amountConsistency: true,
      },
    ];

    const mockInvoiceDelayDetections = [
      {
        detectionResults: [
          {
            dealId: 'DEAL001',
            dealName: 'Deal A',
            customerId: 'CUST001',
            customerName: 'Customer A',
            dealAmount: 500000,
            dealStatus: 'closed_won',
            invoiceStatus: 'billed',
            issueType: 'unbilled' as const,
            priority: 'low' as const,
            daysOverdue: 0,
            expectedInvoiceDate: new Date('2026-10-05T00:00:00Z'),
            detectionReason: 'On time',
            amountDifference: 0,
            recommendedAction: 'No action',
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
      validationTimestamp: new Date('2026-10-08T10:00:00Z'),
    };

    try {
      await validateDashboardDataIntegrity(input);
      fail('Expected DataInconsistencyDetected to be thrown');
    } catch (error) {
      if (error instanceof DataInconsistencyDetected) {
        expect(error.message).toContain('REP001');
        expect(error.message).toContain('活動実績と商談進捗');
        expect(error.message).toContain('一致');
      } else {
        throw error;
      }
    }
  });
});
