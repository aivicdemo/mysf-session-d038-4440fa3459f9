import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { validateDashboardDataIntegrity, CriticalDataMissing } from '../../src/logic/dashboard-data-integrity';
import type { ValidateDashboardDataIntegrityInput } from '../../src/logic/dashboard-data-integrity';
import * as salesPerformanceModule from '../../src/logic/sales-performance-aggregation';
import * as anomalyDetectionModule from '../../src/logic/dataflow-anomaly-detection';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';
import * as invoiceDelayModule from '../../src/logic/invoice-delay-detection';

describe('SCEN-548: validateDashboardDataIntegrity detects missing critical data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw CriticalDataMissing when activity metrics data is null', async () => {
    const mockAggregatedSalesPerformance = {
      targetPeriod: '2026-10-01 to 2026-10-15',
      aggregationTimestamp: new Date('2026-10-15T10:30:00Z'),
      activityMetricsByRepresentative: [] as any,
      dealStageProgressMetrics: [
        {
          stageId: 'STAGE001',
          stageName: '提案',
          stageOrder: 2,
          dealCountByRepresentative: [],
          totalDealCount: 5,
          totalDealAmount: 1000000,
          achievementHighlightColor: '#FFB300',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2026-10-15T10:30:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 60,
        isFresh: true,
      },
    };

    const mockInvoiceStatusClassifications = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'unbilled' as const,
        invoiceCount: 0,
        totalInvoiceAmount: 0,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 500000,
        amountConsistency: false,
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
            dealStatus: 'open',
            invoiceStatus: 'unbilled',
            issueType: 'unbilled' as const,
            priority: 'high' as const,
            daysOverdue: null,
            expectedInvoiceDate: new Date('2026-10-20T00:00:00Z'),
            detectionReason: 'Deal is not invoiced',
            amountDifference: 500000,
            recommendedAction: 'Create invoice',
          },
        ],
        totalUnbilledCount: 1,
        totalDelayedCount: 0,
        notificationSent: true,
      },
    ];

    jest.spyOn(salesPerformanceModule, 'aggregateSalesPerformanceForDashboard').mockResolvedValue(
      mockAggregatedSalesPerformance,
    );
    jest.spyOn(anomalyDetectionModule, 'detectDataflowAnomalies').mockResolvedValue(null as any);
    jest.spyOn(invoiceStatusModule, 'classifyInvoiceStatus').mockResolvedValue(
      mockInvoiceStatusClassifications[0],
    );
    jest.spyOn(invoiceDelayModule, 'detectInvoiceDelayAndClassifyPriority').mockResolvedValue(
      mockInvoiceDelayDetections[0],
    );

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance: mockAggregatedSalesPerformance,
      dataflowAnomalies: null as any,
      invoiceStatusClassifications: mockInvoiceStatusClassifications,
      invoiceDelayDetections: mockInvoiceDelayDetections as any,
      validationTimestamp: new Date('2026-10-15T10:30:00Z'),
    };

    await expect(validateDashboardDataIntegrity(input)).rejects.toThrow(CriticalDataMissing);
  });

  it('should throw CriticalDataMissing error with message containing failed data set names', async () => {
    const mockAggregatedSalesPerformance = {
      targetPeriod: '2026-10-01 to 2026-10-15',
      aggregationTimestamp: new Date('2026-10-15T10:30:00Z'),
      activityMetricsByRepresentative: [] as any,
      dealStageProgressMetrics: [
        {
          stageId: 'STAGE001',
          stageName: '提案',
          stageOrder: 2,
          dealCountByRepresentative: [],
          totalDealCount: 5,
          totalDealAmount: 1000000,
          achievementHighlightColor: '#FFB300',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2026-10-15T10:30:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 60,
        isFresh: true,
      },
    };

    const mockInvoiceStatusClassifications = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'unbilled' as const,
        invoiceCount: 0,
        totalInvoiceAmount: 0,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 500000,
        amountConsistency: false,
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
            dealStatus: 'open',
            invoiceStatus: 'unbilled',
            issueType: 'unbilled' as const,
            priority: 'high' as const,
            daysOverdue: null,
            expectedInvoiceDate: new Date('2026-10-20T00:00:00Z'),
            detectionReason: 'Deal is not invoiced',
            amountDifference: 500000,
            recommendedAction: 'Create invoice',
          },
        ],
        totalUnbilledCount: 1,
        totalDelayedCount: 0,
        notificationSent: true,
      },
    ];

    jest.spyOn(salesPerformanceModule, 'aggregateSalesPerformanceForDashboard').mockResolvedValue(
      mockAggregatedSalesPerformance,
    );
    jest.spyOn(anomalyDetectionModule, 'detectDataflowAnomalies').mockResolvedValue(null as any);
    jest.spyOn(invoiceStatusModule, 'classifyInvoiceStatus').mockResolvedValue(
      mockInvoiceStatusClassifications[0],
    );
    jest.spyOn(invoiceDelayModule, 'detectInvoiceDelayAndClassifyPriority').mockResolvedValue(
      mockInvoiceDelayDetections[0],
    );

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance: mockAggregatedSalesPerformance,
      dataflowAnomalies: null as any,
      invoiceStatusClassifications: mockInvoiceStatusClassifications,
      invoiceDelayDetections: mockInvoiceDelayDetections as any,
      validationTimestamp: new Date('2026-10-15T10:30:00Z'),
    };

    try {
      await validateDashboardDataIntegrity(input);
      fail('Expected CriticalDataMissing to be thrown');
    } catch (error) {
      if (error instanceof CriticalDataMissing) {
        expect(error.message).toContain('重要データが欠落');
        expect(error.message).toContain('取得失敗');
      } else {
        throw error;
      }
    }
  });

  it('should record failed data sets in validationDetails when critical data is missing', async () => {
    const mockAggregatedSalesPerformance = {
      targetPeriod: '2026-10-01 to 2026-10-15',
      aggregationTimestamp: new Date('2026-10-15T10:30:00Z'),
      activityMetricsByRepresentative: [] as any,
      dealStageProgressMetrics: [
        {
          stageId: 'STAGE001',
          stageName: '提案',
          stageOrder: 2,
          dealCountByRepresentative: [],
          totalDealCount: 5,
          totalDealAmount: 1000000,
          achievementHighlightColor: '#FFB300',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: new Date('2026-10-15T10:30:00Z'),
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 60,
        isFresh: true,
      },
    };

    const mockInvoiceStatusClassifications = [
      {
        dealId: 'DEAL001',
        invoiceStatus: 'unbilled' as const,
        invoiceCount: 0,
        totalInvoiceAmount: 0,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 500000,
        amountConsistency: false,
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
            dealStatus: 'open',
            invoiceStatus: 'unbilled',
            issueType: 'unbilled' as const,
            priority: 'high' as const,
            daysOverdue: null,
            expectedInvoiceDate: new Date('2026-10-20T00:00:00Z'),
            detectionReason: 'Deal is not invoiced',
            amountDifference: 500000,
            recommendedAction: 'Create invoice',
          },
        ],
        totalUnbilledCount: 1,
        totalDelayedCount: 0,
        notificationSent: true,
      },
    ];

    jest.spyOn(salesPerformanceModule, 'aggregateSalesPerformanceForDashboard').mockResolvedValue(
      mockAggregatedSalesPerformance,
    );
    jest.spyOn(anomalyDetectionModule, 'detectDataflowAnomalies').mockResolvedValue(null as any);
    jest.spyOn(invoiceStatusModule, 'classifyInvoiceStatus').mockResolvedValue(
      mockInvoiceStatusClassifications[0],
    );
    jest.spyOn(invoiceDelayModule, 'detectInvoiceDelayAndClassifyPriority').mockResolvedValue(
      mockInvoiceDelayDetections[0],
    );

    const input: ValidateDashboardDataIntegrityInput = {
      aggregatedSalesPerformance: mockAggregatedSalesPerformance,
      dataflowAnomalies: null as any,
      invoiceStatusClassifications: mockInvoiceStatusClassifications,
      invoiceDelayDetections: mockInvoiceDelayDetections as any,
      validationTimestamp: new Date('2026-10-15T10:30:00Z'),
    };

    try {
      await validateDashboardDataIntegrity(input);
      fail('Expected CriticalDataMissing to be thrown');
    } catch (error) {
      if (error instanceof CriticalDataMissing) {
        expect(error).toBeDefined();
      } else {
        throw error;
      }
    }
  });
});
