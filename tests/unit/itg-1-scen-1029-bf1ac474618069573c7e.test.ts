import {
  notifyAnomalyDetection,
  InvalidAnomalyInput,
  type NotifyAnomalyDetectionInput,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1029: notifyAnomalyDetection - 必須フィールド不足エラー', () => {
  it('should throw InvalidAnomalyInput when required fields are missing', async () => {
    const input: NotifyAnomalyDetectionInput = {
      anomalies: [
        {
          anomalyType: 'amount_discrepancy',
          targetRecordId: null as any,
          severity: 'critical',
          description: '金額ズレ検出',
        },
      ],
      detectionTimestamp: new Date('2026-10-07T10:30:00.000Z'),
      detectionSourceModulePath: 'src/logic/dataflow-anomaly-detection.ts',
    };

    await expect(notifyAnomalyDetection(input)).rejects.toThrow(InvalidAnomalyInput);
    await expect(notifyAnomalyDetection(input)).rejects.toThrow(
      '異常検知通知の入力に必須項目が不足しています。異常タイプ・対象レコードID・重要度を確認してください。'
    );
  });
});
