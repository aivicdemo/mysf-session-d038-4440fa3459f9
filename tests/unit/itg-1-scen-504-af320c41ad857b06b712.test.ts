import {
  validateAndVisualizeSystemDataSyncDifferences,
} from '../../src/logic/system-data-sync-validation';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-504: 旧システムと新システムで商談ステータスがマッピングルール適用後も一致しない場合、ステータス不整合として差異を検出し返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ステータス不整合を2件検出し、それぞれ是正状況を含めて返す', async () => {
    const mockRetrieveAnomalyLogs = anomalyLogging.retrieveAnomalyLogsByDetectionType as jest.Mock;
    mockRetrieveAnomalyLogs.mockResolvedValue([
      {
        differenceId: 'DIFF-DEAL-001-STATUS',
        status: 'pending',
        lastUpdated: new Date('2026-10-07T10:00:00Z'),
      },
      {
        differenceId: 'DIFF-DEAL-002-STATUS',
        status: 'pending',
        lastUpdated: new Date('2026-10-07T10:00:00Z'),
      },
    ]);

    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Negotiation',
        invoiceAmount: 500000,
        invoiceStatus: 'Issued',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 2000000,
        dealStatus: 'Won',
        invoiceAmount: 2000000,
        invoiceStatus: 'Paid',
        invoiceCount: 2,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'In Progress',
        invoiceAmount: 500000,
        invoiceStatus: 'Issued',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 2000000,
        dealStatus: 'Completed',
        invoiceAmount: 2000000,
        invoiceStatus: 'Paid',
        invoiceCount: 2,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: 5,
      statusMismatchThreshold: 1,
      countMismatchThreshold: 1,
    };

    const executionTimestamp = new Date('2026-10-07T10:00:00Z');

    const result = await validateAndVisualizeSystemDataSyncDifferences({
      legacySystemData,
      newSystemData,
      syncValidationCriteria,
      executionTimestamp,
    });

    expect(result.syncStatus).toBe('differences_detected');
    expect(result.detectedDifferences).toHaveLength(2);

    expect(result.detectedDifferences[0].dealId).toBe('DEAL-001');
    expect(result.detectedDifferences[0].differenceType).toBe('status_mismatch');
    expect(result.detectedDifferences[0].legacyValue).toBe('Negotiation');
    expect(result.detectedDifferences[0].newSystemValue).toBe('In Progress');
    expect(result.detectedDifferences[0].discrepancyPercentage).toBe(100);

    expect(result.detectedDifferences[1].dealId).toBe('DEAL-002');
    expect(result.detectedDifferences[1].differenceType).toBe('status_mismatch');
    expect(result.detectedDifferences[1].legacyValue).toBe('Won');
    expect(result.detectedDifferences[1].newSystemValue).toBe('Completed');
    expect(result.detectedDifferences[1].discrepancyPercentage).toBe(100);

    expect(result.dashboardVisualization.totalDealsCompared).toBe(2);
    expect(result.dashboardVisualization.differenceCount).toBe(2);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(0);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(2);
    expect(result.dashboardVisualization.countMismatchCount).toBe(0);

    expect(result.dashboardVisualization.correctionStatus).toHaveLength(2);
    expect(result.dashboardVisualization.correctionStatus[0].differenceId).toBe('DIFF-DEAL-001-STATUS');
    expect(result.dashboardVisualization.correctionStatus[0].status).toBe('pending');
    expect(result.dashboardVisualization.correctionStatus[1].differenceId).toBe('DIFF-DEAL-002-STATUS');
    expect(result.dashboardVisualization.correctionStatus[1].status).toBe('pending');

    expect(result.validationTimestamp).toEqual(executionTimestamp);
  });
});
