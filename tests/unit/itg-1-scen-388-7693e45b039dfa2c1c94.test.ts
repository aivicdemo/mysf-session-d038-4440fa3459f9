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

describe('SCEN-388: 請求書レコードが存在しない場合の警告検証', () => {
  it('請求書レコードが存在しない場合、警告メッセージが含まれたログが記録される', async () => {
    const dataStore = require('../../src/platform/data-store');
    const anomalyDetectionLogging = require('../../src/logic/anomaly-detection-logging');

    dataStore.listRecords.mockResolvedValue([{
      dealId: 'deal-001',
      accountId: 'account-001',
      dealAmount: 100000,
      dealStage: 'won',
      invoiceRecords: [],
      activityRecords: [{
        activityId: 'activity-001',
        dealId: 'deal-001',
        type: 'call',
        completedAt: new Date('2026-01-15T10:00:00Z'),
      }],
    }]);

    anomalyDetectionLogging.recordAnomalyDetection.mockResolvedValue({
      anomalyDetectionLogId: 'log-001',
      recordedAt: new Date('2026-01-31T12:00:00Z'),
      recordedByUserId: 'user-12345',
    });

    const input = {
      targetPeriodStartDate: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2026-01-31T23:59:59Z'),
      executedByUserId: 'user-12345',
    };

    const result = await detectDataflowAnomalies(input);

    expect(result).toBeDefined();
    expect(result.anomalyDetectionLogIds).toContain('log-001');
    expect(result.totalAnomaliesDetected).toBeGreaterThanOrEqual(1);
    expect(result.anomalySummaryByType).toHaveProperty('請求書未作成');
    expect(result.anomalySummaryByType['請求書未作成']).toBeGreaterThanOrEqual(1);
    expect(result.detectionCompletedAt).toBeInstanceOf(Date);

    expect(anomalyDetectionLogging.recordAnomalyDetection).toHaveBeenCalled();
  });
});
