import { recordAnomalyDetection, InvalidValidationRuleIdError } from '../../src/logic/anomaly-detection-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-665: エラー系：検証ルールIDが指定されているが、データ検証ルール定義テーブルに存在しない場合、InvalidValidationRuleIdError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidValidationRuleIdError when validationRuleId does not exist in the validation rules table', async () => {
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          テーブル名: '請求書',
        },
      ]);

    const input = {
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求書',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      validationRuleId: '550e8400-e29b-41d4-a716-446655440000',
      anomalyContent: '請求書の合計金額が営業提案額と一致しない',
      expectedValue: '150000',
      actualValue: '145000',
      detectionTimestamp: new Date('2026-10-07T10:30:00.000Z'),
      detectorId: 'detector-001',
    };

    await expect(recordAnomalyDetection(input)).rejects.toThrow(InvalidValidationRuleIdError);
    await expect(recordAnomalyDetection(input)).rejects.toThrow(
      "検証ルールID '550e8400-e29b-41d4-a716-446655440000' は存在しません"
    );
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
