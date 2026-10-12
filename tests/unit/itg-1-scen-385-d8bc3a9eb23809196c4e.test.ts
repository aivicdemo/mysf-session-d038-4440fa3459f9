import { detectDataflowAnomalies, DetectDataflowAnomaliesInput, AnomalyDetectionLogRecordingFailed } from '../../src/logic/dataflow-anomaly-detection';
import * as anomalyDetectionLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  recordAnomalyDetection: jest.fn(),
}));

describe('SCEN-385: 異常検知ログ記録処理が失敗した場合、AnomalyDetectionLogRecordingFailed エラーが発生', () => {
  it('should throw AnomalyDetectionLogRecordingFailed when recording fails', async () => {
    // Mock recordAnomalyDetection to throw an error
    (anomalyDetectionLogging.recordAnomalyDetection as jest.Mock).mockRejectedValue(
      new Error('異常検知ログの記録処理が内部エラーで失敗した')
    );

    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2026-01-31T23:59:59Z'),
      executedByUserId: 'user-001',
    };

    await expect(detectDataflowAnomalies(input)).rejects.toThrow(AnomalyDetectionLogRecordingFailed);
    await expect(detectDataflowAnomalies(input)).rejects.toThrow(
      '異常検知ログの記録に失敗しました。'
    );
  });
});
