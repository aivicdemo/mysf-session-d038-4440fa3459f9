import { recordAnomalyDetection, InvalidSeverityLevelError } from '../../src/logic/anomaly-detection-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-663: エラー系：重要度が定義済みリストに無い場合、InvalidSeverityLevelError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidSeverityLevelError when severity is not in the valid list', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        テーブル: '請求書',
      },
    ]);

    const input = {
      anomalyType: '金額ズレ',
      severity: '緊急',
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: null,
      anomalyContent: '請求書の合計金額が営業活動での見積金額と不一致',
      expectedValue: '1500000',
      actualValue: '1480000',
      detectionTimestamp: new Date('2026-10-07T06:22:11.338Z'),
      detectorId: 'user-001',
    };

    await expect(recordAnomalyDetection(input)).rejects.toThrow(InvalidSeverityLevelError);
    await expect(recordAnomalyDetection(input)).rejects.toThrow(
      "重要度レベル '緊急' は無効です。有効な重要度: 高、中、低"
    );
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
