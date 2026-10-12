import { validateAndVisualizeSystemDataSyncDifferences } from '../../src/logic/system-data-sync-validation';
import * as anomalyDetectionLogging from '../../src/logic/anomaly-detection-logging';
import type {
  ValidateAndVisualizeSystemDataSyncDifferencesInput,
  ValidateAndVisualizeSystemDataSyncDifferencesOutput,
} from '../../src/logic/system-data-sync-validation';

jest.mock('../../src/logic/anomaly-detection-logging');

describe('SCEN-513: 検出された差異に対する過去の是正状況を異常検知ログから取得し、ダッシュボード表示用の是正ステータス配列に含めて返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検出された差異に対する過去の是正状況を異常検知ログから取得し、是正ステータス配列に含めて返す', async () => {
    // Arrange
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Closed Won',
        invoiceAmount: 1000000,
        invoiceStatus: 'Invoiced',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: 'Negotiation',
        invoiceAmount: 250000,
        invoiceStatus: 'Partial',
        invoiceCount: 1,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Closed Won',
        invoiceAmount: 1000000,
        invoiceStatus: 'Invoiced',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 510000,
        dealStatus: 'Negotiation',
        invoiceAmount: 250000,
        invoiceStatus: 'Partial',
        invoiceCount: 1,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: 2,
      statusMismatchThreshold: 1,
      countMismatchThreshold: 1,
    };

    const executionTimestamp = new Date('2026-10-15T09:00:00Z');

    // Mock retrieveAnomalyLogsByDetectionType to return correction history
    const mockAnomalyLogs = [
      {
        anomalyDetectionLogId: 'DIFF-002-amount_mismatch',
        detectionTimestamp: new Date('2026-10-14T15:30:00Z'),
        anomalyType: 'amount_mismatch',
        severity: 'medium',
        anomalyContent: 'Amount mismatch detected for DEAL-002',
        expectedValue: '500000',
        actualValue: '510000',
        status: 'in_progress',
        validationRuleId: null,
      },
    ];

    (
      anomalyDetectionLogging.retrieveAnomalyLogsByDetectionType as jest.Mock
    ).mockResolvedValue({
      anomalyLogs: mockAnomalyLogs,
      totalCount: 1,
      detectionType: 'amount_mismatch',
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
    expect(result).toBeDefined();
    expect(result.syncStatus).toBe('differences_detected');
    expect(result.detectedDifferences).toHaveLength(1);

    // Verify detected difference for DEAL-002 (金額差異 10000 円)
    const detectedDiff = result.detectedDifferences[0];
    expect(detectedDiff.dealId).toBe('DEAL-002');
    expect(detectedDiff.differenceType).toBe('amount_mismatch');
    expect(detectedDiff.legacyValue).toBe(500000);
    expect(detectedDiff.newSystemValue).toBe(510000);
    expect(detectedDiff.discrepancyPercentage).toBe(2);

    // Verify dashboard visualization
    expect(result.dashboardVisualization).toBeDefined();
    expect(result.dashboardVisualization.totalDealsCompared).toBe(2);
    expect(result.dashboardVisualization.differenceCount).toBe(1);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(10000);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(0);
    expect(result.dashboardVisualization.countMismatchCount).toBe(0);

    // Verify that correction status array includes the anomaly log with in_progress status
    expect(result.dashboardVisualization.correctionStatus).toHaveLength(1);
    const correctionStatus = result.dashboardVisualization.correctionStatus[0];
    expect(correctionStatus.differenceId).toBe('DIFF-002-amount_mismatch');
    expect(correctionStatus.status).toBe('in_progress');
    expect(new Date(correctionStatus.lastUpdated).toISOString()).toBe(
      '2026-10-14T15:30:00.000Z'
    );

    // Verify validation timestamp
    expect(result.validationTimestamp.toISOString()).toBe(
      '2026-10-15T09:00:00.000Z'
    );

    // Verify that retrieveAnomalyLogsByDetectionType was called for amount_mismatch
    expect(
      anomalyDetectionLogging.retrieveAnomalyLogsByDetectionType
    ).toHaveBeenCalledWith({
      detectionType: 'amount_mismatch',
    });
  });
});
