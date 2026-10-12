import { recordAnomalyDetection } from '../../src/logic/anomaly-detection-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-668: 正常系：検証ルールIDが null（手動報告）の場合でも、他の必須項目が満たされていれば検知ログを記録する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record anomaly detection with null validationRuleId and return unresolved status', async () => {
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          テーブル名: '請求書',
        },
      ]);

    (dataStore.createRecord as jest.Mock).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174001',
    });

    const input = {
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: null,
      anomalyContent: '請求金額が商談の合計金額と一致していません',
      expectedValue: '1500000',
      actualValue: '1400000',
      detectionTimestamp: new Date('2026-10-07T10:30:00.000Z'),
      detectorId: 'user-20261007-manual',
    };

    const result = await recordAnomalyDetection(input);

    expect(result.anomalyDetectionLogId).toBeDefined();
    expect(result.recordedAt).toBeDefined();
    expect(result.status).toBe('未対応');
    expect(dataStore.createRecord).toHaveBeenCalledWith(
      'AnomalyDetectionLog',
      expect.objectContaining({
        anomalyType: '金額ズレ',
        severity: '高',
        targetTable: '請求書',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
        validationRuleId: null,
        anomalyContent: '請求金額が商談の合計金額と一致していません',
        expectedValue: '1500000',
        actualValue: '1400000',
        status: '未対応',
      })
    );
  });
});
