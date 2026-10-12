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

describe('SCEN-392: 未完了案件が検出される場合の検証', () => {
  it('未完了案件が検出される場合、異常タイプ別集計に未完了案件の件数が含まれる', async () => {
    const dataStore = require('../../src/platform/data-store');
    const anomalyDetectionLogging = require('../../src/logic/anomaly-detection-logging');

    dataStore.listRecords.mockResolvedValue([
      {
        dealId: 'deal-101',
        accountId: 'account-01',
        dealAmount: 500000,
        dealStage: 'won',
      },
      {
        dealId: 'deal-102',
        accountId: 'account-02',
        dealAmount: 300000,
        dealStage: 'won',
      },
    ]);

    anomalyDetectionLogging.recordAnomalyDetection.mockResolvedValue({
      anomalyDetectionLogIds: ['log-20240115-001'],
      recordedAt: new Date('2024-01-15T12:00:00Z'),
      recordedByUserId: 'user-001',
    });

    const input = {
      targetPeriodStartDate: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2024-01-31T23:59:59Z'),
      executedByUserId: 'user-001',
    };

    const result = await detectDataflowAnomalies(input);

    expect(result).toBeDefined();
    expect(result.anomalyDetectionLogIds).toContain('log-20240115-001');
    expect(result.totalAnomaliesDetected).toBeGreaterThanOrEqual(2);

    const incompleteKeys = Object.keys(result.anomalySummaryByType).filter(key =>
      key.includes('未完了') || key.includes('未請求') || key.includes('部分請求')
    );
    expect(incompleteKeys.length).toBeGreaterThan(0);

    const incompleteCount = Object.entries(result.anomalySummaryByType).reduce((sum, [key, count]) => {
      if (key.includes('未完了') || key.includes('未請求') || key.includes('部分請求')) {
        return sum + (count as number);
      }
      return sum;
    }, 0);
    expect(incompleteCount).toEqual(2);

    expect(result.detectionCompletedAt).toBeInstanceOf(Date);
  });
});
