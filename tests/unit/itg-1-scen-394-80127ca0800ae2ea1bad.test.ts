import { detectDataflowAnomalies } from '../../src/logic/dataflow-anomaly-detection';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  recordAnomalyDetection: jest.fn(),
}));

describe('SCEN-394: 異常が検出されない場合、totalAnomaliesDetectedがゼロで異常検知ログも記録されない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('異常が検出されず、ログ記録が呼ばれない', async () => {
    const result = await detectDataflowAnomalies({
      targetPeriodStartDate: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2025-01-31T23:59:59Z'),
      executedByUserId: 'user-12345',
    });

    // 期待値：異常が検出されない
    expect(result.anomalyDetectionLogIds).toEqual([]);
    expect(result.totalAnomaliesDetected).toBe(0);
    expect(result.anomalySummaryByType).toEqual({});
    expect(result.detectionCompletedAt).toBeInstanceOf(Date);

    // recordAnomalyDetection は呼ばれない
    const recordAnomalyDetection = (anomalyLogging as any).recordAnomalyDetection;
    expect(recordAnomalyDetection).not.toHaveBeenCalled();
  });
});
