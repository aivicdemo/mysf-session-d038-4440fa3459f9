import { validateAndVisualizeSystemDataSyncDifferences } from '../../src/logic/system-data-sync-validation';
import * as anomalyDetectionLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  retrieveAnomalyLogsByDetectionType: jest.fn(),
}));

describe('SCEN-512: 複数の差異が検出された場合、差異のサマリー（件数、合計金額、ステータス不整合件数、件数不一致件数）をダッシュボード表示形式で集計し返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect multiple differences and return summary aggregated for dashboard display', async () => {
    const executionTimestamp = new Date('2026-10-07T10:30:00.000Z');
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: '契約済み',
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
      {
        dealId: 'DEAL-003',
        dealAmount: 2000000,
        dealStatus: '契約済み',
        invoiceAmount: 1500000,
        invoiceStatus: '部分請求',
        invoiceCount: 1,
      },
    ];
    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1050000,
        dealStatus: '契約済み',
        invoiceAmount: 1050000,
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
      {
        dealId: 'DEAL-003',
        dealAmount: 2000000,
        dealStatus: '保留中',
        invoiceAmount: 1500000,
        invoiceStatus: '部分請求',
        invoiceCount: 2,
      },
    ];
    const syncValidationCriteria = {
      amountTolerancePercent: 3,
      statusMismatchThreshold: 1,
      countMismatchThreshold: 1,
    };

    (anomalyDetectionLogging.retrieveAnomalyLogsByDetectionType as jest.Mock).mockResolvedValueOnce({
      anomalyLogs: [
        {
          differenceId: 'DIFF-DEAL-001-AMOUNT',
          dealId: 'DEAL-001',
          differenceType: 'amount_mismatch',
          status: 'pending',
          lastUpdated: new Date('2026-10-07T10:30:00.000Z'),
        },
        {
          differenceId: 'DIFF-DEAL-003-STATUS',
          dealId: 'DEAL-003',
          differenceType: 'status_mismatch',
          status: 'pending',
          lastUpdated: new Date('2026-10-07T10:30:00.000Z'),
        },
        {
          differenceId: 'DIFF-DEAL-003-COUNT',
          dealId: 'DEAL-003',
          differenceType: 'count_mismatch',
          status: 'pending',
          lastUpdated: new Date('2026-10-07T10:30:00.000Z'),
        },
      ],
    });

    const result = await validateAndVisualizeSystemDataSyncDifferences({
      legacySystemData,
      newSystemData,
      syncValidationCriteria,
      executionTimestamp,
    });

    expect(result.syncStatus).toBe('differences_detected');
    expect(result.detectedDifferences).toHaveLength(3);

    const amountDifference = result.detectedDifferences.find(
      (d) => d.dealId === 'DEAL-001' && d.differenceType === 'amount_mismatch',
    );
    expect(amountDifference).toBeDefined();
    expect(amountDifference?.legacyValue).toBe(1000000);
    expect(amountDifference?.newSystemValue).toBe(1050000);
    expect(amountDifference?.discrepancyPercentage).toBeCloseTo(5.0, 1);

    const statusDifference = result.detectedDifferences.find(
      (d) => d.dealId === 'DEAL-003' && d.differenceType === 'status_mismatch',
    );
    expect(statusDifference).toBeDefined();
    expect(statusDifference?.legacyValue).toBe('契約済み');
    expect(statusDifference?.newSystemValue).toBe('保留中');
    expect(statusDifference?.discrepancyPercentage).toBe(0);

    const countDifference = result.detectedDifferences.find(
      (d) => d.dealId === 'DEAL-003' && d.differenceType === 'count_mismatch',
    );
    expect(countDifference).toBeDefined();
    expect(countDifference?.legacyValue).toBe(1);
    expect(countDifference?.newSystemValue).toBe(2);
    expect(countDifference?.discrepancyPercentage).toBe(0);

    expect(result.dashboardVisualization.totalDealsCompared).toBe(3);
    expect(result.dashboardVisualization.differenceCount).toBe(3);
    expect(result.dashboardVisualization.amountDiscrepancyTotal).toBe(50000);
    expect(result.dashboardVisualization.statusMismatchCount).toBe(1);
    expect(result.dashboardVisualization.countMismatchCount).toBe(1);

    const correctionStatus = result.dashboardVisualization.correctionStatus;
    expect(correctionStatus).toHaveLength(3);
    expect(correctionStatus.every((cs) => cs.status === 'pending')).toBe(true);
    expect(correctionStatus.every((cs) => cs.lastUpdated === executionTimestamp)).toBe(true);

    expect(result.validationTimestamp).toEqual(executionTimestamp);
  });
});
