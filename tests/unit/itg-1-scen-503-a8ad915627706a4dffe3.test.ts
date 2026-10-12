import {
  validateAndVisualizeSystemDataSyncDifferences,
} from '../../src/logic/system-data-sync-validation';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-503: 旧システムと新システムで商談金額が許容差異率を超えて異なる場合、金額不整合として差異を検出し返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('許容差異率を超える金額差異を検出し、差異情報を返す', async () => {
    const mockRetrieveAnomalyLogs = anomalyLogging.retrieveAnomalyLogsByDetectionType as jest.Mock;
    mockRetrieveAnomalyLogs.mockResolvedValue([
      {
        differenceId: 'DIFF-001',
        dealId: 'DEAL-001',
        differenceType: 'amount_mismatch',
        status: 'pending',
        lastUpdated: new Date('2026-10-07T10:00:00Z'),
      },
    ]);

    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: '商談成立',
        invoiceAmount: 1000000,
        invoiceStatus: '請求済',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: '商談成立',
        invoiceAmount: 500000,
        invoiceStatus: '請求済',
        invoiceCount: 1,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 950000,
        dealStatus: '商談成立',
        invoiceAmount: 950000,
        invoiceStatus: '請求済',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: '商談成立',
        invoiceAmount: 500000,
        invoiceStatus: '請求済',
        invoiceCount: 1,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: 3,
      statusMismatchThreshold: 1,
      countMismatchThreshold: 0,
    };

    const executionTimestamp = new Date('2026-10-07T10:00:00Z');

    const result = await validateAndVisualizeSystemDataSyncDifferences({
      legacySystemData,
      newSystemData,
      syncValidationCriteria,
      executionTimestamp,
    });

    expect(result.syncStatus).toBe('differences_detected');
    expect(result.detectedDifferences).toHaveLength(1);
    expect(result.detectedDifferences[0].dealId).toBe('DEAL-001');
    expect(result.detectedDifferences[0].differenceType).toBe('amount_mismatch');
    expect(result.detectedDifferences[0].legacyValue).toBe(1000000);
    expect(result.detectedDifferences[0].newSystemValue).toBe(950000);
    expect(result.detectedDifferences[0].discrepancyPercentage).toBe(5);

    expect(result.dashboardVisualization.totalDealsCompared).toBe(2);
    expect(result.dashboardVisualization.differenceCount).toBe(1);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(50000);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(0);
    expect(result.dashboardVisualization.countMismatchCount).toBe(0);

    expect(result.dashboardVisualization.correctionStatus).toHaveLength(1);
    expect(result.dashboardVisualization.correctionStatus[0].differenceId).toBe('DIFF-001');
    expect(result.dashboardVisualization.correctionStatus[0].status).toBe('pending');

    expect(result.validationTimestamp).toEqual(executionTimestamp);
  });
});
