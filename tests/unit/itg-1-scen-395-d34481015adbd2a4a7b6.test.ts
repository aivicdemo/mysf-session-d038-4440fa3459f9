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

describe('SCEN-395: 検証完了日時が記録され、処理実行時刻を含む形式で出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (recordingModule.recordAnomalyDetection as jest.Mock<(input: RecordAnomalyDetectionInput) => Promise<RecordAnomalyDetectionOutput>>).mockResolvedValue({
      anomalyDetectionLogId: 'anomaly-log-001',
      recordedAt: new Date('2024-01-20T14:35:42.123Z'),
      status: 'recorded',
    });
  });

  it('should record detection completed timestamp with time precision', async () => {
    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2024-01-31T23:59:59Z'),
      executedByUserId: 'user-12345',
    };

    const result: DetectDataflowAnomaliesOutput = await detectDataflowAnomalies(input);

    expect(result.detectionCompletedAt).toBeDefined();
    expect(result.detectionCompletedAt).toBeInstanceOf(Date);
    expect(result.detectionCompletedAt).not.toBeNull();

    const completedTime = result.detectionCompletedAt.getTime();
    const startTime = input.targetPeriodStartDate.getTime();
    const endTime = input.targetPeriodEndDate.getTime();
    expect(completedTime).toBeGreaterThanOrEqual(startTime);
    expect(completedTime).toBeLessThanOrEqual(endTime + 86400000);

    const isoString = result.detectionCompletedAt.toISOString();
    expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    expect(result.anomalyDetectionLogIds).toBeDefined();
    expect(Array.isArray(result.anomalyDetectionLogIds)).toBe(true);
    expect(result.anomalyDetectionLogIds.length).toBeGreaterThan(0);

    expect(result.totalAnomaliesDetected).toBeGreaterThanOrEqual(1);

    expect(result.anomalySummaryByType).toBeDefined();
    expect(typeof result.anomalySummaryByType).toBe('object');
    expect(Object.keys(result.anomalySummaryByType).length).toBeGreaterThan(0);
    Object.entries(result.anomalySummaryByType).forEach(([key, value]) => {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
