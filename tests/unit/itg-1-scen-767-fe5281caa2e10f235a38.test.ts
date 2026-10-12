import { saveAnomalyDetectionLog, InvalidAnomalyDetectionLogInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-767: saveAnomalyDetectionLog - 対象テーブルが空文字列のとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidAnomalyDetectionLogInput when targetTable is empty string', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    mockDataStore.listRecords.mockResolvedValue([]);

    const input = {
      anomalyDetectionLogId: null,
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求金額が注文金額と一致しません',
      expectedValue: '100000',
      actualValue: '99500',
      status: '未対応',
      currentUserId: '770e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2026-10-07T10:30:00Z',
    };

    await expect(saveAnomalyDetectionLog(input)).rejects.toThrow(InvalidAnomalyDetectionLogInput);
    await expect(saveAnomalyDetectionLog(input)).rejects.toThrow('異常検知ログの必須項目が不足しています。');
    expect(mockDataStore.createRecord).not.toHaveBeenCalled();
  });
});
