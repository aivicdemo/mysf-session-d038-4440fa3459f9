import { detectDataflowAnomalies } from '../../src/logic/dataflow-anomaly-detection';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  recordAnomalyDetection: jest.fn(),
}));

describe('SCEN-391: ステータス不整合が検出される場合の検証', () => {
  it('ステータス不整合が検出される場合、異常タイプ別集計にステータス不整合の件数が含まれる', async () => {
    const dataStore = require('../../src/platform/data-store');
    const anomalyDetectionLogging = require('../../src/logic/anomaly-detection-logging');

    dataStore.listRecords.mockResolvedValue([
      {
        dealId: 'deal-101',
        dealAmount: 100000,
        dealStage: 'won',
        invoiceId: 'inv-201',
        invoiceAmount: 95000,
        invoiceStatus: 'created',
      },
      {
        dealId: 'deal-102',
        dealAmount: 50000,
        dealStage: 'proposal',
        invoiceId: null,
        invoiceAmount: 0,
        invoiceStatus: 'not_created',
      },
    ]);

    anomalyDetectionLogging.recordAnomalyDetection.mockResolvedValue({
      anomalyDetectionLogIds: ['log-001'],
      recordedAt: new Date('2024-01-31T12:00:00Z'),
      recordedByUserId: 'user-001',
    });

    const input = {
      targetPeriodStartDate: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2024-01-31T23:59:59Z'),
      executedByUserId: 'user-001',
    };

    const result = await detectDataflowAnomalies(input);

    expect(result).toBeDefined();
    expect(result.anomalyDetectionLogIds).toContain('log-001');
    expect(result.totalAnomaliesDetected).toEqual(1);
    expect(result.anomalySummaryByType).toHaveProperty('ステータス不整合');
    expect(result.anomalySummaryByType['ステータス不整合']).toEqual(1);
    expect(result.detectionCompletedAt).toBeInstanceOf(Date);
  });
});
