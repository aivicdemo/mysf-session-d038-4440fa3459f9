import {
  validateAndVisualizeSystemDataSyncDifferences,
} from '../../src/logic/system-data-sync-validation';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-505: 旧システムと新システムで請求件数が異なる場合、件数不一致として差異を検出し返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('件数不一致を検出し、差異情報と是正状況を返す', async () => {
    const mockRetrieveAnomalyLogs = anomalyLogging.retrieveAnomalyLogsByDetectionType as jest.Mock;
    mockRetrieveAnomalyLogs.mockResolvedValue([
      {
        differenceId: 'DIFF-DEAL-002-COUNT',
        status: 'pending',
        lastUpdated: new Date('2026-10-07T10:00:00.000Z'),
      },
    ]);

    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'closed_won',
        invoiceAmount: 1000000,
        invoiceStatus: 'invoiced',
        invoiceCount: 5,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: 'closed_won',
        invoiceAmount: 500000,
        invoiceStatus: 'invoiced',
        invoiceCount: 3,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'closed_won',
        invoiceAmount: 1000000,
        invoiceStatus: 'invoiced',
        invoiceCount: 5,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: 'closed_won',
        invoiceAmount: 500000,
        invoiceStatus: 'invoiced',
        invoiceCount: 2,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: 5,
      statusMismatchThreshold: 1,
      countMismatchThreshold: 1,
    };

    const executionTimestamp = new Date('2026-10-07T10:00:00.000Z');

    const result = await validateAndVisualizeSystemDataSyncDifferences({
      legacySystemData,
      newSystemData,
      syncValidationCriteria,
      executionTimestamp,
    });

    expect(result.syncStatus).toBe('differences_detected');
    expect(result.detectedDifferences).toHaveLength(1);
    expect(result.detectedDifferences[0].dealId).toBe('DEAL-002');
    expect(result.detectedDifferences[0].differenceType).toBe('count_mismatch');
    expect(result.detectedDifferences[0].legacyValue).toBe(3);
    expect(result.detectedDifferences[0].newSystemValue).toBe(2);
    expect(result.detectedDifferences[0].discrepancyPercentage).toBeCloseTo(33.33, 1);

    expect(result.dashboardVisualization.totalDealsCompared).toBe(2);
    expect(result.dashboardVisualization.differenceCount).toBe(1);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(0);
    expect(result.dashboardVisualization.countMismatchCount).toBe(1);

    expect(result.dashboardVisualization.correctionStatus).toHaveLength(1);
    expect(result.dashboardVisualization.correctionStatus[0].differenceId).toBe('DIFF-DEAL-002-COUNT');
    expect(result.dashboardVisualization.correctionStatus[0].status).toBe('pending');

    expect(result.validationTimestamp).toEqual(executionTimestamp);
  });
});
