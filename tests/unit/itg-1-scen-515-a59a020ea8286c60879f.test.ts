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

describe('SCEN-515: 差異が検出されない場合、syncStatusを「synchronized」に設定し、detectedDifferencesが空配列の状態で返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異が検出されない場合、syncStatusを「synchronized」に設定し、detectedDifferencesが空配列の状態で返す', async () => {
    // Arrange
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Closed Won',
        invoiceAmount: 1000000,
        invoiceStatus: 'Paid',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: 'Negotiation',
        invoiceAmount: 0,
        invoiceStatus: 'Pending',
        invoiceCount: 0,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Closed Won',
        invoiceAmount: 1000000,
        invoiceStatus: 'Paid',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: 'Negotiation',
        invoiceAmount: 0,
        invoiceStatus: 'Pending',
        invoiceCount: 0,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: 5,
      statusMismatchThreshold: 0,
      countMismatchThreshold: 0,
    };

    const executionTimestamp = new Date('2026-10-07T10:30:00Z');

    // Mock retrieveAnomalyLogsByDetectionType to return empty array
    (
      anomalyDetectionLogging.retrieveAnomalyLogsByDetectionType as jest.Mock
    ).mockResolvedValue({
      anomalyLogs: [],
      totalCount: 0,
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
    // 1. Verify syncStatus is set to synchronized
    expect(result.syncStatus).toBe('synchronized');

    // 2. Verify detectedDifferences is empty array
    expect(result.detectedDifferences).toEqual([]);

    // 3. Verify dashboardVisualization
    expect(result.dashboardVisualization).toBeDefined();
    expect(result.dashboardVisualization.totalDealsCompared).toBe(2);
    expect(result.dashboardVisualization.differenceCount).toBe(0);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(0);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(0);
    expect(result.dashboardVisualization.countMismatchCount).toBe(0);

    // 4. Verify correctionStatus is empty array
    expect(result.dashboardVisualization.correctionStatus).toEqual([]);

    // 5. Verify validationTimestamp is set (equal to or after executionTimestamp)
    expect(result.validationTimestamp).toBeDefined();
    const validationTime = new Date(result.validationTimestamp).getTime();
    const executionTime = executionTimestamp.getTime();
    expect(validationTime).toBeGreaterThanOrEqual(executionTime);
  });
});
