import {
  validateAndVisualizeSystemDataSyncDifferences,
} from '../../src/logic/system-data-sync-validation';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-507: 新システムにのみ存在する商談が検出された場合、旧システム側での欠落差異として記録し返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新システムのみの商談を検出し、欠落差異として返す', async () => {
    const mockRetrieveAnomalyLogs = anomalyLogging.retrieveAnomalyLogsByDetectionType as jest.Mock;
    mockRetrieveAnomalyLogs.mockResolvedValue([
      {
        differenceId: 'DIFF-DEAL-003-NEW',
        dealId: 'DEAL-003',
        status: 'pending',
        lastUpdated: new Date('2026-10-07T10:00:00.000Z'),
      },
    ]);

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
        dealAmount: 200000,
        dealStatus: 'Negotiation',
        invoiceAmount: 0,
        invoiceStatus: 'Not Invoiced',
        invoiceCount: 0,
      },
    ];

    const newSystemData = [
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
        dealAmount: 200000,
        dealStatus: 'Negotiation',
        invoiceAmount: 0,
        invoiceStatus: 'Not Invoiced',
        invoiceCount: 0,
      },
      {
        dealId: 'DEAL-003',
        dealAmount: 150000,
        dealStatus: 'Proposal',
        invoiceAmount: 0,
        invoiceStatus: 'Not Invoiced',
        invoiceCount: 0,
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
    expect(result.detectedDifferences[0].dealId).toBe('DEAL-003');
    expect(result.detectedDifferences[0].differenceType).toBe('count_mismatch');
    expect(result.detectedDifferences[0].legacyValue).toBe(0);
    expect(result.detectedDifferences[0].newSystemValue).toBe(1);
    expect(result.detectedDifferences[0].discrepancyPercentage).toBeGreaterThanOrEqual(100);

    expect(result.dashboardVisualization.totalDealsCompared).toBe(3);
    expect(result.dashboardVisualization.differenceCount).toBe(1);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(150000);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(0);
    expect(result.dashboardVisualization.countMismatchCount).toBe(1);

    expect(result.dashboardVisualization.correctionStatus).toHaveLength(1);
    expect(result.dashboardVisualization.correctionStatus[0].differenceId).toBe('DIFF-DEAL-003-NEW');
    expect(result.dashboardVisualization.correctionStatus[0].status).toBe('pending');

    expect(result.validationTimestamp.getTime()).toBeGreaterThanOrEqual(executionTimestamp.getTime());
  });
});
