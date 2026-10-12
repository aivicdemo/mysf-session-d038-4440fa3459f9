import { detectDataflowAnomalies } from '../../src/logic/dataflow-anomaly-detection';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/anomaly-detection-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging')>('../../src/logic/anomaly-detection-logging'),
  recordAnomalyDetection: jest.fn().mockResolvedValue({
    logIds: [
      'log-amountmismatch-001',
      'log-statusmismatch-001',
      'log-statusmismatch-002',
      'log-unfinalized-001',
      'log-unfinalized-002',
      'log-orphaninvoice-001',
      'log-orphanactivity-001',
      'log-lineitemsmismatch-001',
      'log-incompletestage-001',
    ],
  }),
}));

describe('SCEN-393: 複数の異常タイプが同時に検出される場合、各タイプの件数が正確に集計される', () => {
  it('複数の異常タイプが検出され、各タイプの件数が正確に集計される', async () => {
    const result = await detectDataflowAnomalies({
      targetPeriodStartDate: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2026-01-31T23:59:59Z'),
      executedByUserId: 'user-001',
    });

    // 期待値：9件の異常が検出される
    expect(result.anomalyDetectionLogIds).toHaveLength(9);
    expect(result.anomalyDetectionLogIds).toEqual([
      'log-amountmismatch-001',
      'log-statusmismatch-001',
      'log-statusmismatch-002',
      'log-unfinalized-001',
      'log-unfinalized-002',
      'log-orphaninvoice-001',
      'log-orphanactivity-001',
      'log-lineitemsmismatch-001',
      'log-incompletestage-001',
    ]);

    // totalAnomaliesDetected は 9
    expect(result.totalAnomaliesDetected).toBe(9);

    // anomalySummaryByType は各タイプの件数を正確に集計
    expect(result.anomalySummaryByType).toEqual({
      '金額ズレ': 1,
      'ステータス不整合': 2,
      '未請求・部分請求': 2,
      '孤立請求書': 1,
      '紐付けなし活動': 1,
      '請求明細不整合': 1,
      '未完了ステージ': 1,
    });

    // detectionCompletedAt は Date 型
    expect(result.detectionCompletedAt).toBeInstanceOf(Date);
  });
});
