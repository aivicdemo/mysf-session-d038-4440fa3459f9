import { detectDataflowAnomalies, DetectDataflowAnomaliesInput, DetectDataflowAnomaliesOutput } from '../../src/logic/dataflow-anomaly-detection';
import * as anomalyDetectionLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  recordAnomalyDetection: jest.fn(),
}));

describe('SCEN-386: 金額ズレが検出される場合、異常タイプ別集計に金額ズレの件数が含まれる', () => {
  it('should include amount discrepancy count in anomalySummaryByType', async () => {
    // Mock recordAnomalyDetection
    (anomalyDetectionLogging.recordAnomalyDetection as jest.Mock).mockResolvedValue({
      anomalyDetectionLogIds: ['log-001', 'log-002'],
    });

    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2024-01-31T23:59:59Z'),
      executedByUserId: 'user-001',
    };

    const result = await detectDataflowAnomalies(input);

    // Verify anomalySummaryByType structure
    expect(result).toHaveProperty('anomalySummaryByType');
    expect(result.anomalySummaryByType).toEqual(
      expect.objectContaining({
        '金額ズレ': expect.any(Number),
      })
    );

    // Verify that 金額ズレ count is present and includes deal-001 (20000 discrepancy)
    expect(result.anomalySummaryByType['金額ズレ']).toBe(1);

    // Verify other anomaly types if present
    if (result.anomalySummaryByType['ステータス不整合']) {
      expect(result.anomalySummaryByType['ステータス不整合']).toBe(1);
    }

    // Verify total anomalies count is present
    expect(result).toHaveProperty('totalAnomaliesDetected');
    expect(typeof result.totalAnomaliesDetected).toBe('number');
    expect(result.totalAnomaliesDetected).toBeGreaterThan(0);

    // Verify log IDs
    expect(result.anomalyDetectionLogIds).toContain('log-001');
    expect(result.anomalyDetectionLogIds).toContain('log-002');
  });
});
