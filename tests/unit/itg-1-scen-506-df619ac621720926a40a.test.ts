import {
  validateAndVisualizeSystemDataSyncDifferences,
} from '../../src/logic/system-data-sync-validation';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-506: 旧システムにのみ存在する商談が検出された場合、新システム側での欠落差異として記録し返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('旧システムのみの商談を検出し、欠落差異として返す', async () => {
    const mockRetrieveAnomalyLogs = anomalyLogging.retrieveAnomalyLogsByDetectionType as jest.Mock;
    mockRetrieveAnomalyLogs.mockResolvedValue({
      anomalyLogs: [
        {
          dealId: 'DEAL-002',
          detectionType: 'missing_in_new_system',
          status: 'pending',
          lastUpdated: new Date('2026-10-07T10:00:00.000Z'),
        },
      ],
    });

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
        invoiceAmount: 0,
        invoiceStatus: 'Not Invoiced',
        invoiceCount: 0,
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
    expect(result.detectedDifferences[0].differenceType).toBe('missing_in_new_system');
    expect(result.detectedDifferences[0].legacyValue).toBe(500000);
    expect(result.detectedDifferences[0].newSystemValue).toBeNull();
    expect(result.detectedDifferences[0].discrepancyPercentage).toBe(100);

    expect(result.dashboardVisualization.totalDealsCompared).toBe(2);
    expect(result.dashboardVisualization.differenceCount).toBe(1);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(500000);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(0);
    expect(result.dashboardVisualization.countMismatchCount).toBe(0);

    expect(result.dashboardVisualization.correctionStatus).toHaveLength(1);
    expect(result.dashboardVisualization.correctionStatus[0].status).toBe('pending');

    expect(result.validationTimestamp).toEqual(executionTimestamp);
  });
});
