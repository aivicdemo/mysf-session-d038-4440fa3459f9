import { recordAnomalyDetection, InvalidTargetRecordIdError } from '../../src/logic/anomaly-detection-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-666: エラー系：対象レコードIDが指定された対象テーブルに存在しない場合、InvalidTargetRecordIdError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidTargetRecordIdError when target record does not exist in the target table', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([]);

    const input = {
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '商談',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: null,
      anomalyContent: '商談の見積金額と請求金額が一致していない',
      expectedValue: '1000000',
      actualValue: '950000',
      detectionTimestamp: new Date('2026-10-07T10:30:00.000Z'),
      detectorId: 'user-001',
    };

    await expect(recordAnomalyDetection(input)).rejects.toThrow(InvalidTargetRecordIdError);
    await expect(recordAnomalyDetection(input)).rejects.toThrow(
      "対象テーブル '商談' にレコードID '550e8400-e29b-41d4-a716-446655440000' は存在しません"
    );
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
