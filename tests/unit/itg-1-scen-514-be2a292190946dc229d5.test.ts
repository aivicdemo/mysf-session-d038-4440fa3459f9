import { validateAndVisualizeSystemDataSyncDifferences } from '../../src/logic/system-data-sync-validation';
import * as anomalyDetectionLogging from '../../src/logic/anomaly-detection-logging';
import type {
  ValidateAndVisualizeSystemDataSyncDifferencesInput,
  ValidateAndVisualizeSystemDataSyncDifferencesOutput,
} from '../../src/logic/system-data-sync-validation';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-514: 差異が検出された場合、syncStatusを「differences_detected」に設定し、detectedDifferencesと共に返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異が検出された場合、syncStatusを「differences_detected」に設定し、detectedDifferencesと共に返す', async () => {
    // Arrange
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 100000,
        dealStatus: 'Closed Won',
        invoiceAmount: 100000,
        invoiceStatus: 'Invoiced',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 50000,
        dealStatus: 'In Progress',
        invoiceAmount: 0,
        invoiceStatus: 'Pending',
        invoiceCount: 0,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 105000,
        dealStatus: 'Closed Won',
        invoiceAmount: 100000,
        invoiceStatus: 'Invoiced',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 50000,
        dealStatus: 'Negotiation',
        invoiceAmount: 0,
        invoiceStatus: 'Pending',
        invoiceCount: 0,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: 3,
      statusMismatchThreshold: 1,
      countMismatchThreshold: 1,
    };

    const executionTimestamp = new Date('2026-10-07T10:00:00Z');

    // Mock retrieveAnomalyLogsByDetectionType to return anomaly logs
    (
      anomalyDetectionLogging.retrieveAnomalyLogsByDetectionType as jest.Mock
    ).mockResolvedValue({
      anomalyLogs: [
        {
          anomalyDetectionLogId: 'DIFF-DEAL-001-AMT',
          detectionTimestamp: new Date('2026-10-07T09:30:00Z'),
          anomalyType: 'amount_mismatch',
          severity: 'high',
          anomalyContent: 'Amount mismatch detected for DEAL-001',
          expectedValue: '100000',
          actualValue: '105000',
          status: 'pending',
          validationRuleId: null,
        },
        {
          anomalyDetectionLogId: 'DIFF-DEAL-002-STS',
          detectionTimestamp: new Date('2026-10-07T09:30:00Z'),
          anomalyType: 'status_mismatch',
          severity: 'medium',
          anomalyContent: 'Status mismatch detected for DEAL-002',
          expectedValue: 'In Progress',
          actualValue: 'Negotiation',
          status: 'pending',
          validationRuleId: null,
        },
      ],
      totalCount: 2,
    });

    const input: ValidateAndVisualizeSystemDataSyncDifferencesInput = {
      legacySystemData,
      newSystemData,
      syncValidationCriteria,
      executionTimestamp,
    };

    // Act
    const result = await validateAndVisualizeSystemDataSyncDifferences(input);

    // Assert
    // 1. Verify syncStatus is set to differences_detected
    expect(result.syncStatus).toBe('differences_detected');

    // 2. Verify detectedDifferences contains exactly 2 differences
    expect(result.detectedDifferences).toHaveLength(2);

    // 3. Verify first difference: DEAL-001 amount_mismatch
    const amountDiff = result.detectedDifferences.find(
      (d) => d.dealId === 'DEAL-001'
    );
    expect(amountDiff).toBeDefined();
    expect(amountDiff!.differenceType).toBe('amount_mismatch');
    expect(amountDiff!.legacyValue).toBe(100000);
    expect(amountDiff!.newSystemValue).toBe(105000);
    expect(amountDiff!.discrepancyPercentage).toBe(5.0);

    // 4. Verify second difference: DEAL-002 status_mismatch
    const statusDiff = result.detectedDifferences.find(
      (d) => d.dealId === 'DEAL-002'
    );
    expect(statusDiff).toBeDefined();
    expect(statusDiff!.differenceType).toBe('status_mismatch');
    expect(statusDiff!.legacyValue).toBe('In Progress');
    expect(statusDiff!.newSystemValue).toBe('Negotiation');
    expect(statusDiff!.discrepancyPercentage).toBe(100);

    // 5. Verify dashboardVisualization
    expect(result.dashboardVisualization).toBeDefined();
    expect(result.dashboardVisualization.totalDealsCompared).toBe(2);
    expect(result.dashboardVisualization.differenceCount).toBe(2);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(5000);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(1);
    expect(result.dashboardVisualization.countMismatchCount).toBe(0);

    // 6. Verify correctionStatus array contains both differences
    expect(result.dashboardVisualization.correctionStatus).toHaveLength(2);

    const correctionStatusIds = result.dashboardVisualization.correctionStatus.map(
      (cs) => cs.differenceId
    );
    expect(correctionStatusIds).toContain('DIFF-DEAL-001-AMT');
    expect(correctionStatusIds).toContain('DIFF-DEAL-002-STS');

    // Verify each correction status has proper fields
    result.dashboardVisualization.correctionStatus.forEach((cs) => {
      expect(cs.status).toBe('pending');
      expect(new Date(cs.lastUpdated).toISOString()).toBe(
        '2026-10-07T09:30:00.000Z'
      );
    });

    // 7. Verify validationTimestamp matches executionTimestamp
    expect(result.validationTimestamp.toISOString()).toBe(
      '2026-10-07T10:00:00.000Z'
    );
  });
});
