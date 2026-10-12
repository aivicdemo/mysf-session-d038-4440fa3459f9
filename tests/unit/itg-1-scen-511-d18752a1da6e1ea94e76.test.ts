import { validateAndVisualizeSystemDataSyncDifferences } from '../../src/logic/system-data-sync-validation';
import * as anomalyDetectionLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-511: ステータスマッピングルールが設定されていない場合、ステータス比較をスキップし警告を記録して処理を続行する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip status comparison when no status mapping rules are configured and return synchronized status with no differences detected', async () => {
    const executionTimestamp = new Date('2026-10-15T09:00:00.000Z');
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: '商談成立',
        invoiceAmount: 1000000,
        invoiceStatus: '請求済み',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: '提案中',
        invoiceAmount: 0,
        invoiceStatus: '未請求',
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
      {
        dealId: 'DEAL-002',
        dealAmount: 500000,
        dealStatus: 'In Proposal',
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

    (anomalyDetectionLogging.retrieveAnomalyLogsByDetectionType as jest.Mock).mockResolvedValueOnce({
      anomalyLogs: [],
    });

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
    expect(result.validationTimestamp).toEqual(executionTimestamp);
  });
});
