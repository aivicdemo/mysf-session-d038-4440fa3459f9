import {
  validateAndVisualizeSystemDataSyncDifferences,
  InvalidLegacySystemDataFormat,
  InvalidNewSystemDataFormat,
  InvalidSyncValidationCriteria,
} from '../../src/logic/system-data-sync-validation';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-499: 旧新システムのデータが完全に同期している場合、差異なし状態をダッシュボード表示形式で返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('同期状態を正常に検出し、空の差異配列を返す', async () => {
    const mockRetrieveAnomalyLogs = anomalyLogging.retrieveAnomalyLogsByDetectionType as jest.Mock;
    mockRetrieveAnomalyLogs.mockResolvedValue({
      anomalyLogs: [],
    });

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
        dealStatus: 'In Progress',
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
        dealStatus: 'In Progress',
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

    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    const result = await validateAndVisualizeSystemDataSyncDifferences({
      legacySystemData,
      newSystemData,
      syncValidationCriteria,
      executionTimestamp,
    });

    expect(result.syncStatus).toBe('synchronized');
    expect(result.detectedDifferences).toEqual([]);
    expect(result.dashboardVisualization.totalDealsCompared).toBe(2);
    expect(result.dashboardVisualization.differenceCount).toBe(0);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(0);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(0);
    expect(result.dashboardVisualization.countMismatchCount).toBe(0);
    expect(result.dashboardVisualization.correctionStatus).toEqual([]);
    expect(result.validationTimestamp).toEqual(executionTimestamp);
  });
});
