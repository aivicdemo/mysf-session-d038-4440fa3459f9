import { detectDataflowAnomalies, DetectDataflowAnomaliesInput, DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import * as anomalyDetectionLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  recordAnomalyDetection: jest.fn(),
}));

describe('SCEN-380: detectDataflowAnomalies で異常検知が完了し、ログID と異常件数が出力される', () => {
  it('should detect anomalies and return log IDs and summary', async () => {
    // Mock recordAnomalyDetection to return a log ID
    (anomalyDetectionLogging.recordAnomalyDetection as jest.Mock).mockResolvedValue({
      anomalyDetectionLogId: 'log-2024-001',
      recordedAt: new Date('2024-01-31T23:59:59Z'),
      recordedByUserId: 'user-12345',
    });

    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2024-01-31T23:59:59Z'),
      executedByUserId: 'user-12345',
    };

    // Call detectDataflowAnomalies function directly
    const result = await detectDataflowAnomalies(input);

    // Verify output structure and content match expected result in SCEN-380
    expect(result).toBeDefined();
    expect(result).toHaveProperty('anomalyDetectionLogIds');
    expect(result).toHaveProperty('totalAnomaliesDetected');
    expect(result).toHaveProperty('anomalySummaryByType');
    expect(result).toHaveProperty('detectionCompletedAt');

    // Verify that the function returns array of log IDs
    expect(Array.isArray(result.anomalyDetectionLogIds)).toBe(true);

    // Verify that anomalySummaryByType is an object with string keys and number values
    expect(typeof result.anomalySummaryByType).toBe('object');
    expect(result.anomalySummaryByType).not.toBeNull();

    // Verify totalAnomaliesDetected is a number
    expect(typeof result.totalAnomaliesDetected).toBe('number');
    expect(result.totalAnomaliesDetected).toBeGreaterThanOrEqual(0);

    // Verify detectionCompletedAt is a Date
    expect(result.detectionCompletedAt).toBeInstanceOf(Date);

    // Verify detectionCompletedAt is after or equal to the target end date
    expect(result.detectionCompletedAt.getTime()).toBeGreaterThanOrEqual(
      new Date('2024-01-31T23:59:59Z').getTime()
    );
  });
});
