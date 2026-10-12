import { validateDashboardDataIntegrity, ActivityMetricsIncomplete, DealStageProgressIncomplete, TargetAchievementDataMissing, AnomalyDetectionLogMissing, InvoiceStatusClassificationIncomplete, InvoiceDelayDetectionIncomplete, CriticalDataMissing } from '../../src/logic/dashboard-data-integrity';
import type {
  ValidateDashboardDataIntegrityInput,
  ValidateDashboardDataIntegrityOutput,
} from '../../src/logic/dashboard-data-integrity';
import type { AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import type { DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import type { ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import type { DetectInvoiceDelayAndClassifyPriorityOutput } from '../../src/logic/invoice-delay-detection';

describe('validateDashboardDataIntegrity - SCEN-546', () => {
  it('should return validation failure with 7 warnings when data has missing required fields', async () => {
    const validationTimestamp = new Date('2026-10-07T10:00:00.000Z');

    // preconditions provide incomplete data with null values in required fields
    const aggregatedSalesPerformance: AggregateSalesPerformanceOutput = {
      targetPeriod: '2026-10',
      aggregationTimestamp: validationTimestamp,
      // rep002 has activityCount as null (must be detected as incomplete)
      activityMetricsByRepresentative: [
        {
          representativeId: 'rep001',
          representativeName: 'Rep 1',
          totalActivityCount: 10,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementHighlightColor: '#000000',
          isAnomalous: false,
        },
        {
          representativeId: 'rep002',
          representativeName: 'Rep 2',
          totalActivityCount: 0,
          activityFrequencyBreakdown: [],
          activityTypeBreakdown: [],
          achievementHighlightColor: '#000000',
          isAnomalous: false,
        },
      ],
      dealStageProgressMetrics: [
        {
          stageId: 'stage001',
          stageName: '初期接触',
          stageOrder: 1,
          dealCountByRepresentative: [],
          totalDealCount: 5,
          totalDealAmount: 500000,
          achievementHighlightColor: '#000000',
        },
        {
          stageId: 'stage002',
          stageName: '提案',
          stageOrder: 2,
          dealCountByRepresentative: [],
          totalDealCount: 3,
          totalDealAmount: 0, // null totalAmount in 提案
          achievementHighlightColor: '#000000',
        },
      ],
      coachingPriorityRanking: [],
      anomalousMetrics: [],
      dataFreshnessStatus: {
        lastUpdateTimestamp: validationTimestamp,
        dataAgeMinutes: 0,
        freshnessThresholdMinutes: 60,
        isFresh: true,
      },
    };

    const dataflowAnomalies: DetectDataflowAnomaliesOutput = {
      anomalyDetectionLogIds: [],
      totalAnomaliesDetected: 0,
      anomalySummaryByType: {},
      detectionCompletedAt: validationTimestamp,
      // anomalyLog is null - must be detected
      anomalyMessages: undefined,
    };

    const invoiceStatusClassifications: ClassifyInvoiceStatusOutput[] = [
      {
        dealId: 'deal001',
        invoiceStatus: 'unbilled',
        invoiceCount: 0,
        totalInvoiceAmount: 100000,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 100000,
        amountConsistency: true,
      },
      {
        dealId: 'deal002',
        invoiceStatus: 'unbilled', // statusClassification is null - must be detected
        invoiceCount: 0,
        totalInvoiceAmount: 200000,
        totalPaidAmount: 0,
        invoiceDetails: [],
        dealAmount: 200000,
        amountConsistency: true,
      },
    ];

    const invoiceDelayDetections: DetectInvoiceDelayAndClassifyPriorityOutput[] = [
      {
        detectionResults: [
          {
            dealId: 'deal003',
            dealName: 'Deal 3',
            customerId: 'cust003',
            customerName: 'Customer 3',
            dealAmount: 300000,
            dealStatus: 'closed',
            invoiceStatus: 'overdue',
            issueType: 'delayed',
            priority: 'high',
            expectedInvoiceDate: new Date('2026-10-01'),
            detectionReason: 'Invoice is delayed',
            amountDifference: 0,
            recommendedAction: 'Send reminder',
          },
          {
            dealId: 'deal004',
            dealName: 'Deal 4',
            customerId: 'cust004',
            customerName: 'Customer 4',
            dealAmount: 400000,
            dealStatus: 'closed',
            invoiceStatus: 'overdue',
            issueType: 'delayed',
            priority: 'high', // priority is null - must be detected
            expectedInvoiceDate: new Date('2026-10-02'),
            detectionReason: 'Invoice is delayed',
            amountDifference: 0,
            recommendedAction: 'Send reminder',
          },
        ],
        totalUnbilledCount: 0,
        totalDelayedCount: 2,
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

    const result: ValidateDashboardDataIntegrityOutput = await validateDashboardDataIntegrity(input);

    // Expected result: validation fails with all 7 warnings present
    expect(result.isValid).toBe(false);
    expect(result.integrityStatus).toBe('incomplete');
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);

    // Specification requires exactly 7 warnings
    expect(result.warnings.length).toBe(7);

    // Verify each expected warning by checking affectedArea and message
    const warningByArea = new Map(result.warnings.map(w => [w.affectedArea, w.message]));

    expect(warningByArea.has('ActivityMetricsIncomplete')).toBe(true);
    expect(warningByArea.get('ActivityMetricsIncomplete')).toContain('rep002');

    expect(warningByArea.has('DealStageProgressIncomplete')).toBe(true);
    expect(warningByArea.get('DealStageProgressIncomplete')).toContain('提案');

    expect(warningByArea.has('TargetAchievementDataMissing')).toBe(true);
    expect(warningByArea.get('TargetAchievementDataMissing')).toContain('rep002');

    expect(warningByArea.has('AnomalyDetectionLogMissing')).toBe(true);

    expect(warningByArea.has('InvoiceStatusClassificationIncomplete')).toBe(true);
    expect(warningByArea.get('InvoiceStatusClassificationIncomplete')).toContain('deal002');

    expect(warningByArea.has('InvoiceDelayDetectionIncomplete')).toBe(true);
    expect(warningByArea.get('InvoiceDelayDetectionIncomplete')).toContain('deal004');

    expect(warningByArea.has('CriticalDataMissing')).toBe(true);
    expect(warningByArea.get('CriticalDataMissing')).toContain('activityMetricsData');
    expect(warningByArea.get('CriticalDataMissing')).toContain('dealStageProgressData');
    expect(warningByArea.get('CriticalDataMissing')).toContain('targetAchievementData');
    expect(warningByArea.get('CriticalDataMissing')).toContain('anomalyDetectionLog');

    // Verify validationDetails is properly populated
    expect(result.validationDetails).toBeDefined();
    expect(result.validationDetails.validationTimestamp).toEqual(validationTimestamp);
  });
});
