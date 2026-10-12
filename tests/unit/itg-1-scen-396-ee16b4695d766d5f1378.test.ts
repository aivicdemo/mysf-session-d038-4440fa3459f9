import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  detectDataflowAnomalies,
  DetectDataflowAnomaliesInput,
  DetectDataflowAnomaliesOutput,
} from '../../src/logic/dataflow-anomaly-detection';
import * as recordingModule from '../../src/logic/anomaly-detection-logging';
import type { RecordAnomalyDetectionInput, RecordAnomalyDetectionOutput } from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  recordAnomalyDetection: jest.fn(),
}));

describe('SCEN-396: 実行者ユーザーIDが異常検知ログの作成者として正確に記録される', () => {
  const mockRecordAnomalyDetection = recordingModule.recordAnomalyDetection as jest.Mock<(input: RecordAnomalyDetectionInput) => Promise<RecordAnomalyDetectionOutput>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRecordAnomalyDetection.mockResolvedValue({
      anomalyDetectionLogId: 'log-anomaly-001',
      recordedAt: new Date('2024-01-31T23:59:59Z'),
      status: 'recorded',
    });
  });

  it('should pass executedByUserId to recordAnomalyDetection', async () => {
    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2024-01-31T23:59:59Z'),
      executedByUserId: 'user-12345',
    };

    const result: DetectDataflowAnomaliesOutput = await detectDataflowAnomalies(input);

    expect(result.anomalyDetectionLogIds).toContain('log-anomaly-001');

    expect(mockRecordAnomalyDetection).toHaveBeenCalled();
    const callArgs = mockRecordAnomalyDetection.mock.calls[0][0];
    expect(callArgs.detectorId).toBe('user-12345');

    expect(result.totalAnomaliesDetected).toBe(0);
    expect(result.anomalySummaryByType).toEqual({});

    expect(result.detectionCompletedAt).toBeDefined();
    expect(result.detectionCompletedAt).toBeInstanceOf(Date);
    const completedTime = result.detectionCompletedAt.getTime();
    const referenceTime = new Date('2024-01-31T23:59:59Z').getTime();
    expect(completedTime).toBeGreaterThanOrEqual(referenceTime);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
